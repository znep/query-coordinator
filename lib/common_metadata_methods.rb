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
      if parent_column != column[:name]
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
      metadb_response = Array(View.find(dataset_id).find_related(1))
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

    # Return hash with publisher and user views.
    # Combines metadb and phiddy results into publisher views.
    {
      :publisher => metadb_result.map { |page|
          HashWithIndifferentAccess.new(page[:displayFormat][:data_lens_page_metadata])
        }.concat(Array(phiddy_result[:body][:publisher])),
      :user => phiddy_result[:body][:user]
    }
  end
end
