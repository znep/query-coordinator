require 'cgi'

module SocrataSiteChrome
  module ThemesHelper

    def sass_engine_options
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

    def cache_key_for_site_chrome(site_chrome, request)
      version = site_chrome.try(:updated_at) || SocrataSiteChrome::VERSION
      if request.try(:params).try(:keys).try(:length).to_i > 0
        version = "#{version}-#{request.params.keys.first}"
      end
      "#{Thread.current[:current_domain]}/config/custom-#{version}"
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

    def exclude_styleguide?
      SocrataSiteChrome::Engine.config.respond_to?(:styleguide) &&
        SocrataSiteChrome::Engine.config.styleguide == false
    end

  end
end
