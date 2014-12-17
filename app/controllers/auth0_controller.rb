class Auth0Controller < ApplicationController
  include Auth0Helper
  skip_before_filter :require_user, :only => [:callback, :failure]
  def callback
    
    # This stores all the user information that came from Auth0
    # and the IdP

    session[:userinfo] = request.env['omniauth.auth']

    if session[:userinfo][:uid].start_with?('auth0|')
      uid = session[:userinfo][:uid].sub('auth0|', '')

      # Do some primitive validation on the returned UID
      if uid.nil? || !uid.match(/^\w{4}-\w{4}$/)
        Rails.logger.error("Invalid UID returned from Auth0: #{uid}")
        redirect_to '/500'
      else # UID is of the form xxxx-xxxx
        Rails.logger.info("Successful Auth0 login with UID: #{uid}")
        cookies[:_core_session_id] = gen_cookie(uid)
        cookies[:logged_in] = true
        redirect_to '/profile'
      end
    else
      Rails.logger.error("Invalid provider/UID pair returned from Auth0: #{session[:userinfo][:uid]}")
      redirect_to '/500'
    end
  end

  # Indicates a failure on the side of Auth0; it may be internal, auth code expiration, etc.
  # May indicate an authentication failure if accessed programmatically, but will not happen if
  # accessed as part of the UI login flow. As such, not much to do besides return a failure response
  def failure
    Rails.logger.error("Auth0 login failed with message '#{request.params['message']}'")
    redirect_to '/500'
  end
end
