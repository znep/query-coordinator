require 'chroma'
require 'request_store'

# Internal helpers for the rendering of views within the gem only.

module SocrataSiteChrome
  module SiteChromeHelper
    include SharedHelperMethods

    def icon_with_aria_text(text, opts = {})
      content_tag(:span, aria_text_span(text), :class => opts.fetch(:class, 'icon'))
    end

    def aria_text_span(text)
      content_tag(:span, text, :class => 'aria-not-displayed')
    end

    def divider
      content_tag(:div, content_tag(:span), :class => 'divider')
    end

    def my_profile
      t('shared.site_chrome.admin.user.my_profile')
    end

    def admin_title
      header_title.presence || request.host
    end

    def profile_image?
      user_profile_image_url.present?
    end

    def user_profile_image_url
      site_chrome_current_user.profileImageUrlMedium
    end

    def open_performance_enabled?
      SocrataSiteChrome::FeatureSet.new(request.host).feature_enabled?('govstat') rescue false
    end

    def open_performance_catalog_path
      use_internal_asset_manager? ? '/admin/assets' : '/stat/data'
    end

    def use_internal_asset_manager?
      get_feature_flag('use_internal_asset_manager')
    end

    def get_feature_flag(flag)
      Signaller.for(flag: flag).value(on_domain: request.host) rescue nil
    end


    def header_title
      localized('header.site_name', site_chrome_instance.locales)
    end

    def footer_title
      localized('footer.site_name', site_chrome_instance.locales)
    end

    def logo(img, display_name = nil)
      logo_src = img.dig('logo', 'src')
      if logo_src.present?
        tag(
          'img',
          :src => site_chrome_massage_url(logo_src, add_locale: false),
          :alt => img.dig('logo', 'alt').presence || display_name.presence || request.host,
          :onerror => 'this.style.display="none"'
        )
      end
    end

    def header_logo
      url = site_chrome_instance.header.dig(:logo, :url).presence || '/'
      link_to(site_chrome_massage_url(url), :class => 'logo') do
        img = logo(site_chrome_instance.header, header_title)
        span = content_tag(:span, header_title, :class => 'site-name')
        img.present? ? img << span : span
      end
    end

    def footer_logo
      url = site_chrome_instance.footer.dig(:logo, :url).presence || '/'
      link_to(site_chrome_massage_url(url)) do
        img = logo(site_chrome_instance.footer, footer_title)
        span = content_tag(:span, footer_title, :class => 'site-name')
        img.present? ? img << span : span
      end
    end

    def logged_in?
      site_chrome_current_user.present?
    end

    def username
      site_chrome_current_user.try(:display_name).presence || t('shared.site_chrome.header.profile')
    end

    def current_user_id
      site_chrome_current_user.try(:id).to_s
    end

    def show_site_chrome_header_notifications_for_user?
      logged_in? && !current_user_can_see_admin_link? && get_feature_flag('enable_user_notifications')
    end

    def current_user_role
      site_chrome_current_user.role_name
    end

    def is_superadmin?
      site_chrome_current_user.is_superadmin?
    end

    def user_has_right?(activity)
      return false unless site_chrome_current_user
      site_chrome_current_user.is_superadmin? || site_chrome_current_user.has_right?(activity)
    end

    def current_user_can_see_create_menu?
      return false unless site_chrome_current_user

      site_chrome_current_user.is_superadmin? ||
        current_user_can_see_create_datasets? ||
        current_user_can_see_create_stories? ||
        current_user_can_see_create_measures? ||
        current_user_can_see_create_datasets_beta?
    end

    def current_user_can_see_create_stories?
      return false unless site_chrome_current_user

      get_feature_flag('stories_enabled') &&
        (site_chrome_current_user.is_superadmin? || site_chrome_current_user.can_create_stories?)
    end

    def current_user_can_see_create_measures?
      return false unless site_chrome_current_user

      get_feature_flag('open_performance_standalone_measures') &&
        open_performance_enabled? &&
        (site_chrome_current_user.is_superadmin? || site_chrome_current_user.can_create_measures?)
    end

    def current_user_can_see_create_datasets?
      return false unless site_chrome_current_user
      return false if get_feature_flag('usaid_features_enabled')

      site_chrome_current_user.is_superadmin? || site_chrome_current_user.can_create_datasets?
    end

    def current_user_can_see_create_datasets_beta?
      return false unless site_chrome_current_user

      get_feature_flag('enable_dataset_management_ui') &&
        (site_chrome_current_user.is_superadmin? || site_chrome_current_user.can_create_datasets?)
    end

    def current_user_can_see_dsmp_preview?
      return false unless site_chrome_current_user

      get_feature_flag('dsmp_preview') || false
    end

    def current_user_can_see_create_data_assets?
      return false unless site_chrome_current_user

      get_feature_flag('usaid_features_enabled') && get_feature_flag('enable_dataset_management_ui') &&
        (site_chrome_current_user.is_superadmin? || site_chrome_current_user.can_create_datasets?)
    end

    def current_user_can_see_admin_link?
      return false unless site_chrome_current_user
      site_chrome_current_user.is_superadmin? || site_chrome_current_user.has_any_rights?
    end

    def current_user_can_see_activity_logs?
      user_has_right?(:view_all_dataset_status_logs)
    end

    def current_user_can_see_asset_inventory?
      user_has_right?(:edit_others_datasets) || user_has_right?(:edit_site_theme)
    end

    def current_user_can_see_analytics?
      current_user_can_see_admin_link?
    end

    def current_user_can_see_users?
      user_has_right?(:manage_users)
    end

    def current_user_can_see_administration?
      current_user_can_see_admin_link?
    end

    def copyright_source
      localized('footer.copyright_notice_source', site_chrome_instance.locales)
    end

    def copyright
      "&copy; #{Time.now.year}".html_safe + " #{copyright_source}"
    end

    def show_copyright?
      site_chrome_instance.footer[:copyright_notice].to_s.downcase == 'true'
    end

    def show_powered_by?
      site_chrome_instance.footer.fetch(:powered_by, 'true').downcase == 'true'
    end

    def powered_by_logo_src
      # Chroma brightness returns a number between 0 and 255 representing how bright the color is.
      # 180 seemed to be a good cutoff point to use the darker logo. If the background brightness is
      # greater than the cutoff, use the light bg socrata logo. Otherwise use the dark bg logo.

      # EN-10151: By default Chroma returns 0 for "transparent" but it should be a light background.
      # Special case that to use the dark logo as well.
      footer_bg_color == 'transparent' || Chroma.paint(footer_bg_color).try(:brightness) > 180 ?
        '/socrata_site_chrome/images/socrata-logo-pb.png' :
        '/socrata_site_chrome/images/socrata-logo-2c-dark.png'
    end

    def footer_bg_color
      color = site_chrome_instance.footer.dig(:styles, :bg_color)
      color.present? ?
        color : SocrataSiteChrome::SiteChrome.default_site_chrome_content.dig(:footer, :styles, :bg_color)
    end

    def social_link_icon(type)
      {
        'facebook' => '&#xe027;',
        'twitter' => '&#xe086;',
        'youtube' => '&#xe099;',
        'linked_in' => '&#xe052;',
        'flickr' => '&#xe029;',
        'instagram' => '&#xe100;',
        'pinterest' => '&#xe064;',
        'tumblr' => '&#xe085;',
        'yammer' => 'y', # Doesn't exist for yammer. Just show a "y" because y not
        'google_plus' => '&#xe039;',
        'vimeo' => '&#xe089;',
        'github' => '&#xe037;'
      }[type.to_s.downcase]
    end

    def social_link_order
      %w(facebook twitter youtube linked_in flickr instagram pinterest tumblr yammer google_plus vimeo)
    end

    def valid_social_links(links)
      if current_version_is_greater_than_or_equal?('0.3')
        social_links = []
        links.to_a.each do |type, value|
          social_links.push(
            :type => type.to_s,
            :url => value[:url]
          )
        end
      else
        social_links = links.to_a
      end

      social_links.select { |link| link[:url].present? }.sort_by do |link|
        social_link_order.find_index(link[:type]).to_i
      end
    end

    def nav_link_classnames(child_link: false, social_link: false, is_mobile: false)
      [
        child_link ? 'site-chrome-nav-child-link' : 'site-chrome-nav-link',
        social_link ? 'site-chrome-social-link' : nil,
        is_mobile ? 'mobile-button' : nil,
        'noselect'
      ].compact.join(' ')
    end

    def navbar_links
      site_chrome_instance.header[:links].to_a
    end

    def navbar_links_div(args)
      content_tag(:div, :class => 'site-chrome-nav-links') do
        navbar_links.each do |link|
          link_text = localized("header.links.#{link[:key]}", site_chrome_instance.locales)
          concat(
            if valid_navbar_menu_item?(link)
              if args[:use_dropdown]
                content_tag(:div, :class => 'site-chrome-nav-menu noselect') do
                  dropdown(
                    content_tag(:span, link_text) << content_tag(:span, nil, :class => 'socrata-icon-arrow-down'),
                    navbar_child_links_array(link[:links], args[:is_mobile])
                  )
                end
              else
                # Instead of a dropdown, print out the name of the menu item followed by all its links
                content_tag(:div, :class => 'site-chrome-nav-menu noselect') do
                  content_tag(:span, link_text, :class => 'nav-menu-title') <<
                  navbar_child_links_array(link[:links], args[:is_mobile]).join('').html_safe
                end
              end
            elsif valid_link_item?(link, link_text)
              # Top level link
              link_to(link_text,
                site_chrome_massage_url(link[:url]),
                :class => nav_link_classnames(is_mobile: args[:is_mobile])
              )
            end
          )
        end
      end
    end

    def navbar_child_links_array(child_links, is_mobile)
      child_links.to_a.map do |link|
        link_text = localized("header.links.#{link[:key]}", site_chrome_instance.locales)
        if valid_link_item?(link, link_text)
          link_to(
            link_text,
            site_chrome_massage_url(link[:url]),
            :class => nav_link_classnames(child_link: true, is_mobile: is_mobile)
          )
        end
      end
    end

    # Valid if link has :key and :links, and :links contains at least one valid_link_item
    def valid_navbar_menu_item?(link)
      link.try(:dig, :key).present? && link.dig(:links).present? && link[:links].any? do |link_item|
        link_text = localized("header.links.#{link_item[:key]}", site_chrome_instance.locales)
        valid_link_item?(link_item, link_text)
      end
    end

    # Valid if link has :key and :url
    def valid_link_item?(link, link_text)
      link.try(:dig, :key).present? &&
      link[:url].present? &&
      link_text.present?
    end

    def locale_config
      if Rails.env.test?
        SocrataSiteChrome::LocaleConfig.default_configuration
      else
        SocrataSiteChrome::LocaleConfig.new(request.host).get_locale_config rescue
          SocrataSiteChrome::LocaleConfig.default_configuration
      end
    end

    def show_language_switcher?
      site_chrome_instance.general.dig(:languages, :display_language_switcher).to_s.downcase == 'true'
    end

    def language_switcher_locales
      locale_config.dig(:available_locales)
    end

    def language_switcher_options
      language_switcher_locales.map do |locale_key|
        link_to(
          locale_full_name(locale_key),
          "/#{locale_key}#{request.path}",
          :class => 'language-switcher-option'
        )
      end
    end

    def locale_full_name(locale_key)
      t('shared.site_chrome.current_language', :locale => locale_key, :default => locale_key) rescue locale_key
    end

    def default_locale
      locale_config.dig(:default_locale)
    end

    def dropdown(prompt, dropdown_options = [], orientation = 'bottom')
      dropdown_options = dropdown_options.compact.map { |option| content_tag(:li, option) }
      div_options = {
        'data-dropdown' => '',
        'data-orientation' => orientation,
        'class' => 'dropdown'
      }
      content_tag(:div, div_options) do
        div_content = content_tag(:span, prompt)
        div_content << content_tag(:ul, 'class' => 'dropdown-options') do
          safe_join(dropdown_options)
        end
      end
    end

    def show_profile?
      site_chrome_instance.general.fetch(:show_profile, 'true').downcase == 'true'
    end

    def show_signin_signout?
      site_chrome_instance.general.fetch(:show_signin_signout, 'true').downcase == 'true'
    end

    def localized(locale_key, locales)
      locales[I18n.locale.to_s].try(:dig, *locale_key.split('.'))
    end

    # Returns template name - either 'evergreen' (default) or 'rally'
    # Users can override with query parameter `?site_chrome_template=rally`
    def current_template
      template = (request.try(:query_parameters).dig(:site_chrome_template) ||
        site_chrome_instance.general[:template]).to_s.strip.downcase
      case template
        when 'rally' then 'rally'
        else 'evergreen'
      end
    end

    def current_version_is_greater_than_or_equal?(version)
      Gem::Version.new(site_chrome_instance.current_version) >= Gem::Version.new(version)
    end

    def render_custom_content_html(content: {}, section_id: nil, custom_content_class: nil, size: nil)
      begin
        content_tag(
          :div,
          raw(ERB.new(content[:html].to_s).result),
          :id => section_id.to_s,
          :class => "#{custom_content_class} #{size}".strip
        )
      rescue StandardError, SyntaxError => e
        error_msg = "Error parsing custom html: #{e.inspect}"
        Rails.logger.debug(error_msg)
        ::Airbrake.notify(
          :error_class => 'InvalidSiteChromeCustomContentConfiguration',
          :error_message => error_msg
        )
        error_msg
      end
    end

    def app_token
      SocrataSiteChrome.configuration.app_token
    end

    def current_domain_features_map
      SocrataSiteChrome::FeatureSet.new(request.host).feature_set.to_h.
        fetch('properties', []).
        each_with_object({}) { |property, hsh| hsh[property['name']] = property['value'] }
    end
  end
end
