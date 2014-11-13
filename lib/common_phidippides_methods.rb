module CommonPhidippidesMethods

  include CommonSocrataMethods

  def has_rights?
    current_user && (current_user.is_owner?(dataset) || current_user.is_admin?)
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

end
