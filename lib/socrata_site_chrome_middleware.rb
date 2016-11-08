class SocrataSiteChromeMiddleware

  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)

    Rails.application.config.socrata_site_chrome = SocrataSiteChrome::SiteChrome.new(
      if Rails.env.test?
        SocrataSiteChrome::DomainConfig.site_chrome_test_configuration
      else
        SocrataSiteChrome::DomainConfig.new(request.host).site_chrome_config(pub_stage(request.cookies))
      end
    )

    @app.call(env)
  end

  private

  def pub_stage(cookies = {})
    !!cookies[:socrata_site_chrome_preview] ? :draft : :published
  end
end
