#Making this explicit so it works outside of a Rails app
require 'active_support/all'
require 'airbrake'
require 'httparty'
require 'logger'
require 'time_extensions'

module SocrataSiteChrome
  class DomainConfig

    CONFIGURATION_TYPE = 'site_chrome'

    attr_reader :cname, :config_updated_at, :request_config, :logger, :cache

    def initialize(domain_name, config: Hash.new, logger: nil, cache: nil)
      @request_config = {
        :cache_key_prefix => (defined?(Rails) && !config.has_key?(:cache_key_prefix)) ? Rails.application.config.cache_key_prefix : config[:cache_key_prefix],
        :coreservice_uri => (defined?(Rails) && !config.has_key?(:coreservice_uri)) ? Rails.application.config.coreservice_uri : config[:coreservice_uri],
        :application => (defined?(Rails) && !config.has_key?(:application)) ? 'frontend' : config[:application],
      }

      @logger = logger
      @logger ||= if defined?(Rails) then
        Rails.logger
      else
        Logger.new(STDOUT)
      end

      @cache = cache
      @cache ||= if defined?(Rails) then
        Rails.cache
      end

      raise ArgumentError.new('No cache provided as parameter or by Rails environment') unless @cache.present?

      fetch_domain(domain_name) if [@cname, @config_updated_at].any?(&:blank?)
    end

    # Convert domain_config to data structure needed for Site Chrome
    def site_chrome_config(stage = :published)
      raise RuntimeError.new("Empty configuration in #{CONFIGURATION_TYPE}") unless config

      site_chrome_config = current_site_chrome(stage).to_h.with_indifferent_access
      site_chrome_content = config[:properties].to_a.detect do |property|
        property[:name] == 'siteChromeConfigVars'
      end.to_h.with_indifferent_access

      {
        id: config[:id],
        content: site_chrome_config[:content],
        updated_at: site_chrome_config[:updatedAt] || config[:updatedAt],
        current_version: site_chrome_content.dig(:value, :current_version) ||
          latest_existing_version(site_chrome_content) || SiteChrome::LATEST_VERSION
      }
    end

    def config
      @config = Hash.new(@config).empty? ? get_domain_config : @config
    end

    def self.default_configuration
      JSON.parse(File.read("#{SocrataSiteChrome::Engine.root}/config/default_site_chrome.json"))
    end

    # Dummy config to use in test
    def self.site_chrome_test_configuration
      site_chrome_config = default_configuration.first.with_indifferent_access
      site_chrome_config_values = site_chrome_config[:properties].first.dig(:value)
      current_version = site_chrome_config_values[:current_version]
      {
        id: site_chrome_config[:id],
        content: site_chrome_config_values.dig(:versions, current_version, :published, :content),
        updated_at: site_chrome_config[:updatedAt],
        current_version: current_version
      }
    end

    # NOTE!! It is critical that the composition this cache key structurally match the corresponding
    # cache_key method in consuming applications. For example in the frontend, this is defined in the
    # frontend/app/models/configuration.rb class.
    def cache_key
      "domain:#{cname}:#{config_updated_at}:configurations:#{CONFIGURATION_TYPE}"
      [
        @request_config[:application],
        @request_config[:cache_key_prefix],
        'domain',
        cname,
        config_updated_at,
        'configurations',
        CONFIGURATION_TYPE,
      ].join(':')
    end

    def fetch_domain(domain_name)
      begin
        domain_json = HTTParty.get(
          "#{@request_config[:coreservice_uri]}/domains/#{domain_name}.json",
          :headers => { 'X-Socrata-Host' => domain_name }
        ).body
      rescue HTTParty::ResponseError => e
        raise "Failed to get domain configuration for #{domain_name}: #{e}"
      end
      @cname, @config_updated_at = JSON.parse(domain_json).slice('cname', 'configUpdatedAt').values
      @config_updated_at ||= Time.now.quantize_to(300).to_i
    end

    def header_logo(site_chrome = SiteChrome.new(site_chrome_config))
      logo_config = site_chrome.header[:logo].slice(:src)
      style_config = site_chrome.header[:styles].slice(:logo_height, :logo_width)

      if logo_config[:src].present?
        logo_config.merge(style_config).compact.with_indifferent_access
      end
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

        if site_chrome_config.try(:dig, :value, :versions).present?
          # If current_version does not exist, use latest existing version
          current_version = site_chrome_config.dig(:value, :current_version) ||
            latest_existing_version(site_chrome_config)
          site_chrome_config_for_stage = site_chrome_config.dig(:value, :versions, current_version, stage)
        elsif site_chrome_config.try(:dig, :value, :content).present?
          # This is the case for a domain with Perspectives configuration set up,
          # but not the Site Chrome header/footer. Don't Airbrake.
        else
          # Unrecognized Site Chrome config, Airbrake.
          message = "Invalid #{CONFIGURATION_TYPE} configuration in domain: #{cname}"
          ::Airbrake.notify(
            :error_class => 'InvalidSiteChromeConfiguration',
            :error_message => message
          )
          @logger.error(message)
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
      unless cname.present?
        error_msg = 'cname is nil! cname must be present to fetch domain config'
        ::Airbrake.notify(
          :error_class => 'InvalidSiteChromeDomainConfig',
          :error_message => error_msg
        )
        @logger.error(error_msg)
        raise error_msg
      end

      body = @cache.fetch(cache_key) do
        begin
          response = HTTParty.get(
            domain_config_uri,
            :headers => { 'X-Socrata-Host' => cname.to_s }
          )
          response.code == 200 ? response.body : nil
        rescue HTTParty::ResponseError => e
          raise "Failed to get domain configuration for #{cname}: #{e}"
        end
      end

      ActiveSupport::HashWithIndifferentAccess.new(configuration_or_default(body))
    end

    def domain_config_uri
      "#{@request_config[:coreservice_uri]}/configurations.json?type=#{CONFIGURATION_TYPE}&defaultOnly=true"
    end

    def configuration_or_default(configuration_response)
      configuration = configuration_response.to_s
      result = JSON.parse(configuration).first rescue nil
      result || DomainConfig.default_configuration.first
    end
  end
end
