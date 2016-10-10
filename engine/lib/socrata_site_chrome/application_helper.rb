require 'chroma'
require 'request_store'

module SocrataSiteChrome
  module ApplicationHelper
    def header_title
      localized('header.site_name', get_site_chrome.locales)
    end

    def footer_title
      localized('footer.site_name', get_site_chrome.locales)
    end

    def logo(img, display_name = nil)
      img_src = img.dig('logo', 'src')
      if img_src.present?
        image_tag(
          massage_url(img_src),
          :alt => img.dig('logo', 'alt').presence || display_name.presence || ::RequestStore.store[:current_domain],
          :onerror => 'this.style.display="none"')
      end
    end

    def header_logo
      link_to(massage_url('/'), class: 'logo') do
        img = logo(get_site_chrome.header, header_title)
        span = content_tag(:span, header_title, :class => 'site-name')
        img.present? ? img << span : span
      end
    end

    def logged_in?
      site_chrome_current_user.present?
    end

    def username
      if site_chrome_current_user.try(:displayName).blank?
        t('header.profile')
      else
        site_chrome_current_user.displayName
      end
    end

    def request_current_user
      ::RequestStore.store[:current_user]
    end

    def site_chrome_current_user
      Rails.logger.error("DEBUG EN-10582 (chrome gem): Domain = #{::RequestStore.store[:current_domain]}; request_current_user = #{request_current_user.inspect}")
      SocrataSiteChrome::User.new(request_current_user) if request_current_user.present?
    end

    def current_user_can_see_admin_link?
      return false unless site_chrome_current_user
      site_chrome_current_user.is_superadmin? ||
        %w(administrator publisher designer editor viewer).
          include?(site_chrome_current_user.role_name.to_s.downcase)
    end

    def copyright_source
      localized('footer.copyright_notice_source', get_site_chrome.locales)
    end

    def copyright
      "&copy; #{Time.now.year}".html_safe + " #{copyright_source}"
    end

    def show_copyright?
      get_site_chrome.footer[:copyright_notice].to_s.downcase == 'true'
    end

    def show_powered_by?
      get_site_chrome.footer.fetch(:powered_by, 'true').downcase == 'true'
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
      color = get_site_chrome.footer.dig(:styles, :bg_color)
      color.present? ?
        color : SiteChrome.default_site_chrome_content.dig(:footer, :styles, :bg_color)
    end

    def social_link_icon(type)
      {
        'facebook' => 'facebook',
        'twitter' => 'twitterbird',
        'youtube' => 'youtube',
        'linked_in' => 'linkedin',
        'flickr' => 'flickr',
        'instagram' => 'instagram',
        'pinterest' => 'pinterest',
        'tumblr' => 'tumblr',
        'yammer' => 'y', # Doesn't exist for yammer. Just show a "y" because y not
        'google_plus' => 'googleplus',
        'vimeo' => 'vimeo',
        'github' => 'githubalt'
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

      social_links.select do |link|
        link[:url].present?
      end.sort_by { |x| social_link_order.find_index(x[:type]).to_i }
    end

    def navbar_links
      get_site_chrome.header[:links].to_a
    end

    def navbar_links_div(use_dropdown: true)
      content_tag(:div, :class => 'site-chrome-nav-links') do
        navbar_links.each do |link|
          concat(
            if valid_navbar_menu_item?(link)
              if use_dropdown
                content_tag(:div, :class => 'site-chrome-nav-menu noselect') do
                  dropdown(
                    content_tag(:span, localized("header.links.#{link[:key]}", get_site_chrome.locales)) <<
                      content_tag(:span, nil, :class => 'icon-arrow-down'),
                    navbar_child_links_array(link[:links])
                  )
                end
              else
                # Instead of a dropdown, print out the name of the menu item followed by all its links
                content_tag(:div, :class => 'site-chrome-nav-menu noselect') do
                  content_tag(:span, localized("header.links.#{link[:key]}", get_site_chrome.locales),
                    :class => 'nav-menu-title') <<
                  navbar_child_links_array(link[:links]).join('').html_safe
                end
              end
            elsif valid_link_item?(link)
              # Top level link
              link_to(localized("header.links.#{link[:key]}", get_site_chrome.locales),
                massage_url(link[:url]), :class => 'site-chrome-nav-link noselect')
            end
          )
        end
      end
    end

    def navbar_child_links_array(child_links)
      child_links.to_a.map do |link|
        if valid_link_item?(link)
          link_to(localized("header.links.#{link[:key]}", get_site_chrome.locales),
            massage_url(link[:url]), :class => 'site-chrome-nav-child-link noselect')
        end
      end
    end

    # Valid if link has :key and :links, and :links contains at least one valid_link_item
    def valid_navbar_menu_item?(link)
      !!(link.try(:dig, :key).present? && link.dig(:links) && link[:links].any?(&method(:valid_link_item?)))
    end

    # Valid if link has :key and :url
    def valid_link_item?(link)
      !!(link.try(:dig, :key).present? && link[:url].present?)
    end

    def relative_url_with_locale(url)
      I18n.locale == I18n.default_locale ? url : "/#{I18n.locale}#{url}"
    end

    # EN-9586: prepend "http://" onto links that do not start with it, and are not relative paths.
    # EN-7151: prepend locales onto relative links, and turn URLs into relative links if applicable
    def massage_url(url)
      return unless url.present?

      # If relative path, prerepend current locale if necessary and return
      return relative_url_with_locale(url) if url.start_with?('/')

      supported_scheme_matchers = Regexp.union(%r{^https?://}, %r{^mailto:})

      # Prepend with 'http://' if they don't provide a scheme
      url = "http://#{url}" unless url.match(supported_scheme_matchers)
      uri = URI.parse(url)

      # Turn full URL into a relative link if the url host matches the current domain host
      if uri.host == ::RequestStore.store[:current_domain]
        uri.scheme = nil
        uri.host = nil
        return relative_url_with_locale(uri.to_s)
      end

      # Outoing link
      uri.to_s
    end

    def dropdown(prompt, dropdown_options = [], orientation = 'bottom')
      dropdown_options = dropdown_options.compact.map { |option| content_tag :li, option }
      div_options = {
        'data-dropdown' => '',
        'data-orientation' => 'bottom',
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
      get_site_chrome.general.fetch(:show_profile, 'true').downcase == 'true'
    end

    def show_signin_signout?
      get_site_chrome.general.fetch(:show_signin_signout, 'true').downcase == 'true'
    end

    def localized(locale_key, locales)
      # TODO - actually handle different locales
      locales['en'].dig(*locale_key.split('.'))
    end

    def site_chrome_test_config
      site_chrome_config = DomainConfig.default_configuration.first.with_indifferent_access
      site_chrome_config_values = site_chrome_config[:properties].first.dig(:value)
      current_version = site_chrome_config_values[:current_version]
      {
        id: site_chrome_config[:id],
        content: site_chrome_config_values.dig(:versions, current_version, :published, :content),
        updated_at: site_chrome_config[:updatedAt],
        current_version: current_version
      }
    end

    def get_site_chrome
      (::RequestStore.store[:site_chrome] ||= {})[pub_stage] ||= SocrataSiteChrome::SiteChrome.new(
        if Rails.env.test?
          site_chrome_test_config
        else
          SocrataSiteChrome::DomainConfig.new(request.host).site_chrome_config(pub_stage)
        end
      )
    end

    # Returns template name - either 'default' or 'rally'
    # Users can override with query parameter `?site_chrome_template=rally`
    def current_template
      template = (request.try(:query_parameters).dig(:site_chrome_template) ||
        get_site_chrome.general[:template]).to_s.strip.downcase
      case template
      when 'rally'
        'rally'
      else
        'default'
      end
    end

    def current_version_is_greater_than_or_equal?(version)
      Gem::Version.new(get_site_chrome.current_version) >= Gem::Version.new(version)
    end

    def in_preview_mode?
      !!cookies[:socrata_site_chrome_preview]
    end

    def pub_stage
      in_preview_mode? ? :draft : :published
    end
  end
end
