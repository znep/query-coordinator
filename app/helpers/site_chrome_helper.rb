# Helper for SiteChromeController and its views
module SiteChromeHelper
  def social_share_link(type, site_chrome = @site_chrome)
    social_shares = site_chrome.send(content_at_stage).to_h.dig('general', 'social_shares')

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

  def in_preview_mode?
    !!cookies[:socrata_site_chrome_preview]
  end

  def content_at_stage
    in_preview_mode? ? :draft_content : :published_content
  end

  # TODO: replace with `dig` after the Ruby upgrade
  def fetch_content(array_of_path_elements, site_chrome = @site_chrome)
    array_of_path_elements.inject(site_chrome.send(content_at_stage)) do |acc, element|
      acc[element.to_s] if acc.is_a?(Hash) # do not throw on strings or arrays
    end
  end

  # Forms will default to "1" and "0" but manual configurations could vary
  def fetch_boolean(array_of_path_elements, default_to_true = false, site_chrome = @site_chrome)
    content = fetch_content(array_of_path_elements, site_chrome)
    ['1', 'true', 1, true].include?(content) || (content.nil? && default_to_true)
  end

  # This tells the form how to format an input field for the call to update
  # fields is a path, like [:footer, :logo, :src]
  def form_field(fields)
    "content[#{fields.join('][')}]"
  end

  # Returns a "link-row" div that contains 3 input fields and an "X" icon to remove the row.
  # Example output:
  # <div class="link-row ">
  #   <input type="hidden" name="content[header]links[][key]" value="link_0" class="hidden-label-input">
  #   <input type="text" name="content[locales][en][header]links[link_0]" value="Home" class="localized-label-input">
  #   <input type="text" name="content[header]links[][url]" value="/">
  #   <span class="icon-close-2 remove-link-row" title="Remove Link" onclick="removeLinkRow(this);"></span>
  # </div>
  def link_row_div(content_key, link, placeholder_text, default = false)
    link ||= { 'key' => 'link_PLACEHOLDER_INDEX', 'url' => '' }
    key_path = "content[#{content_key}]links[][key]"
    url_path = "content[#{content_key}]links[][url]"
    # TODO - actually support other locales and remove "en" hardcoding.
    translated_label_path = "content[locales][en][#{content_key}]links[#{link['key']}]"
    translated_label = default ? nil : fetch_content([:locales, :en, content_key, :links, link['key']])

    content_tag(:div, :class => "link-row#{' default' if default}") do
      hidden_field_tag(key_path, link['key'] || '', :class => 'hidden-label-input') <<
      text_field_tag(
        translated_label_path,
        translated_label || '',
        :class => 'localized-label-input',
        :placeholder => placeholder_text[:link_title]
      ) <<
      text_field_tag(url_path, link['url'] || '', :placeholder => placeholder_text[:url]) <<
      content_tag(
        :span,
        nil,
        :class => 'icon-close-2 remove-link-row',
        :title => t('screens.admin.site_chrome.remove_link_row'),
        :onclick => 'removeLinkRow(this);'
      )
    end
  end

  # If less than 3 present_links, add empty link rows until there are 3 total rows
  def empty_link_row_divs(content_key, placeholder_text, present_link_count)
    (link_row_div(content_key, nil, placeholder_text) * [0, 3 - present_link_count].max).html_safe
  end

  # Return array of links with a url present
  def present_links(links)
    links.to_a.select do |link|
      link.dig('url').present?
    end
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
                         { checked: fetch_boolean(fields, true) },
                         'true', 'false')
        html << translation[fields.last]
      end
    end
  end

  def page_controls
    content_tag :div, class: 'page-controls' do
      safe_join([
        link_to('#', onclick: 'return confirmReload();') do
          content_tag(:button, t('screens.admin.site_chrome.cancel'), id: 'site_chrome_cancel')
        end,
        link_to('#') do
          content_tag :button, id: 'site_chrome_preview' do
            [
              t('screens.admin.site_chrome.preview_changes'),
              content_tag(:span, nil, class: 'icon-preview')
            ].join(' ').html_safe
          end
        end,
        content_tag(:button, t('screens.admin.site_chrome.update'), class: 'primary', id: 'site_chrome_save')
      ])
    end
  end
end
