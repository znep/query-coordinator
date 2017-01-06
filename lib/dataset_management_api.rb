module DatasetManagementAPI
  class ResourceNotFound < StandardError; end

  class ServerError < StandardError; end

  def self.get_update(view_uid, update_seq, cookies)
    get("/api/update/#{view_uid}/#{update_seq}", cookies)['resource']
  end

  def self.get_uploads_index(view_uid, update_seq, cookies)
    get("/api/update/#{view_uid}/#{update_seq}/upload", cookies)
  end

  def self.get_upload(view_uid, update_seq, upload_id, cookies)
    path = "/api/update/#{view_uid}/#{update_seq}/upload/#{upload_id}"
    get(path, cookies)['resource']
  end

  def self.get_websocket_token(view_uid, cookies)
    get("/api/update/#{view_uid}/token", cookies)['token']
  end

  private

  def self.get(path, cookies)
    cookie_header = cookies.map { |k, v| "#{k}=#{v}" }.join('; ')
    url = "http://#{hostname}:#{port}#{path}"

    response = nil
    ms = Benchmark.ms do
      response = HTTParty.get(
        url,
        :headers => {
          'X-Socrata-Host' => CurrentDomain.cname,
          'Cookie' => cookie_header
        }
      )
    end

    case response.code
      when 200..299
        Rails.logger.debug('DSMAPI request: %s (%.1fms)' % [path, ms])
        return JSON.parse(response.body)
      when 400..499
        raise(DatasetManagementAPI::ResourceNotFound, response.inspect)
      when 500..599
        raise(DatasetManagementAPI::ServerError, response.inspect)
      else
        raise(response.inspect)
    end
  end

  ## Config

  def self.hostname
    ENV['DATASET_MANAGEMENT_API_HOSTNAME'] || APP_CONFIG.dataset_management_api_hostname
  end

  def self.port
    ENV['DATASET_MANAGEMENT_API_PORT'] || APP_CONFIG.dataset_management_api_port
  end
end
