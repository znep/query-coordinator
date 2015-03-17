class TileServer < SocrataHttp

  def path(page_id, field_id, zoom, x_coord, y_coord, row_limit, where)
    "tiles/#{page_id}/#{field_id}/#{zoom}/#{x_coord}/#{y_coord}.pbf?$limit=#{row_limit}&$where=#{CGI::escape(where)}"
  end

  def fetch_tile(options)
    issue_request(
      :verb => :get,
      :app_token => options['$$app_token'],
      :request_id => options[:request_id],
      :cookies => options[:cookies],
      :path => path(
        options.fetch(:page_id),
        options.fetch(:field_id),
        options.fetch(:zoom),
        options.fetch(:x_coord),
        options.fetch(:y_coord),
        options.fetch('$limit'),
        options['$where'] || '0=0'
      ),
      :allow_304 => true,
      :headers => options.fetch(:headers, {}),
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
          reason: 'Received error from TileServer which could not be parsed as JSON',
        }
      end
    else
      result[:body] = {
        error: true,
        reason: 'Received error status and unexpected return type from TileServer',
        details: {
          content_type: response.content_type
        }
      }
    end
    result
  end

  def on_success(response, url, verb)
    if tile?(response.content_type)
      result = { status: '200', body: response.body, content_type: response.content_type }
    else
      result = {
        status: '500',
        body: {
          error: true,
          reason: 'Unexpected return type from TileServer',
          details: response.content_type
        }
      }
    end
    result

  end

  def tile?(content_type)
    # TileServer doesn't provide anything more specific at this time.
    content_type == 'application/octet-stream'
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
