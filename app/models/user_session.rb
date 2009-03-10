require 'cgi'

# Model class for representing a user's session in an ActiveRecord-like way,
# without actually using ActiveRecord.
#
# This is very loosely based on the principles of AuthLogic:
#   http://authlogic.rubyforge.org/
#
# Unlike AuthLogic, our backend is our core server, accessed via HTTP requests.
class UserSession
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

    def controller=(value)
      Thread.current[:session_controller] = value
    end

    def controller
      Thread.current[:session_controller]
    end
  end

  cattr_accessor :controller
  attr_accessor :login, :password, :new_session, :cookie
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
    
    values.slice('login', 'password').each do |field, value|
      send("#{field}=", value)
    end
  end

  # Stub out the errors class to make error handling on views happy.
  # Right now, we're wrapping ActiveResource::Errors but not actually
  # handling any validations, so don't expect this to work - just expect
  # it not to crash.
  def errors
    @errors ||= SessionErrors.new(self)
  end

  # Return true if the session hasn't been saved yet.
  def new_record?
    new_session != false
  end

  def valid?
    @token = find_token unless @token
    if @token
      @token.valid?
    else
      false
    end
  end

  # Look up the authentication token based on the user's cookie information.
  # This function is typically called on every request cycle - we're given
  # a token representing an authenticated session, and we need to validate it
  # and look up the user associated with that token.
  def find_token
    if @token.nil? || !@token.valid?
      if cookies['blist_core_session'] && !cookies['blist_core_session'].blank?
        @token = AuthenticationSessionCookie.new(cookies['blist_core_session'])
        UserSession.update_current_user(User.find(@token.user_id), @token)
      end
    end

    @token
  end

  # Create or update an existing authentication session.
  # This function is typically called as part of the login workflow; you must
  # set the login and password before saving, which is then validated against
  # the core server. On success, the core server returns a JSON payload
  # representing the logged-in user; we can use this to instantiate the User
  # model object w/o making a separate request.
  def save(&block)
    result = false
    response = post_core_authentication
    if response.is_a?(Net::HTTPSuccess)
      cookie = CGI::Cookie.parse(response['Set-Cookie'])
      token = AuthenticationSessionCookie.new(cookie)
      if token.valid?
        cookies['blist_core_session'] = { :value => token.base64_value,
                                          :domain => cookie_domain }
        self.new_session = false
        UserSession.update_current_user(User.parse(response.body)[0], token)
        result = self
      end
    end

    yield result if result && block_given?
    result
  end

  def destroy
    @token = nil
    cookies['blist_core_session'] = nil
    UserSession.update_current_user(nil, nil)
  end

  def user
    User.current_user
  end

private
  # We're calling it 'username' here, but the authentication service prefers
  # 'username' instead. I like login better, since login-by-email is something
  # we want to support and emails aren't usernames. :-P
  def credentials_for_post
    {'username' => login, 'password' => password}
  end

  def post_core_authentication
    Net::HTTP.post_form(URI.parse('http://localhost:8080/authenticate'), credentials_for_post)
  end

  def self.update_current_user(user, session_token)
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
end

# Simple class for representing whether a given session is valid.
class AuthenticationSessionCookie
  attr_accessor :user_id, :expiration, :salt, :signature

  def initialize(cookie)
    if cookie.is_a?(Hash) && cookie['blist_core_session']
      cookie_text = cookie['blist_core_session'].value[0]
    elsif cookie.is_a?(String)
      cookie_text = cookie
    else
      raise ArgumentError
    end

    cookie_text = Base64.decode64(cookie_text)
    parts = cookie_text.split
    raise ArgumentError if parts.length != 4

    @user_id = parts[0]
    @expiration = Time.at(parts[1].to_i)
    @salt = parts[2]
    @signature = parts[3]
  end

  def to_s
    "#{user_id} #{expiration.to_i} #{salt} #{signature}"
  end

  def base64_value
    Base64.encode64(to_s).delete("\n")
  end

  def cookie
    CGI::Cookie.new('name' => 'blist_core_session',
                    'value' => base64_value)
  end

  def valid?
    valid_expiration? && valid_signature?
  end

  def valid_expiration?
    expiration > Time.now
  end

  def valid_signature?
    @signature == computed_signature
  end

  private
  SECRET = "wm4NmtBisUd3XJ0JvQwJqTth8UdFvbYpy3LZ5IU3I3XCwG06XRa1TYXC3WySahssDzrt2cHFrbsRPT1o"

  def computed_signature
    require 'digest/sha1'
    Digest::SHA1.hexdigest("#{SECRET} #{user_id} #{expiration.to_i} #{salt}")
  end
end

class NotActivatedError < StandardError
  def initialize(session)
    super("You must activate the authentication controller hook by setting UserSession.controller before creating objects.")
  end
end

class SessionErrors < ActiveResource::Errors; end
