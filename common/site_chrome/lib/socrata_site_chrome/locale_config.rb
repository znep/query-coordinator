require 'airbrake'
require 'httparty'

module SocrataSiteChrome
  class LocaleConfig

    attr_reader :domain

    def initialize(domain)
      @domain = domain
    end

    def self.default_configuration
      ActiveSupport::HashWithIndifferentAccess.new(
        :default_locale => 'en',
        :available_locales => ['en']
      )
    end

    def get_locale_config
      ::RequestStore.store['site_chrome.locale_config'] ||= begin
        response = HTTParty.get(
          locale_config_uri,
          :verify => !!ENV['SSL_VERIFY_NONE'] || Rails.env.production?,
          :headers => { 'X-Socrata-Host' => domain }
        )
        response.code == 200 ? response.body : nil
      rescue HTTParty::ResponseError => e
        raise "Failed to get locale configuration for #{domain}: #{e}"
      end

      ActiveSupport::HashWithIndifferentAccess.new(
        configuration_or_default(::RequestStore.store['site_chrome.locale_config'])
      )
    end

    private

    def locale_config_uri
      "#{coreservice_uri}/configurations.json?type=locales&defaultOnly=true"
    end

    def coreservice_uri
      Rails.application.config.coreservice_uri
    end

    def configuration_or_default(configuration_response)
      configuration = configuration_response.to_s
      result = JSON.parse(configuration).first rescue nil
      # Merge result with the default locale config
      LocaleConfig.default_configuration.merge(get_locale_hash(result))
    end

    # Maps from a locale configurations result to hash with :default_locale and :available_locales
    def get_locale_hash(config)
      properties = config.try(:dig, 'properties').to_a
      {
        :default_locale => properties.detect { |prop| prop['name'] == '*' }.try(:dig, 'value'),
        :available_locales => properties.detect { |prop| prop['name'] == 'available_locales' }.try(:dig, 'value')
      }.reject { |k, v| v.nil? }
    end
  end
end
