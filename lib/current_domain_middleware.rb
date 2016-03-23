# Set the current domain on every request
# We used to do this as a before_filter, but that didn't work as reliably as
# we wanted to - in particular, rendering errors (404 in particular) would
# pick a theme at "random" because we never got to the point of running a
# controller - so the before_filter hook didn't run, and we used whatever
# domain the app server last ran. By using a rack middleware to set the
# CurrentDomain instead, we guarantee it's set regardless of whether it's
# an error or not.
#
# FIXME: The code in CurrentDomain is pretty ugly with the use of class-
# scoped variables. The bug where a domain could still leak between requests
# still exists in some form; in reality the cache of domains should survive
# across requests but the code that uses CurrentDomain.____ accessors should
# be converted to use the rack env['socrata.current_domain'] variable instead.
class CurrentDomainMiddleware
  include SocrataDockerHelpers

  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)

    # Bail out early if the request is merely checking the version end point, because both /version and
    # /version.html are only accessed via load balancer which injects the Host: header. The json endpoint is
    # accessed directly on each node by Decima, which doesn't set the Host: header, so we exit early here to
    # avoid any imperial entanglements. See also VersionMiddleware to see how we build the JSON response.
    if ::VersionRequestHelper.is_version_json_request?(env['REQUEST_URI'])
      return @app.call(env)
    end

    unless env['HTTP_X_FORWARDED_HOST'].blank?
      host = env['HTTP_X_FORWARDED_HOST'].gsub(/:\d+\z/, '')
    end
    host = request.host if host.blank?

    if !host.blank?
      current_domain = ::CurrentDomain.set(host)

      # Check every n minutes if the current domain needs to be refreshed
      if ::CurrentDomain.needs_refresh_check?(host)
        logger.debug("Checking memcache to see if domain '#{host}' needs update")
        ::CurrentDomain.check_for_theme_update(host)
        ::CurrentDomain.flag_refresh_checked!(host)
      end
    else
      logger.warn "Unable to determine domain for request."
    end

    if current_domain
      env['socrata.current_domain'] = current_domain
      env['socrata.httpsEnforced'] = current_domain[:data].httpsEnforced
      @app.call(env)
    else
      html = %{<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>301 Moved Permanently</title>
</head><body>
<h1>Moved Permanently</h1>
<p>The document has moved <a href="http://www.socrata.com/">here</a>.</p>
</body></html>}
      [301, {'Content-Type' => 'text/html', 'Location' => 'http://www.socrata.com'}, [html]]
    end
  end

  private

  def logger
    Rails.logger || Logger.new(STDOUT)
  end
end
