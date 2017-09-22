class Auth0Controller < ApplicationController
  include Auth0Helper
  include UserSessionsHelper
  skip_before_filter :require_user, :only => [:callback, :link, :connections]
  protect_from_forgery
  before_filter :set_empty_user_session, :redirect_if_logged_in
  cattr_accessor :auth_providers

  def callback
    # This stores all the user information that came from Auth0 and the IdP
    userinfo_hash = request.env['omniauth.auth']
    auth0_identifier = userinfo_hash[:extra][:raw_info][:socrata_user_id]

    # get auth0 federated user info-hash (aka auth0 token)
    token = userinfo_hash[:extra][:raw_info]

    # if this is a social login attempt but social login isn't allowed, error.
    # openid_login is the social login feature flag, because naming is hard. It should be renamed.
    if social_connection?(auth0_identifier) && !feature?('openid_login')
      Rails.logger.error("Tried to login with auth0 social provider on a domain with social login disabled (user_id #{auth0_identifier})")
      return render_404
    # if the token isn't valid, error
    elsif !valid_token?(token)
      Rails.logger.info('Token is invalid. Verify that it contains email, name and user_id in the correct format')
      return render_404
    else
      if username_password_connection?(auth0_identifier)
        # In the username and password flow, the UID is set as part of authentication
        # It's going to come in with the form "auth0|abcd-efgh|connection_name"
        # Use the Auth0Helper to attempt to extract it
        extracted_uid = extract_uid(auth0_identifier)

        # Do some primitive validation on the returned UID
        if extracted_uid.nil?
          Rails.logger.error("Invalid UID returned from Auth0: #{extracted_uid}")
          return render_500
        else # UID is of the form xxxx-xxxx
          uid = extracted_uid.to_s
          Rails.logger.info("Successful username/password Auth0 login with UID: #{uid}")
        end
      end

      Rails.logger.info('Token contains required fields.  Attempting to authenticate through Core.')
      auth0_authentication = authentication_provider_class.new(token.to_json)

      if auth0_authentication.authenticated?
        UserSessionProvider.klass.auth0(auth0_authentication)
        return redirect_back_or_default(login_redirect_url)
      elsif auth0_authentication.error
        return render_500
      else
        Rails.logger.error('Cannot authenticate federated user -- no user linked to this identity')
        Rails.logger.error('Starting linking process')
        # store the token in the session for later linking
        session[:auth0_link_token] = token
        return redirect_to(auth0_link_path)
      end
    end
  end

  # Links an auth0 identifier for a social account to a user
  # The user is presented with the authentication screen
  # If they create an account, it will be passwordless and can only be logged in to with the identifier
  # If they link an existing account, using that idenfitier in the future will log them in
  def link
    auth0_token = session[:auth0_link_token]
    auth0_identifier = auth0_token[:socrata_user_id]
    signup_params = params[:signup]
    case request.method_symbol
    when :get
      @signup = SignupPresenter.new(signup_params || {})
      # assume user wants to create a new account.
      @body_id = 'signup'
      # this endpoint will only be hit if the login is a social one (not enterprise), so might as well fill things in
      @signup.user.email = auth0_token.email if auth0_token.email.present?
      @signup.user.screenName = auth0_token.name if auth0_token.name.present?
    when :post
      if params[:user_session].nil?
        # signup attempt
        unless SocrataRecaptcha.valid(params['g-recaptcha-response'])
          flash[:error] = t('recaptcha2.errors.verification_failed')
          return redirect_to(auth0_link_path)
        end
        if signup_params.present?
          signup_params[:auth0Identifier] = auth0_identifier
        end
        @signup = SignupPresenter.new(signup_params || {})
        @body_id = 'signup'
        if @signup.create
          # auth0 identifier was linked as part of the create step
          return redirect_to(profile_path(@signup.user))
        else
          flash.now[:error] = @signup.errors.values.join(', ')
        end
      else
        #login attempt
        @body_id = 'login'
        @user_session = UserSessionProvider.klass.new(params[:user_session])
        if @user_session.save
          add_auth0_identifier(auth0_identifier)
          return redirect_to(login_redirect_url)
        else
          flash.now[:notice_login] = 'Unable to login with that username and password; please try again'
        end
      end
    end
    render :template => 'auth0/link'
  end

  def connections
    get_auth0_connections
  end

private
  def set_empty_user_session
    @user_session = UserSessionProvider.klass.new
  end

  def redirect_if_logged_in
    redirect_to '/' if current_user.present?
  end

  #Factored out to support functional testing
  def authentication_provider_class
    Auth0Authentication
  end

  def add_auth0_identifier(auth0_id)
    Rails.logger.info('attempting to add auth0 link')
    resp = CoreServer::Base.connection.create_request('/auth0_identifiers/', {:identifier => auth0_id}.to_json)
    Rails.logger.info(resp)
  end

end
