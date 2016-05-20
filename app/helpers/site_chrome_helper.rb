# Helper for SiteChromeController and its views
module SiteChromeHelper
  def social_share_link(type, site_chrome = @site_chrome)
    social_shares = fetch_content([:general, :social_shares], site_chrome)
    if social_shares
      share_type_hash = social_shares.detect { |x| x['type'] == type }
      if share_type_hash
        share_type_hash['url']
      end
    end
  end

  # TODO: replace with `dig` after the Ruby upgrade
  def fetch_content(array_of_path_elements, site_chrome = @site_chrome)
    array_of_path_elements.inject(site_chrome.content) do |acc, element|
      acc[element.to_s] if acc.is_a?(Hash) # do not throw on strings or arrays
    end
  end

  # Forms will default to "1" and "0" but manual configurations could vary
  def fetch_boolean(array_of_path_elements, site_chrome = @site_chrome)
    content = fetch_content(array_of_path_elements, site_chrome)
    # True unless...
    [
      nil,
      '0',
      'false',
      0,
      false
    ].exclude?(content)
  end

  # This tells the form how to format an input field for the call to update
  # fields is a path, like [:footer, :logo, :src]
  def form_field(fields)
    "content[#{fields.join('][')}]"
  end
end
