class VersionMiddleware
  def initialize(app)
    @app = app
  end

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
