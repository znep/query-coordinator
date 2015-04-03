module UserAuthMethods

  if respond_to?(:hide_action)
    hide_action :current_user, :current_user_session, :prerendered_fragment_for,
      :require_module!, :require_that
  end

  # See ActionController::Base for details
  # Uncomment this to filter the contents of submitted sensitive data parameters
  # from your application log (in this case, all fields with names like "password").
  # filter_parameter_logging :password

  def current_user_session
    @current_user_session ||= UserSession.find
  end

  def current_user_session=(user_session)
    @current_user_session = user_session
  end

  def current_user_session_or_basic_auth
    @current_user_session ||= UserSession.find || basic_auth
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

  private

  # Allow access to the current controller from the UserSession model.
  # UserSession itself is an ActiveRecord-like model, but it's mostly
  # concerned with setting session data, so it's easiest to just plumb
  # it through.
  def hook_auth_controller
    UserSession.controller = self
    UserSession.update_current_user(nil, nil)
  end

end
