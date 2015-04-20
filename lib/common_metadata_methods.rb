module CommonMetadataMethods

  include CommonSocrataMethods

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

  def inherit_catalog_lens_permissions?
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:use_catalog_lens_permissions]
  end
end
