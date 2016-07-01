require 'httparty'

module SocrataSiteChrome
  class DomainConfig

    attr_reader :domain

    def initialize(domain)
      @domain = domain
    end

    # Convert domain_config to data structure needed for Site Chrome
    def site_chrome_config
      raise RuntimeError.new('Empty configuration in site_chrome.') unless config

      site_chrome_config = current_published_site_chrome

      {
        id: config[:id],
        content: site_chrome_config[:content],
        updated_at: site_chrome_config[:updatedAt] || config[:updatedAt],
        current_version: config[:properties].to_a.first.to_h.dig(:value, :current_version)
      }
    end

    def config
      @config = Hash.new(@config).empty? ? get_domain_config : @domain
    end

    private

    # Config contains various versions, each having a "published" and "draft" set of
    # site chrome config vars. This finds and returns the newest published content.
    def current_published_site_chrome
      published_site_chrome_config = {}

      if config.has_key?(:properties)
        site_chrome_config = config[:properties].detect do |config|
          config[:name] == 'siteChromeConfigVars'
        end

        if site_chrome_config.dig(:value, :versions).present?
          # If current_version does not exist, use latest version
          current_version = site_chrome_config.dig(:value, :current_version) ||
            site_chrome_config.dig(:value, :versions).keys.map { |version| Gem::Version.new(version) }.max.to_s
          published_site_chrome_config = site_chrome_config.dig(:value, :versions, current_version, :published)
        else
          message = "Invalid site_chrome configuration in domain: #{domain}"
          Airbrake.notify(
            :error_class => 'InvalidSiteChromeConfiguration',
            :error_message => message
          )
          Rails.logger.error(message)
        end
      end

      published_site_chrome_config
    end

    def get_domain_config
      begin
        response = HTTParty.get(domain_config_uri, :verify => false) # todo remove :verify false
        body = response.code == 200 ? response.body : nil
        ActiveSupport::HashWithIndifferentAccess.new(configuration_or_default(body))
      rescue HTTParty::ResponseError => e
        raise "Failed to get domain configuration for #{domain}: #{e}"
      end
    end

    def domain_config_uri
      "#{domain_with_scheme}/api/configurations.json?type=site_chrome&defaultOnly=true"
    end

    def domain_with_scheme
      uri = URI.parse(domain) rescue domain
      uri.scheme ? uri.to_s : "https://#{uri}"
    end

    def configuration_or_default(configuration_response)
      configuration = configuration_response.to_s
      result = JSON.parse(configuration).first rescue nil
      result || JSON.parse(default_configuration).first
    end

    def default_configuration
      File.read("#{SocrataSiteChrome::Engine.root}/config/default_site_chrome.json")
    end

  end
end
