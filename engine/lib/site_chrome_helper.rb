# The purpose of this module is to add helper methods to the host Rails application.

module SiteChromeHelper

  def site_chrome_meta_viewport_tag
    raw('<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">')
  end

  def site_chrome_stylesheet_tag
    stylesheet_link_tag('/chrome/themes/custom.css', media: 'all')
  end

  def site_chrome_javascript_tag
    javascript_include_tag('/asset_pipeline/chrome/site_chrome')
  end

end
