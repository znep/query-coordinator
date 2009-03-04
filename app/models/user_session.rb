# Model class for representing a user's session in an ActiveRecord-like way,
# without actually using ActiveRecord.
#
# This is very loosely based on the principles of AuthLogic:
#   http://authlogic.rubyforge.org/
#
# Unlike AuthLogic, our backend is our core server, accessed via HTTP requests.
class UserSession
  class << self
    def find
      session = new()
      if session.find_record
        session.save
        session
      else
        nil
      end
    end
  end

  attr_accessor :login, :password, :new_session
  attr_writer :id

  # You can initialize a session by doing any of the following:
  #
  #   UserSession.new
  #   UserSession.new(:login => 'login', :password => 'password')
  def initialize(*args)
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
    true
  end


  def find_record
    nil
  end

  def save(&block)
    result = nil
    if valid?
      self.new_session = false
      result = self
    end

    yield result if result && block_given?
    result
  end
end

class SessionErrors < ActiveResource::Errors; end
