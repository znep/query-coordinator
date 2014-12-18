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

  def current_user
    @current_user ||= current_user_session ? current_user_session.user : nil
  end

  def basic_auth
    authenticate_with_http_basic do |username, password|
      user_session = UserSession.new('login' => username, 'password' => password)
      user_session.save
    end
  end

  def current_user_session
    @current_user_session ||= UserSession.find || basic_auth
  end

  def current_user_session=(user_session)
    @current_user_session = user_session
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

  private

  def hook_auth_controller
    UserSession.controller = self
  end

end
