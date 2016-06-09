# The purpose of this module is to add helper methods to the host Rails application.

module SiteChromeHelper

  def site_chrome_meta_viewport_tag
    raw('<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">')
  end

  def site_chrome_stylesheet_tag
    # Note: The _inclusion_ of the leading / is critcial to the helper generating the correct digest path
    stylesheet_link_tag('/socrata_site_chrome/themes/custom.css', media: 'all')
  end

  def site_chrome_javascript_tag
    # Note: The _lack_ of a leading / is critical to this helper generating the correct digest path
    javascript_include_tag('socrata_site_chrome/application')
  end

end
