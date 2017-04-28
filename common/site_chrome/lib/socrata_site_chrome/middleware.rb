module SocrataSiteChrome
  class Middleware

    SOCRATA_SITE_CHROME_ENV_KEY = 'socrata_site_chrome_middleware_instance'

    def initialize(app)
      @app = app
    end

    def call(env)
      env[SOCRATA_SITE_CHROME_ENV_KEY] = self

      @app.call(env)
    end

    def socrata_site_chrome(env)
      request = Rack::Request.new(env)
      SocrataSiteChrome::SiteChrome.new(
        if Rails.env.test?
          SocrataSiteChrome::DomainConfig.site_chrome_test_configuration
        else
          SocrataSiteChrome::DomainConfig.new(request.host).site_chrome_config(publication_stage(request.cookies))
        end
      )
    end

    private

    def publication_stage(cookies = {})
      !!cookies.with_indifferent_access[:socrata_site_chrome_preview] ? :draft : :published
    end

  end
end
