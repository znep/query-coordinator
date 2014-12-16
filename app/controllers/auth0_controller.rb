class Auth0Controller < ApplicationController
  include Auth0Helper
  skip_before_filter :require_user, :only => [:callback, :failure]
  def callback
    
    # This stores all the user information that came from Auth0
    # and the IdP

    session[:userinfo] = request.env['omniauth.auth']
    uid = session[:userinfo][:uid].sub('auth0|', '')

    # Do some primitive validation on the returned UID
    if uid.nil? || !uid.match(/\w{4}-\w{4}/)
      Rails.logger.error("Invalid UID returned from Auth0: #{uid}")
      #TODO more meaningful error handling
      redirect_to '/'
    else # UID is of the form xxxx-xxxx
      Rails.logger.info("Successful Auth0 login with UID: #{uid}")
      cookies[:_core_session_id] = gen_cookie(uid)
      cookies[:logged_in] = true
      redirect_to '/profile'
    end
  end

  def failure
    # TODO more meaningful error handling
    Rails.logger.error("Auth0 login failed with message '#{request.params['message']}'")
    redirect_to '/'
  end
end
