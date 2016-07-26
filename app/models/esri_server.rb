# Represents the outmost datatype of an external federation with esri
# A server represents the main domain that is being federated.
# It has folders, which have services, which have layers
# A federated layer corresponds to a socrata dataset.

class EsriServer
  attr_reader :job, :url, :synced_count, :layer_count, :id, :sync_type, :last_synced

  def initialize(server_hash)
    @data = server_hash
    @job =  @data['most_recent_job'] # may be nil
    @url = @data['url']
    @layer_count = @data['layer_count']
    @synced_count = @data['synced_count']
    @id = @data['id']
    @sync_type = @data['sync_type']
    @last_synced = @data['last_synced']
  end

  def parse_last_synced
    if @last_synced
      Time.parse(@last_synced).to_s(:admin_connectors)
    else
      'Never'
    end
  end

  def status_key
    if @job
      case @job['status']
        when 'failure' then 'failed'
        when 'success' then 'success'
        else 'not_yet'
      end
    else
      'not_yet'
    end
  end

  def federate_all?
    @sync_type == 'catalog'
  end


end
