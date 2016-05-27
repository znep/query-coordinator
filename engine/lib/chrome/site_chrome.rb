require 'erb'
require 'ostruct'

module Chrome
  class SiteChrome
    attr_reader :id, :content, :updated_at

    def initialize(config = {})
      @id = config[:id]
      @updated_at = config[:updated_at] || 0
      @content = config[:content] || {}
    end

    def header
      @content[:header] || default_content[:header]
    end

    def footer
      @content[:footer] || default_content[:footer]
    end

    def general
      @content[:general] || default_content[:general]
    end

    def locales
      # In the event that a user has incomplete data, we want to keep the default locale values
      # for their incomplete sections. Merge the user-specified locales over the defaults.
      default_content[:locales].deep_merge(@content[:locales] || {})
    end

    def styles
      {
        general: general[:styles],
        header: header[:styles],
        footer: footer[:styles]
      }
    end

    private

    def default_content
      JSON.parse(File.read("#{Chrome::Engine.root}/config/default_site_chrome.json")).first['properties'].
        first.dig('value', 'versions', '0.1', 'published', 'content').with_indifferent_access
    end
  end
end
