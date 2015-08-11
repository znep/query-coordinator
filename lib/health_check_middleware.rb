# Performs basic windowed health checks on HTTP status codes
# returned by the app. Also exposes a /health-check url for
# load balancers / nosy engineers to peek at.
class HealthCheckMiddleware
  def initialize(app)
    @app = app
    @request_log = []
  end

  def call(env)
    request = Rack::Request.new(env)
    if "/health-check" == request.path
      health_check(request)
    else
      status, headers, body = @app.call(env)
      @request_log.push [status, Time.new]
      @request_log.slice! 0 if @request_log.length > @@STATUS_WINDOW
      [status, headers, body]
    end
  end

  private

  def health_check(request)
    health = nil
    begin
      health = JSON.parse(CoreServer::Base.connection.create_request("/health_check"))
    rescue Exception => e
      # Yes, I mean 200. If the CS is failing its health check,
      # we should already know about it
      return [200, {"Content-Type" => "text/plain"}, ["ERROR\n", "Error fetching core server health status\n", e.message]]
    end

    if health.nil? || !health.is_a?(Hash)
      return [500, {"Content-Type" => "text/plain"}, ["ERROR\n", "Core server returned malformed health check:\n", health.inspect]]
    end

    # Only check to see if requests are past expiration on /health-check requests
    # otherwise we're doing a lot of time comparisons
    now = Time.new
    @request_log.delete_if { |l| (now - l.last) > @@WINDOW_SECONDS }

    if @request_log.empty?
      return [200, {"Content-Type" => "text/plain"}, ["WARNING\nNo requests in window."]]
    end

    errors = @request_log.select { |r| (r.first / 100) == 5 }
    failometer = errors.length.to_f / @request_log.length.to_f
    percentage = (failometer * 100).round

    status = "Core server says: '#{health['status']}'"

    if failometer < @@ERROR_THRESHOLD
      [200, {"Content-Type" => "text/plain"}, ["OK\n", "#{percentage}% failure.\n", status]]
    else
      [500, {"Content-Type" => "text/plain"}, ["ERROR\n", "#{percentage}% failure.\n", status]]
    end
  end

  # Health checking constants
  @@ERROR_THRESHOLD = 0.5     # What fraction of requests in error before we cry
  @@STATUS_WINDOW = 100       # How many items to keep in sliding window
  @@WINDOW_SECONDS = 60 * 5   # Max age of items in window
end
