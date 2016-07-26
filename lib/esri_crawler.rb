# Use this module to make requests to the socrata esri_crawler_http service
require 'securerandom'

module EsriCrawler
  include HTTParty

  def self.hostname
    ENV['ESRI_CRAWLER_HOSTNAME'] || APP_CONFIG.esri_crawler_hostname
  end

  def self.port
    ENV['ESRI_CRAWLER_PORT'] || APP_CONFIG.esri_crawler_port
  end

  class ServerError < StandardError
    attr_reader :body

    def initialize(body)
      super(body["error"])
      @body = body
    end
  end

  class ResourceNotFound < ServerError; end
  class BadRequest < ServerError; end

  def self.get_request(path, query = {})
    execute do
      EsriCrawler.get(path, :query => query)
    end
  end

  def self.post_request(path, body = {})
    execute do
      EsriCrawler.post(path, :body => body.to_json)
    end
  end

  def self.patch_request(path, body = {})
    execute do
      EsriCrawler.patch(path, :body => body.to_json)
    end
  end

  def self.delete_request(path)
    execute do
      EsriCrawler.delete(path)
    end
  end

  private

  def self.execute
    begin
      base_uri "#{hostname}:#{port}"
      default_options.update(headers: {
        'X-Socrata-Host' => CurrentDomain.cname,
        'X-Socrata-RequestId' => SecureRandom.uuid,
        'X-Socrata-User' => User.current_user.email
      })
      response = yield
      case response.code
        when 200..299
          return JSON.parse(response.body)
        when 400
          raise EsriCrawler::BadRequest.new(parse_error(response.body))
        when 401..499
          raise EsriCrawler::ResourceNotFound.new(parse_error(response.body))
        when 500..599
          raise EsriCrawler::ServerError.new(parse_error(response.body))
        else
          raise RuntimeError(response.inspect)
        end
    end
  end

  def self.parse_error(body)
    begin
      JSON.parse(body)
    rescue JSON::ParserError, TypeError
      {"error" => body.to_s}
    end
  end

end
