require 'core/auth/client'

# Populates env[CURRENT_USER_ENV_KEY] with a user object based on
# _core_session_id and _socrata_session_id cookies (which are checked for
# validity through a coreserver call).
#
# If the session cookies are invalid/expired/otherwise broken,
# env[CURRENT_USER_ENV_KEY] is set to nil.
class SocrataSession
  CURRENT_USER_ENV_KEY = 'socrata.current_user'

  def initialize(app)
    @app = app
  end

  def call(env)
    env[CURRENT_USER_ENV_KEY] = nil

    if has_session_cookies(env)
      auth_object = authenticate(env)
      if auth_object.logged_in?
        env[CURRENT_USER_ENV_KEY] = auth_object.current_user
      end
    end

    @app.call(env)
  end

  private

  # Returns true if all these hold on the request's cookies:
  # A) mere presence of _socrata_session_id and _core_session_id
  # B) logged_in is set to true
  #
  # Does not do _any_ verification beyond this.
  #
  def has_session_cookies(env)
    cookies = env['rack.request.cookie_hash']
    return false unless cookies

    cookies.has_key?('_core_session_id')
  end

  def authenticate(env)
    cookies = env['rack.request.cookie_hash']

    socrata_session_cookies = cookies.map{ |k, v| "#{k}=#{v}" }.join('; ')

    Core::Auth::Client.new(
      env['HTTP_HOST'], #TODO we need to make sure we're actually talking to core, not some random host.
      port: Rails.application.config.frontend_port,
      cookie: socrata_session_cookies,
      verify_ssl_cert: false
    )
  end
end

