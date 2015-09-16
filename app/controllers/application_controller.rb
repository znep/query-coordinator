class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Expose helper_methods for use in all views
  helper_method :current_user

  prepend_before_filter :require_logged_in_user

  # Returns the current user, or nil
  #
  # ==== Examples
  #   current_user  # with valid cookies
  #   => {"id"=>"tugg-ikce", "createdAt"=>1425577015, "displayName"=>"cspurgeon", etc }
  #   current_user  # with invalid cookies
  #   => nil
  def current_user
    env[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env)
  end

  def require_logged_in_user
    # If no current_user, send to main login page
    Rails.logger.debug "i am a current user: #{current_user.inspect}"
    redirect_to "/login?return_to=#{request.path}" unless current_user.present?
  end
end

