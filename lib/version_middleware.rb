require 'uri'
require 'json'

class VersionMiddleware
  def initialize(app)
    @app = app
  end

  # Both /version and /version.html are themed according to the domain configuration which requires the
  # Host: header to be set, but the /version.json is just a plain JSON response, we return it here directly.
  # See also CurrentDomainMiddleware for further details.
  def call(env)
    if '/version.json' == URI(env['REQUEST_URI']).path
      version = {}
      begin
        version[:facility] = 'frontend',
        version[:version] = Frontend.version,
        version[:revision] = REVISION_NUMBER,
        version[:timestamp] = REVISION_DATE
      rescue
      end
      ['200', {'Content-Type' => 'application/json'}, [version.to_json]]
    else
      @app.call(env)
    end
  end
end
