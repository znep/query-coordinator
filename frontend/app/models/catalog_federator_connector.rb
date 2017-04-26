class CatalogFederatorConnector
  include DataConnectorHelper

  class << self
    def client
      @cf_client ||= CatalogFederator::Client.new
    end

    def servers
      begin
        client.get_sources.map { |source| CatalogFederatorSource.new(source) }
      rescue StandardError => ex
        Rails.logger.error("Error getting sources from catalog-federtor: #{ex}")
        []
      end
    end

    def create(source_form)
      client.post_source(
        'source' => source_form.fetch('source_url'),
        'sourceType' => 'open_data_metadata_v1_1',
        'displayName' => source_form.fetch('display_name')
      )
    end

    def delete(source_id)
      client.disable_source(source_id)
      client.delete_source(source_id)
    end
  end
end
