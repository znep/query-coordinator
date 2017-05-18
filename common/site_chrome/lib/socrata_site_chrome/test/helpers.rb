module SocrataSiteChrome
  module Test
    module Helpers
      def stub_site_chrome_instance(site_chrome = nil)
        if @request.present?
          @request.env[SocrataSiteChrome::Middleware::SOCRATA_SITE_CHROME_ENV_KEY] = SocrataSiteChrome::Middleware.new(@app)
        end
      end
    end
  end
end
