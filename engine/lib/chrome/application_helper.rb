require 'request_store'

module Chrome
  module ApplicationHelper

    def site_name
      @site_name ||= localized('general.site_name', get_site_chrome.locales)
    end

    def logo(img)
      img_src = img.dig('logo', 'src')
      if img_src.present?
        image_tag(img_src, :alt => img.dig('logo', 'alt') || site_name,
          :onerror => 'this.style.display="none"')
      end
    end

    def header_logo
      link_to('/', class: 'logo') do
        img = logo(get_site_chrome.header)
        span = content_tag(:span, site_name, :class => 'site-name')
        img.present? ? img << span : span
      end
    end

    def logged_in?
      current_user.present?
    end

    def username
      (current_user && current_user['displayName'].present?) ? current_user['displayName'] : 'Profile'
    end

    def copyright
      copy_with_year = "\u00A9 #{Time.now.year}"
      site_name ? "#{copy_with_year}, #{site_name}" : copy_with_year
    end

    def show_copyright?
      get_site_chrome.footer[:copyright_notice] == 'true'
    end

    def social_link_classname(type)
      {
        'facebook' => 'icon-facebook',
        'twitter' => 'icon-twitter'
      }[type.to_s.downcase]
    end

    def valid_social_links(links)
      links.to_a.select do |link|
        link && link[:url].present?
      end
    end

    def valid_links(links)
      links.to_a.select do |link|
        link && link[:url].present? && link[:key].present?
      end
    end

    def localized(locale_key, locales)
      # TODO - actually handle different locales
      locales['en'].dig(*locale_key.split('.'))
    end

    def get_site_chrome
      RequestStore.store[:site_chrome] ||=
        Chrome::SiteChrome.new(Chrome::DomainConfig.new(request.host).site_chrome_config)
    end

    def current_user
      unless RequestStore.store.has_key?(:current_user)
        raise 'Site Chrome: Host app must provide current_user key in RequestStore (even if nil)'
      end

      RequestStore.store[:current_user]
    end

  end
end
