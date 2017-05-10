class CatalogFederatorConnector
  include DataConnectorHelper

  class << self
    def client
      @cf_client ||= CatalogFederator::Client.new
    end

    def servers
      client.get_sources.map { |source| CatalogFederatorSource.new(source) }
    end

    def create(source_form)
      client.create_source(
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
