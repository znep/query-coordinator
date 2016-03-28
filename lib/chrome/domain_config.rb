require 'httparty'

module Chrome
  class DomainConfig

    attr_reader :config

    def initialize(domain, auth_cookie)
      @domain = domain
      @auth_cookie = auth_cookie
      @config = get_domain_config
    end

    private

    def get_domain_config
      uri = "#{domain_with_scheme}/api/configurations.json?type=site_chrome&defaultOnly=true"
      begin
        response = HTTParty.get(uri,
          headers: { 'Cookies' => @auth_cookie })
        case response.code
          when 200
            body = JSON.parse(response.body)
            raise "Configuration is empty on #{uri}" if body.nil? || body.empty?
            body[0]
          else
            raise "#{response.code}: #{response.body}"
        end
      rescue HTTParty::ResponseError => e
        raise "Failed to get domain configuration for #{@domain}: #{e}"
      end
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
