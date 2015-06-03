require 'core/auth/client'

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
    env['socrata.current_user']
  end

  def require_logged_in_user
    # If no current_user, send to main login page
    redirect_to "/login?return_to=#{request.path}" unless current_user
  end
end

