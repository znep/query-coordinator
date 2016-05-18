# Helper for SiteChromeController and its views
module SiteChromeHelper
  def social_share_link(type)
    @site_chrome.content['general']['social_shares'].detect{ |x| x['type'] == type }['url']
  end

  # TODO: replace with `dig` after the Ruby upgrade
  def fetch_content(array_of_path_elements, site_chrome = @site_chrome)
    array_of_path_elements.inject(site_chrome.content) do |acc, element|
      acc[element.to_s] if acc.is_a?(Hash) # do not throw on strings or arrays
    end
  end
end
