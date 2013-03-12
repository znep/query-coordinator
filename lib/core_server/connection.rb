module CoreServer
  class Connection
    cattr_accessor :cache
    cattr_accessor :env
    cattr_accessor :cookie_name

    @@cookie_name = "_core_session_id".freeze

    def initialize(logger = nil, cookies = nil)
      @logger = logger
      @cookies = cookies
      @runtime = 0
      @request_count = {}
      @batching = false
    end

    def batch_request()
      @batching = true
      @batch_queue = []
      yield
      @batching = false
      flush_batch_queue()
    end

    def reset_counters
      {:runtime => reset_runtime, :requests => reset_request_count}
    end

    # Require the caller to tell us to use batching, since we won't
    # return anything when we do
    def get_request(path, custom_headers = {}, use_batching = false, is_anon = false, timeout = 60)
      if @batching && use_batching
        @batch_queue << {:url => path, :requestType => 'GET'}
        nil
      else
        cache_key = "#{CurrentDomain.cname}:#{path}"
        cache_key += ':anon' if is_anon
        result_body = cache.read(cache_key)
        if result_body.nil?
          result_body = generic_request(Net::HTTP::Get.new(path),
                                        nil, custom_headers, is_anon, timeout).body
          cache.write(cache_key, result_body)
        end

        result_body
      end
    end

    def create_request(path, payload = "{}", custom_headers = {}, cache_req = false, use_batching = false,
                      is_anon = false)
      if @batching && use_batching
       @batch_queue << {:url => path, :body => payload, :requestType => 'POST'}
      else
        cache_key = "#{CurrentDomain.cname}:#{path}:#{payload}"
        cache_key += ':anon' if is_anon
        result_body = cache_req ? cache.read(cache_key) : nil
        if result_body.nil?
          result_body = generic_request(Net::HTTP::Post.new(path),
                                        payload, custom_headers, is_anon).body
          cache.write(cache_key, result_body) if cache_req
        end

        result_body
      end
    end

    def update_request(path, payload = "", custom_headers = {})
      if @batching
       @batch_queue << {:url => path, :body => payload, :requestType => 'PUT'}
      else
        generic_request(Net::HTTP::Put.new(path), payload, custom_headers).body
      end
    end

    def delete_request(path, payload = "", custom_headers = {})
      if @batching
         @batch_queue << {:url => path, :body => payload, :requestType => 'DELETE'}
      else
        generic_request(Net::HTTP::Delete.new(path), payload, custom_headers).body
      end
    end

    def multipart_post_file(path, file)
      req = Net::HTTP::Post::Multipart.new path,
        'file' => UploadIO.new(file.tempfile, file.content_type, File.basename(file.original_filename))
      generic_request(req).body
    end

    def post_form(path, fields, custom_headers = {})
      req = Net::HTTP::Post.new(path)
      fieldEntries = []
      fields.each { |key, value|
        fieldEntries << (CGI.escape(key.to_s) + "=" + CGI.escape(value.to_s))
      }
      req.body = fieldEntries.join("&")
      req.content_type = 'application/x-www-form-urlencoded'
      generic_request(req, nil, custom_headers).body
    end

    def log_info(message, ms)
      if @logger && @logger.debug?
        log_output = 'Core server request: %s (%.1fms)' % [message, ms]
        @logger.info(log_output)
      end
    end

  protected
    def log(request)
      # Useful if you want to find out why a request is being made
      # begin
      #   raise Exception.new
      # rescue Exception => ex
      #   Rails.logger.info ex.backtrace.join("\n")
      # end

      if block_given?
        result = nil
        ms = Benchmark.ms { result = yield }
        @runtime += ms
        log_info("#{CurrentDomain.cname}:#{request.path}", ms)
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
    def flush_batch_queue
      if !@batch_queue.empty?
        result = generic_request(Net::HTTP::Post.new('/batches'), {:requests => @batch_queue}.to_json)
        Rails.logger.info("Batch request sent: " + @batch_queue.map{|b| b[:url]}.join(", "))
        results_parsed = JSON.parse(result.body, {:max_nesting => 25})
        if results_parsed.is_a? Array
          results_parsed.each_with_index do |result, i|
            if result['error']
              raise CoreServer::CoreServerError.new(@batch_queue[i][:requestType] +
                " " + @batch_queue[i][:url],
                result['errorCode'], result['errorMessage'], @batch_queue[i][:body])
            end
          end
        else
          raise CoreServer::CoreServerError.new("POST /batches",
            'expected_array_return_value', parsed_body, @batch_queue)
        end
        @batch_queue.clear
      end
      results_parsed
    end

    def generic_request(request, json = nil, custom_headers = {}, is_anon = false, timeout = 60)
      requestor = User.current_user
      if requestor && requestor.session_token
        request['Cookie'] = "#{@@cookie_name}=#{requestor.session_token.to_s}"
      end

      # pass in the server session cookie
      if !@cookies.nil?
        [:socrata_session, :serverid].each do |cookie_to_copy|
          cookie_value = @cookies[cookie_to_copy]
          if !cookie_value.nil?
            request.add_field 'Cookie', "#{cookie_to_copy.to_s}=#{cookie_value}"
          end
        end
      end

      @request_count[Thread.current.object_id] = (@request_count[Thread.current.object_id] || 0) + 1

      # Make anon if requested, unless there's a good reason not to (see allow_anon)
      request['X-Socrata-Auth'] = 'unauthenticated' if is_anon && !(CurrentDomain.feature? :staging_lockdown)

      # pass/spoof in the current domain cname
      request['X-Socrata-Host'] = CurrentDomain.cname

      # proxy user agent
      if @@env.present?
        request['X-User-Agent'] = @@env['HTTP_USER_AGENT']
      else
        Rails.logger.warn("Missing env in CoreServer::Connection")
      end


      custom_headers.each { |key, value| request[key] = value }

      if (!json.blank?)
        request.body = json.to_s
        request.content_type = "application/json"
      end
      result = log(request) do
        Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
          http.read_timeout = timeout
          begin
            http.request(request)
          rescue Timeout::Error
            raise CoreServer::TimeoutError.new(timeout)
          end
        end
      end

      if result.is_a?(Net::HTTPAccepted) # 202
        res_obj = JSON.parse(result.body, {:max_nesting => 30})
        if res_obj.key?('ticket')
          sleep(10)
          return get_request({ticket: res_obj['ticket']}.to_json, custom_headers, false, is_anon)
        else
          while result.is_a?(Net::HTTPAccepted) # 202
            sleep(10)
            result = log(request) do
              Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
                http.read_timeout = timeout
                begin
                  http.request(request)
                rescue Timeout::Error
                  raise CoreServer::TimeoutError.new(timeout)
                end
              end
            end
          end
        end
      end

      raise CoreServer::ResourceNotFound.new(result) if result.is_a?(Net::HTTPNotFound)
      if !result.is_a?(Net::HTTPSuccess)
        parsed_body = JSON.parse(result.body, {:max_nesting => 25})
        Rails.logger.info("Error: " +
                      "#{request.method} #{CORESERVICE_URI.to_s}#{request.path}: " +
                      (parsed_body.nil? ? 'No response' :
                        (parsed_body['code'] || '')) + " : " +
                      (parsed_body.nil? ? 'No response' :
                        (parsed_body['message'] || '')))
        raise CoreServer::CoreServerError.new(
          "#{request.method} #{CORESERVICE_URI.to_s}#{request.path}",
          parsed_body['code'],
          parsed_body['message'],
          json)
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
      count, @request_count = @request_count, {}
      count
    end
  end
end
