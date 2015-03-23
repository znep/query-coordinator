class Auth0Controller < ApplicationController
  include Auth0Helper
  include UserSessionsHelper
  skip_before_filter :require_user, :only => [:callback, :failure]
  protect_from_forgery :except => [:return_login, :return_signup]
  cattr_accessor :auth_providers

  def callback
    
    # This stores all the user information that came from Auth0 and the IdP
    userinfo_hash = request.env['omniauth.auth']
    socrata_user_id = userinfo_hash[:extra][:raw_info][:socrata_user_id]
    # Check to see if it's a username and password connection.  
    if username_password_connection?(socrata_user_id)
      # In the username and password flow, the UID is set as part of authentication 
      # It's going to come in with the form "auth0|abcd-efgh|connection_name"
      # Use the Auth0Helper to attempt to extract it
      extracted_uid = extract_uid(socrata_user_id)

      # Do some primitive validation on the returned UID
      if extracted_uid.nil?
        Rails.logger.error("Invalid UID returned from Auth0: #{extracted_uid}")
        render_500
      else # UID is of the form xxxx-xxxx
        uid = extracted_uid.to_s
        Rails.logger.info("Successful Auth0 login with UID: #{uid}")
        cookies[:_core_session_id] = {value: "#{gen_cookie(uid)}", secure: true}
        cookies[:logged_in] = true
        redirect_to '/profile'
      end
    else
      #See if the user is federated
      token = userinfo_hash[:extra][:raw_info];
      unless valid_token?(token)
        Rails.logger.info("Token is invalid. Verify that it contains email, name and user_id in the correct format")
        render_404
      else
        Rails.logger.info("Token contains required fields.  Attempting to authenticate through Core.")
        auth0_authentication = authentication_provider_class.new(token.to_json)
        if auth0_authentication.authenticated?
          user_session = UserSession.auth0(auth0_authentication)
          redirect_back_or_default(login_redirect_url)
        else
          Rails.logger.error("Cannot authenticate federated user")
          render_500
        end
      end
    end
  end

  #Factored out to support functional testing
  def authentication_provider_class
    Auth0Authentication
  end

  # Indicates a failure on the side of Auth0; it may be internal, auth code expiration, etc.
  # May indicate an authentication failure if accessed programmatically, but will not happen if
  # accessed as part of the UI login flow. As such, not much to do besides return a failure response
  def failure
    Rails.logger.error("Auth0 login failed with message '#{request.params['message']}'")
    redirect_to '/500'
  end

end
