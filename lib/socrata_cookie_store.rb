# This cookie-based session store is the Rails default. Sessions typically
# contain at most a user_id and flash message; both fit within the 4K cookie
# size limit. Cookie-based sessions are dramatically faster than the
# alternatives.
#
# If you have more than 4K of session data or don't want your data to be
# visible to the user, pick another session store.
#
# CookieOverflow is raised if you attempt to store more than 4K of data.
#
# A message digest is included with the cookie to ensure data integrity:
# a user cannot alter his +user_id+ without knowing the secret key
# included in the hash. New apps are generated with a pregenerated secret
# in config/environment.rb. Set your own for old apps you're upgrading.
#
# Session options:
#
# * <tt>:secret</tt>: An application-wide key string or block returning a
#   string called per generated digest. The block is called with the
#   CGI::Session instance as an argument. It's important that the secret
#   is not vulnerable to a dictionary attack. Therefore, you should choose
#   a secret consisting of random numbers and letters and more than 30
#   characters. Examples:
#
#     :secret => '449fe2e7daee471bffae2fd8dc02313d'
#     :secret => Proc.new { User.current_user.secret_key }
#
# * <tt>:digest</tt>: The message digest algorithm used to verify session
#   integrity defaults to 'SHA1' but may be any digest provided by OpenSSL,
#   such as 'MD5', 'RIPEMD160', 'SHA256', etc.
#
# To generate a secret key for an existing application, run
# "rake secret" and set the key in config/environment.rb.
#
# Note that changing digest or secret invalidates all existing sessions!
#
require 'rack/session/abstract/id' unless defined? Rack::Session::Abstract::ID
require 'action_dispatch/middleware/session/abstract_store'

class SocrataCookieStore
  include ActionDispatch::Session::StaleSessionCheck

  # Cookies can typically store 4096 bytes.
  MAX = 4096
  SECRET_MIN_LENGTH = 30 # characters

  DEFAULT_OPTIONS = {
    :key          => '_session_id',
    :core_key     => '_core_session_id',
    :domain       => nil,
    :path         => "/",
    :expire_after => nil,
    :secure       => true,
    :httponly     => true
  }.freeze

  CORE_SESSION_KEY = "socrata.core-session".freeze
  ENV_SESSION_KEY = "rack.session".freeze
  ENV_SESSION_OPTIONS_KEY = Rack::Session::Abstract::ENV_SESSION_OPTIONS_KEY

  # Raised when storing more than 4K of session data.
  class CookieOverflow < StandardError; end

  def initialize(app, options = {})
    # Process legacy CGI options
    options = options.symbolize_keys
    if options.has_key?(:session_path)
      options[:path] = options.delete(:session_path)
    end
    if options.has_key?(:session_key)
      options[:key] = options.delete(:session_key)
    end
    if options.has_key?(:session_http_only)
      options[:httponly] = options.delete(:session_http_only)
    end

    @app = app

    # The session_key option is required.
    ensure_session_key(options[:key])
    @key = options.delete(:key).freeze

    ensure_session_key(options[:core_key])
    @core_key = options.delete(:core_key).freeze

    # The secret option is required.
    ensure_secret_secure(options[:secret])
    @secret = options.delete(:secret).freeze

    @digest = options.delete(:digest) || 'SHA1'
    @verifier = verifier_for(@secret, @digest)

    @default_options = DEFAULT_OPTIONS.merge(options).freeze

    freeze
  end

  def call(env)
    prepare!(env)

    status, headers, body = @app.call(env)

    if status >= 200 && status < 400
      core_data = env[CORE_SESSION_KEY]
      session_data = env[ENV_SESSION_KEY]
      options = env[ENV_SESSION_OPTIONS_KEY]
      request = ActionDispatch::Request.new(env)

      save_cookie = false

      if !(options[:secure] && !request.ssl?) &&
          (!session_data.is_a?(Rack::Session::Abstract::SessionHash) ||
            session_data.send(:loaded?) ||
            options[:expire_after])
        session_data.send(:load!) if session_data.is_a?(Rack::Session::Abstract::SessionHash) && !session_data.loaded?
        persistent_session_id!(session_data)
        session_data = marshal(session_data.to_hash)
        save_cookie = true
      end

      if !core_data.is_a?(CoreSession) || core_data.send(:loaded?) || options[:expire_after]
        save_core_cookie = true
      end

      [
        [save_cookie, session_data, @key],
        [save_core_cookie, core_data, @core_key]
      ].each do |persist|
        if persist.first
          raise CookieOverflow if (persist[1].size) > MAX

          cookie = Hash.new
          cookie[:value] = persist[1].to_s || ''
          unless options[:expire_after].nil?
            cookie[:expires] = Time.now + options[:expire_after]
          end

          if (cookie[:expires] || (cookie[:value] != request.cookies[persist.last]))
            Rack::Utils.set_cookie_header!(headers, persist.last, cookie.merge(options))
          end
        end
      end
    end

    [status, headers, body]
  end

  # Called via handle_unverified_request
  def destroy_session(env, sid, options)
  end

  private
    # who knows where in the labyrinth this could be called?
    def prepare!(env)
      env[ENV_SESSION_KEY] = Rack::Session::Abstract::SessionHash.new(self, env)
      env[ENV_SESSION_OPTIONS_KEY] = Rack::Session::Abstract::OptionsHash.new(self, env, @default_options)
      env[CORE_SESSION_KEY] = ::CoreSession.new(self, env)
    end

    def load_session(env)
      data = unpacked_cookie_data(env)
      data = persistent_session_id!(data)
      [data[:session_id], data]
    end

    def load_core_session(env)
      request = ActionDispatch::Request.new(env)
      cookie_data = request.cookie_jar[@core_key]
      return ::CoreSession.unmangle_core_session_from_cookie(cookie_data)
    end

    def extract_session_id(env)
      if data = unpacked_cookie_data(env)
        persistent_session_id!(data) unless data.empty?
        return data['session_id']
      else
        return nil
      end
    end

    def current_session_id(env)
      env[ENV_SESSION_OPTIONS_KEY][:id]
    end

    def session_exists?(env)
      current_session_id(env).present?
    end

    def unpacked_cookie_data(env)
      env["action_dispatch.request.unsigned_session_cookie"] ||= begin
        stale_session_check! do
          request = ActionDispatch::Request.new(env)
          cookie_data = request.cookie_jar[@key]
          session_data = cookie_data.gsub('"' ,'') if cookie_data
          unmarshal(session_data) || {}
        end
      end
    end

    # Marshal a session hash into safe cookie data. Include an integrity hash.
    def marshal(session)
      @verifier.generate(session)
    end

    # Unmarshal cookie data to a hash and verify its integrity.
    def unmarshal(cookie)
      @verifier.verify(cookie) if cookie
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      nil
    end

    def ensure_session_key(key)
      if key.blank?
        raise ArgumentError, 'A key is required to write a ' +
          'cookie containing the session data. Use ' +
          'config.session = { :key => ' +
          '"_myapp_session", :secret => "some secret phrase" } in ' +
          'config/environment.rb'
      end
    end

    # To prevent users from using something insecure like "Password" we make sure that the
    # secret they've provided is at least 30 characters in length.
    def ensure_secret_secure(secret)
      # There's no way we can do this check if they've provided a proc for the
      # secret.
      return true if secret.is_a?(Proc)

      if secret.blank?
        raise ArgumentError, "A secret is required to generate an " +
          "integrity hash for cookie session data. Use " +
          "config.action_controller.session = { :key => " +
          "\"_myapp_session\", :secret => \"some secret phrase of at " +
          "least #{SECRET_MIN_LENGTH} characters\" } " +
          "in config/environment.rb"
      end

      if secret.length < SECRET_MIN_LENGTH
        raise ArgumentError, "Secret should be something secure, " +
          "like \"#{::SecureRandom.hex(16)}\".  The value you " +
          "provided, \"#{secret}\", is shorter than the minimum length " +
          "of #{SECRET_MIN_LENGTH} characters"
      end
    end

    def verifier_for(secret, digest)
      key = secret.respond_to?(:call) ? secret.call : secret
      ActiveSupport::MessageVerifier.new(key, :digest => digest)
    end

    def generate_sid
      ::SecureRandom.hex(16)
    end

    def persistent_session_id!(data)
      (data ||= {}).merge!(inject_persistent_session_id(data))
    end

    def inject_persistent_session_id(data)
      requires_session_id?(data) ? { :session_id => generate_sid } : {}
    end

    def requires_session_id?(data)
      if data
        data.respond_to?(:key?) && !data.key?('session_id')
      else
        true
      end
    end
end
