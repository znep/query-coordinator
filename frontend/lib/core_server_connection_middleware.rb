# This is similar to CurrentDomainMiddleware. We need to hook in as early
# as possible so we can give the core server connection the environment
# so it can pass along headers (such as user agent).
# Tried to do this as a before_filter, but that didn't work as reliably as
# we wanted to - in particular, current domain (from the middleware) loads the
# current domain long before it gets to controllers.
class CoreServerConnectionMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    CoreServer::Connection.env = env
    if defined?(Signaller)
      Signaller::Connection.request_id = env['action_dispatch.request_id'].to_s.gsub('-', '')
    end
    if defined?(FeatureFlagMonitor)
      FeatureFlagMonitor.request_id = env['action_dispatch.request_id'].to_s.gsub('-', '')
    end
    @app.call(env)
  end
end
