# Represents a catalog-federator source, which serves to create
# socrata assets (as external links) from a non-socrata data.json catalog

class CatalogFederatorSource
  attr_reader :id, :url, :display_name, :sync_policy, :sync_status, :discovered_count, :connected_count, :last_synced

  def initialize(source)
    @data = source
    @id = @data['id']
    @url = @data['source']
    @display_name = @data['displayName']
    @sync_policy = @data['syncSelectionPolicy']
    @sync_status = @data['syncStatus']
    @discovered_count = @data['syncDiscoveryCount'] || 0
    @connected_count = @data['syncConnectedCount'] || 0
    @last_synced = @data['syncEnded']
  end

  def backend
    'catalog-federator'
  end

  def status_key
    sync_status || 'not_yet'
  end

  def federate_all?
    sync_policy == 'all'
  end

  def data_connect_all?
    false
  end
end
