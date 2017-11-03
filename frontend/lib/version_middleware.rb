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
    if ::VersionRequestHelper.is_version_json_request?(env['REQUEST_URI'])
      ['200', {'Content-Type' => 'application/json'}, [version.to_json]]
    else
      @app.call(env)
    end
  end

  private

  def version
    result = {}

    begin
      result[:facility] = 'frontend'
      result[:revision] = REVISION_NUMBER
      result[:timestamp] = REVISION_DATE
      result[:cheetahRevision] = CHEETAH_REVISION_NUMBER
      result[:version] = Frontend.version
    rescue
    end

    result
  end
end
