module DatasetManagementAPI
  class ResourceNotFound < StandardError; end

  class ServerError < StandardError; end

  def self.get(path, cookies)
    cookie_header = cookies.map { |k, v| "#{k}=#{v}" }.join('; ')
    url = "http://#{hostname}:#{port}#{path}"

    response = HTTParty.get(
      url,
      :headers => {
        'X-Socrata-Host' => CurrentDomain.cname,
        'Cookie' => cookie_header
      }
    )

    case response.code
      when 200..299
        Rails.logger.debug("GET #{url} => ...")
        return JSON.parse(response.body)
      when 400..499
        raise(DatasetManagementAPI::ResourceNotFound, response.inspect)
      when 500..599
        raise(DatasetManagementAPI::ServerError, response.inspect)
      else
        raise(response.inspect)
    end
  end

  def self.hostname
    ENV['DATASET_MANAGEMENT_API_HOSTNAME'] || APP_CONFIG.dataset_management_api_hostname
  end

  def self.port
    ENV['DATASET_MANAGEMENT_API_PORT'] || APP_CONFIG.dataset_management_api_port
  end
end
