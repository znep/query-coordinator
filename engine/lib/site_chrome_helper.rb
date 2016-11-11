# The purpose of this module is to add helper methods to the host Rails application.

require 'cgi'

module SiteChromeHelper

  def site_chrome_meta_viewport_tag
    raw('<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">')
  end

  def site_chrome_google_analytics_tracking_code
    CGI.escapeHTML(get_site_chrome.general[:google_analytics_token].to_s)
  end

  def site_chrome_google_analytics_tag
    if site_chrome_google_analytics_tracking_code.present?
      javascript_tag(<<-eos)
        if (typeof window._gaSocrata === 'undefined') {
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
              m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
          })(window,document,'script','//www.google-analytics.com/analytics.js','_gaSocrata');
        }

        _gaSocrata('create', '#{site_chrome_google_analytics_tracking_code}', 'auto', 'socrataSiteChrome');
        _gaSocrata('socrataSiteChrome.send', 'pageview');
      eos
    end
  end

  def site_chrome_stylesheet_tag
    # `socrata_site_chrome` corresponds to the mount point in the hosting app's config/routes.rb
    # Note: The _inclusion_ of the leading / is critcial to the helper generating the correct digest path
    stylesheet_link_tag('/socrata_site_chrome/themes/custom.css', media: 'all')
  end

  def site_chrome_javascript_tag
    # `socrata_site_chrome` corresponds to the mount point in the hosting app's config/routes.rb
    # Note: The _lack_ of a leading / is critical to this helper generating the correct digest path
    javascript_include_tag('socrata_site_chrome/application')
  end

  def site_chrome_favicon_tag
    favicon_url = get_site_chrome.general[:window_icon]
    favicon_link_tag(massage_url(favicon_url, add_locale: false)) if favicon_url.present?
  end

  def site_chrome_window_title
    get_site_chrome.general[:window_title_display]
  end

  def site_chrome_header(request, response, args = {})
    site_chrome_controller_instance(request, response).header(args)
  end

  def site_chrome_footer(request, response, args = {})
    site_chrome_controller_instance(request, response).footer(args)
  end

  private

  def site_chrome_controller_instance(request, response)
    SocrataSiteChrome::SiteChromeController.new.tap do |cont|
      cont.request = request
      cont.response = response
    end
  end

  # Copied from SocrataSiteChrome::SiteChromeHelper

  def get_site_chrome
    Rails.application.config.try(:socrata_site_chrome) || SocrataSiteChrome::SiteChrome.new
  end

  def massage_url(url, add_locale: true)
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

  def relative_url_with_locale(url)
    I18n.locale.to_s == default_locale ? url : "/#{I18n.locale}#{url}"
  end

end
