module Chrome
  module ThemesHelper

    def sass_engine_options
      {
        :style => Rails.env.development? ? :nested : :compressed,
        :syntax => :scss,
        :load_paths => [
          "#{Rails.root}/app/assets/stylesheets",
          "#{Rails.root}/app/views/config"
        ]
      }
    end

    def cache_key_for_site_chrome(site_chrome)
      return unless site_chrome.try(:updated_at).present?
      "#{Thread.current[:current_domain]}/config/custom-#{site_chrome.updated_at}"
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
      key == 'font_family' ? %Q{"#{value}"} : value
    end

  end
end
