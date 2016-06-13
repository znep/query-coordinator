# The purpose of this module is to add helper methods to the host Rails application.

module SiteChromeHelper
  include SocrataSiteChrome::ApplicationHelper

  def site_chrome_meta_viewport_tag
    raw('<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">')
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
    favicon_url = get_site_chrome.general[:window_or_tab_icon]
    favicon_url.present? ? favicon_link_tag(favicon_url) : nil
  end

  def site_chrome_window_title
    get_site_chrome.general[:window_or_tab_title_display]
  end

end
