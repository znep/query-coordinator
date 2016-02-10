# Store HTTP_REFERER for later use.
class ReferrerMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    # Also, spelling it right for our case because WTF?
    ::RequestStore.store[:http_referrer] = env['HTTP_REFERER']

    @app.call(env)
  end
end
