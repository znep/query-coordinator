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
      HashWithIndifferentAccess.new(SocrataSiteChrome::DomainConfig.instance(domain).config)
    end

    def fetch(publication_stage = :published)
      content = config[:properties].to_a.select do |property|
        SocrataSiteChrome::CustomContent.property_names.include?(property[:name])
      end.to_a

      {
        :header => {
          :html => property(content, 'custom_header_html', publication_stage),
          :css => property(content, 'custom_header_css', publication_stage),
          :js => property(content, 'custom_header_js', publication_stage)
        },
        :footer => {
          :html => property(content, 'custom_footer_html', publication_stage),
          :css => property(content, 'custom_footer_css', publication_stage),
          :js => property(content, 'custom_footer_js', publication_stage)
        }
      }
    end

    def activated?
      get_property_by_name('activation_state').dig(:value, :custom) == true
    end

    # Using translation data in custom content, seed the translations in I18n so
    # the custom html can use them.
    def populate_translations
      get_property_by_name('translations')['value'].to_h.each do |locale, translations|
        I18n.backend.store_translations(locale, translations)
      end
    end

    private

    def property(custom_content, property_name, publication_stage)
      custom_content.detect do |content|
        content[:name] == property_name_with_prefix(property_name, publication_stage)
      end.try(:[], :value)
    end

    def property_name_with_prefix(property_name, publication_stage)
      publication_stage == :draft ? "draft_#{property_name}" : property_name
    end

    # Returns the property hash for property matching provided name
    def get_property_by_name(name)
      config[:properties].to_a.detect do |property|
        property[:name] == name
      end || {}
    end
  end
end
