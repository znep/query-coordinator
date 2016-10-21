# See EN-6555: Support for entirely custom headers/footers

require 'airbrake'
require 'httparty'

module SocrataSiteChrome
  class CustomContent

    attr_reader :domain

    def initialize(domain)
      @domain = domain
    end

    def self.property_names
      published_property_names + draft_property_names
    end

    def self.published_property_names
      %w(custom_header_html custom_header_css custom_header_js
        custom_footer_html custom_footer_css custom_footer_js)
    end

    def self.draft_property_names
      published_property_names.map do |property_name|
        "draft_#{property_name}"
      end
    end

    def config
      SocrataSiteChrome::DomainConfig.new(domain).config
    end

    def fetch(pub_stage = :published)
      content = config[:properties].to_a.select do |property|
        SocrataSiteChrome::CustomContent.property_names.include?(property[:name])
      end.to_a

      {
        :header => {
          :html => property(content, 'custom_header_html', pub_stage),
          :css => property(content, 'custom_header_css', pub_stage),
          :js => property(content, 'custom_header_js', pub_stage)
        },
        :footer => {
          :html => property(content, 'custom_footer_html', pub_stage),
          :css => property(content, 'custom_footer_css', pub_stage),
          :js => property(content, 'custom_footer_js', pub_stage)
        }
      }
    end

    def activated?
      (config[:properties].to_a.detect do |property|
        property[:name] == 'activation_state'
      end || {}).dig(:value, :custom) == true
    end

    private

    def property(custom_content, property_name, pub_stage)
      custom_content.detect do |content|
        content[:name] == property_name_with_prefix(property_name, pub_stage)
      end.try(:[], :value)
    end

    def property_name_with_prefix(property_name, pub_stage)
      pub_stage == :draft ? "draft_#{property_name}" : property_name
    end
  end
end
