class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Expose helper_methods for use in all views
  helper_method :current_user, :current_user_authorization

  prepend_before_filter :require_logged_in_user

  # Returns the current user, or nil
  #
  # ==== Examples
  #   current_user  # with valid cookies
  #   => {"id"=>"tugg-ikce", "createdAt"=>1425577015, "displayName"=>"cspurgeon", etc }
  #   current_user  # with invalid cookies
  #   => nil
  def current_user
    @current_user ||= env[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env)
  end

  def current_user_authorization
    @current_user_authorization ||= CoreServer.current_user_authorization(current_user, params[:uid])
  end

  # +before_filter+
  def require_logged_in_user
    # If no current_user, send to main login page
    redirect_to "/login?return_to=#{request.path}" unless current_user.present?
  end

  # +before_filter+
  def require_super_admin
    unless current_user.try(:[], 'flags').try(:include?, 'admin')
      redirect_to "/login?return_to=#{request.path}"
    end
  end
end

