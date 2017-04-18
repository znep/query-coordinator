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
  end
end
