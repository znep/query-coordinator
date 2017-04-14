require 'cgi'

# The purpose of this module is to add helper methods to the host Rails application.

module SiteChromeHelper
  include SocrataSiteChrome::SharedHelperMethods

  def site_chrome_meta_viewport_tag
    raw('<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">')
  end

  def site_chrome_google_analytics_tracking_code
    CGI.escapeHTML(site_chrome_instance.general[:google_analytics_token].to_s)
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
    stylesheet_link_tag('/socrata_site_chrome/themes/custom.css', media: 'all') +
    stylesheet_link_tag('socrata_site_chrome/application', media: 'all')
  end

  def site_chrome_javascript_tag
    if using_custom_header_footer?
      site_chrome_js_dir = "#{SocrataSiteChrome::Engine.root}/app/assets/javascripts/socrata_site_chrome"
      node_modules_dir = "#{SocrataSiteChrome::Engine.root}/node_modules"

      safe_join([
        File.read("#{site_chrome_js_dir}/disable_preview.js"),
        File.read("#{site_chrome_js_dir}/admin_header.js"),
        File.read("#{node_modules_dir}/socrata-notifications/socrata-notifications.js"),
        File.read("#{node_modules_dir}/socrata-autocomplete/socrata-autocomplete.js"),
        "window.current_user = #{site_chrome_current_user || {}};",
        raw(custom_header_footer_content[:header][:js]),
        raw(custom_header_footer_content[:footer][:js])
      ].map(&method(:javascript_tag)))
    else
      # `socrata_site_chrome` corresponds to the mount point in the hosting app's config/routes.rb
      # Note: The _lack_ of a leading / is critical to this helper generating the correct digest path
      javascript_include_tag('socrata_site_chrome/application')
    end
  end

  def site_chrome_favicon_tag
    favicon_url = site_chrome_instance.general[:window_icon]
    favicon_link_tag(site_chrome_massage_url(favicon_url, add_locale: false)) if favicon_url.present?
  end

  def site_chrome_window_title
    site_chrome_instance.general[:window_title_display]
  end

  def site_chrome_header(request, response, args = {})
    site_chrome_controller_instance(request, response).header(args)
  end

  def site_chrome_admin_header(request, response, args = {})
    site_chrome_controller_instance(request, response).admin_header(args)
  end

  def site_chrome_footer(request, response, args = {})
    site_chrome_controller_instance(request, response).footer(args)
  end

  private

  def site_chrome_controller_instance(request, response)
    SocrataSiteChrome::SiteChromeController.new.tap do |controller|
      controller.request = request
      controller.response = response
    end
  end

end
