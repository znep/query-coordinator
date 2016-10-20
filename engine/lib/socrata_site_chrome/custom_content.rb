# See EN-6555: Support for entirely custom headers/footers

require 'airbrake'
require 'httparty'

module SocrataSiteChrome
  class CustomContent

    attr_reader :domain

    def initialize(domain)
      @domain = domain
    end

    def fetch
      config = SocrataSiteChrome::DomainConfig.new(domain).config
      content = config[:properties].to_a.select do |property|
        property_names.include?(property[:name])
      end.to_a

      {
        :header => {
          :html => property(content, 'custom_header_html'),
          :css => property(content, 'custom_header_css'),
          :js => property(content, 'custom_header_js')
        },
        :footer => {
          :html => property(content, 'custom_footer_html'),
          :css => property(content, 'custom_footer_css'),
          :js => property(content, 'custom_footer_js')
        }
      }
    end

    def present?
      custom_content = fetch
      (custom_content[:header].values + custom_content[:footer].values).any?(&:present?)
    end

    def blank?
      !present?
    end

    private

    def property_names
      %w(custom_header_html custom_header_css custom_header_js
        custom_footer_html custom_footer_css custom_footer_js)
    end

    def property(custom_content, property_name)
      custom_content.detect { |content| content[:name] == property_name }.try(:[], :value)
    end
  end
end
