module CatalogFederator
  class AbstractClient
    include HTTParty
    include Socrata::RequestIdHelper
    include Socrata::CookieHelper

    def get_sources
      route = '/v1/source'
      response = self.class.get(route, headers: headers)
      handle_response(response, route)
    end

    def post_source(source)
      route = '/v1/source'
      response = self.class.post(route, headers: headers, body: source.to_json)
      handle_response(response, route)
    end

    def disable_source(source_id)
      route = "/v1/source/#{source_id}/disable"
      response = self.class.delete(route, headers: headers)
      handle_response(response, route)
    end

    def delete_source(source_id)
      route = "/v1/source/#{source_id}"
      response = self.class.delete(route, headers: headers)
      handle_response(response, route)
    end

    private

    def headers
      {
        'Content-Type' => 'application/json',
        'X-Socrata-RequestId' => current_request_id,
        'Cookie' => current_cookies,
        'X-Socrata-Host' => CurrentDomain.cname
      }.compact
    end

    def raise_error(response, path)
      message = "Invalid response from catalog-federator calling #{path}\n" \
                "Response code: #{response.code}\n" \
                "#{response.body.inspect}"
      raise StandardError, message
    end

    def handle_response(response, path)
      raise_error(response, path) unless response.code == 200
      response.parsed_response
    end
  end

  class Client < AbstractClient
    def initialize
      uri = Addressable::URI.parse(APP_CONFIG.catalog_federator_url).to_s
      self.class.base_uri(uri)
    end
  end
end
