require 'securerandom'

# Helper for SiteAppearanceController and its views
module SiteAppearanceHelper

  def social_share_link(type, site_appearance = @site_appearance)
    social_shares = site_appearance.content(site_chrome_published_mode?).to_h.dig('general', 'social_shares')

    if social_shares
      if site_appearance_version_is_greater_than_or_equal?('0.3', site_appearance)
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
  def fetch_content(array_of_path_elements, site_appearance = @site_appearance)
    array_of_path_elements.inject(site_appearance.content(site_chrome_published_mode?)) do |acc, element|
      acc[element.to_s] if acc.is_a?(Hash) # do not throw on strings or arrays
    end
  end

  # Forms will default to "1" and "0" but manual configurations could vary
  def fetch_boolean(array_of_path_elements, default_to_true = false, site_appearance = @site_appearance)
    content = fetch_content(array_of_path_elements, site_appearance)
    ['1', 'true', 1, true].include?(content) || (content.nil? && default_to_true)
  end

  # This tells the form how to format an input field for the call to update
  # fields is a path, like [:footer, :logo, :src]
  def form_field(fields)
    "content[#{fields.join('][')}]"
  end

  def link_row_div_classnames(default, child_link)
    [
      'link-row',
      default ? 'default' : '',
      child_link ? 'child' : ''
    ].join(' ')
  end

  # Returns a "link-row" div that contains 3 input fields and an "X" icon to remove the row.
  # Example output:
  # <div class="link-row ">
  #   <input type="hidden" name="content[header]links[][key]" value="link_0" class="hidden-label-input">
  #   <input type="text" name="content[locales][en][header]links[link_0]" value="Home" class="localized-label-input">
  #   <span class="icon-move move-link-row" title="Drag to reorder"></span>
  #   <input type="text" name="content[header]links[][url]" value="/">
  #   <span class="icon-close-2 remove-link-row" title="Remove Link"></span>
  # </div>
  def link_row_div(link, options)
    link ||= { 'key' => 'link_PLACEHOLDER_INDEX', 'url' => '' }
    path_suffix = 'links[]' if options[:child_link]
    key_path = "content[#{options[:content_key]}]links[]#{path_suffix}[key]"
    url_path = "content[#{options[:content_key]}]links[]#{path_suffix}[url]"

    translated_label_path = "content[locales][#{I18n.locale}][#{options[:content_key]}]links[#{link['key']}]"
    translated_label = options[:default] ? nil : fetch_content(
      [:locales, I18n.locale, options[:content_key], :links, link['key']]
    )

    content_tag(:div, :class => link_row_div_classnames(options[:default], options[:child_link])) do
      hidden_field_tag(key_path, link['key'] || '', :class => 'hidden-label-input') <<
      text_field_tag(
        translated_label_path,
        translated_label || '',
        :class => 'localized-label-input',
        :placeholder => options.dig(:placeholder, :link_title)
      ) <<
      # content_tag(
      #   :span,
      #   nil,
      #   :class => 'icon-move-vertical move-link-row',
      #   :title => t('screens.admin.site_appearance.move_link_row')
      # ) <<

      # Temporary img until we get the icon font in common/resources/fonts
      image_tag(
        'admin/site_appearance/icon_move_vertical.svg',
        :class => 'move-link-row',
        :title => t('screens.admin.site_appearance.move_link_row')
      ) <<

      text_field_tag(
        url_path,
        link['url'] || '',
        :id => SecureRandom.uuid, # Unique id so jquery validate plugin can hook onto individual inputs
        :class => 'url-input',
        :required => options[:child_link] && !options[:default],
        :placeholder => options.dig(:placeholder, :url)
      ) <<
      content_tag(
        :span,
        nil,
        :class => 'icon-close-2 remove-link-row',
        :title => t('screens.admin.site_appearance.remove_link_row')
      )
    end
  end

  # If less than 3 present_links, add empty link rows until there are 3 total rows
  def empty_link_row_divs(options)
    link_options = {
      :content_key => options[:content_key],
      :placeholder => options[:placeholder]
    }
    (link_row_div(nil, link_options) * [0, 3 - options[:count]].max).html_safe
  end

  # Returns a "link-menu" div that may contain link-row divs.
  def link_menu_div(menu_links, options)
    menu_links ||= { 'key' => 'menu_PLACEHOLDER_INDEX', 'links' => [] }
    key_path = "content[#{options[:content_key]}]links[][key]"
    translated_label_path = "content[locales][#{I18n.locale}][#{options[:content_key]}]links[#{menu_links['key']}]"
    translated_label = options[:default] ? nil : fetch_content(
      [:locales, I18n.locale, options[:content_key], :links, menu_links['key']]
    )

    content_tag(:div, :class => "link-menu#{' default' if options[:default]}") do
      label_tag(nil, t('screens.admin.site_appearance.link_menu_label_html'), :class => 'link-menu-header') <<
      hidden_field_tag(key_path, menu_links['key'] || '', :class => 'hidden-label-input') <<
      text_field_tag(
        translated_label_path,
        translated_label || '',
        :class => 'localized-label-input',
        :placeholder => options.dig(:placeholder, :menu_title)
      ) <<
      content_tag(
        :span,
        nil,
        :class => 'icon-close-2 remove-link-menu',
        :title => t('screens.admin.site_appearance.remove_link_menu')
      ) <<
      child_link_row_divs(menu_links['links'], {
        :content_key => options[:content_key],
        :placeholder => options[:placeholder]
      }) <<
      content_tag(
        :button,
        :class => 'add-new-link-row',
        :type => 'button'
      ) do
        content_tag(:span, ' ', :class => 'icon-add') <<
        t('screens.admin.site_appearance.add_new_link_row', section: options[:content_key].capitalize)
      end
    end
  end

  # Returns html for multiple link-row divs
  def child_link_row_divs(links, options)
    content_tag(:div, :class => 'child-links') do
      link_options = {
        :content_key => options[:content_key],
        :placeholder => options[:placeholder],
        :default => false,
        :child_link => true
      }
      present_links(links).to_a.each do |link|
        concat(link_row_div(link, link_options))
      end
    end
  end

  # Returns array of links with a url present
  def present_links(links)
    links.to_a.select do |link|
      link.dig('url').present?
    end
  end

  # Returns array of links with a url present or child links present.
  def present_links_and_menus(links)
    links.to_a.select do |link|
      link.dig('url').present? || link.dig('links').present?
    end
  end

  def has_child_links?(link)
    link.dig('links').present?
  end

  def section_separator
    content_tag(:div, nil, :class => 'section-separator')
  end

  def site_appearance_version_is_greater_than_or_equal?(version, site_appearance = @site_appearance)
    Gem::Version.new(site_appearance.current_version) >= Gem::Version.new(version)
  end

  def signin_signout_checkbox(field, locale_string, options = {})
    fields = [:general, field]
    content_tag(:div, nil, :class => 'signin-signout-checkbox') do
      label_tag form_field(fields), :class => ('indented' if options[:indent]) do
        html = check_box(
          form_field(fields[0..-2]),
          fields.last,
          { checked: fetch_boolean(fields, true) },
          'true',
          'false'
        )
        html << t("#{locale_string}.#{fields.last}")
      end
    end
  end

  def site_appearance_form_field(section, fields, locale_string)
    render(
      'site_appearance/tab_content/form_field',
      :fields => Array[*fields].unshift(section),
      :locale_string => locale_string
    )
  end

  def site_appearance_dropdown_field(section, fields, dropdown_options, locale_string)
    render(
      'site_appearance/tab_content/dropdown_field',
      :fields => Array[*fields].unshift(section),
      :options => dropdown_option_tags(dropdown_options),
      :locale_string => locale_string
    )
  end

  # Takes an array of dropdown_options and creates option tags that match the styleguide format.
  def dropdown_option_tags(dropdown_options)
    dropdown_options.to_a.reduce('') do |result, option|
      result << content_tag(:li) do
        link_to(option, '#', :value => option, :class => 'dropdown-option')
      end
    end.html_safe
  end

  # Dropdown tag and its initial value (falls back to the placeholder if there isn't a value present)
  def dropdown_title_tag(initial_value, placeholder)
    content_tag(:span, nil, :class => initial_value.present? ? nil : 'placeholder') do
      initial_value.presence || placeholder
    end
  end

  # Should return true if the site chrome has never been activated, or if enabled for entire site
  def site_appearance_on_entire_site_or_default_state(site_appearance = @site_appearance)
    !site_appearance.activated? || site_appearance.on_entire_site?
  end

  def site_appearance_radio_button(name, value, title, selected: false, disabled: false)
    content_tag('div', :class => 'radiobutton horizontal') do
      radio_button_tag(name, value, selected, :disabled => disabled) <<
      label_tag([name, sanitize_to_id(value)].join('_'), :class => disabled ? 'disabled' : nil) do
        content_tag('span') << title
      end
    end
  end

  def activate_button_options
    {
      :id => 'site_appearance_activate',
      :class => 'primary',
      :type => :button
    }.merge(
      @site_appearance.reverted? ? {} : { :'data-flannel' => 'site_appearance_activation_flannel' }
    )
  end

  def valid_webfonts
    ['Arial', 'Georgia', 'Open Sans', 'Verdana']
  end

  def using_non_default_locale?
    default_locale = CurrentDomain.configuration(:locales).try(:properties).try(:*)
    # EN-12054: Ensure the default locale (as specified in the locales configuration)
    # is present and not equal to the current locale
    default_locale.present? && default_locale.to_sym != I18n.locale.to_sym
  end

end
