# Helper for SiteChromeController and its views
module SiteChromeHelper
  def tab_link_classnames(index)
    "tab-link#{' current' if index == 0}"
  end

  def tab_section_classnames(index)
    "tab-content#{' current' if index == 0}"
  end

  def social_share_link(type)
    @site_chrome.content['general']['social_shares'].detect{ |x| x['type'] == type }['url']
  end
end
