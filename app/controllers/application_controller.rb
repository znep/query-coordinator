class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Expose helper_methods for use in all views
  helper_method :current_user

  prepend_before_filter :require_logged_in_user

  # All requests must use SSL, otherwise core's CSRF check
  # will fail (its CSRF cookies are HTTPS-only).
  #
  # However, since SSL isn't actually controlled by this app (it's done at the
  # global Socrata router), SSL won't work in local test mode.
  force_ssl unless Rails.env.test?

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
    redirect_to "/login?return_to=#{request.path}" unless current_user.present?
  end
end

