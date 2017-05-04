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

  def server_backend
    'catalog_federator'
  end

  def status_key
    case sync_status
      when 'failure' then 'failed'
      else sync_status || 'not_yet'
    end
  end

  def type_key
    'data_json'
  end

  def federate_all?
    sync_policy == 'all'
  end

  def data_connect_all?
    false
  end

  def sync_in_progress?
    sync_status == 'in_progress'
  end
end