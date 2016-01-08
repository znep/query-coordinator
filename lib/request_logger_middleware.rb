require 'rack'

# We have decided to silence middleware internal to unicorn becase we could not change the log formats.
# Most sites suggest we do this anyway, e.g., http://dave.is/unicorn.html and https://pooreffort.com/blog/better-rails-logging/.
# In order to maintain parity, as we wish to still preserve such logs, and have control over their formats we are creating
# this middleware. The output of the layer will be to stderr by default. 
# We build this based out of: https://github.com/rack/rack/blob/master/lib/rack/common_logger.rb

class RequestLoggerMiddleware

  # Common Log Format: http://httpd.apache.org/docs/1.3/logs.html#common
  #
  #   lilith.local - - [07/Aug/2006 23:58:02 -0400] "GET / HTTP/1.1" 500 -
  #
  #   %{%s - %s [%s] "%s %s%s %s" %d %s\n} %
  FORMAT = %{%s - %s [%s] "%s %s%s %s" %d %s %0.4f\n} 
  DATETIME_FORMAT = " %Y-%m-%d %H:%M:%S,%L "
  CONTENT_LENGTH = "Content-Length"

  def initialize(app, datetime_format = nil)
    @app = app
    @logger = Logger.new(STDERR)
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
    length = extract_content_length(header)

    msg = FORMAT % [
      env['HTTP_X_FORWARDED_FOR'] || env['REMOTE_ADDR'] || '-',
      env['REMOTE_USER'] || '-',
      now.strftime(@datetime_format),
      env['REQUEST_METHOD'],
      env['PATH_INFO'],
      env['QUERY_STRING'].empty? ? '' : "?#{env['QUERY_STRING']}",
      env['HTTP_VERSION'],
      status.to_s[0..3],
      length,
      now - began_at ]
 
    # We define the logger ab initio
    logger = @logger 
    if logger.respond_to?(:write)
      logger.write(msg)
    else
      logger << msg
    end
  end

  def extract_content_length(headers)
    (value = headers[CONTENT_LENGTH].to_i) == 0 ? '-' : value
  end

end

