module CatalogFederator
  class AbstractClient
    include HTTParty
    include Socrata::RequestIdHelper
    include Socrata::CookieHelper

    def get_sources
      response = self.class.get('/v1/source', headers: headers)
      raise_error('/v1/source', response) unless response.code == 200
      response.parsed_response
    end

    def post_source(source)
      response = self.class.post('/v1/source', headers: headers, body: source.to_json)
      raise_error('/v1/source', response) unless response.code == 200
      response.parsed_response
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

    def raise_error(path, response)
      message = "Invalid response from catalog-federator calling #{path}\n" \
                "Response code: #{response.code}\n" \
                "#{response.body.inspect}"
      raise StandardError, message
    end
  end

  class Client < AbstractClient
    def initialize
      uri = Addressable::URI.parse(APP_CONFIG.catalog_federator_url).to_s
      self.class.base_uri(uri)
    end
  end
end
