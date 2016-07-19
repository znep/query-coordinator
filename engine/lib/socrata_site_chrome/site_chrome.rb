require 'erb'
require 'ostruct'

module SocrataSiteChrome
  class SiteChrome
    attr_reader :id, :content, :updated_at, :current_version

    LATEST_VERSION = '0.3'.freeze

    def initialize(config = {})
      @id = config[:id]
      @updated_at = config[:updated_at] || 0
      @content = config[:content] || {}
      @current_version = config[:current_version] || SiteChrome.default_site_chrome_config.
        dig(:value, :current_version)
    end

    def header
      @content[:header] || SiteChrome.default_site_chrome_content[:header]
    end

    def footer
      @content[:footer] || SiteChrome.default_site_chrome_content[:footer]
    end

    def general
      @content[:general] || SiteChrome.default_site_chrome_content[:general]
    end

    def locales
      # In the event that a user has incomplete data, we want to keep the default locale values
      # for their incomplete sections. Merge the user-specified locales over the defaults.
      SiteChrome.default_site_chrome_content[:locales].deep_merge(@content[:locales] || {})
    end

    def styles
      {
        general: general[:styles],
        header: header[:styles],
        footer: footer[:styles]
      }
    end

    def self.default_site_chrome_config
      DomainConfig.default_configuration.first['properties'].first.with_indifferent_access
    end

    def self.default_site_chrome_content(version = SiteChrome::LATEST_VERSION)
      SiteChrome.default_site_chrome_config.
        dig(:value, :versions, version, :published, :content).with_indifferent_access
    end
  end
end
