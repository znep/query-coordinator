require 'uri'
# Due to how our internal service routing works, requests will come in with the
# Host HTTP header set to the internal service name (something like
# storyteller.app.marathon.aws-us-west-2-prod.socrata.net). This causes
# issues and complications with various app components, like Rails' redirect_to.
# Instead of patching each troublesome component separately, we instead rewrite
# the request to appear to be for the original host (customer domain), which is
# provided to us by nginx in the X-Socrata-Host header.
#
# Note that since Rack generates additional environment variables based on Host
# (like SERVER_NAME and REQUEST_URI), we need to update more than just
# env['HTTP_HOST'].
class RequestHost
  def initialize(app)
    @app = app
  end

  def call(env)
    if env['HTTP_X_SOCRATA_HOST']
      env['SERVER_NAME'] = env['HTTP_X_SOCRATA_HOST']
      env['HTTP_HOST'] = env['HTTP_X_SOCRATA_HOST']

      parsed_request_uri = URI(env['REQUEST_URI'])
      parsed_request_uri.host = env['HTTP_X_SOCRATA_HOST']
      env['REQUEST_URI'] = parsed_request_uri.to_s
    end

    @app.call(env)
  end
end
