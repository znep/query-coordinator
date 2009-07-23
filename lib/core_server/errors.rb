module CoreServer
  class CoreServerError < RuntimeError
    attr_reader :source, :error_code, :error_message

    def initialize(source, error_code, error_message)
      @source = source
      @error_code = error_code
      @error_message = error_message
    end

    def to_s
      "Failed at #{source} with code #{error_code} #{error_message}"
    end
  end
  
  class ConnectionError < StandardError
    attr_reader :response

    def initialize(response, message = nil)
      @response = response
      @message = message
    end

    def to_s
      "Failed with #{response.code} #{@message}"
    end
  end

  class ResourceNotFound < ConnectionError; end
end
