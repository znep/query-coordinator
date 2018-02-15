require 'cgi'

module SocrataSiteChrome
  module ThemesHelper

    def self.sass_engine_options
      {
        :style => Rails.env.development? ? :nested : :compressed,
        :syntax => :scss,
        :load_paths => [
          "#{SocrataSiteChrome::Engine.root}/app/assets/stylesheets",
          "#{SocrataSiteChrome::Engine.root}/app/assets/stylesheets/socrata_site_chrome",
          "#{SocrataSiteChrome::Engine.root}/app/views/config"
        ]
      }
    end

    def site_chrome_theme_cache_key
      SocrataSiteChrome::CacheKey.new(domain_config, 'site_chrome:custom.css').to_s
    end

    # theme_section is one of 'general', 'header', or 'footer'
    def theme_variable_key(theme_section, key)
      if theme_section.to_s == 'general'
        # General is implied and doesn't need a prefix
        key
      else
        "#{theme_section}_#{key}"
      end
    end

    def theme_value(key, value)
      # Return font family values in quotes
      key == 'font_family' ? %Q{"#{CGI.escapeHTML(value.to_s)}"} : value
    end

    def domain_config(cname = request.host)
      SocrataSiteChrome::DomainConfig.instance(cname)
    end
  end
end
