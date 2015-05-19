require 'core/auth/client'

class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  # Expose helper_methods for use in all views
  helper_method :current_user

  # Returns the current user, or nil
  #
  # ==== Examples
  #   current_user  # with valid cookies
  #   => {"id"=>"tugg-ikce", "createdAt"=>1425577015, "displayName"=>"cspurgeon", etc }
  #   current_user  # with invalid cookies
  #   => nil
  def current_user
    # If there are no cookies for the domain, don't bother checking core
    return unless cookies[:_core_session_id]
    socrata_session_cookies = request.cookies.map{ |k, v| "#{k}=#{v}" }.join('; ')

    auth = Core::Auth::Client.new(request.host, port: '9443', cookie: socrata_session_cookies, verify_ssl_cert: false)
    if auth.logged_in?
      auth.current_user
    else
      nil
    end
  end

end
