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
#
# In addition, this complicates how we handle locales. The Socrata
# platform uses a url-prefix locale scheme, like this:
# /it/mypage => mypage in Italian
# /es/mypage => mypage in Spanish
# /mypage => mypage in domain default locale.
#
# With relative URL root on, Stories will try to generate and serve
# URLs like this:
# /stories/es/mypage.
#
# This won't work. Yet another rewrite needs to be done here.

require 'uri'

class UriRewriteMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    uri = URI.parse(env['REQUEST_URI'])
    #TODO port over locale_middleware.rb from FE
    # This is a minimal implementation that only supports english.
    # We need to localize AX and the viz before we can support other locales.
    first_path_component = $1 if uri.path =~ /^\/([^\/]+)/
    locale_prefix_is_en = first_path_component == 'en'

    uri.path = uri.path[3..-1] if locale_prefix_is_en

    if uri.path.start_with?('/api/')
      uri.path = "/stories#{uri.path}"
    elsif uri.path.start_with?('/stat/')
      if locale_prefix_is_en
        uri.path = "/stories/en#{uri.path}"
      else
        uri.path = "/stories#{uri.path}"
      end
    end

    env['REQUEST_URI'] = uri.to_s

    # Need to update this too.
    # See RFC: https://tools.ietf.org/html/rfc3875#section-4
    env['PATH_INFO'] = uri.path

    @app.call(env)
  end
end
