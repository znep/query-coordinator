class CoreSession
  attr_accessor :user_id, :expiration, :salt, :signature

  def initialize(by, env)
    @by = by
    @env = env
    @loaded = false
  end

  def to_s
    if valid? && loaded?
      CGI.escape(Base64.encode64("#{user_id} #{expiration.to_i} #{salt} #{signature}").gsub(/\n/, ''))
    else
      ""
    end
  end

  def size
    to_s.size
  end

  def valid?(force_load = false)
    load! if !@loaded && force_load
    false unless @loaded
    valid_expiration? && valid_signature?
  end

  def user_id
    load! unless @loaded
    @user_id
  end

  def user_id=(value)
    @user_id = value
    update_signature_if_otherwise_valid
  end

  def expiration=(value)
    load! unless @loaded
    @expiration
  end

  def expiration=(value)
    @expiration = value
    update_signature_if_otherwise_valid
  end

  def salt
    load! unless @loaded
    @salt
  end

  def salt=(value)
    @salt = value
    update_signature_if_otherwise_valid
  end

  def clear!
    @user_id = nil
    @expiration = nil
    @salt = nil
    @signature = nil
    @loaded = true # Needed so we save an empty core session back
  end

private
  SECRET = "wm4NmtBisUd3XJ0JvQwJqTth8UdFvbYpy3LZ5IU3I3XCwG06XRa1TYXC3WySahssDzrt2cHFrbsRPT1o"

  def valid_expiration?
    (expiration > Time.now) unless expiration.nil?
  end

  def valid_signature?
    load! unless @loaded
    loaded? && (@signature == computed_signature)
  end

  def update_signature_if_otherwise_valid
    if !user_id.blank? && expiration && !salt.blank?
      @signature = computed_signature
      @loaded = true
    end
  end

  def computed_signature
    require 'digest/sha1'
    Digest::SHA1.hexdigest("#{SECRET} #{user_id} #{expiration.to_i} #{salt}")
  end

  def loaded?
    @loaded
  end

  def load!
    stale_session_check! do
      core_session = @by.send(:load_core_session, @env)
      unless core_session.blank?
        parts = core_session.split
        raise ArgumentError if parts.length != 4

        @user_id = parts[0]
        @expiration = Time.at(parts[1].to_i)
        @salt = parts[2]
        @signature = parts[3]
        @loaded = true
      end
    end
  end

  def stale_session_check!
    yield
  rescue ArgumentError => argument_error
    if argument_error.message =~ %r{undefined class/module ([\w:]*\w)}
      begin
        # Note that the regexp does not allow $1 to end with a :
        $1.constantize
      rescue LoadError, NameError => const_error
        raise ActionController::SessionRestoreErrror("Session contains objects whose class definition isn\\'t available.\nRemember to require the classes for all objects kept in the session.\n(Original exception: \#{const_error.message} [\#{const_error.class}])\n")
      end

      retry
    else
      raise
    end
  end
end
