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
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)
    host = env['HTTP_X_FORWARDED_HOST'].gsub(/:\d+\z/, '')
    host = request.host if host.blank?

    if host
      logger.debug "Current domain: #{host}"
      env['socrata.current_domain'] = current_domain = CurrentDomain.set(host, env['rack.session'][:custom_site_config])
    else
      logger.warn "Unable to determine domain for request."
    end

    if current_domain
      @app.call(env)
    else
      html = %{<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>301 Moved Permanently</title>
</head><body>
<h1>Moved Permanently</h1>
<p>The document has moved <a href="http://www.socrata.com/">here</a>.</p>
</body></html>}
      [301, {'Location' => 'http://www.socrata.com'}, html]
    end
  end

  private
  def logger
    RAILS_DEFAULT_LOGGER || Logger.new
  end
end
