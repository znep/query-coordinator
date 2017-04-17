require 'airbrake'
require 'httparty'

module SocrataSiteChrome
  class FeatureSet

    CONFIGURATION_TYPE = 'feature_set'

    attr_reader :domain

    def initialize(domain)
      @domain = domain
    end

    ##
    # `name` is a case-insensitive Socrata feature module name.
    def feature_enabled?(name)
      get_feature(name).try(:[], 'value') == true
    end

    def get_feature(name)
      feature_set.to_h.
        fetch('properties', []).
        find { |property| property['name'].downcase == name.downcase }
    end

    def feature_set
      @feature_set ||= get_feature_set
    end

    def self.feature_set_uri
      "#{Rails.application.config.coreservice_uri}/configurations.json?type=feature_set&defaultOnly=true"
    end

    private

    def domain_config
      ::RequestStore.store['site_chrome.domain_config'] ||= SocrataSiteChrome::DomainConfig.new(domain)
    end

    def get_feature_set
      body = Rails.cache.fetch(SocrataSiteChrome::CacheKey.new(domain_config, CONFIGURATION_TYPE).to_s) do
        begin
          response = HTTParty.get(
            self.class.feature_set_uri,
            :headers => coreservice_headers
          )

          if response.success?
            response.body
          else
            raise_feature_set_error("/configurations returned a non-200 response code (#{response.code}).")
          end
        rescue HTTParty::ResponseError => error
          raise_feature_set_error(error)
        end
      end

      parse_feature_set(JSON.parse(body))
    end

    def raise_feature_set_error(error)
      raise "Failed to get domain feature set for #{domain}: #{error}"
    end

    def parse_feature_set(feature_set_json)
      ActiveSupport::HashWithIndifferentAccess.new(feature_set_json.first)
    end

    def coreservice_headers
      {
        'X-Socrata-Host' => domain,
        'Content-Type' => 'application/json'
      }
    end
  end
end
