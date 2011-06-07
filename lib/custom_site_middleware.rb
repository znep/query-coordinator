class CustomSiteMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    if env['rack.session']
      CurrentDomain.set_custom_site_config(CurrentDomain.cname, env['rack.session'][:custom_site_config])
    end
    @app.call(env)
  end
end
