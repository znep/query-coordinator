require 'set'
require 'json'

class NewUxBootstrapController < ActionController::Base

  include CommonMetadataMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods
  include CardTypeMapping
  include ApplicationHelper

  before_filter :hook_auth_controller
  before_filter :set_locale

  # Keep track of the types of cards we added, so we can give a spread
  attr_accessor :skipped_cards_by_type, :added_card_types, :page_metadata_manager

  helper :data_lens

  layout 'angular'

  SYSTEM_COLUMN_ID_REGEX = /:([a-z][a-z_0-9\-]*)/i

  def initialize(*args)
    @added_card_types = Set.new
    @skipped_cards_by_type = Hash.new { |h, k| h[k] = [] }
    @page_metadata_manager = PageMetadataManager.new

    super
  end

  def disable_site_chrome?
    false
  end

  def bootstrap
    # This method needs to accomplish a few things in order to enable 'new UX' views of
    # existing datasets.
    #
    # 1a. Check to make sure that the user is authorized to create a new view.
    #     Crucially, this includes SuperAdmins so that Socrata employees can
    #     test this functionality without having to impersonate customers.
    #     This check can be skipped when using the ephemeral bootstrapping
    #     approach, since it separates the creation of something renderable
    #     from the actual persistence.
    #
    # 1b. Check if the dataset is a derived view. If it is, and creating a data lens
    #     from a derived view is enabled, exit early and gather required metadata.
    #     While this approach uses the ephemeral bootstrapping approach, so we still
    #     first check the current user's permissions, as it has the side effect of
    #     obtaining the user session (which is needed, for instance, if your derived
    #     view is private).
    #
    # 2. Check to make sure the dataset in question is in the new backend,
    #    if it isn't 400.
    #
    # 3. Check to make sure the dataset does not have a group by.
    #    If it does, redirect and provide a friendly error message.
    #
    # 4. Fetch the dataset metadata, which is used downstream to create cards. If we
    #    cannot fetch the dataset data then we fail early. We will let Airbrake know
    #    about this, but not the user.
    #
    # 5. If use_ephemeral_bootstrap is false, check to see if any 'new UX' pages already exist.
    #
    # 6a. If they do, then we send the user to the default or the last page in
    #     the collection.
    #
    # 6b. If no pages already exist, then we need to create one. This is hacky
    #     and non-deterministic.

    # Note: As of 5/24/2017 use_ephemeral_bootstrap is true on all production domains
    use_ephemeral_bootstrap = FeatureFlags.derive(@view, request)[:use_ephemeral_bootstrap]

    # 1a. Check to make sure that the user is authorized to create a new view.
    # NOTE! Calling current_user method has side effect of creating user session.
    unless current_user.present?
      return redirect_to "/d/#{params[:id]}"
    end

    # IMPORTANT: can_create_metadata? *must* come first in this conditional
    # because it has the side effect of obtaining the user session.
    # If the order is swapped, the logic is short-circuited and the call to
    # dataset_is_new_backend? will fail unexpectedly.
    unless can_create_metadata? || use_ephemeral_bootstrap
      return render :json => {
        error: true,
        reason: "User must be one of these roles: #{roles_allowed_to_create_data_lenses.join(', ')}"
      }, :status => :forbidden
    end

    # 1b. Check if dataset is a derived view and exit early if the feature flag is not enabled.
    if is_from_derived_view
      return instantiate_ephemeral_view_from_derived_view
    end

    # 2. Check to make sure the dataset in question is in the new backend.
    unless dataset_is_new_backend?
      return render :json => {
        error: true,
        reason: 'Dataset must be in the dataspace backend, but it is in the legacy backend.'
      }, :status => 400
    end

    # 3. Check to make sure the dataset does not have a group by.
    unless !dataset_has_group_by?
      flash[:error] = t('controls.grid.errors.data_lens_is_incompatible_with_group_bys')
      return redirect_to request.base_url
    end

    # 4. Fetch the dataset metadata, which is used downstream to create cards.
    begin
      dataset_metadata = fetch_dataset_metadata(
        params[:id],
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )

    rescue => ex
      Rails.logger.error(ex)

      Airbrake.notify(
        :error_class => 'BootstrapUXFailure',
        :error_message => 'Could not retrieve dataset metadata.',
        :request => { :params => params },
        :context => { :response => dataset_metadata }
      )
      return render :nothing => true, :status => 404
    end

    # If we're in ephemeral mode, exit this logic early — we don't care about
    # controlling for the presence of existing pages, and we also don't want
    # to persist the data lens page automatically.
    if use_ephemeral_bootstrap
      begin
        return instantiate_ephemeral_view(dataset_metadata)
      rescue CoreServer::TimeoutError
        flash[:warning] = t('controls.grid.errors.timeout_on_bootstrap').html_safe
        return render 'shared/error', :status => 504, :layout => 'main'
      end
    end

    # 5. Check to see if any 'new UX' pages already exist.

    pages_response = phidippides.fetch_pages_for_dataset(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    has_publisher_pages = pages_response.try(:[], :body).present? &&
      pages_response[:body].try(:[], :publisher).present?

    request_successful_and_has_publisher_pages =
      has_publisher_pages && pages_response[:status] == '200'

    request_successful_but_no_pages =
      ((!has_publisher_pages && pages_response[:status] == '200') ||
        pages_response[:status] == '404')

    # 6a. There is at least one 'New UX' page already, so we can find a default.
    if request_successful_and_has_publisher_pages
      pages = pages_response[:body][:publisher]

      if dataset_metadata[:defaultPage].present?
        default_page = pages.find do |page|
          page[:pageId] == dataset_metadata[:defaultPage]
        end
      end

      if default_page.present? && page_accessible?(default_page[:pageId])
        # If we found a default page as specified in the dataset_metadata,
        # check its metadata version.
        # Note that the .to_i will coerce potential nil results into 0.
        if default_page[:version].to_i > 0
          # If the default page version is greater than or equal to 1,
          # immediately redirect to the default page.
          redirect_args = { controller: 'data_lens', action: 'data_lens', app: 'dataCards', id: default_page[:pageId] }
          unless I18n.locale.to_s == CurrentDomain.default_locale
            redirect_args[:locale] = I18n.locale
          end

          return redirect_to redirect_args
        else
          # Otherwise, generate a new default page and redirect to it.
          generate_and_redirect_to_new_page(dataset_metadata)
        end
      else
        # In any other metadata transition phase, however, if no pages match
        # the default page listed in the dataset_metadata, we attempt to find
        # a page in the collection that is of at least version 1 page
        # metadata.
        some_page = pages.find do |page|
          # Note that this may be nil and, if so, will be coerced by .to_i into 0
          page[:version].to_i > 0
        end
        if some_page.present? && page_accessible?(some_page[:pageId])
          # If we have found a qualifying default page, set it as the default
          # and then redirect to it.
          set_default_page(dataset_metadata, some_page[:pageId])
          redirect_args = { controller: 'data_lens', action: 'data_lens', app: 'dataCards', id: some_page[:pageId] }
          unless I18n.locale.to_s == CurrentDomain.default_locale
            redirect_args[:locale] = I18n.locale
          end

          return redirect_to redirect_args
        else
          # If no qualifying pages exist, then generate a new page and redirect
          # to it instead.
          generate_and_redirect_to_new_page(dataset_metadata)
        end
      end

    # 6b. If there are no pages, we will need to create a default 'New UX' page.
    elsif request_successful_but_no_pages
      generate_and_redirect_to_new_page(dataset_metadata)

    # This is a server error so we should notify Airbrake.
    else
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Dataset #{params[:id].inspect} failed to return pages for bootstrapping.",
        :request => { :params => params },
        :context => { :pages_response => pages_response }
      )
      Rails.logger.error(
        "Dataset #{params[:id].inspect} failed to return pages for bootstrapping. " \
        "Response: #{pages_response.inspect}"
      )
      flash[:error] = I18n.t('screens.ds.new_ux_error')

      return redirect_to action: 'show', controller: 'datasets'
    end
  end

  private

  # An arbitrary number of cards to create, if there are that many columns available
  MAX_NUMBER_OF_CARDS = 10

  def page_accessible?(page_id)
    return false unless page_id.present?

    default_page_metadata = page_metadata_manager.show(page_id)
    default_page_metadata[:status] == '200'
  end

  def set_default_page(dataset_metadata, page_id)
    # Set the specified page as the default.
    dataset_metadata[:defaultPage] = page_id

    # Send a request to phidippides to set the default page.
    dataset_metadata_response = phidippides.update_dataset_metadata(
      dataset_metadata,
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    unless dataset_metadata_response[:status] == '200'
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Dataset #{params[:id].inspect} failed to return pages for bootstrapping.",
        :request => { :params => params },
        :context => { :dataset_metadata_response => dataset_metadata_response }
      )
      Rails.logger.error(
        "Could not save new default page #{page_id.inspect} " \
        "Dataset #{params[:id].inspect}. " \
        "Response: #{dataset_metadata_response.inspect}"
      )
    end
  end

  def create_default_page(dataset_metadata)
    new_ux_page = generate_page_metadata(dataset_metadata)

    page_creation_response = HashWithIndifferentAccess.new(
      page_metadata_manager.create(
        new_ux_page,
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
    )

    page_id = page_creation_response.try(:[], :body).try(:[], :pageId)

    unless page_creation_response[:status].to_s == '200' && page_id.present?
      # Somehow the page creation failed so we should notify Airbrake.
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Error creating page for dataset #{params[:id]}",
        :request => { :params => params },
        :context => { :page_creation_result => page_creation_response }
      )
      Rails.logger.error(
        "Error creating page for dataset #{params[:id]}. " \
        "Response: #{page_creation_response.inspect}"
      )
    end

    page_id
  end

  def get_version
    FeatureFlags.derive(@view, request)[:create_v2_data_lens] ? 2 : 1
  end

  def generate_page_metadata(new_dataset_metadata)
    cards = generate_cards_from_dataset_metadata_columns(new_dataset_metadata[:columns])

    if cards.length < MAX_NUMBER_OF_CARDS
      # skipped_cards is an array of arrays, grouped by card type
      skipped_cards = skipped_cards_by_type.values
      # Find the card type with the most cards (to facilitate the zip operation)
      most_cards_of_this_type = skipped_cards.max_by(&:length)
      if most_cards_of_this_type.present?
        # Interleave the cards of different types, for the best variety
        interleaved_cards = most_cards_of_this_type.zip(*skipped_cards.select do |cards|
          cards != most_cards_of_this_type
        end).flatten(1).compact
        # Fill out the rest of the cards for the page
        cards = cards.concat(interleaved_cards.first(MAX_NUMBER_OF_CARDS - cards.length))
      else
        # This is a NOOP. wtf
        cards
      end
    else
      cards = cards.first(MAX_NUMBER_OF_CARDS)
    end


    # EN-13836 logic was originally attempted by changing the default_card_type_for method, however code in
    # the AngularJS implementation examines the default_card_type property rather than available_card_types
    # when determining if a card can be added for a given column. The change in EN-13836 resulted in making
    # the default_card_type 'invalid' when it would have been a search card, but available_card_types still
    # included 'search' among the other valid choices. So we perform the elision here instead. EN-14579
    cards.reject! { |card| card['cardType'] == 'search' } # Beware this key is 'card_type' elsewhere here

    unmigrated_metadata = {
      'cards' => cards,
      'datasetId' => new_dataset_metadata[:id],
      'description' => new_dataset_metadata[:description],
      'isFromDerivedView' => is_from_derived_view,
      'name' => new_dataset_metadata[:name],
      'primaryAggregation' => nil,
      'primaryAmountField' => nil,
      'version' => get_version
    }

    page_metadata_manager.migrated_page_metadata(
      unmigrated_metadata,
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )
  end

  # CORE-4770 Avoid card creation for latitude/longitude column types (because no one cares)
  def field_name_ignored_for_bootstrap?(field_name)
    columns_to_avoid = ['latitude', 'longitude', 'lat', 'lng', 'long', 'x', 'y']
    columns_to_avoid.include?(field_name.downcase)
  end

  def system_column?(field_name)
    (field_name =~ Phidippides::SYSTEM_COLUMN_ID_REGEX) != nil
  end

  def hidden_column?(column)
    column[:hideInTable] #is true or false
  end

  # CORE-4645 OBE datasets can have columns that have sub-columns. When converted to the NBE, these
  # sub-columns become their own columns. These generally don't have meaning in isolation, so don't
  # create a card for them.
  def filter_out_subcolumns(columns)
    # Reject everything that looks like a subcolumn
    flag_subcolumns!(columns)
    columns.reject { |field_name, column| column[:isSubcolumn] }
  end

  def number_column?(column)
    column[:physicalDatatype] == 'number'
  end

  def money_column?(column)
    column[:physicalDatatype] == 'money'
  end

  def point_column?(column)
    column[:physicalDatatype] == 'point'
  end

  def column_too_large_for_feature_card?(column)
    point_column?(column) && dataset_size > 100_000
  end

  def curated_region_is_disabled_for_column?(column)
    return false unless has_georegion_computation_strategy?(column)

    shapefile_id = column['computationStrategy']['parameters']['region'][1..-1] # slice off leading underscore

    curated_region = CuratedRegion.find_by_view_id(shapefile_id) rescue nil

    curated_region.nil? || curated_region.disabled?
  end

  # If a point column has no actual values in it, then the computed cardinality
  # will be 1 because there is only a single empty value. We use this cardinality
  # as a proxy for emptiness and omit these columns during the bootstrap process.
  def point_column_has_insufficient_cardinality?(column)
    # NOTE: "Insufficient cardinality" includes nil cardinality for points.
    # This is DIFFERENT from the behavior of other column types, which will
    # assume a default upon encountering nil cardinality!
    point_column?(column) && column['cardinality'].to_i <= 1
  end

  # If a column is uniform (cardinality of 1), its data is considered boring.
  def column_is_known_uniform?(column)
    column['cardinality'].to_i == 1
  end

  def column_has_no_valid_cards?(column)
    default_card_type_for(column, dataset_size) == 'invalid'
  end

  def non_bootstrappable_column?(field_name, column)
    field_name_ignored_for_bootstrap?(field_name) ||
      system_column?(field_name) ||
      hidden_column?(column) ||
      column_too_large_for_feature_card?(column) ||
      point_column_has_insufficient_cardinality?(column) ||
      column_is_known_uniform?(column) ||
      money_column?(column) ||
      curated_region_is_disabled_for_column?(column) ||
      column_has_no_valid_cards?(column)
  end

  def interesting_columns(columns)
    columns = columns.reject do |field_name, column|
      non_bootstrappable_column?(field_name, column)
    end

    filter_out_subcolumns(columns)
  end

  def generate_cards_from_dataset_metadata_columns(columns)
    interesting_columns(columns).map do |field_name, column|
      card_type = default_card_type_for(column, dataset_size, is_from_derived_view)

      if card_type
        card = page_metadata_manager.merge_new_card_data_with_default(field_name, card_type)

        if added_card_types.add?(card_type)
          card
        else
          skipped_cards_by_type[card_type] << card
          nil
        end
      end
    end.compact
  end

  def generate_and_redirect_to_new_page(dataset_metadata)
    default_page_id = create_default_page(dataset_metadata)

    unless default_page_id.present?
      flash[:error] = I18n.t('screens.ds.new_ux_error')
      return redirect_to action: 'show', controller: 'datasets'
    end

    # Set the newly-created page as the default.
    set_default_page(dataset_metadata, default_page_id)
    redirect_args = {controller: 'data_lens', action: 'data_lens', app: 'dataCards', id: default_page_id}
    unless I18n.locale.to_s == CurrentDomain.default_locale
      redirect_args[:locale] = I18n.locale
    end

    redirect_to redirect_args
  end

  def instantiate_ephemeral_view(dataset_metadata)
    @dataset_metadata = dataset_metadata

    @page_metadata = generate_page_metadata(dataset_metadata)
    @page_metadata['displayType'] = 'data_lens'

    @dataset_metadata[:permissions] = fetch_permissions(@dataset_metadata[:id])

    # Set up card-type info for (non-system) columns
    @dataset_metadata[:columns].each do |field_name, column|
      unless SYSTEM_COLUMN_ID_REGEX.match(field_name)
        column['defaultCardType'] = default_card_type_for(
          column,
          dataset_size,
          is_from_derived_view
        )
        column['availableCardTypes'] = available_card_types_for(
          column,
          dataset_size,
          is_from_derived_view
        )
      end
    end

    # Set up the table column
    @dataset_metadata[:columns]['*'] = {
      :availableCardTypes => ['table'],
      :defaultCardType => 'table',
      :name => 'Data Table',
      :description => '',
      :physicalDatatype => '*'
    }

    # Make sure that there is a table card
    has_table_card = @page_metadata['cards'].any? do |card|
      card['fieldName'] == '*' || card['cardType'] == 'table'
    end
    @page_metadata['cards'] << page_metadata_manager.table_card unless has_table_card

    # Fetch migration info to get mapping from nbe to obe for skipLinks
    begin
      @migration_metadata = View.migrations(@page_metadata[:datasetId])
    rescue
      @migration_metadata = {}
    end

    @dataset_id = is_from_derived_view ? @dataset_metadata[:id] : @migration_metadata[:obeId]

    request[:app] = 'dataCards'

    render 'data_lens/data_cards'
  end

  # EN-12365: This exists to create data lenses from derived views. We have a number of limitations:
  # - we cannot use Phidippides
  # - most derived views are based on the OBE version of a dataset, so the /views endpoint will
  #   return OBE columns, which makes data lens very, very unhappy
  # - we have to use the `read_from_nbe=true` flag whenever talking to Core, including the /views
  #   endpoint, because there are special snowflake hacks in place under that flag for derived views
  #   that make data lens for derived views possible
  def instantiate_ephemeral_view_from_derived_view
    dataset_metadata = fetch_dataset_metadata_for_derived_view(params[:id])

    begin
      instantiate_ephemeral_view(dataset_metadata)
    rescue CoreServer::TimeoutError
      flash[:warning] = t('controls.grid.errors.timeout_on_bootstrap').html_safe
      render 'shared/error', :status => 504, :layout => 'main'
    end
  end

  def dataset_size
    # Get the size of the dataset so we can compare it against the cardinality when creating cards
    @dataset_size ||= dataset.row_count
  end

  def dataset
    View.find(params[:id])
  end

  def is_from_derived_view
    dataset.is_derived_view?
  end

  def dataset_is_new_backend?
    dataset.new_backend?
  end

  def dataset_has_group_by?
    dataset.query.present? && dataset.query.groupBys.present?
  end

  # EN-1111: Force Data Lens to always use English
  def set_locale
    I18n.locale = 'en'
  end

end
