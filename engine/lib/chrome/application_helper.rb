module Chrome
  module ApplicationHelper

    def site_name
      @site_name ||= localized('general.site_name', get_site_chrome.locales)
    end

    def logo(source)
      image_tag(source['logo']['src'], :alt => source['logo']['alt'] || site_name)
    end

    def logged_in?
      !!request.cookies['logged_in']
    end

    def username
      (@current_user && @current_user['displayName'].present?) ? @current_user['displayName'] : 'Profile'
    end

    def copyright
      copy_with_year = "\u00A9 #{Time.now.year}"
      site_name ? "#{copy_with_year}, #{site_name}" : copy_with_year
    end

    def social_link_classname(type)
      {
        'facebook' => 'icon-facebook',
        'twitter' => 'icon-twitter'
      }[type.to_s.downcase]
    end

    def localized(locale_key, locales)
      # TODO - actually handle different locales
      locales['en'].dig(*locale_key.split('.'))
    end

    def get_site_chrome
      # This is just temporary caching. This approach should not be used in production.
      @get_site_chrome ||= Chrome::SiteChrome.new(Chrome::DomainConfig.new(ENV['DOMAIN']).site_chrome_config)
    end

  end
end
