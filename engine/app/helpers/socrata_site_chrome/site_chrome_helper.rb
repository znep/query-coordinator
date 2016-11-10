require 'chroma'
require 'request_store'

# Internal helpers for the rendering of views
module SocrataSiteChrome
  module SiteChromeHelper

    def divider
      content_tag(:div, :class => 'divider') do
        content_tag(:span, nil)
      end
    end

    def my_profile
      t('admin.user.my_profile')
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
      begin
        SocrataSiteChrome::FeatureSet.new(request.host).feature_enabled?('govstat')
      rescue
        false
      end
    end

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
          massage_url(img_src, add_locale: false),
          :alt => img.dig('logo', 'alt').presence || display_name.presence ||
            request.host,
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
      ::RequestStore.store[:current_user] # TODO fix this to use the request?
    end

    def site_chrome_current_user
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
        color : SocrataSiteChrome::SiteChrome.default_site_chrome_content.dig(:footer, :styles, :bg_color)
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

    def nav_link_classnames(child_link: false, social_link: false, is_mobile: false)
      [
        child_link ? 'site-chrome-nav-child-link' : 'site-chrome-nav-link',
        social_link ? 'site-chrome-social-link' : nil,
        is_mobile ? 'mobile-button' : nil,
        'noselect'
      ].compact.join(' ')
    end

    def navbar_links
      get_site_chrome.header[:links].to_a
    end

    def navbar_links_div(args)
      content_tag(:div, :class => 'site-chrome-nav-links') do
        navbar_links.each do |link|
          link_text = localized("header.links.#{link[:key]}", get_site_chrome.locales)
          concat(
            if valid_navbar_menu_item?(link)
              if args[:use_dropdown]
                content_tag(:div, :class => 'site-chrome-nav-menu noselect') do
                  dropdown(
                    content_tag(:span, link_text) << content_tag(:span, nil, :class => 'icon-arrow-down'),
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
                massage_url(link[:url]),
                :class => nav_link_classnames(is_mobile: args[:is_mobile])
              )
            end
          )
        end
      end
    end

    def navbar_child_links_array(child_links, is_mobile)
      child_links.to_a.map do |link|
        link_text = localized("header.links.#{link[:key]}", get_site_chrome.locales)
        if valid_link_item?(link, link_text)
          link_to(link_text, massage_url(link[:url]),
            :class => nav_link_classnames(child_link: true, is_mobile: is_mobile)
          )
        end
      end
    end

    # Valid if link has :key and :links, and :links contains at least one valid_link_item
    def valid_navbar_menu_item?(link)
      link.try(:dig, :key).present? && link.dig(:links).present? && link[:links].any? do |link_item|
        link_text = localized("header.links.#{link_item[:key]}", get_site_chrome.locales)
        valid_link_item?(link_item, link_text)
      end
    end

    # Valid if link has :key and :url
    def valid_link_item?(link, link_text)
      link.try(:dig, :key).present? &&
      link[:url].present? &&
      link_text.present?
    end

    def relative_url_with_locale(url)
      I18n.locale.to_s == default_locale ? url : "/#{I18n.locale}#{url}"
    end

    # EN-9586: prepend "http://" onto links that do not start with it, and are not relative paths.
    # EN-7151: prepend locales onto relative links, and turn URLs into relative links if applicable
    def massage_url(url, add_locale: true)
      return unless url.present?

      url.strip!

      # If relative path, prerepend current locale if necessary and return
      if url.start_with?('/')
        return add_locale ? relative_url_with_locale(url) : url
      end

      supported_scheme_matchers = Regexp.union(%r{^https?://}, %r{^mailto:})

      # Prepend with 'http://' if they don't provide a scheme
      url = "http://#{url}" unless url.match(supported_scheme_matchers)
      uri = begin
        URI.parse(url)
      rescue
        return url
      end

      # Turn full URL into a relative link if the url host matches the current domain host
      if request.host.present? && uri.host == request.host
        uri.scheme = nil
        uri.host = nil
        add_locale ? relative_url_with_locale(uri.to_s) : uri.to_s
      else
        # Outoing link
        uri.to_s
      end
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
      get_site_chrome.general.dig(:languages, :display_language_switcher).to_s.downcase == 'true'
    end

    def language_switcher_locales
      locale_config.dig(:available_locales)
    end

    def language_switcher_options
      language_switcher_locales.map do |locale_key|
        link_to(
          locale_full_name(locale_key),
          url_for(:locale => locale_key),
          :class => 'language-switcher-option'
        )
      end
    end

    def locale_full_name(locale_key)
      t('current_language', :locale => locale_key, :default => locale_key) rescue locale_key
    end

    def default_locale
      locale_config.dig(:default_locale)
    end

    def dropdown(prompt, dropdown_options = [], orientation = 'bottom')
      dropdown_options = dropdown_options.compact.map { |option| content_tag :li, option }
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
      get_site_chrome.general.fetch(:show_profile, 'true').downcase == 'true'
    end

    def show_signin_signout?
      get_site_chrome.general.fetch(:show_signin_signout, 'true').downcase == 'true'
    end

    def localized(locale_key, locales)
      locales[I18n.locale.to_s].try(:dig, *locale_key.split('.'))
    end

    def get_site_chrome
      Rails.application.config.try(:socrata_site_chrome) || SocrataSiteChrome::SiteChrome.new
    end

    # Returns template name - either 'evergreen' (default) or 'rally'
    # Users can override with query parameter `?site_chrome_template=rally`
    def current_template
      template = (request.try(:query_parameters).dig(:site_chrome_template) ||
        get_site_chrome.general[:template]).to_s.strip.downcase
      case template
      when 'rally'
        'rally'
      else
        'evergreen'
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

    # EN-6555: Support for entirely custom headers/footers.
    # This will bypass the Site Appearance configuration and pull the custom header/footer content
    # from the Site Chrome configuration properties `custom_[header|footer]_[html|css|js]`
    def site_chrome_custom_content
      ::RequestStore.store[:site_chrome_custom_content] ||=
        SocrataSiteChrome::CustomContent.new(request.host)
    end

    def using_custom_header_footer?
      site_chrome_custom_content.activated?
    end

    def custom_header_footer_content
      site_chrome_custom_content.fetch(pub_stage)
    end

    def render_custom_content_html(content, custom_content_id)
      begin
        content_tag(:div, raw(ERB.new(content[:html].to_s).result), :id => custom_content_id)
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
  end
end
