module ImportStatusService
  class ResourceNotFound < StandardError; end

  class ServerError < StandardError; end

  def self.get(path)
    response = HTTParty.get(
      "http://#{hostname}:#{port}#{path}",
      :headers => {
        'X-Socrata-Host' => CurrentDomain.cname
      }
    )

    case response.code
      when 200..299
        return JSON.parse(response.body)
      when 400..499
        raise(ImportStatusService::ResourceNotFound, response.inspect)
      when 500..599
        raise(ImportStatusService::ServerError, response.inspect)
      else
        raise(response.inspect)
    end
  end

  def self.hostname
    ENV['IMPORT_STATUS_SERVICE_HOSTNAME'] || APP_CONFIG.import_status_service_hostname
  end

  def self.port
    ENV['IMPORT_STATUS_SERVICE_PORT'] || APP_CONFIG.import_status_service_port
  end
end
