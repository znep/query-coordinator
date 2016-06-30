require 'erb'
require 'ostruct'

module SocrataSiteChrome
  class SiteChrome
    attr_reader :id, :content, :updated_at, :current_version

    def initialize(config = {})
      @id = config[:id]
      @updated_at = config[:updated_at] || 0
      @content = config[:content] || {}
      @current_version = config[:current_version] || default_site_chrome_config.dig(:value, :current_version)
    end

    def header
      @content[:header] || default_site_chrome_content[:header]
    end

    def footer
      @content[:footer] || default_site_chrome_content[:footer]
    end

    def general
      @content[:general] || default_site_chrome_content[:general]
    end

    def locales
      # In the event that a user has incomplete data, we want to keep the default locale values
      # for their incomplete sections. Merge the user-specified locales over the defaults.
      default_site_chrome_content[:locales].deep_merge(@content[:locales] || {})
    end

    def styles
      {
        general: general[:styles],
        header: header[:styles],
        footer: footer[:styles]
      }
    end

    private

    def default_site_chrome_config
      JSON.parse(File.read("#{SocrataSiteChrome::Engine.root}/config/default_site_chrome.json")).
        first['properties'].first.with_indifferent_access
    end

    def default_site_chrome_content
      default_site_chrome_config.dig(:value, :versions, @current_version, :published, :content).
        with_indifferent_access
    end
  end
end
