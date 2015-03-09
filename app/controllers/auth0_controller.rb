class Auth0Controller < ApplicationController
  include Auth0Helper
  include UserSessionsHelper
  skip_before_filter :require_user, :only => [:callback, :failure]
  protect_from_forgery :except => [:return_login, :return_signup]
  cattr_accessor :auth_providers

  def callback
    
    # This stores all the user information that came from Auth0
    # and the IdP
    userinfo_hash = request.env['omniauth.auth']
    Rails.logger.error("Thing: #{userinfo_hash}")
    if userinfo_hash[:extra][:raw_info][:socrata_user_id].start_with?('auth0|')
      uid = userinfo_hash[:extra][:raw_info][:socrata_user_id].sub('auth0|', '')

      # Do some primitive validation on the returned UID
      if uid.nil? || !uid.match(/^\w{4}-\w{4}$/)
        Rails.logger.error("Invalid UID returned from Auth0: #{uid}")        
        render_500
      else # UID is of the form xxxx-xxxx
        Rails.logger.info("Successful Auth0 login with UID: #{uid}")
        cookies[:_core_session_id] = {value: "#{gen_cookie(uid)}", secure: true}
        cookies[:logged_in] = true
        redirect_to '/profile'
      end
    else
      
      Rails.logger.info("Not a username and password user.  Checking for federated user")
      Rails.logger.info(session[:userinfo])
      #See if the user is federated
      token = userinfo_hash[:extra][:raw_info];
      if (!isValidToken(token))
        Rails.logger.info("Token is invalid. Verify that it contains email, name and user_id in the correct format")
        render_500
      else
        Rails.logger.info("Token contains required fields.  Attempting to authenticate through Core.")
        auth0_authentication = Auth0Authentication.new(token.to_json)
        if (auth0_authentication.isAuthenticated?)
          user_session = UserSession.auth0(auth0_authentication)
          Rails.logger.info(user_session.to_s)
          redirect_back_or_default(login_redirect_url)
        else
          Rails.logger.error("Cannot find federated user")
          render_500
        end
      end
      #Rails.logger.error("Invalid provider/UID pair returned from Auth0: #{session[:userinfo][:uid]}")
      #render_500
    end
  end

  # Indicates a failure on the side of Auth0; it may be internal, auth code expiration, etc.
  # May indicate an authentication failure if accessed programmatically, but will not happen if
  # accessed as part of the UI login flow. As such, not much to do besides return a failure response
  def failure
    Rails.logger.error("Auth0 login failed with message '#{request.params['message']}'")
    redirect_to '/500'
  end

def login_or_signup
    rpx_authentication = RpxAuthentication.new(params[:token])
    if (rpx_authentication.existing_account?)
      user_session = UserSession.rpx(rpx_authentication)
      redirect_back_or_default(login_redirect_url)
    else
      @body_id = 'signup'
      @signup = SignupPresenter.new
      @signup.user = rpx_authentication.user if rpx_authentication.user
      @signup.emailConfirm = @signup.email
      render :template => 'rpx/return_login'
    end
  end

end
