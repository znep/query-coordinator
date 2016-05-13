require 'erb'
require 'ostruct'

module Chrome
  class SiteChrome

    attr_reader :id, :content, :updated_at, :domain_cname

    def initialize(config = {})
      @id = config[:id]
      @content = config[:content] || {}
      @updated_at = config[:updated_at] || 0
      @domain_cname = config[:domain_cname]
    end

    def header
      @content[:header]
    end

    def footer
      @content[:footer]
    end

    def general
      @content[:general]
    end

    def locales
      @content[:locales]
    end

    def styles
      {
        general: general[:styles],
        header: header[:styles],
        footer: footer[:styles]
      }
    end

    # TODO - this method is one way the gem could handle rendering the HTML
    # def get_html(section_content)
    #   # Returns template with content hash passed in as variables
    #   # eg: template = File.read("app/views/site_chrome/header.html.erb")
    #   ERB.new(template).result(OpenStruct.new(section_content).instance_eval { binding })
    # end

    private

  end
end
