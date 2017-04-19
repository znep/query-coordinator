class CatalogFederatorConnector
  include DataConnectorHelper

  class << self
    def client
      @cf_client ||= CatalogFederator::Client.new
    end

    def servers
      begin
        sources = client.get_sources
        sources.map { |source| CatalogFederatorSource.new(source) }
      rescue StandardError => ex
        Rails.logger.error("Error getting sources from catalog-federtor: #{ex}")
        []
      end
    end

    def create(source_form)
      source = {
        'source' => source_form['source_url'],
        'sourceType' => 'open_data_metadata_v1_1',
        'displayName' => source_form['display_name']
      }
      client.post_source(source)
    end
  end
end
