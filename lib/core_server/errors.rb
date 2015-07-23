module CoreServer
  # A base class for errors working with the core server. Generally, we'll
  # raise a subclass of this exception.
  class Error < RuntimeError; end

  # Generic error class for legacy code.
  # This is the error class from our early forays into retrieving data from the
  # core server - while it has a bit of logic to parse out an error response
  # from the core server, it's not particularly granular in terms of what we can
  # catch. New code should favor the other error classes, if possible.
  class CoreServerError < Error
    attr_reader :source, :error_code, :error_message, :payload

    def initialize(source, error_code, error_message, payload = nil)
      @source = source
      @error_code = error_code
      @error_message = error_message
      @payload = payload
    end

    def to_s
      "Failed at #{source} with code #{error_code} #{error_message}"
    end
  end

  # Helper class for development/test - we keep track of the total number of
  # requests made to the core server in a give request/response cycle to the
  # client. If we make too many requests, it's a sign that we're not designing
  # our API correctly - so we throw an exception to make it blatantly obvious
  # that you're doing something wrong.
  class TooManyRequests < Error
    def initialize(controller, action_name, requests)
      @controller, = controller.class.name
      @action_name = action_name
      @requests = requests
    end

    def to_s
      "Too many requests (#{@requests}) to the core server in a client request for #{@controller}::#{@action_name}"
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

  class TimeoutError < StandardError
    def initialize(timeout, message = nil)
      @message = message
      @timeout = timeout
    end

    def to_s
      "Timed out after #{@timeout} seconds #{@message}"
    end
  end

  class ResourceNotFound < ConnectionError; end
end
