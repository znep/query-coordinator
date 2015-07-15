# Populates `env[SOCRATA_SESSION_ENV_KEY]` with an object capable of
# authenticating the current session (represented by _core_session_id
# and _socrata_session_id cookies) against core.
#
# Perform the authentication by calling `authenticate`:
# `env[SOCRATA_SESSION_ENV_KEY].authenticate`
#
# If the session cookies are invalid/expired/otherwise broken,
# `authenticate` will return `nil`. Otherwise, the current user hash
# is returned.

class SocrataSession
  SOCRATA_SESSION_ENV_KEY = 'socrata.session'

  def initialize(app)
    @app = app
  end

  def call(env)
    env[SOCRATA_SESSION_ENV_KEY] = self

    @app.call(env)
  end

  # Validate the current session against core server. If the session is valid,
  # the user hash is returned (see example). Otherwise, nil is returned.
  #
  # Sample user hash:
  # {
  #   "id"=>"tugg-ikce",
  #   "createdAt"=>1364945570,
  #   "displayName"=>"John Doe",
  #   "email"=>"john@example.com",
  #   "emailUnsubscribed"=>false,
  #   "lastLogin"=>1435350228,
  #   "numberOfFollowers"=>0,
  #   "numberOfFriends"=>0,
  #   "oid"=>2,
  #   "profileLastModified"=>1364945570,
  #   "publicTables"=>0,
  #   "publicViews"=>0,
  #   "roleName"=>"administrator",
  #   "screenName"=>"John",
  #   "rights"=>[
  #     "create_datasets",
  #     "edit_dashboards",
  #     "create_dashboards",
  #     ...
  #   ],
  #   "flags"=>["admin"]
  # }
  #
  def authenticate(env)
    request = Rack::Request.new(env)

    if has_session_cookie?(request)
      current_user(request)
    else
      nil
    end
  end

  private

  # Returns true if _core_session_id is set on the cookie.
  #
  # Does not do _any_ verification beyond this.
  #
  def has_session_cookie?(request)
    request.cookies.has_key?('_core_session_id')
  end

  def current_user(request)
    socrata_session_cookie =
      "_core_session_id=#{request.cookies['_core_session_id']}"

    CoreServer.current_user(
      'Cookie' => socrata_session_cookie,
      'X-Socrata-Host' => request.host
    )
  end
end

