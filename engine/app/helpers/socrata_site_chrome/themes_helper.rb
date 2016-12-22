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

    # NOTE!! It is critical that the composition this cache key structurally match the corresponding
    # cache_key method in consuming applications. For example in the frontend, this is defined in the
    # frontend/app/models/configuration.rb class.
    def cache_key_for_site_chrome
      [
        'frontend',
        Rails.application.config.cache_key_prefix,
        'domain',
        domain_config.cname,
        domain_config.config_updated_at,
        'configurations',
        'site_chrome',
        'custom.css'
      ].join(':')
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
      ::RequestStore.store['site_chrome.domain_config'] ||= SocrataSiteChrome::DomainConfig.new(cname)
    end
  end
end
