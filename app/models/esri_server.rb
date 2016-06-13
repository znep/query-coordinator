# Represents the outmost datatype of an external federation with esri
# A server represents the main domain that is being federated.
# It has folders, which have services, which have layers
# A federated layer corresponds to a socrata dataset.

class EsriServer
  attr_reader :job, :url, :synced_count, :layer_count, :id, :sync_type

  def initialize(server_hash)
    @data = server_hash
    @job =  @data['most_recent_job'] # may be nil
    @url = @data['url']
    @layer_count = @data['layer_count']
    @synced_count = @data['synced_count']
    @id = @data['id']
    @sync_type = @data['sync_type']
  end

 # TODO: move this to a named time presentation
 # in config/initializers/time_formats.rb, when that file becomes available
  def last_synced
    if @job && @job['ended_at']
      time = Time.parse(@job['ended_at'])
      time.strftime('%d %b %Y %H:%M %Z')
    end
  end

  def status_key
    if @job
      case @job['status']
        when 'failure' then 'failing'
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
