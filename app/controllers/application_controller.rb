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
    # If there are no cookies for the domain, don't bother checking
    return unless cookies[:_core_session_id]

    # Request current user from core
    response = core_server_get('/users/current.json')

    # If cookies are invalid, response will be formatted as:
    # {"code"=>"not_found", "error"=>true, "message"=>"User not found"}
    if response.include?('error')
      return nil
    else
      # Return user object
      response
    end
  end

  private

  # Builds a core request with cookies
  #
  # ==== Examples
  #   core_server_get('/users/current.json')
  def core_server_get(path)
    # Join list of cookies into single string to pass to core
    socrata_session_cookies = request.cookies.map{|k,v| "#{k}=#{v}"}.join('; ')

    HTTParty.get("#{Rails.application.config.core_service_uri}#{path}",
      :headers => {
        'X-Socrata-Host' => "#{request.host}",
        'Cookie' => socrata_session_cookies
      }
    )
  end

end
