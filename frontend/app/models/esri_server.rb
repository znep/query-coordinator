# Represents the outmost datatype of an external federation with esri
# A server represents the main domain that is being federated.
# It has folders, which have services, which have layers
# A federated layer corresponds to a socrata dataset.

class EsriServer
  attr_reader :job, :url, :connected_count, :discovered_count, :id, :sync_type, :last_synced

  def initialize(server_hash)
    @data = server_hash
    @job =  @data['most_recent_job'] # may be nil
    @url = @data['url']
    @discovered_count = @data['layer_count']
    @connected_count = @data['synced_count']
    @id = @data['id']
    @sync_type = @data['sync_type']
    @last_synced = @data['last_synced']
  end

  def server_backend
    'esri_crawler'
  end

  def status_key
    if @job
      case @job['status']
        when 'failure' then 'failed'
        when 'success' then 'success'
        else 'in_progress'
      end
    else
      'in_progress'
    end
  end

  def display_name
    url
  end

  def type_key
    'esri_arcgis'
  end

  def federate_all?
    @sync_type == 'catalog'
  end

  def data_connect_all?
    @sync_type == 'data'
  end

end
