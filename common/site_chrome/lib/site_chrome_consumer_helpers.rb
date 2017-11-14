require 'cgi'

# The purpose of this module is to add helper methods to the consumer/host Rails application.

module SiteChromeConsumerHelpers
  include SocrataSiteChrome::SharedHelperMethods

  def site_chrome_meta_viewport_tag
    raw('<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">')
  end

  def site_chrome_google_analytics_tracking_code
    CGI.escapeHTML(site_chrome_instance.general[:google_analytics_token].to_s)
  end

  def site_chrome_google_analytics_tag
    if site_chrome_google_analytics_tracking_code.present?
      javascript_tag(<<-eos, :async => true)
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

  def site_chrome_tealium_tags
    tealium_account_id = site_chrome_instance.general.dig(:tealium, :account_id)
    if tealium_account_id.present?
      tealium_cname_for_prod_reporting = site_chrome_instance.general[:tealium][:cname_for_prod_reporting]

      teailum_production_mode = request.host == tealium_cname_for_prod_reporting ||
        tealium_cname_for_prod_reporting.empty?

      javascript_include_tag("//tags.tiqcdn.com/utag/#{tealium_account_id}/prod/utag.sync.js") <<
      javascript_tag(<<-eos)
        (function(a,b,c,d){
        a='//tags.tiqcdn.com/utag/#{tealium_account_id}/#{teailum_production_mode ? 'prod' : 'dev'}/utag.js';
        b=document;c='script';d=b.createElement(c);d.src=a;d.type='text/java'+c;d.async=true;
        a=b.getElementsByTagName(c)[0];a.parentNode.insertBefore(d,a);
        })();
      eos
    end
  end

  def site_chrome_webtrends_tag
    webtrends_url = site_chrome_instance.general[:webtrends_url]
    if webtrends_url.present?
      javascript_include_tag(webtrends_url, :async => true) +
        # This meta tag is used _only_ by Open Calgary, but we put it on every page. :sadpanda:
        tag('meta', :name => 'DC.creator', :content => 'Open Calgary')
    end
  end

  def site_chrome_analytics_tags
    if using_custom_header_footer?
      site_chrome_custom_content.analytics_html
    else
      [site_chrome_google_analytics_tag, site_chrome_tealium_tags, site_chrome_webtrends_tag].
        map(&:to_s).join.html_safe
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

      safe_join([
        File.read("#{site_chrome_js_dir}/disable_preview.js"),
        File.read("#{site_chrome_js_dir}/admin_header.js"),
        "window.current_user = #{site_chrome_current_user || {}};",
        raw(site_chrome_custom_header_footer_content[:header][:js]),
        raw(site_chrome_custom_header_footer_content[:footer][:js])
      ].map(&method(:javascript_tag)))
    else
      # `socrata_site_chrome` corresponds to the mount point in the hosting app's config/routes.rb
      # Note: The _lack_ of a leading / is critical to this helper generating the correct digest path
      javascript_include_tag('socrata_site_chrome/application')
    end
  end

  def site_chrome_favicon_tag
    favicon_url = site_chrome_instance.general[:window_icon]

    if favicon_url.present?
      tag('link', {
        :rel  => 'shortcut icon',
        :type => 'image/x-icon',
        :href => site_chrome_massage_url(favicon_url, add_locale: false)
      })
    end
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

  def show_signup?
    show_signup = site_chrome_instance.general[:show_signup]
    if show_signup.nil?
      true # default to true
    else
      show_signup.downcase == 'true'
    end
  end

  private

  def site_chrome_controller_instance(request, response)
    SocrataSiteChrome::SiteChromeController.new.tap do |controller|
      controller.request = request
      controller.response = response
    end
  end

end
