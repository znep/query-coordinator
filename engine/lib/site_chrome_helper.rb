# The purpose of this module is to add helper methods to the host Rails application.

require 'cgi'

module SiteChromeHelper
  include SocrataSiteChrome::ApplicationHelper

  def site_chrome_meta_viewport_tag
    raw('<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">')
  end

  def google_analytics_tracking_code
    CGI.escapeHTML(get_site_chrome.general[:google_analytics_token].to_s)
  end

  def site_chrome_google_analytics_tag
    if google_analytics_tracking_code.present?
      javascript_tag(<<-eos)
        if (typeof window._gaSocrata === 'undefined') {
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
              m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
          })(window,document,'script','//www.google-analytics.com/analytics.js','_gaSocrata');
        }

        _gaSocrata('create', '#{google_analytics_tracking_code}', 'auto', 'socrataSiteChrome');
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
    favicon_link_tag(favicon_url) if favicon_url.present?
  end

  def site_chrome_window_title
    get_site_chrome.general[:window_title_display]
  end

end
