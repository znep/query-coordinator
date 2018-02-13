class RequestIdMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    if defined?(Signaller)
      Signaller::Connection.request_id = env['HTTP_X_SOCRATA_REQUESTID'] ||
        env['action_dispatch.request_id'].gsub('-', '')
    end
    if defined?(FeatureFlagMonitor)
      FeatureFlagMonitor.request_id = env['HTTP_X_SOCRATA_REQUESTID'] ||
        env['action_dispatch.request_id'].gsub('-', '')
    end
    @app.call(env)
  end
end
