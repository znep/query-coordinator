require 'cgi'

# Model class for representing a user's session in an ActiveRecord-like way,
# without actually using ActiveRecord.
#
# This is very loosely based on the principles of AuthLogic:
#   http://authlogic.rubyforge.org/
#
# Unlike AuthLogic, our backend is our core server, accessed via HTTP requests.
class UserSession
  include ActiveModel::Validations
  include ActiveModel::Conversion

  class << self
    # Check to see if we've been provided a controller instance already.
    # Many things won't work if this is false.
    def activated?
      !controller.nil?
    end

    def find
      session = new()
      if session.find_token
        session
      else
        nil
      end
    end

    def rpx(token)
      session = new()
      if session.find_rpx_token(token)
        session
      else
        nil
      end
    end

    def auth0(token)
      session = new()
      if session.find_auth0_token(token)
        session
      else
        nil
      end
    end

    def user_no_security_check(user)
      session = new()
      if session.find_user(user)
        session
      else
        nil
      end
    end

    def controller=(value)
      Thread.current[:session_controller] = value
    end

    def controller
      Thread.current[:session_controller]
    end
  end

  cattr_accessor :controller
  attr_accessor :login, :password, :new_session, :cookie, :remember_me
  attr_writer :id

  # You can initialize a session by doing any of the following:
  #
  #   UserSession.new
  #   UserSession.new(:login => 'login', :password => 'password')
  def initialize(*args)
    raise NotActivatedError.new(self) unless self.class.activated?

    if args.size == 1 && args.first.is_a?(Hash)
      self.credentials = args.first
    end
  end

  def id
    @id
  end

  # Your login credentials in hash format.
  def credentials
    {:login => login, :password => password}
  end

  # Lets you set your login and password via a hash format. It's safe to use
  # by passing in a params hash from the user; only the login and password are
  # overwritten.
  def credentials=(values)
    return if values.blank? || !values.is_a?(Hash)
    
    values.slice('login', 'password', 'remember_me').each do |field, value|
      send("#{field}=", value)
    end
  end

  def remember_me=(value)
    @remember_me = (value == '1')
  end

  # Look up the authentication token based on the user's cookie information.
  # This function is typically called on every request cycle - we're given
  # a token representing an authenticated session, and we need to validate it
  # and look up the user associated with that token.
  def find_token
    if core_session.valid?(true) # true to force load
      user = User.find(core_session.user_id,
                       {'Cookie' => "#{::CoreServer::Connection.cookie_name}=#{core_session.to_s}"})
      UserSession.update_current_user(user, core_session)
      if !(controller.request.headers["x-socrata-auth"] == "unauthenticated")
        new_core_cookie = controller.request.env["socrata.new-core-session-cookie"]
        exp = UserSession.expiration_from_core_cookie(new_core_cookie)
        create_core_session_credentials(user, exp) if exp > 0
      end
    elsif !cookies['remember_token'].blank?
      response = post_cookie_authentication
      if response.is_a?(Net::HTTPSuccess)
        expiration = UserSession.expiration_from_core_response(response)
        user = User.parse(response.body)
        create_core_session_credentials(user, expiration) if expiration > 0
        self.new_session = false
        cookies[:logged_in] = true
        UserSession.update_current_user(user, core_session)
      end
    end

    return user
  end
  # Return true if the session hasn't been saved yet.
  def persisted?
    !@new_session.blank?
  end

  def self.expiration_from_core_cookie(cookie)
    core_data = ::CoreSession.unmangle_core_session_from_cookie(cookie)
    return -1 if core_data.nil? or core_data.split[1].nil?
    expiration_data = core_data.split[1].to_i
    return expiration_data - Time.now.to_i
  end

  def self.expiration_from_core_response(response)
    if response.is_a?(Net::HTTPSuccess)
      response.get_fields('set-cookie').each do |cookie_header|
        if match = /\b#{::CoreServer::Connection.cookie_name}=([A-Za-z0-9%\-|]+)/.match(cookie_header)
          return expiration_from_core_cookie(match[1])
        end
      end
    end
    return 15.minutes
  end

  def self.find_seconds_until_timeout
    path = "/sessionExpiration/" + User.current_user.id + ".json"
    return CoreServer::Base.connection.get_request(path, {}, false, true)
  end

  def extend
    path = "/sessionExpiration/" + User.current_user.id + ".json"
    coreResponse = CoreServer::Base.connection.get_request(path)
    new_core_cookie = controller.request.env["socrata.new-core-session-cookie"]
    expiration = UserSession.expiration_from_core_cookie(new_core_cookie)
      create_core_session_credentials(user, expiration) if expiration > 0
    return coreResponse
  end


  # Obtain a UserSession based on an RpxAuthentication object
  # If the RpxAuthentication has a valid user associated with it, log in
  # that user.
  def find_rpx_token(rpx_authentication)
    result = nil
    if rpx_authentication.existing_account?
      result = find_user(rpx_authentication.user)
    end
    result
  end

  def find_auth0_token(auth0_authentication)
    result = nil
    if auth0_authentication.isAuthenticated?
      result = find_user(auth0_authentication.user)
    end
    result
  end

  # Obtain a UserSession initialized based on a User object.
  # WARNING: This doesn't offer any authentication checks. You better know that
  # this user should be logged in before you go calling it.
  def find_user(user)
    result = nil
    unless user.nil?
      create_core_session_credentials(user)
      self.new_session = false
      UserSession.update_current_user(user, core_session)
      cookies[:logged_in] = true
      result = self
    end

    result
  end

  # Create or update an existing authentication session.
  # This function is typically called as part of the login workflow; you must
  # set the login and password before saving, which is then validated against
  # the core server. On success, the core server returns a JSON payload
  # representing the logged-in user; we can use this to instantiate the User
  # model object w/o making a separate request.
  def save(wants_response = false)
    result = false
    response = post_core_authentication
    if response.is_a?(Net::HTTPSuccess)
      expiration = UserSession.expiration_from_core_response(response)
      user = User.parse(response.body)
      create_core_session_credentials(user, expiration) if expiration > 0

      # Plumb the cookie from the core server back to the user's browser
      response.get_fields('set-cookie').each do |cookie_header|
        if match = /\bremember_token=([A-Za-z0-9]+)/.match(cookie_header)
          cookies['remember_token'] = { :value => match[1], :expires => 2.weeks.from_now }
        end
      end

      self.new_session = false
      UserSession.update_current_user(user, core_session)
      cookies[:logged_in] = true
      result = self
    end

    yield result if result && block_given?
    return wants_response ? response : result
  end

  def destroy
    core_session.clear!
    self.new_session = true
    UserSession.update_current_user(nil, nil)
    post_expire_cookie_authentication if cookies['remember_token']
    cookies.delete(:remember_token)
    cookies.delete(:logged_in)
  end

  def user
    User.current_user
  end

private
  @@auth_uri = CORESERVICE_URI.clone
  @@auth_uri.path += '/authenticate'
  cattr_reader :auth_uri

  # We're calling it 'username' here, but the authentication service prefers
  # 'username' instead. I like login better, since login-by-email is something
  # we want to support and emails aren't usernames. :-P
  def credentials_for_post
    creds = {'username' => login, 'password' => password,
      'remoteAddress' => controller.request.remote_ip}
    if remember_me
      creds['remember_me'] = 'true'
    end

    return creds
  end

  def post_core_authentication
    post = Net::HTTP::Post.new(auth_uri.request_uri)
    post['X-Socrata-Host'] = CurrentDomain.cname
    post['X-User-Agent'] = controller.request.env['HTTP_USER_AGENT']

    post.set_form_data credentials_for_post
    Net::HTTP.start(auth_uri.host, auth_uri.port) do |http|
      ## uncomment for debug -- http.read_timeout = 60 * 10;
      http.request post
    end
  end

  def post_cookie_authentication
    uri = auth_uri.clone
    uri.query = "method=findByRememberToken"
    post = Net::HTTP::Post.new(uri.request_uri, {'Cookie' => "remember_token=#{cookies['remember_token']}"})

    # pass/spoof in the current domain cname
    post['X-Socrata-Host'] = CurrentDomain.cname

    Net::HTTP.start(uri.host, uri.port) do |http|
      http.request post
    end
  end

  def post_expire_cookie_authentication
    uri = auth_uri.clone
    uri.query = "method=expireRememberToken"
    post = Net::HTTP::Post.new(uri.request_uri, {'Cookie' => "remember_token=#{cookies['remember_token']}"})

    # pass/spoof in the current domain cname
    post['X-Socrata-Host'] = CurrentDomain.cname

    Net::HTTP.start(uri.host, uri.port) do |http|
      http.request post
    end
  end

  def create_core_session_credentials(user, expiration=15.minutes)
    core_session.user_id = user.data['id']
    core_session.expiration = Time.now + expiration
    core_session.salt = Digest::SHA1.hexdigest("--#{Time.now.to_s}--#{user.id}--")[0,12]
  end

  def self.update_current_user(user, session_token)
    # I thought we only needed this line to make old rails work (which is now
    # gone) but without this line we're getting InvalidAuthenticityToken
    # exceptions when trying to create a new dataset.
    controller.session[:user] = user.nil? ? nil : user.oid

    user.session_token = session_token if user
    User.current_user = user
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
    controller.request.core_session
  end
end


class NotActivatedError < StandardError
  def initialize(session)
    super("You must activate the authentication controller hook by setting UserSession.controller before creating objects.")
  end
end

# class SessionErrors < ActiveResource::Errors; end
