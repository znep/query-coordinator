require 'base64'
require 'digest/sha1'
require 'httparty'
require 'net/http'
require 'securerandom'
require 'uri'

module Auth0Helper
  SOCIAL_DOMAINS = %w(twitter facebook google_oauth2 windowslive yahoo).freeze

  def gen_cookie(uid)
    salt = SecureRandom.hex(8)

    # Expire in 15 minutes
    expiration = Time.now.to_i + 60 * 15

    # Core produces a cookie which is a base64 encoding of "uid expiration salt signature"
    Base64.strict_encode64("#{uid} #{expiration} #{salt} #{compute_signature(uid, expiration, salt)}")
  end

  private

  def compute_signature(uid, expiration, salt)
    cookie_secret = Rails.application.secrets.core_session_secret

    # Core produces a signature which is a SHA1 hash of the string "secret 4x4 expiration salt"
    Digest::SHA1.hexdigest("#{cookie_secret} #{uid} #{expiration} #{salt}")
  end

  def valid_token?(auth0_hash)
    if auth0_hash['identities'].length != 1
      false
    elsif auth0_hash['identities'].any? { |id| id['isSocial'] }
      # social identities get linked to a profile manually
      # so we don't need email/name/user id
      true
    else
      contains_valid_email?(auth0_hash) &&
        contains_valid_name?(auth0_hash) &&
        contains_valid_userid?(auth0_hash)
    end
  end

  def contains_valid_email?(auth0Hash)
    email = auth0Hash['email']
    !email.nil? &&
      !email.empty?
  end

  def contains_valid_name?(auth0Hash)
    displayName = auth0Hash['name']
    if !displayName.nil? &&
        !displayName.empty?
      true
    else
      firstName = auth0Hash['given_name']
      lastName = auth0Hash['family_name']
      !firstName.nil? && !lastName.nil?
    end
  end

  def contains_valid_userid?(auth0Hash)
    userId = auth0Hash['socrata_user_id']
    !userId.nil? && valid_userid_format?(userId)
  end

  def valid_userid_format?(userId)
    splitId = userId.split('|')

    #Make sure that none of the values are empty
    for split in splitId do
      if split.empty?
        return false
      end
    end

    #Finally, check to make sure that it has all three required fields
    splitId.length == 3
  end

  def username_password_connection?(socrata_user_id)
    socrata_user_id.start_with?('auth0|')
  end

  def social_connection?(socrata_user_id)
    SOCIAL_DOMAINS.any?(&socrata_user_id.method(:start_with?))
  end

  # In the username and password flow, the UID is set as part of authentication
  # It's going to come in with the form "auth0|abcd-efgh|connection_name"
  # Use a regex to attempt to extract it
  def extract_uid(socrata_user_id)
    trimmed_id = socrata_user_id.sub('auth0|','')
    trimmed_id.match(/(\w{4}-\w{4})(?=\|)/)
  end

  ##
  # Generate an authorization URI that can be used to
  # authenticate a user with the given Auth0 connection string.
  #
  # Connection strings correspond to providers. If the provider
  # is unavailable, then the system will fail.
  def generate_authorize_uri(connection, callback_uri)
    parameters = {
      :scope => 'openid profile',
      :response_type => 'code',
      :connection => connection,
      :callbackURL => callback_uri,
      :sso => true,
      :client_id => AUTH0_ID,
      :redirect_uri => callback_uri
    }

    URI::escape(
      "https://#{AUTH0_URI}/authorize?" <<
      parameters.map { |key, value| "#{key}=#{value}" }.join('&')
    )
  end

  # Documentation for Auth0 logout API is here: https://auth0.com/docs/logout
  def generate_auth0_logout_uri
    action_name = 'new'

    # if the "auth0_always_redirect_connection" config is defined,
    # then we want to redirect to /signed_out since redirecting back
    # to /login will just automatically log the user back in
    properties = CurrentDomain.configuration('auth0').try(:properties)
    if properties.present? && properties.auth0_always_redirect_connection.present?
      action_name = 'signed_out'
    end

    parameters = {
      :client_id => AUTH0_ID,
      :returnTo => url_for(
        :action => action_name,
        :controller => 'user_sessions',
        :only_path => false,
        :protocol => 'https'
      )
    }

    "https://#{AUTH0_URI}/v2/logout?" << parameters.to_param
  end

  def get_authorization_token
    url = URI("https://#{AUTH0_URI}/oauth/token")
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    request = Net::HTTP::Post.new(url,
      'content-type' => 'application/json'
    )
    request.body = {
      'client_id' => AUTH0_ID, 
      'client_secret' => AUTH0_SECRET, 
      'audience' => 'https://socrata.auth0.com/api/v2/', 
      'grant_type' => 'client_credentials'
    }.to_json
    JSON.parse(http.request(request).read_body)['access_token']
  end

  def get_auth0_connections
    url = URI("https://#{AUTH0_URI}/api/v2/connections?fields=name,options&include_fields=true")
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    request = Net::HTTP::Get.new(url,
      'content-type' => 'application/json',
      'authorization' => "Bearer #{get_authorization_token}"
    )
    result = http.request(request)
    if result.is_a?(Net::HTTPSuccess)
      connections = transform_connections(JSON.parse(result.read_body))
    else
      connections = []
    end
    render :json => connections.to_json
  end

  def use_auth0_component(view, request)
    flags = FeatureFlags.derive(view, request)
    flags.use_auth0 && flags.use_auth0_component
  end

  def transform_connections(source)
    source.map do |connection|
      domain_aliases = connection.fetch('options', {}).fetch('domain_aliases', [])
      # A disabled connection will have a single 'domain_aliases' item that is 'THIS CONNECTION IS DISABLED.'
      connection_status = domain_aliases.none? { |domain_alias| domain_alias.include?('DISABLED') }
      { name: connection['name'], domain_aliases: domain_aliases, status: connection_status }
    end
  end

  ##
  # Tests an Auth0 connection string for redirection eligibility.
  # A client is redirected if:
  # 1. The connection is present.
  # 2. The client is making a fresh login attempt.
  # 3. The redirect parameter is NOT set.
  #
  # Redirect can be overriden by using ?redirect=false.
  def should_auth0_redirect?(connection)
    has_redirect_param = params.fetch(:redirect, false)
    connection.present? && !has_redirect_param
  end

  ##
  # Tests an unknown variable with three requirements:
  # 1. It is an array.
  # 2. It is an array with hash maps.
  # 3. Each hash map has two parameters: connection and a name OR buttonText.
  def valid_auth0_connections?(connections)
    connections.is_a?(Array) && connections.present? &&
      connections.all? { |conn| conn[:connection].present? && (conn[:name].present? || conn[:buttonText].present?) }
  end

  def valid_auth0_forced_connections?(forced_connections)
    forced_connections.is_a?(Array) && forced_connections.present? &&
      forced_connections.all? { |conn| conn[:match].present? && conn[:connection].present? }
  end

  def valid_auth0_modal_config?(modal_config)
    modal_config.present? && modal_config[:text].present?
  end

  def return_value_if_valid(properties, key)
    value = properties.try(key)
    valid_function_symbol = "valid_#{key}?".to_sym
    if send(valid_function_symbol, value)
      value
    elsif value.present?
      error = "#{key}, #{value.inspect}, has been specified incorrectly in the Auth0 configuration."

      Rails.logger.error(error)
      Airbrake.notify(:error_class => 'UnexpectedInput', :error_message => error)
    end
  end

  def process_auth0_config
    return unless use_auth0?

    set_auth0_variables_from_config(CurrentDomain.configuration('auth0').try(:properties))
  end

  def set_auth0_variables_from_config(properties)
    return unless properties.present?

    @auth0_connections = return_value_if_valid(properties, :auth0_connections)

    @auth0_forced_connections = return_value_if_valid(properties, :auth0_forced_connections)

    @auth0_modal_config = return_value_if_valid(properties, :auth0_modal_config)

    @auth0_message = properties.try(:auth0_message)
    @auth0_form_message = properties.try(:auth0_form_message)
  end

  # these options are passed to the login/signup screen
  def generate_auth0_options
    # we want to keep email and screenName, in case something failed
    # and user wants to try again after a page refresh
    params =
      (request.params[:signup] || {})
      .only('email', 'screenName')
      .map { |k, v| [k, sanitize(v)] }
      .to_h

    # we only care about the database connection in production
    database_connection = ''
    if AUTH0_DATABASE_CONNECTION.nil?
      if Rails.env.production?
        throw 'AUTH0_DATABASE_CONNECTION environment variable is not set! It should be set to the proper custom database connection to use for username/password logins.'
      elsif Rails.env.development?
        database_connection = 'not_applicable'
      end
    else
      database_connection = AUTH0_DATABASE_CONNECTION
    end

    {
      auth0ClientId: AUTH0_ID,
      auth0Uri: AUTH0_URI,
      auth0DatabaseConnection: database_connection,

      # here, we basically force "form login" for development
      # if you want to test auth0 logins locally, change this line to false
      # (note that when doing so, the AUTH0_DATABASE_CONNECTION config value needs to be set)
      allowUsernamePasswordLogin: Rails.env.development? || feature?('username_password_login') == true,
      recaptchaSitekey: RECAPTCHA_2_SITE_KEY,
      baseDomainUri: request.base_url,
      authenticityToken: form_authenticity_token,
      showSocial: feature?('openid_login'),
      hideSocrataId: FeatureFlags.derive(nil, request).hide_socrata_id,

      # "fedramp" feature trumps "socrata_emails_bypass_auth0"
      socrataEmailsBypassAuth0: feature?('socrata_emails_bypass_auth0') && !feature?('fedramp'),
      connections: @auth0_connections,
      forcedConnections: @auth0_forced_connections,
      chooseConnectionMessage: @auth0_message || t('screens.sign_in.auth0_intro'),
      formMessage: @auth0_form_message,
      modalConfig: @auth0_modal_config,
      flashes: formatted_flashes,
      companyName: CurrentDomain.strings.company,
      signUpDisclaimer: CurrentDomain.strings.disclaimer,
      params: params,
      disableSignInAutocomplete: feature?('fedramp')
    }.to_json.html_safe
  end
end
