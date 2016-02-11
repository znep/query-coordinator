class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Expose helper_methods for use in all views
  helper_method :current_user, :current_user_story_authorization

  prepend_before_filter :require_logged_in_user

  before_filter :set_story_uid

  # Returns the current user, or nil
  #
  # ==== Examples
  #   current_user  # with valid cookies
  #   => {"id"=>"tugg-ikce", "createdAt"=>1425577015, "displayName"=>"cspurgeon", etc }
  #   current_user  # with invalid cookies
  #   => nil
  def current_user
    @current_user = env[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env)
  end

  def current_user_story_authorization
    @current_user_story_authorization = CoreServer.current_user_story_authorization
  end

  def set_story_uid
    ::RequestStore.store[:story_uid] = params['uid']
  end

  # +before_filter+
  def require_logged_in_user
    # If no current_user:
    # - for JSON requests, respond with 401.
    # - for other requests, redirect to login.
    unless current_user.present?
      if params[:format] == 'json'
        head :unauthorized
      else
        redirect_to_login_and_return
      end
    end
  end

  # +before_filter+
  def require_super_admin
    unless current_user.try(:[], 'flags').try(:include?, 'admin')
      redirect_to_login_and_return
    end
  end

  def redirect_to_login_and_return
    redirect_to "/login?return_to=#{Rack::Utils.escape(request.fullpath)}"
  end
end

