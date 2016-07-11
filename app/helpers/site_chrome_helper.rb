# Helper for SiteChromeController and its views
module SiteChromeHelper
  def social_share_link(type, site_chrome = @site_chrome)
    social_shares = site_chrome.content.to_h.dig('general', 'social_shares')

    if social_shares
      if site_chrome_version_is_greater_than_or_equal?('0.3', site_chrome)
        social_shares.dig(type, 'url')
      else
        share_type_hash = social_shares.detect { |x| x['type'] == type }
        if share_type_hash
          share_type_hash['url']
        end
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
    ['1', 'true', 1, true].include?(content) # default to false
  end

  # Forms will default to "1" and "0" but manual configurations could vary
  def fetch_boolean_with_true_default(array_of_path_elements, site_chrome = @site_chrome)
    content = fetch_content(array_of_path_elements, site_chrome)
    if content.nil? then true else ['1', 'true', 1, true].include?(content) end
  end

  # This tells the form how to format an input field for the call to update
  # fields is a path, like [:footer, :logo, :src]
  def form_field(fields)
    "content[#{fields.join('][')}]"
  end

  # Return links array trimmed to link_count, and create empty placeholders as needed
  def links_with_placeholders(links, link_count)
    Array[*links.to_a[0...link_count] + Array.new(link_count)][0...link_count]
  end

  def site_chrome_version_is_greater_than_or_equal?(version, site_chrome = @site_chrome)
    Gem::Version.new(site_chrome.current_version) >= Gem::Version.new(version)
  end

  def signin_signout_checkbox(field, translation, options = {})
    fields = [:general, field]
    content_tag :div do
      label_tag form_field(fields), :class => ('indented' if options[:indent]) do
        html = check_box(form_field(fields[0..-2]),
                         fields.last,
                         { checked: fetch_boolean_with_true_default(fields) },
                         "true", "false")
        html << translation[fields.last]
      end
    end
  end
end
