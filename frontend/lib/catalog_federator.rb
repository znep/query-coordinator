class CatalogFederator

  class << self
    def client
      @client ||= Client.new
    end
  end

  class AbstractClient

    include HTTParty
    include Socrata::RequestIdHelper
    include Socrata::CookieHelper

    delegate :base_uri, :delete, :get, :patch, :post, :put, :to => self

    def get_sources
      handle_response(get(route, headers: headers), route)
    end

    def create_source(source)
      handle_response(post(route, headers: headers, body: source.to_json), route)
    end

    def get_datasets(source_id, concise: true)
      handle_response(
        get(route(source_id, "preprocess?concise=#{concise}"), headers: headers),
        route(source_id, "preprocess?concise=#{concise}"),
        'datasets'
      )
    end

    def set_sync_policy(source_id, sync_policy)
      handle_response(
        put(route(source_id), headers: headers, body: {:syncSelectionPolicy => sync_policy}.to_json),
        route(source_id)
      )
    end

    def disable_source(source_id)
      handle_response(delete(route(source_id, 'disable'), headers: headers), route(source_id, 'disable'))
    end

    def delete_source(source_id)
      handle_response(delete(route(source_id), headers: headers), route(source_id))
    end

    # Synchronous call - large number of datasets can take a long time.
    def sync_datasets(source_id, datasets)
      handle_response(
        patch(route(source_id, 'make-it-so'), headers: headers, body: datasets.to_json),
        route(source_id, 'make-it-so')
      )
    end

    # Asynchronous call - just puts a message on a queue to sync previous selections
    def sync_source(source_id)
      handle_response(put(route(source_id, 'sync'), headers: headers), route(source_id, 'sync'))
    end

    private

    def route(id = nil, action = nil)
      "/v1/source#{"/#{id}" if id}#{"/#{action}" if action}"
    end

    def headers
      {
        'Content-Type' => 'application/json',
        'X-Socrata-RequestId' => current_request_id,
        'Cookie' => current_cookies,
        'X-Socrata-Host' => CurrentDomain.cname
      }.compact
    end

    def raise_error(response, route)
      message = <<~EOM
        Invalid response from catalog-federator calling #{route}
        Response code: #{response.code}
        #{response.body.inspect}
      EOM
      raise StandardError, message
    end

    def handle_response(response, route, key = nil)
      raise_error(response, route) unless response.code == 200
      key ? response.parsed_response[key] : response.parsed_response
    end

  end

  class Client < AbstractClient
    def initialize
      base_uri(Addressable::URI.parse(APP_CONFIG.catalog_federator_url).to_s)
    end
  end

end
