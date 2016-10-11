require 'airbrake'
require 'httparty'

module SocrataSiteChrome
  class DomainConfig

    attr_reader :domain

    def initialize(domain)
      @domain = domain
    end

    # Convert domain_config to data structure needed for Site Chrome
    def site_chrome_config(stage = :published)
      raise RuntimeError.new('Empty configuration in site_chrome.') unless config

      site_chrome_config = current_site_chrome(stage).to_h.with_indifferent_access
      site_chrome_content = config[:properties].to_a.first.to_h.with_indifferent_access

      {
        id: config[:id],
        content: site_chrome_config[:content],
        updated_at: site_chrome_config[:updatedAt] || config[:updatedAt],
        current_version: site_chrome_content.dig(:value, :current_version) ||
          latest_existing_version(site_chrome_content) || SiteChrome::LATEST_VERSION
      }
    end

    def config
      @config = Hash.new(@config).empty? ? get_domain_config : @domain
    end

    def self.default_configuration
      JSON.parse(File.read("#{SocrataSiteChrome::Engine.root}/config/default_site_chrome.json"))
    end

    def cache_key
      "#{@domain}_site_chrome_config"
    end

    private

    # Config contains various versions, each having a "published" and "draft" set of
    # site chrome config vars. This finds and returns the newest published content.
    def current_site_chrome(stage = :published)
      site_chrome_config_for_stage = {}

      if config.dig(:properties).present?
        site_chrome_config = config[:properties].detect do |config|
          config[:name] == 'siteChromeConfigVars'
        end

        if site_chrome_config.dig(:value, :versions).present?
          # If current_version does not exist, use latest existing version
          current_version = site_chrome_config.dig(:value, :current_version) ||
            latest_existing_version(site_chrome_config)
          site_chrome_config_for_stage = site_chrome_config.dig(:value, :versions, current_version, stage)
        else
          message = "Invalid site_chrome configuration in domain: #{domain}"
          ::Airbrake.notify(
            :error_class => 'InvalidSiteChromeConfiguration',
            :error_message => message
          )
          Rails.logger.error(message)
        end
      end

      site_chrome_config_for_stage
    end

    # Latest version of Site Chrome that exists in the current configuration.
    # Return nil if config is invalid.
    def latest_existing_version(config)
      return nil unless config.present? && config.dig(:value, :versions).present?
      config.dig(:value, :versions).keys.map { |version| Gem::Version.new(version) }.max.to_s
    end

    def get_domain_config
      body = Rails.cache.fetch(cache_key) do
        begin
          response = HTTParty.get(
            domain_config_uri,
            :verify => Rails.env.production?,
            :headers => { 'X-Socrata-Host' => domain }
          )
          response.code == 200 ? response.body : nil
        rescue HTTParty::ResponseError => e
          raise "Failed to get domain configuration for #{domain}: #{e}"
        end
      end

      ActiveSupport::HashWithIndifferentAccess.new(configuration_or_default(body))
    end

    def domain_config_uri
      "#{coreservice_uri}/configurations.json?type=site_chrome&defaultOnly=true"
    end

    def coreservice_uri
      Rails.application.config.coreservice_uri
    end

    def configuration_or_default(configuration_response)
      configuration = configuration_response.to_s
      result = JSON.parse(configuration).first rescue nil
      result || DomainConfig.default_configuration.first
    end

  end
end
