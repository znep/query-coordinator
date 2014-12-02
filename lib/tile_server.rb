class TileServer < SocrataHttp

  def path(page_id, field_id, zoom, x_coord, y_coord, row_limit)
    "tiles/#{page_id}/#{field_id}/#{zoom}/#{x_coord}/#{y_coord}.pbf?$limit=#{row_limit}"
  end

  def fetch_tile(page_id, field_id, zoom, x_coord, y_coord, options = {})
    issue_request(
      :verb => :get,
      :request_id => options[:request_id],
      :cookies => options[:cookies],
      :path => path(page_id, field_id, zoom, x_coord, y_coord, options[:row_limit])
    )
  end


  def on_failure(response, url, verb)
    result = { status: response.code, content_type: 'application/json' }

    if json?(response.content_type)
      begin
        result[:body] = JSON.parse(response.body) if response.body.present?

        Rails.logger.debug("#{verb.upcase} at #{url} - TileServer service returned error")

      rescue JSON::ParserError => error
        Rails.logger.error("#{verb.upcase} at #{url} failed with error: #{error}")
        result[:body] = {
          error: true,
          reason: 'Received error from image service'
        }
      end
    else
      result[:body] = {
        error: true,
        reason: 'Received error status and unexpected return type from image service'
      }
    end
    result
  end

  def on_success(response, url, verb)
    if image?(response.content_type)
      result = { status: '200', body: response.body, content_type: response.content_type }
    else
      result = {
        status: '500',
        body: {
          error: true,
          reason: 'Unexpected return type from image service'
        }
      }
    end
    result

  end

  def image?(content_type)
    content_type =~ /^image\/.*$/
    true
  end

  def json?(content_type)
    content_type == 'application/json'
  end

  def connection_details
    {
      port: ENV['TILESERVER_PORT'] || APP_CONFIG['tileserver_port'],
      address: ENV['TILESERVER_HOSTNAME'] || APP_CONFIG['tileserver_hostname']
    }.with_indifferent_access
  end

end
