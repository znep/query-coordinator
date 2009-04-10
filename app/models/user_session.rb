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

  # Look up the authentication token based on the user's cookie information.
  # This function is typically called on every request cycle - we're given
  # a token representing an authenticated session, and we need to validate it
  # and look up the user associated with that token.
  def find_token
    if core_session.valid?
      user = User.find(core_session.user_id, core_session.to_s)
      UserSession.update_current_user(user, core_session)
      user
    else
      nil
    end
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
      user = User.parse(response.body)
      core_session.user_id = user.data['id']
      core_session.expiration = Time.now + 1.hour
      core_session.salt = Digest::SHA1.hexdigest("--#{Time.now.to_s}--#{User.id}--")[0,12]
      self.new_session = false
      UserSession.update_current_user(user, core_session)
      result = self
    end

    yield result if result && block_given?
    result
  end

  def destroy
    core_session.clear!
    self.new_session = true
    UserSession.update_current_user(nil, nil)
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
    {'username' => login, 'password' => password}
  end

  def post_core_authentication
    Net::HTTP.post_form(auth_uri, credentials_for_post)
  end

  def self.update_current_user(user, session_token)
    # We only need to set the session here for the old Rails project.
    # When we finally get rid of it, you can get rid of this line.
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

class SessionErrors < ActiveResource::Errors; end
