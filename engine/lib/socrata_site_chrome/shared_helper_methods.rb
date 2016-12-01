# This is for methods that are included in both the external (hosting app) facing helper methods, as well as
# the internal-only helper methods.
# Because of this, they should be properly namespaced with a `site_chrome_` prefix so they are less likely
# to have conflicts with the hosting app.

module SocrataSiteChrome
  module SharedHelperMethods

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

    def site_chrome_instance
      @site_chrome_instance ||=
        request.env[SocrataSiteChrome::Middleware::SOCRATA_SITE_CHROME_ENV_KEY].socrata_site_chrome(request.env)
    end

  end
end
