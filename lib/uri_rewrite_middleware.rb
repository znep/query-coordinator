# In order to fit into the overall Socrata routing system,
# our app must live under the /stories namespace. We elected
# to enforce this via relative_url_root, but this makes it
# impossible for Rails to directly respond to OpenPerformance
# URLs (these are not prefixed with /stories).
#
# Instead of unwinding relative_url_root (it's hard*), we
# apply a /stories prefix to relevant incoming requests
# before Rails gets a chance to see the request.
#
# * Removing relative_url_root breaks gem asset inclusion (i.e.,
# socrata_site_chrome) as the gems will expect their assets to
# be served relative to /. This is not acceptable - we would
# have to teach haproxy to route a manually-curated set of
# gem assets to storyteller. We need the unambiguous prefix.

require 'uri'

class UriRewriteMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    uri = URI.parse(env['REQUEST_URI'])
    if uri.path =~ %r{^/(api|stat)/}
      uri.path = "/stories#{uri.path}"
      env['REQUEST_URI'] = uri.to_s

      # Need to update this too.
      # See RFC: https://tools.ietf.org/html/rfc3875#section-4
      env['PATH_INFO'] = uri.path
    end
    @app.call(env)
  end
end
