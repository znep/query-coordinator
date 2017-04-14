# This is for methods that are included in both the external (hosting app) facing helper methods, as well as
# the internal-only helper methods.
# Because of this, they should be properly namespaced with a `site_chrome_` prefix so they are less likely
# to have conflicts with the hosting app.

module SocrataSiteChrome
  module SharedHelperMethods
    def site_chrome_request_current_user
      raise 'Hosting app must provide a method for current_user_json on ApplicationController' unless
        request.env['action_controller.instance'].respond_to?(:current_user_json)
      request.env['action_controller.instance'].current_user_json
    end

    def site_chrome_current_user
      SocrataSiteChrome::User.new(site_chrome_request_current_user) if site_chrome_request_current_user.present?
    end

    def site_chrome_preview_mode?
      !!cookies[:socrata_site_chrome_preview]
    end

    def site_chrome_pub_stage
      site_chrome_preview_mode? ? :draft : :published
    end

    def site_chrome_massage_url(url, add_locale: true)
      def relative_url_with_locale(url)
        url = url.presence || '/' # EN-11978
        I18n.locale.to_s == default_locale ? url : "/#{I18n.locale}#{url}"
      end

      return unless url.present?

      url.strip!

      # If relative path, prerepend current locale if necessary and return
      if url.start_with?('/')
        return add_locale ? relative_url_with_locale(url) : url
      end

      supported_scheme_matchers = Regexp.union(%r{^https?://}, %r{^mailto:})

      # Prepend with 'http://' if they don't provide a scheme
      url = "http://#{url}" unless url.match(supported_scheme_matchers)
      uri = begin
        URI.parse(url)
      rescue
        return url
      end

      # Turn full URL into a relative link if the url host matches the current domain host
      if request.host.present? && uri.host == request.host
        uri.scheme = nil
        uri.host = nil
        add_locale ? relative_url_with_locale(uri.to_s) : uri.to_s
      else
        # Outoing link
        uri.to_s
      end
    end

    def site_chrome_custom_content
      ::RequestStore.store['site_chrome.custom_content'] ||= SocrataSiteChrome::CustomContent.new(request.host)
    end

    def using_custom_header_footer?
      Rails.env.test? ? false : site_chrome_custom_content.activated?
    end

    # EN-6555: Support for entirely custom headers/footers.
    # This will bypass the Site Appearance configuration and pull the custom header/footer content
    # from the Site Chrome configuration properties `custom_[header|footer]_[html|css|js]`
    def site_chrome_custom_header_footer_content
      site_chrome_custom_content.fetch(site_chrome_pub_stage)
    end

    def site_chrome_instance
      @site_chrome_instance ||=
        request.env[SocrataSiteChrome::Middleware::SOCRATA_SITE_CHROME_ENV_KEY].socrata_site_chrome(request.env)
    end
  end
end
