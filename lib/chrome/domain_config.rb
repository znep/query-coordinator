require 'httparty'

module Chrome
  class DomainConfig
    def initialize(domain, auth_cookie)
      @domain = domain
      @auth_cookie = auth_cookie
      @config = get_domain_config
    end

    def header_html

    end

    def footer_html

    end

    # In case anyone wants the entire config
    def json
      @config.to_json
    end

    private

    def get_domain_config
      begin
        response = HTTParty.get("#{domain_with_scheme}/api/configurations.json",
          headers: { "Cookies" => @auth_cookie })
        case response.code
          when 200
            response
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
