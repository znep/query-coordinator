module UserAuthMethods

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

  private

  def hook_auth_controller
    UserSession.controller = self
  end

end
