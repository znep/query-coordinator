module Chrome
  module ApplicationHelper
  end
end

module ApplicationHelper

  def chrome_stylesheet_tag
    stylesheet_link_tag '/themes/custom.css', media: 'all'
  end

end
