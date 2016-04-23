# The purpose of this module is to add helper methods to the host Rails application.

module ApplicationHelper

  def chrome_meta_viewport_tag
    raw('<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">')
  end

  def chrome_stylesheet_tag
    stylesheet_link_tag('/chrome/themes/custom.css', media: 'all')
  end

  def chrome_javascript_tag
    javascript_include_tag('/assets/chrome/site_chrome')
  end

end
