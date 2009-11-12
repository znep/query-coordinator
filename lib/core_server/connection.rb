module CoreServer
  class Connection
    cattr_accessor :cache

    def initialize(logger = nil, cookies = nil)
      @logger = logger
      @cookies = cookies
      @runtime = 0
      @request_count = 0
    end

    def reset_counters
      {:runtime => reset_runtime, :requests => reset_request_count}
    end

    def get_request(path, custom_headers = {})
      result_body = cache.read(path)
      if result_body.nil?
        result_body = generic_request(Net::HTTP::Get.new(path),
                                      nil, custom_headers).body
        cache.write(path, result_body)
      end

      result_body
    end

    def create_request(path, payload = "{}")
      generic_request(Net::HTTP::Post.new(path), payload).body
    end

    def update_request(path, payload = "")
      generic_request(Net::HTTP::Put.new(path), payload).body
    end

    def delete_request(path, payload = "")
      generic_request(Net::HTTP::Delete.new(path), payload).body
    end

    def multipart_post_file(path, file)
      req = Net::HTTP::Post::Multipart.new path,
        'file' => UploadIO.new(file, file.content_type, File.basename(file.original_path))
      generic_request(req).body
    end
    
    # For creating tweetsets only
    def create_tweetset(query, name, follow = true)
      request = Net::HTTP::Post.new('/views.json')
      request.basic_auth APP_CONFIG['tweetsets_user'], APP_CONFIG['tweetsets_password']
      
      request.body = {
        :name => name, :tags => ['tweetset', query],
        :flags => ['dataPublic']
        }.to_json
      request.content_type = "application/json"


      @request_count += 1
      
      result = log(request) do
        Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
          http.request(request)
        end
      end
      
      # DEBUG
      RAILS_DEFAULT_LOGGER.error "Result from core create: #{result.body.inspect}"
      raise CoreServer::ResourceNotFound.new(result) if result.is_a?(Net::HTTPNotFound)
      
      json = JSON.parse(result.body) unless result.nil?
      json['id']
    end

    def log_info(message, ms)
      if @logger && @logger.debug?
        log_output = 'Core server request: %s (%.1fms)' % [message, ms]
        @logger.debug(log_output)
      end
    end

  protected
    def log(request)
      if block_given?
        result = nil
        ms = Benchmark.ms { result = yield }
        @runtime += ms
        log_info(request.path, ms)
        result
      else
        log_info(request.path, 0)
        nil
      end
    rescue Exception => e
      message = "#{e.class.name}: #{e.message}: #{request.path}"
      log_info(message, 0)
      raise e
    end

  private
    def generic_request(request, json = nil, custom_headers = {})
      requestor = User.current_user
      if requestor && requestor.session_token
        request['Cookie'] = "_blist_session_id=#{requestor.session_token.to_s}"
      end

      # pass in the server session cookie
      if !@cookies.nil?
        server_session_cookie = @cookies[:socrata_session]
        if !server_session_cookie.nil?
          request.add_field 'Cookie', "socrata_session=#{server_session_cookie}"
        end
      end

      custom_headers.each { |key, value| request[key] = value }

      if (!json.blank?)
        request.body = json
        request.content_type = "application/json"
      end

      @request_count += 1
      result = log(request) do
        Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
          http.request(request)
        end
      end

      raise CoreServer::ResourceNotFound.new(result) if result.is_a?(Net::HTTPNotFound)
      if !result.is_a?(Net::HTTPSuccess)
        parsed_body = JSON.parse(result.body)
        Rails.logger.info("Error: " +
                      "#{request.method} #{CORESERVICE_URI.to_s}#{request.path}: " +
                      (parsed_body.nil? ? 'No response' :
                        (parsed_body['code'] || '')) + " : " +
                      (parsed_body.nil? ? 'No response' :
                        (parsed_body['message'] || '')))
        raise CoreServer::CoreServerError.new(
          "#{request.method} #{CORESERVICE_URI.to_s}#{request.path}",
          parsed_body['code'],
          parsed_body['message'])
      end

      result
    end

    def cache
      @@cache ||= ActiveSupport::Cache::RequestStore.new
    end

    def reset_runtime
      rt, @runtime = @runtime, 0
      rt
    end

    def reset_request_count
      count, @request_count = @request_count, 0
      count
    end
  end
end
