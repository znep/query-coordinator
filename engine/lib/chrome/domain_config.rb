require 'httparty'

module Chrome
  class DomainConfig

    attr_reader :domain

    def initialize(domain)
      @domain = domain
    end

    # Convert domain_config to data structure needed for Site Chrome
    def site_chrome_config
      raise RuntimeError.new('Empty configuration in site_chrome.') unless config

      site_chrome_config = newest_published_site_chrome
      {
        id: config[:id],
        content: site_chrome_config[:content],
        updated_at: site_chrome_config[:updatedAt] || config[:updatedAt],
        domain_cname: config[:domainCName]
      }
    end

    def config
      @config = Hash.new(@config).empty? ? get_domain_config : @domain
    end

    private

    # Config contains various versions, each having a "published" and "draft" set of
    # site chrome config vars. This finds and returns the newest published content.
    def newest_published_site_chrome
      if config.has_key?(:properties)
        site_chrome_config = config[:properties].detect do |config|
          config[:name] == 'siteChromeConfigVars'
        end

        latest_version = site_chrome_config[:value][:versions].keys.map(&:to_f).max.to_s
        site_chrome_config[:value][:versions][latest_version][:published]
      else
        {}
      end
    end

    def get_domain_config
      uri = domain_config_uri
      begin
        response = HTTParty.get(uri)
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
      File.read("#{Chrome::Engine.root}/config/default_site_chrome.json")
    end

  end
end
