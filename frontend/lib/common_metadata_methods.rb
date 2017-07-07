module CommonMetadataMethods

  include CommonSocrataMethods

  class AuthenticationRequired < RuntimeError; end
  class UnauthorizedPageMetadataRequest < RuntimeError; end
  class PageMetadataNotFound < RuntimeError; end
  class UnauthorizedDatasetMetadataRequest < RuntimeError; end
  class DatasetMetadataNotFound < RuntimeError; end
  class UnknownRequestError < RuntimeError; end

  # A user's right to write to phidippides is currently determined by role.
  # This is not sustainable but adding a right to a role involves writing a
  # migration what parses JSON. The risk associated with that was deemed worse
  # than keying off of the role.
  # Note that bootstrapping old backend datasets is controlled by this as well.
  ROLES_ALLOWED_TO_CREATE_V1_DATA_LENSES = %w(administrator publisher)
  ROLES_ALLOWED_TO_CREATE_V2_DATA_LENSES = %w(administrator publisher designer editor viewer publisher_stories editor_stories)

  def roles_allowed_to_create_data_lenses
    if FeatureFlags.derive(nil, nil)[:create_v2_data_lens]
      ROLES_ALLOWED_TO_CREATE_V2_DATA_LENSES
    else
      ROLES_ALLOWED_TO_CREATE_V1_DATA_LENSES
    end
  end

  def role_allows_data_lens_creation?(role)
    roles_allowed_to_create_data_lenses.include?(role)
  end

  def can_create_metadata?
    return false unless current_user

    role_allows_data_lens_creation?(current_user.roleName) ||
    current_user.is_owner?(dataset) ||
    current_user.is_superadmin?
  end

  def page_metadata_manager
    @page_metadata_manager ||= PageMetadataManager.new
  end

  def phidippides
    @phidippides ||= Phidippides.new
  end

  def fetch_permissions(id)
    catalog_response = data_lens_manager.fetch(id)
    {
      isPublic: catalog_response.fetch(:grants, []).any? do |grant|
        grant.fetch(:flags, []).include?('public')
      end,
      rights: catalog_response.fetch(:rights, [])
    }
  end

  def data_lens_manager
    @data_lens_manager ||= DataLensManager.new
  end

  def fetch_dataset_metadata(dataset_id, request_options = {}, options = {})
    # Grab permissions from core.
    permissions = fetch_permissions_and_normalize_exceptions(dataset_id)

    if options[:is_from_derived_view]
      begin
        # we're imitating the format phidippides would have returned here so we can use the
        # metadata formatting methods the normal response returns.
        result = {
          :body => fetch_dataset_metadata_for_derived_view(dataset_id),
          :status => '200'
        }
      rescue CoreServer::Error
        raise UnknownRequestError.new("Error fetching derived view metadata for #{dataset_id}")
      end
    else
      result = case FeatureFlags.derive.phidippides_deprecation_metadata_source
        when 'phidippides-only'
          fetch_dataset_metadata_from_phidippides(dataset_id, request_options)
        when 'core-only'
          fetch_dataset_metadata_from_core(dataset_id, request_options)
        when 'mixed-mode'
          fetch_dataset_metadata_in_mixed_mode(dataset_id, request_options)
      end

      if result[:status] != '200'
        case result[:status]
          when '401'
            raise AuthenticationRequired.new
          when '403'
            raise UnauthorizedDatasetMetadataRequest.new
          when '404'
            raise DatasetMetadataNotFound.new
          else
            raise UnknownRequestError.new result[:body].to_s
        end
      end
    end

    # Moving forward, we also compute and insert two card type mapping
    # properties on columns before we send them to the front-end.
    # This method call will check the metadata transition phase
    # internally and just pass through if it is not set to '3'.
    phidippides.set_default_and_available_card_types_to_columns!(result, options[:is_from_derived_view])

    dataset_metadata = result[:body]
    dataset_metadata[:permissions] = permissions if dataset_metadata && result[:status] =~ /\A20[0-9]\z/

    if options[:add_table_column]
      add_table_column_to_dataset_metadata!(dataset_metadata)
    end

    flag_subcolumns!(dataset_metadata.fetch(:columns, {}))

    dataset_metadata
  end

  def fetch_permissions_and_normalize_exceptions(resource_id)
    begin
      fetch_permissions(resource_id)
    rescue DataLensManager::ViewAuthenticationRequired
      raise AuthenticationRequired.new
    rescue DataLensManager::ViewAccessDenied
      raise UnauthorizedPageMetadataRequest.new
    rescue DataLensManager::ViewNotFound
      raise PageMetadataNotFound.new
    rescue => error
      raise UnknownRequestError.new error.to_s
    end
  end

  # EN-12365: This method assembles metadata data similar to what Phidippides would have returned.
  # Data lenses based on derived views have a number of limitations to keep in mind:
  # - we cannot use Phidippides
  # - most derived views are based on the OBE version of a dataset, so the /views endpoint will
  #   return OBE columns, which makes data lens very, very unhappy
  # - we have to use the `read_from_nbe=true` flag whenever talking to Core, including the /views
  #   endpoint, because there are special snowflake hacks in place under that flag for derived views
  #   that make data lens for derived views possible
  def fetch_dataset_metadata_for_derived_view(dataset_id)
    derived_view_dataset = View.find_derived_view_using_read_from_nbe(dataset_id)

    dataset_metadata = derived_view_dataset.as_json.merge({
      :domain => CurrentDomain.cname,
      :locale => I18n.locale,
      :columns => Column.get_derived_view_columns(derived_view_dataset),
      :ownerId => derived_view_dataset.owner.id,
      :updatedAt => derived_view_dataset.time_metadata_last_updated_at,
      # this fetches the NBE view of the default view. if it errors, we have bigger problems
      :defaultId => derived_view_dataset.nbe_view.id
    }).with_indifferent_access

    # This mutates dataset_metadata with the extra things we need by looking up the view again in
    # Core. While it's in the Phidippides class, it doesn't actually talk to Phidippides.
    phidippides.mirror_nbe_column_metadata!(derived_view_dataset, dataset_metadata)

    dataset_metadata
  end

  def add_table_column_to_dataset_metadata!(dataset_metadata)
    table_column = {
      :availableCardTypes => ['table'],
      :defaultCardType => 'table',
      :name => 'Data Table',
      :description => '',
      :fred => '*',
      :physicalDatatype => '*'
    }
    dataset_metadata[:columns]['*'] = table_column

    dataset_metadata
  end

  # CORE-4645 OBE datasets can have columns that have sub-columns. When converted to the NBE, these
  # sub-columns become their own columns. This function flags them with a 'subcolumn' boolean, via
  # heuristics (so not guaranteed to be 100% accurate!)
  def flag_subcolumns!(columns)
    # The OBE->NBE conversion doesn't add any metadata to allow us to differentiate sub-columns,
    # except that it has a naming convention of "Parent Column Name (Sub-column Name)"

    return columns if columns.blank?

    # Create a mapping from the name, to all field_names that have that name
    field_name_by_name = Hash.new { |hash, key| hash[key] = [] }
    columns.each do |field_name, column|
      field_name_by_name[column[:name]] << field_name
    end

    # Flag everything that looks like a subcolumn
    columns.each do |field_name, column|
      # The naming convention is that child column names are the parent column name, followed by the
      # child column name in parentheses. Remove the parentheses to get the parent column's name.
      parent_column_name = column[:name].sub(/(\w) +\(.+\)$/, '\1')

      # CORE-6925: Fairly brittle, but with no other clear option, it seems that
      # we can and should only flag a column as a subcolumn if it follows the
      # naming conventions associated with "exploding" location, URL, and phone
      # number columns, which is an OBE-to-NBE occurrence. Robert Macomber has
      # verified the closed set of suffixes in Slack PM:
      #
      #   _type for the type subcolumn on phones (the number has no suffix)
      #   _description for the description subcolumn on urls (the url itself has no suffix)
      #   _address, _city, _state, _zip for location columns (the point has no suffix)
      #
      # See also https://socrata.slack.com/archives/engineering/p1442959713000621
      # for an unfortunately lengthy conversation on this topic.
      #
      # Complicating this matter... there is no strict guarantee that any suffix
      # for collision prevention (e.g. `_1`) will belong to a user-given column
      # or an exploded column consistently. It's possible that a user will have
      # a column ending in a number. Given that we're already restricting the
      # columns that we're willing to mark as subcolumns based on the closed set
      # of (non-numeric) suffixes, and the low probability of this very specific
      # type of column name similarity, we'll strip numeric parts off the end of
      # the column name *before* checking the closed set. This leaves us with a
      # very low (but non-zero) probability that a user-provided column will be
      # marked as an exploded subcolumn.

      field_name_without_collision_suffix = field_name.sub(/_\d+$/, '')
      has_exploded_suffix = field_name_without_collision_suffix =~ /_(address|city|state|zip|type|description)$/

      if parent_column_name != column[:name] && has_exploded_suffix
        # Look for the parent column
        parent_field_names = field_name_by_name[parent_column_name]
        is_subcolumn = (parent_field_names &&
            # There are columns that have the same name as this one, sans parenthetical.
            # Its field_name naming convention should also match, for us to infer it's a subcolumn.
            parent_field_names.any? do |parent_field_name|
              parent_field_name + '_' == field_name[0..parent_field_name.length]
            end
           )
        column[:isSubcolumn] = is_subcolumn
      else
        column[:isSubcolumn] = false
      end
    end
  end

  private

  # We have to `rescue nil` in these helpers because, due to the labyrinthine
  # nature of this subset of Ruby code (especially the fact that we cross the
  # boundary between app/ and lib/ in bizarre ways), we can't guarantee that we
  # actually have access to the underlying request/cookies, so the corresponding
  # helper methods used here will error. It's pretty dumb.

  def _cookies(request_options)
    request_options[:cookies] || (forwardable_session_cookies rescue nil)
  end

  def _request_id(request_options)
    request_options[:request_id] || (request_id rescue nil)
  end

  def fetch_dataset_metadata_from_phidippides(dataset_id, request_options)
    phidippides.fetch_dataset_metadata(
      dataset_id,
      :request_id => _request_id(request_options),
      :cookies => _cookies(request_options)
    )
  end

  def fetch_dataset_metadata_from_core(dataset_id, request_options)
    # it's necessary to get nbe metadata because it contains
    # fields that are not present in obe metadata
    view = View.find(dataset_id, {'Cookie' => _cookies(request_options)}.compact)
    nbe_view = view.nbe_view rescue nil
    nbe_metadata = nbe_view.nil? ? {} : nbe_view.data.with_indifferent_access
    core_metadata = translate_core_metadata_to_legacy_structure(nbe_metadata)

    # Add dataset-level fields that phidippides is expected to return
    # because we want to use the obe dataset's information instead of the nbe 4x4
    core_metadata.merge!(
      domain: CurrentDomain.cname,
      id: view.id,
      locale: I18n.locale,
      name: view.name,
      ownerId: view.owner.id,
      updatedAt: view.time_metadata_last_updated_at
    )

    { body: core_metadata, status: '200' }
  end

  def fetch_dataset_metadata_in_mixed_mode(dataset_id, request_options)
    phidippides_metadata = fetch_dataset_metadata_from_phidippides(dataset_id, request_options)
    core_metadata = fetch_dataset_metadata_from_core(dataset_id, request_options)

    # allow phiddy errors to bubble up (non-200 responses from core will be handled
    # by the caller, because deep_merge gives precedence to the core response)
    unless phidippides_metadata[:status] == '200'
      return phidippides_metadata
    end

    merged = phidippides_metadata.deep_merge(core_metadata)

    # it seems to be theoretically possible (i.e. happens locally for unknown
    # reasons) that core and phidippides might disagree about the existence of
    # columns. one manifestation of the problem was a data lens that, prior to
    # this change, correctly hid hidden columns while authenticated but not when
    # anonymous, because we might report different metadata depending on whether
    # you're logged in.
    #
    # to resolve this potential complication, we're going to make assertions
    # about the structure of the merged metadata and deal with anything that
    # doesn't match our expectations. (this is why a single source of truth is
    # important, mmkay?)
    merged[:body][:columns].each do |_, column|
      if column[:hideInTable].nil?
        column[:hideInTable] = true
      end
    end

    merged
  end

  # In core, computationStrategy has a slightly different structure
  # strategy_type becomes type
  def get_computation_strategy_legacy_structure(column)
    core_computation_strategy = column[:computationStrategy]
    return nil unless core_computation_strategy

    computation_strategy = core_computation_strategy.slice(:type, :source_columns, :parameters)
    computation_strategy[:strategy_type] = computation_strategy.delete(:type)
    computation_strategy
  end

  # For Phidippides deprecation, this method should be progressively enhanced to
  # translate the currently-targeted subset of fields.
  def translate_core_metadata_to_legacy_structure(nbe_metadata)
    nbe_columns = nbe_metadata.fetch(:columns, []).each_with_object({}) do |column, accum|
      accum[column[:fieldName]] = {
        cardinality: column.dig(:cachedContents, :cardinality).to_i,
        computationStrategy: get_computation_strategy_legacy_structure(column),
        description: column[:description],
        fred: column[:renderTypeName],
        name: column[:name],
        physicalDatatype: column[:renderTypeName] == 'checkbox' ? 'boolean' : column[:renderTypeName]
      }.compact
    end

    # The OBE->NBE conversion doesn't add any metadata to allow us to differentiate sub-columns,
    # except that it has a naming convention of "Parent Column Name (Sub-column Name)"
    # flag_subcolumns! is an existing helper method that identifies subcolumns from core metadata
    flag_subcolumns!(nbe_columns)

    metadata = {
      columns: nbe_columns,
      permissions: {
        isPublic: nbe_metadata.fetch(:grants, []).any? do |grant|
          grant.fetch(:flags, []).include?('public')
        end
      }
    }.with_indifferent_access

    if nbe_metadata.dig(:metadata, :overrideLink)
      metadata[:downloadOverride] = nbe_metadata[:metadata][:overrideLink]
    end

    # phidippides.rb has a helper method augment_dataset_metadata!
    # that will create phidippides-like structure on some fields using core metadata
    # this helper method is especially useful in creating fields with a complex structure
    phidippides.augment_dataset_metadata!(nbe_metadata[:id], metadata)

    metadata
  end
end
