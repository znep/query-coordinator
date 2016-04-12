require 'httparty'

module Chrome
  class DomainConfig

    attr_reader :config

    def initialize(domain, localhost = false)
      @domain = domain
      @localhost = localhost
      @config = get_domain_config
    end

    # Convert domain_config to data structure needed for Site Chrome
    def to_site_chrome_config
      return if @config.nil?

      site_chrome_config = newest_published_site_chrome
      {
        id: @config[:id],
        content: site_chrome_config[:content],
        updated_at: site_chrome_config[:updatedAt] || @config[:updatedAt],
        domain_cname: @config[:domainCName]
      }
    end

    private

    # Config contains various versions, each having a "published" and "draft" set of
    # site chrome config vars. This finds and returns the newest published content.
    def newest_published_site_chrome()
      if @config.has_key?(:properties)
        site_chrome_config = @config[:properties].detect do |config|
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
        case response.code
          when 200
            body = JSON.parse(response.body)
            raise "Configuration is empty on #{uri}" if body.nil? || body.empty?
            ActiveSupport::HashWithIndifferentAccess.new(body[0])
          else
            raise "#{response.code}: #{response.body}"
        end
      rescue HTTParty::ResponseError => e
        raise "Failed to get domain configuration for #{@domain}: #{e}"
      end
    end

    def domain_config_uri
      domain_config_url_params = '?type=site_chrome&defaultOnly=true'
      (@localhost ?
        'http://localhost:8080/configurations.json' :
        "#{domain_with_scheme}/api/configurations.json"
      ) << domain_config_url_params
    end

    def domain_with_scheme
      uri = URI.parse(@domain)
      if uri.scheme
        uri.to_s
      else
        "https://#{uri}"
      end
    end
  end
end
