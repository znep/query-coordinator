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
  ROLES_ALLOWED_TO_UPDATE_METADATA = %w(administrator publisher)

  def can_create_metadata?
    current_user &&
      (ROLES_ALLOWED_TO_UPDATE_METADATA.include?(current_user.roleName) ||
      current_user.is_owner?(dataset) ||
      current_user.is_admin?)
  end

  def page_metadata_manager
    @page_metadata_manager ||= PageMetadataManager.new
  end

  def phidippides
    @phidippides ||= Phidippides.new
  end

  def request_id
    request.headers['X-Socrata-RequestId'] || request.headers['action_dispatch.request_id']
  end

  def dataset_metadata
    return @dataset_metadata if defined? @dataset_metadata
    result = phidippides.fetch_dataset_metadata(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )
    if result[:status] != '200' || result.try(:[], :body).blank?
      @dataset_metadata = nil
    else
      @dataset_metadata = result[:body]
    end
  end

  def domain_metadata
    categories = CurrentDomain.configuration('view_categories')
    if categories.nil?
      {
        :categories => []
      }
    else
      enabled_categories = categories.properties.select do |category_name, category_settings|
        category_settings['enabled']
      end
      enabled_category_names = enabled_categories.map do |category_name, category_settings|
        if category_settings.has_key? 'locale_strings'
          localized_category_name = category_settings['locale_strings'].fetch(I18n.locale.to_s, category_name)
          localized_category_name.empty? ? category_name : localized_category_name
        else
          category_name
        end
      end
      {
        :categories => enabled_category_names
      }
    end
  end

  def fetch_permissions(id)
    catalog_response = new_view_manager.fetch(id)
    {
      isPublic: catalog_response.fetch(:grants, []).any? do |grant|
        grant.fetch(:flags, []).include?('public')
      end,
      rights: catalog_response.fetch(:rights, [])
    }
  end

  def new_view_manager
    @new_view_manager ||= NewViewManager.new
  end

  # CORE-4645 OBE datasets can have columns that have sub-columns. When converted to the NBE, these
  # sub-columns become their own columns. This function flags them with a 'subcolumn' boolean, via
  # heuristics (so not guaranteed to be 100% accurate!)
  def flag_subcolumns!(columns)
    # The OBE->NBE conversion doesn't add any metadata to allow us to differentiate sub-columns,
    # except that it has a naming convention of "Parent Column Name (Sub-column Name)"

    # Create a mapping from the name, to all field_names that have that name
    field_name_by_name = Hash.new { |hash, key| hash[key] = [] }
    columns.each do |field_name, column|
      field_name_by_name[column[:name]] << field_name
    end

    # Flag everything that looks like a subcolumn
    columns.each do |field_name, column|
      # The naming convention is that child column names are the parent column name, followed by the
      # child column name in parentheses. Remove the parentheses to get the parent column's name.
      parent_column = column[:name].sub(/(\w) +\(.+\)$/, '\1')

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

      if parent_column != column[:name] && has_exploded_suffix
        # Look for the parent column
        parent_field_names = field_name_by_name[parent_column]
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

  def fetch_pages_for_dataset(dataset_id)

    # Fetch phiddy (v1) pages
    phiddy_result = phidippides.fetch_pages_for_dataset(
      dataset_id,
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    # Fetch metadb (v2) pages
    metadb_status = begin
      metadb_response = View.find(dataset_id).find_related(1)
      '200'
    rescue CoreServer::ResourceNotFound
      '404'
    rescue CoreServer::CoreServerError => error
      case error.error_code
      when 'authentication_required'; '401'
      when 'permission_denied'; '403'
      end
    end

    # Filter metadb_response on only published v2 data lenses
    metadb_result = JSON.parse(metadb_response.select { |view|
      view.data_lens? && view.is_published?
    }.to_s, :symbolize_names => true)

    combined_statuses = [phiddy_result[:status], metadb_status]

    unless combined_statuses.include? '200'
      if combined_statuses.include? '401'
        raise AuthenticationRequired.new
      elsif combined_statuses.include? '403'
        raise UnauthorizedDatasetMetadataRequest.new
      elsif combined_statuses.include? '404'
        raise DatasetMetadataNotFound.new
      else
        raise UnknownRequestError.new combined_result[:body].to_s
      end
    end

    metadb_pages = []
    if metadb_result.present?
      metadb_pages = metadb_result.select { |page|
        page[:displayFormat].present? && page[:displayFormat][:data_lens_page_metadata].present?
      }.map { |page|
        HashWithIndifferentAccess.new(page[:displayFormat][:data_lens_page_metadata])
      }
    end

    phiddy_pages = []
    phiddy_user_pages = []
    if phiddy_result[:body].present?
      phiddy_pages = phiddy_result[:body][:publisher] if phiddy_result[:body][:publisher].present?
      phiddy_user_pages = phiddy_result[:body][:user] if phiddy_result[:body][:user].present?
    end

    # Return hash with publisher and user views.
    # Combines metadb and phiddy results into publisher views.
    {
      :publisher => metadb_pages.concat(phiddy_pages),
      :user => phiddy_user_pages
    }
  end
end
