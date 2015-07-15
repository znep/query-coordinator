require 'set'
require 'json'

class NewUxBootstrapController < ActionController::Base

  include CommonMetadataMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods
  include CardTypeMapping

  before_filter :hook_auth_controller

  # Keep track of the types of cards we added, so we can give a spread
  attr_accessor :skipped_cards_by_type, :added_card_types, :page_metadata_manager

  def initialize(*args)
    @added_card_types = Set.new
    @skipped_cards_by_type = Hash.new { |h, k| h[k] = [] }
    @page_metadata_manager = PageMetadataManager.new
    super
  end

  def bootstrap
    # This method needs to accomplish a few things in order to enable 'new UX' views of
    # existing datasets.
    #
    # 1. Check to make sure that the user is authorized to create a new view.
    #    Crucially, this includes SuperAdmins so that Socrata employees can
    #    test this functionality without having to impersonate customers.
    #
    # 2. Check to make sure the dataset in question is in the new backend.
    #    If it isn't, 400.
    #
    # 3. Check to make sure the dataset does not have a group by.
    #    If it does, redirect and provide a friendly error message.
    #
    # 4. Fetch the dataset metadata, which is used downstream to create cards.
    #    If we cannot fetch the dataset data then we fail early. We will let
    #    Airbrake know aout this, but not the user.
    #
    # 5. Check to see if any 'new UX' pages already exist.
    #
    # 6a. If they do, then we send the user to the default or the last page in
    #     the collection.
    #
    # 6b. If no pages already exist, then we need to create one. This is hacky
    #     and non-deterministic.

    # 1. Check to make sure that the user is authorized to create a new view
    unless can_create_metadata?
      return render :json => {
        error: true,
        reason: "User must be one of these roles: #{ROLES_ALLOWED_TO_UPDATE_METADATA.join(', ')}"
      }, :status => :forbidden
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
    dataset_metadata_response = phidippides.fetch_dataset_metadata(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    unless dataset_metadata_response[:status] == '200' && dataset_metadata_response.try(:[], :body).present?
      Airbrake.notify(
        :error_class => "BootstrapUXFailure",
        :error_message => "Could not retrieve dataset metadata.",
        :request => { :params => params },
        :context => { :response => dataset_metadata_response }
      )
      return render :nothing => true, :status => 404
    end

    dataset_metadata_response_body = dataset_metadata_response[:body]

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

      if dataset_metadata_response_body[:defaultPage].present?
        default_page = pages.find do |page|
          page[:pageId] == dataset_metadata_response_body[:defaultPage]
        end
      end

      if default_page_accessible?(default_page)
        # If we found a default page as specified in the dataset_metadata,
        # check its metadata version.
        # Note that the .to_i will coerce potential nil results into 0.
        if default_page[:version].to_i > 0
          # If the default page version is greater than or equal to 1,
          # immediately redirect to the default page.
          return redirect_to "/view/#{default_page[:pageId]}"
        else
          # Otherwise, generate a new default page and redirect to it.
          generate_and_redirect_to_new_page(dataset_metadata_response_body)
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

        if some_page.present?
          # If we have found a qualifying default page, set it as the default
          # and then redirect to it.
          set_default_page(dataset_metadata_response_body, some_page[:pageId])
          return redirect_to "/view/#{some_page[:pageId]}"
        else
          # If no qualifying pages exist, then generate a new page and redirect
          # to it instead.
          generate_and_redirect_to_new_page(dataset_metadata_response_body)
        end
      end

    # 6b. If there are no pages, we will need to create a default 'New UX' page.
    elsif request_successful_but_no_pages

      generate_and_redirect_to_new_page(dataset_metadata_response_body)

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

  def default_page_accessible?(default_page)
    return false unless default_page.present?

    default_page_metadata = phidippides.fetch_page_metadata(default_page)
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

    page_creation_response = page_metadata_manager.create(
      new_ux_page,
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    page_id = page_creation_response.try(:[], :body).try(:[], :pageId)

    unless page_creation_response[:status] == '200' && page_id.present?
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
        cards
      end
    else
      cards = cards.first(MAX_NUMBER_OF_CARDS)
    end

    {
      'cards' => cards,
      'datasetId' => new_dataset_metadata[:id],
      'description' => new_dataset_metadata[:description],
      'name' => new_dataset_metadata[:name],
      'primaryAggregation' => nil,
      'primaryAmountField' => nil,
      'version' => 1
    }
  end

  # CORE-4770 Avoid card creation for latitude/longitude column types (because no one cares)
  def field_name_ignored_for_bootstrap?(field_name)
    columns_to_avoid = ['latitude', 'longitude', 'lat', 'lng', 'long', 'x', 'y']
    columns_to_avoid.include?(field_name.downcase)
  end

  def system_column?(field_name)
    (field_name =~ Phidippides::SYSTEM_COLUMN_ID_REGEX) != nil
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

  # If the column is either money or number, then we only support bootstrapping
  # it if the histogram feature is enabled.
  def histogram_is_unsupported_on_column?(column)
    (number_column?(column) || money_column?(column)) && !histogram_enabled?
  end

  def column_too_large_for_feature_card?(column)
    point_column?(column) && dataset_size > 100_000
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

  def non_bootstrappable_column?(field_name, column)
    field_name_ignored_for_bootstrap?(field_name) ||
      system_column?(field_name) ||
      histogram_is_unsupported_on_column?(column) ||
      column_too_large_for_feature_card?(column) ||
      point_column_has_insufficient_cardinality?(column) ||
      column_is_known_uniform?(column) ||
      money_column?(column)
  end

  def interesting_columns(columns)
    columns = columns.reject do |field_name, column|
      non_bootstrappable_column?(field_name, column)
    end
    filter_out_subcolumns(columns)
  end

  def generate_cards_from_dataset_metadata_columns(columns)
    interesting_columns(columns).map do |field_name, column|
      card_type = card_type_for(column, :fred, dataset_size)
      if card_type
        card = page_metadata_manager.merge_new_card_data_with_default(
          field_name,
          card_type
        )

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
    redirect_to "/view/#{default_page_id}"
  end

  def dataset_size
    # Get the size of the dataset so we can compare it against the cardinality when creating cards
    @dataset_size ||= dataset.row_count
  end

  def dataset
    View.find(params[:id])
  end

  def dataset_is_new_backend?
    dataset.new_backend?
  end

  def dataset_has_group_by?
    dataset.query.present? && dataset.query.groupBys.present?
  end

end
