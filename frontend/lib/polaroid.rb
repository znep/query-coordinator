class Polaroid < SocrataHttp

  def fetch_image(vif, options)
    issue_request(
      :verb => :post,
      :data => {
        :vif => vif
      },
      :headers => {
        'Content-Type' => 'application/json'
      },
      :request_id => options[:request_id],
      :cookies => options[:cookies],
      :path => 'vif.png'
    )
  end


  def on_failure(response, url, verb)
    result = { status: response.code.to_s, content_type: 'application/json' }

    if json?(response.content_type)
      begin
        result[:body] = JSON.parse(response.body) if response.body.present?

        Rails.logger.debug("#{verb.upcase} at #{url} - Polaroid service returned error")

      rescue JSON::ParserError => error
        Rails.logger.error("#{verb.upcase} at #{url} failed with error: #{error}")
        result[:body] = {
          error: true,
          reason: 'Received error from image service which could not be parsed as JSON',
        }
      end
    else
      result[:body] = {
        error: true,
        reason: 'Received error status and unexpected return type from image service',
        details: {
          content_type: response.content_type
        }
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
          reason: 'Unexpected return type from image service',
          details: response.content_type
        }
      }
    end
    result

  end

  def image?(content_type)
    content_type =~ /^image\/.*$/
  end

  def json?(content_type)
    content_type == 'application/json'
  end

  def connection_details
    {
      port: ENV['POLAROID_PORT'] || APP_CONFIG.polaroid_port,
      address: ENV['POLAROID_HOSTNAME'] || APP_CONFIG.polaroid_hostname
    }.with_indifferent_access
  end

end