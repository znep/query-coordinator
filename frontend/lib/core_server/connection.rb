module CoreServer

  class Connection

    cattr_accessor :cache
    cattr_accessor :env

    COOKIE_NAME = '_core_session_id'
    @@current_batch_id = 0

    def initialize(logger = nil, cookies = nil)
      @logger = logger
      @cookies = cookies
      @runtime = 0
      @request_count = {}
      @batch_queue = {}
    end

    def batch_request
      next_batch_id = @@current_batch_id += 1
      @batch_queue[next_batch_id] = []
      yield next_batch_id
      flush_batch_queue(next_batch_id)
    end

    def reset_counters
      { :runtime => reset_runtime, :requests => reset_request_count }
    end

    def get(path:, batch_id:nil, is_anon:false, timeout:60, **headers)
      get_request(path, headers.with_indifferent_access, batch_id, is_anon, timeout)
    end

    # Require the caller to tell us to use batching, since we won't return anything when we do
    def get_request(path, custom_headers = {}, batch_id = nil, is_anon = false, timeout = 60)
      custom_headers = custom_headers.to_h
      # batch_id must be both non-nil and neither true/false for legacy reasons
      if batch_id.present? && [true, false].none?(&batch_id.method(:==))
        @batch_queue[batch_id] << { :url => path, :requestType => 'GET' }
        return nil
      end

      cache_key = "#{CurrentDomain.cname}:#{path}:#{custom_headers}"
      cache_key << ':anon' if is_anon
      cache.fetch(cache_key) do
        # generic_request(Net::HTTP::Get.new(path), nil, custom_headers, is_anon, timeout).body
        make_request(Net::HTTP::Get.new(path), custom_headers.symbolize_keys).body
      end
    end

    def create(path:, payload:'{}', batch_id:nil, is_anon:false, timeout:60, use_cache:false, **headers)
      create_request(path, payload, headers, use_cache, batch_id, is_anon, timeout)
    end

    def create_request(path, *args)
      payload, custom_headers, use_cache, batch_id, is_anon, timeout = args # use_cache no longer used
      payload ||= '{}'
      (custom_headers ||= {}).symbolize_keys!
      is_anon ||= false
      timeout ||= 60

      # Check true/false for legacy
      if batch_id.present? && [true, false].none?(&batch_id.method(:==))
        @batch_queue[batch_id] << { :url => path, :body => payload, :requestType => 'POST' }
        return
      end

      generic_request(Net::HTTP::Post.new(path), payload, custom_headers, is_anon, timeout).body
    end

    def update(path:, payload:'', batch_id:nil, **headers)
      update_request(path, payload, headers.with_indifferent_access, batch_id)
    end

    def update_request(path, payload = '', custom_headers = {}, batch_id = nil)
      if batch_id
       @batch_queue[batch_id] << {:url => path, :body => payload, :requestType => 'PUT'}
      else
        generic_request(Net::HTTP::Put.new(path), payload, custom_headers).body
      end
    end

    def patch(path:, payload:'', batch_id:nil, **headers)
      patch_request(path, payload, headers.with_indifferent_access, batch_id)
    end

    def patch_request(path, payload = '', custom_headers = {}, batch_id = nil)
      if batch_id
       @batch_queue[batch_id] << {:url => path, :body => payload, :requestType => 'PATCH'}
      else
        generic_request(Net::HTTP::Patch.new(path), payload, custom_headers).body
      end
    end

    def delete(path:, payload:'', batch_id:nil, **headers)
      delete_request(path, payload, headers.with_indifferent_access, batch_id)
    end

    def delete_request(path, payload = '', custom_headers = {}, batch_id = nil)
      if batch_id
        @batch_queue[batch_id] << {:url => path, :body => payload, :requestType => 'DELETE'}
      else
        generic_request(Net::HTTP::Delete.new(path), payload, custom_headers).body
      end
    end

    def multipart_post_file(path, file)
      request = Net::HTTP::Post::Multipart.new(
        path,
        'file' => UploadIO.new(file.tempfile, file.content_type, File.basename(file.original_filename))
      )
      generic_request(request).body
    end

    def post_form(path, fields, custom_headers = {})
      request = Net::HTTP::Post.new(path)
      fieldEntries = []
      fields.each do |key, value|
        fieldEntries << "#{CGI.escape(key.to_s)}=#{CGI.escape(value.to_s)}"
      end
      request.body = fieldEntries.join('&')
      request.content_type = 'application/x-www-form-urlencoded'
      generic_request(request, nil, custom_headers).body
    end

    def log_info(message, ms)
      if @logger && @logger.debug?
        log_output = 'Core server request: %s (%.1fms)' % [message, ms]
        @logger.info(log_output)
      end
    end

    protected

    def log(request)
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

    def flush_batch_queue(batch_id)
      if !@batch_queue[batch_id].empty?
        batches = @batch_queue[batch_id]
        @batch_queue.delete(batch_id)
        result = generic_request(Net::HTTP::Post.new('/batches'), { :requests => batches }.to_json)
        results_parsed = JSONWithAirbrake.parse(result.body, :max_nesting => 25, :request => batches)
        if results_parsed.is_a?(Array)
          results_parsed.each_with_index do |result, i|
            if result['error']
              raise CoreServer::CoreServerError.new(
                batches[i][:requestType] + ' ' + batches[i][:url],
                result['errorCode'],
                result['errorMessage'],
                batches[i][:body]
              )
            end
          end
        else
          raise CoreServer::CoreServerError.new(
            'POST /batches',
            'expected_array_return_value',
            parsed_body,
            batches
          )
        end
      end
      results_parsed
    end

    def make_request(request, json:nil, is_anon:false, timeout:60, **headers)
      generic_request(request, json, headers.with_indifferent_access, is_anon, timeout)
    end

    def generic_request(request, json = nil, custom_headers = {}, is_anon = false, timeout = 60)
      custom_headers = custom_headers.to_h
      requestor = User.current_user
      if requestor && requestor.session_token
        request['Cookie'] = "#{COOKIE_NAME}=#{requestor.session_token}"
      end

      # pass in the server session cookie
      if @cookies
        [:socrata_session, :serverid].each do |cookie_to_copy|
          cookie_value = @cookies[cookie_to_copy]
          if cookie_value
            request.add_field 'Cookie', "#{cookie_to_copy}=#{cookie_value}"
          end
        end
      end

      @request_count[Thread.current.object_id] = @request_count[Thread.current.object_id].to_i + 1

      # Make anon if requested, unless there's a good reason not to (see allow_anon)
      request['X-Socrata-Auth'] = 'unauthenticated' if is_anon && !(CurrentDomain.feature?(:staging_lockdown))

      # pass/spoof in the current domain cname
      request['X-Socrata-Host'] = CurrentDomain.cname

      # attach request id, user agent, and client IPs
      if @@env.present?
        request['X-Socrata-RequestId'] = @@env['action_dispatch.request_id'].to_s.gsub('-', '')
        request['X-User-Agent'] = @@env['HTTP_USER_AGENT']

        # NOTE: Forwarded is the standardized header, but not all software makes use of it yet.
        # We use the standardized header here because Core overloads the X-Forwarded-For header
        # to determine whether a request is considered local (see EN-13219).
        request['Forwarded'] = @@env['HTTP_FORWARDED'] || @@env['HTTP_X_FORWARDED_FOR'] || @@env['REMOTE_ADDR'] || '-'
      else
        Rails.logger.warn('Missing env in CoreServer::Connection')
      end

      custom_headers.each { |key, value| request[key] = value }

      if json.present?
        request.body = json.to_s
        request.content_type = 'application/json'
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
        parsed_json = JSONWithAirbrake.parse(result.body, :max_nesting => 30, :request => request)
        if parsed_json.key?('ticket')
          sleep(10)
          return get_request({ticket: parsed_json['ticket']}.to_json, custom_headers, false, is_anon)
        end

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

      raise CoreServer::ResourceNotFound.new(result) if result.is_a?(Net::HTTPNotFound)

      unless result.is_a?(Net::HTTPSuccess)
        parsed_body = JSONWithAirbrake.parse(result.body, :max_nesting => 25, :request => request)

        Rails.logger.info(
          "Error: #{request.method} #{CORESERVICE_URI}#{request.path}: " +
          (parsed_body.nil? ? 'No response' : (parsed_body['code'] || '')) + ' : ' +
          (parsed_body.nil? ? 'No response' : (parsed_body['message'] || ''))
        )
        raise CoreServer::CoreServerError.new(
          "#{request.method} #{CORESERVICE_URI}#{request.path}",
          parsed_body['code'],
          parsed_body['message'],
          json
        )
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
