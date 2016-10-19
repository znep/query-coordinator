# See EN-6555: Support for entirely custom headers/footers

require 'airbrake'
require 'httparty'

module SocrataSiteChrome
  class CustomContent

    attr_reader :domain

    def initialize(domain)
      @domain = domain
    end

    def get_custom_content
      config = SocrataSiteChrome::DomainConfig.new(domain).config
      content = config[:properties].to_a.select do |property|
        custom_content_property_names.include?(property[:name])
      end.to_a

      {
        :header => {
          :html => custom_content_property(content, 'custom_header_html'),
          :css => custom_content_property(content, 'custom_header_css'),
          :js => custom_content_property(content, 'custom_header_js')
        },
        :footer => {
          :html => custom_content_property(content, 'custom_footer_html'),
          :css => custom_content_property(content, 'custom_footer_css'),
          :js => custom_content_property(content, 'custom_footer_js')
        }
      }
    end

    def custom_content_is_present?
      custom_content = get_custom_content
      custom_content[:header].values.any? || custom_content[:footer].values.any?
    end

    private

    def custom_content_property_names
      %w(custom_header_html custom_header_css custom_header_js
        custom_footer_html custom_footer_css custom_footer_js)
    end

    def custom_content_property(custom_content, property_name)
      custom_content.detect { |content| content[:name] == property_name }.try(:[], :value)
    end
  end
end
