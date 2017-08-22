require 'cgi'
require 'active_model'

# Model class for representing a user's session in an ActiveRecord-like way,
# without actually using ActiveRecord.
#
# This is very loosely based on the principles of AuthLogic:
#   http://authlogic.rubyforge.org/
#
# Unlike AuthLogic, our backend is our core server, accessed via HTTP requests.
class CoreManagedUserSession
  include ActiveModel::Validations
  include ActiveModel::Conversion

  @auth_uri = CORESERVICE_URI.clone
  @auth_uri.path += '/authenticate'

  @logout_uri = @auth_uri.clone
  @logout_uri.query = 'method=logout'

  @current_user_uri = CORESERVICE_URI.clone
  @current_user_uri.path += '/users/current.json'

  class << self
    attr_reader :auth_uri, :logout_uri, :current_user_uri

    # Check to see if we've been provided a controller instance already.
    # Many things won't work if this is false.
    def activated?
      controller.present?
    end

    def auth0(token)
      session = new
      session if session.find_auth0_token(token)
    end

    def controller=(value)
      Thread.current[:session_controller] = value
    end

    def controller
      Thread.current[:session_controller]
    end

    def cookie_value_from_cookie(cookie_name, cookie_header)
      if match = /\b#{cookie_name}=([A-Za-z0-9%\-|]+)/.match(cookie_header)
        match[1]
      end
    end

    def expiration_from_core_cookie(cookie_header)
      cookie_value = cookie_value_from_cookie(::CoreServer::Connection::COOKIE_NAME, cookie_header)
      core_data = ::CoreSession.unmangle_core_session_from_cookie(cookie_value)

      if core_data.nil?
        CGI::Cookie.parse(cookie_header).each do |key, value|
          if key == ::CoreServer::Connection::COOKIE_NAME
            return value.expires
          end
        end
      else
        expiration = core_data.to_s.split.fetch(1, -1).to_i # -1 returned if item at index 1 unavailable
        expiration < 0 ? expiration : expiration - Time.now.to_i
      end
    end

    def expiration_from_core_response(response)
      if response.is_a?(Net::HTTPSuccess)
        response.get_fields('set-cookie').each do |cookie_header|
          if /\b#{::CoreServer::Connection::COOKIE_NAME}=.*/.match(cookie_header)
            return expiration_from_core_cookie(cookie_header)
          end
        end
      end
      APP_CONFIG.default_session_time_minutes
    end

    def find
      session = new
      session.validate_and_reload! && session
    end

    def find_seconds_until_timeout
      CoreServer::Base.connection.get_request("/sessionExpiration/#{User.current_user.id}.json", {}, false, true)
    end

    def update_current_user(user, session_token)
      if user
        # i thought we only needed this line to make old rails work (which is now
        # gone) but without this line we're getting invalidauthenticitytoken
        # exceptions when trying to create a new dataset.
        controller.session[:user] = user.oid
        user.session_token = session_token if user
        User.current_user = user
      else
        controller.session[:user] = nil
        User.current_user = nil
      end
    end

    def user_no_security_check(user)
      session = new('login' => user.email, 'password' => user.password)
      session.save
      session.load_user(user) && session
    end
  end

  cattr_accessor :controller
  attr_accessor :new_session, :cookie, :login, :password, :id

  # You can initialize a session by doing any of the following:
  #
  #   CoreManagedUserSession.new
  #   CoreManagedUserSession.new(:login => 'login', :password => 'password')
  def initialize(*args)
    raise NotActivatedError.new(self) unless self.class.activated?

    self.credentials = args.extract_options!
  end

  def destroy
    self.new_session = true
    CoreManagedUserSession.update_current_user(nil, nil)
    expire_with_core
    cookies.delete(:_core_session_id)
    cookies.delete(:remember_token)
    cookies.delete(:logged_in)
  end

  def extend
    core_response = CoreServer::Base.connection.get_request("/sessionExpiration/#{User.current_user.id}.json")
    expiration = CoreManagedUserSession.expiration_from_core_response(core_response)
    update_cookies_from_core(core_response) if expiration > 0
    core_response
  end

  def find_auth0_token(auth0_authentication)
    update_cookies_from_core(auth0_authentication.response)
    load_user(auth0_authentication.user) if auth0_authentication.authenticated?
  end

  # Obtain a CoreManagedUserSession initialized based on a User object.
  # WARNING: This doesn't offer any authentication checks. You better know that
  # this user should be logged in before you go calling it.
  def load_user(user)
    return unless user.present?

    self.new_session = false
    CoreManagedUserSession.update_current_user(user, core_session)
    cookies[:logged_in] = true

    self
  end

  # Return true if the session hasn't been saved yet.
  def persisted?
    @new_session.present?
  end

  # Create or update an existing authentication session.
  # This function is typically called as part of the login workflow; you must
  # set the login and password before saving, which is then validated against
  # the core server. On success, the core server returns a JSON payload
  # representing the logged-in user; we can use this to instantiate the User
  # model object w/o making a separate request.
  def save(wants_response = false)
    result = false
    response = authenticate_with_core

    if response.is_a?(Net::HTTPSuccess)
      load_session_from_core(response)
      result = self
    end

    yield result if result && block_given?

    wants_response ? response : result

  end

  def user
    User.current_user
  end

  # Look up the authentication token based on the user's cookie information.
  # This function is typically called on every request cycle - we're given
  # a token representing an authenticated session, and we need to validate it
  # and look up the user associated with that token.
  def validate_and_reload!
    response = validate_with_core
    load_session_from_core(response)
  end

  private

  def auth_cookie_string
    cookies = []
    cookies << CGI::Cookie.new('_core_session_id', core_session).to_s.split(';')[0] if core_session.present?
    cookies << CGI::Cookie.new('remember_token', remember_token).to_s.split(';')[0] if remember_token.present?
    cookies.join('; ') if cookies.length > 0
  end

  def authenticate_with_core
    uri = CoreManagedUserSession.auth_uri
    post = Net::HTTP::Post.new(uri.request_uri)
    post['X-Socrata-Host'] = CurrentDomain.cname
    post['X-User-Agent'] = controller.request.env['HTTP_USER_AGENT']
    post.set_form_data credentials_for_post

    Net::HTTP.start(uri.host, uri.port) do |http|
      http.request(post)
    end
  end

  # Accessor helper to access the controller's private cookie store.
  def cookies
    controller.send(:cookies)
  end

  # Accessor helper to access the controller's private session options
  def cookie_domain
    controller.class.session_options[:domain]
  end

  def core_session
    cookies['_core_session_id']
  end

  # Your login credentials in hash format.
  def credentials
    { :login => login, :password => password }
  end

  # Lets you set your login and password via a hash format. It's safe to use
  # by passing in a params hash from the user; only the login and password are
  # overwritten.
  def credentials=(values)
    return if values.blank? || !values.is_a?(Hash)

    values.slice('login', 'password').each do |field, value|
      send("#{field}=", value)
    end
  end

  def credentials_for_post
    creds = {
      'username' => login,
      'password' => password,
      'remoteAddress' => controller.request.remote_ip
    }
    creds
  end

  def expire_with_core
    return unless auth_cookie_string.present?

    uri = CoreManagedUserSession.logout_uri

    post = Net::HTTP::Post.new(uri.request_uri, 'Cookie' => auth_cookie_string)

    post['X-Socrata-Host'] = CurrentDomain.cname
    post['X-User-Agent'] = controller.request.env['HTTP_USER_AGENT']

    Net::HTTP.start(uri.host, uri.port) do |http|
      http.request(post)
    end
  end

  # This is a little paranoid; one dropped request and we're locked out.
  def load_session_from_core(response)
    if response.is_a?(Net::HTTPSuccess)
      update_cookies_from_core(response)
      load_user(User.parse(response.body))
    else
      destroy
    end
  end

  def previously_authenticated_session?
    auth_cookie_string.present? && auth_cookie_string.length > 0
  end

  def remember_token
    cookies['remember_token']
  end

  def update_cookies_from_core(response)
    CGI::Cookie.parse(response['Set-Cookie']).each do |key, value|
      cookies[key] = {
        :expires => value.expires,
        :value => value.first,
        :secure => true
      }
    end
  end

  def validate_with_core
    return false unless previously_authenticated_session?

    uri = CoreManagedUserSession.current_user_uri
    get = Net::HTTP::Get.new(uri.request_uri)
    get['X-Socrata-Host'] = CurrentDomain.cname
    get['X-User-Agent'] = controller.request.env['HTTP_USER_AGENT']

    get['Cookie'] = auth_cookie_string

    Net::HTTP.start(uri.host, uri.port) do |http|
      http.request(get)
    end
  end
end

class NotActivatedError < StandardError
  def initialize(session)
    super('You must first activate the authentication controller hook by setting CoreManagedUserSession.controller.')
  end
end
