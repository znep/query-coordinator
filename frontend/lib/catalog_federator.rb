module CatalogFederator

  class AbstractClient

    include HTTParty
    include Socrata::RequestIdHelper
    include Socrata::CookieHelper

    def get_sources
      route = '/v1/source'
      handle_response(self.class.get(route, headers: headers), route)
    end

    def post_source(source)
      route = '/v1/source'
      handle_response(self.class.post(route, headers: headers, body: source.to_json), route)
    end

    def get_datasets(source_id, concise = true)
      route = "/v1/source/#{source_id}/preprocess?concise=#{concise}"
      handle_response(self.class.get(route, headers: headers), route, 'datasets')
    end

    def disable_source(source_id)
      route = "/v1/source/#{source_id}/disable"
      handle_response(self.class.delete(route, headers: headers), route)
    end

    def delete_source(source_id)
      route = "/v1/source/#{source_id}"
      handle_response(self.class.delete(route, headers: headers), route)
    end

    def update_source(source_id, source)
      Rails.logger.debug("source.to_json = #{source.to_json}")
      route = "/v1/source/#{source_id}/make-it-so"
      handle_response(self.class.patch(route, headers: headers, body: source.to_json), route)
    end

    def sync_source(source_id)
      route = "/v1/source/#{source_id}/sync"
      handle_response(self.class.put(route, headers: headers), route)
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

    def handle_response(response, path, key = nil)
      raise_error(response, path) unless response.code == 200
      key ? response.parsed_response[key] : response.parsed_response
    end

  end

  class Client < AbstractClient
    def initialize
      self.class.base_uri(Addressable::URI.parse(APP_CONFIG.catalog_federator_url).to_s)
    end
  end

end
