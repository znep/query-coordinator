require 'rack'

# We have decided to silence middleware internal to unicorn becase we could not change the log formats.
# Most sites suggest we do this anyway, e.g., http://dave.is/unicorn.html and https://pooreffort.com/blog/better-rails-logging/.
# In order to maintain parity, as we wish to still preserve such logs, and have control over their formats we are creating
# this middleware. The output of the layer will be to stderr by default.
# We build this based out of: https://github.com/rack/rack/blob/master/lib/rack/common_logger.rb

class RequestLoggerMiddleware

  # This is vaguely based on the old Common Log Format (http://httpd.apache.org/docs/1.3/logs.html#common),
  # but reshuffled a bit to have date and server host / request id fields more consistent with
  # other frontend logs and removes fields like content-length, which we can't get.
  #
  # eg. '2017-03-16 00:03:43,496 [localhost] [67c9ccd2201b43f4bb57551788bb0a04] [PID-71874] [HTTP ] - 127.0.0.1 - "GET /styles/individual/print.css?joe HTTP/1.1" 200 0.3473'
  FORMAT = %{%s [%s] [%s] [%s] [HTTP ] - %s %s "%s %s%s %s" %d %0.4f\n}
  DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S,%L"

  def initialize(app, datetime_format = nil)
    @app = app
    @logger = Logger.new('/dev/null')

    # check env. variables if we aren't running apache then send to stderr
    if ENV['SERVER_SOFTWARE'] !~ /apache/i
      @logger = Logger.new(STDERR)
    end

    @datetime_format = datetime_format || DATETIME_FORMAT
  end

  def call(env)
    began_at = Time.now.utc
    status, header, body = @app.call(env)
    header = Rack::Utils::HeaderHash.new(header)
    body = Rack::BodyProxy.new(body) { log(env, status, header, began_at) }
    [status, header, body]
  end

  def log(env, status, header, began_at)
    now = Time.now.utc

    msg = FORMAT % [
      now.strftime(@datetime_format),
      env['HTTP_X_SOCRATA_HOST'] || env['HTTP_HOST'] || '',
      header['X-Request-Id'].to_s.gsub('-', ''),
      'PID-%.5d' % Process.pid,
      env['HTTP_X_FORWARDED_FOR'] || env['REMOTE_ADDR'] || '-',
      env['REMOTE_USER'] || '-',
      env['REQUEST_METHOD'],
      env['PATH_INFO'],
      env['QUERY_STRING'] ? "?#{env['QUERY_STRING']}" : '',
      env['HTTP_VERSION'],
      status.to_s[0..3],
      now - began_at ]

    # We define the logger ab initio
    logger = @logger
    if logger.respond_to?(:write)
      logger.write(msg)
    else
      logger << msg
    end
  end
end
