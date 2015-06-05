require 'core/auth/client'

# Populates env[SOCRATA_CURRENT_USER_ENV_KEY] with a user object based on
# _core_session_id and _socrata_session_id cookies (which are checked for
# validity through a coreserver call).
#
# If the session cookies are invalid/expired/otherwise broken,
# env[SOCRATA_CURRENT_USER_ENV_KEY] is set to nil.
class SocrataSession
  SOCRATA_CURRENT_USER_ENV_KEY = 'socrata.current_user'

  def initialize(app)
    @app = app
  end

  def call(env)
    env[SOCRATA_CURRENT_USER_ENV_KEY] = nil

    request = Rack::Request.new(env)

    if has_session_cookie?(request)
      auth_object = authenticate(request)
      if auth_object.logged_in?
        env[SOCRATA_CURRENT_USER_ENV_KEY] = auth_object.current_user
      end
    end

    @app.call(env)
  end

  private

  # Returns true if _core_session_id is set on the cookie.
  #
  # Does not do _any_ verification beyond this.
  #
  def has_session_cookie?(request)
    request.cookies.has_key?('_core_session_id')
  end

  def authenticate(request)
    socrata_session_cookie =
      "_core_session_id=#{request.cookies['_core_session_id']}"

    if request.cookies.has_key?('socrata-csrf-token')
      socrata_session_cookie <<
        "; socrata-csrf-token=#{request.cookies['socrata-csrf-token']}"
    end

    Core::Auth::Client.new(
      request.host, #TODO we need to make sure we're actually talking to core, not some random host.
      port: Rails.application.config.frontend_port,
      cookie: socrata_session_cookie,
      verify_ssl_cert: false #TODO this needs to be configurable.
    )
  end
end

