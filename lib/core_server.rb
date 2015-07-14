require 'retries'

class CoreServer

  def self.get_view(uid, cookie)
    view = nil
    core_server_request_verb = :get
    core_server_request_path = "/views/#{uid}.json"
    core_server_request_error_prefix = "[#{core_server_request_verb.upcase} #{core_server_request_path}] " \
      "CoreServer::get_view(#{uid}) ->"
    core_server_response = nil

    begin

      # The virtue of doing the retry at the outer level is twofold:
      #
      # 1. Retries will potentially be sent to separate instances of
      #    core server since ::ZookeeperDiscovery.get() will sample
      #    from all registered nodes.
      # 2. We can afford to be much less concerned with rescuing
      #    specific errors.
      with_retries(retry_options) do

        core_server_response = core_server_request(
          verb: core_server_request_verb,
          path: core_server_request_path,
          headers: {
            'Content-type' => 'application/json',
            'Cookie' => cookie
          }
        )
      end

      if core_server_response.code.to_i == 200
        view = JSON.parse(core_server_response.body)
      else
        report_error(
          StandardError.new,
          "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
        )
      end

    rescue NoMethodError => no_method_error
      report_error(
        no_method_error,
        "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
      )
    rescue TypeError => type_error
      report_error(
        type_error,
        "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
      )
    rescue JSON::ParserError => parser_error
      report_error(
        parser_error,
        "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
      )
    rescue => unknown_error
      report_error(
        unknown_error,
        "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
      )
    end

    view
  end

  def self.update_view(uid, cookie, view_data)
    updated_view = nil
    core_server_request_verb = :put
    core_server_request_path = "/views/#{uid}.json"
    core_server_request_error_prefix = "[#{core_server_request_verb.upcase} #{core_server_request_path}] " \
      "CoreServer::update_view(#{uid}) ->"
    core_server_response = nil

    begin

      # The virtue of doing the retry at the outer level is twofold:
      #
      # 1. Retries will potentially be sent to separate instances of
      #    core server since ::ZookeeperDiscovery.get() will sample
      #    from all registered nodes.
      # 2. We can afford to be much less concerned with rescuing
      #    specific errors.
      with_retries(retry_options) do

        core_server_response = core_server_request(
          verb: core_server_request_verb,
          path: core_server_request_path,
          headers: {
            'Content-type' => 'application/json',
            'Cookie' => cookie
          },
          body: view_data
        )
      end

      if core_server_response.code.to_i == 200
        updated_view = JSON.parse(core_server_response.body)
      else
        report_error(
          StandardError.new,
          "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
        )
      end

    rescue NoMethodError => no_method_error
      report_error(
        no_method_error,
        "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
      )
    rescue TypeError => type_error
      report_error(
        type_error,
        "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
      )
    rescue JSON::ParserError => parser_error
      report_error(
        parser_error,
        "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
      )
    rescue => unknown_error
      report_error(
        unknown_error,
        "#{core_server_request_error_prefix} '#{core_server_response.inspect}'"
      )
    end

    updated_view
  end

  private

  def self.retry_options
    {
      :max_tries => 3,
      :base_sleep_seconds => 0.1,
      :max_sleep_seconds => 2.0,
      :handler => retry_handler,
      :rescue => retriable_exceptions
    }
  end

  def self.retry_handler
    Proc.new do |exception, attempt_number, total_delay|
      report_error(
        exception,
        "CoreServer::core_server_request(options) with options: " \
        "'#{options.inspect}' failed with retry after #{total_delay.to_s} " \
        "seconds; attempt: #{attempt_number.to_s}"
      )
    end
  end

  def self.retriable_exceptions
    [
      # See: http://tammersaleh.com/posts/rescuing-net-http-exceptions/
      # Out of date, but looks to be still relevant?
      Timeout::Error,
      Errno::EINVAL,
      Errno::ECONNRESET,
      Errno::ECONNREFUSED,
      EOFError,
      Net::HTTPBadResponse,
      Net::HTTPHeaderSyntaxError,
      Net::ProtocolError,
      # The following are not from the blog post but were instead
      # compiled by me.
      Net::HTTPBadGateway,
      Net::HTTPConflict,
      Net::HTTPError,
      Net::HTTPFatalError,
      Net::HTTPGatewayTimeOut,
      Net::HTTPInternalServerError,
      Net::HTTPRequestTimeOut,
      Net::HTTPRetriableError,
      Net::HTTPServerError,
      Net::HTTPServerException,
      Net::HTTPServiceUnavailable
    ]
  end

  def self.core_server_request(options)
    raise ArgumentError.new("':verb' is required.") unless options[:verb].present?
    raise ArgumentError.new("':path' is required.") unless options[:path].present?

    options[:headers] = {} unless options.has_key?(:headers)

    core_server_address = get_core_server_address

    uri = URI.parse("http://#{core_server_address}#{options[:path]}")

    http = Net::HTTP.new(uri.host, uri.port)
    # These timeouts might turn out to be overly-aggressive. We will have
    # to see how it goes.
    http.open_timeout = 5
    http.read_timeout = 5

    core_request = "Net::HTTP::#{options[:verb].to_s.capitalize}".constantize.new(uri.request_uri)

    options[:headers].each { |key, value| core_request[key] = value }

    body = options.fetch(:body, nil)

    if body.present?
      core_request.body = JSON.dump(body)
    end

    http.request(core_request)
  end

  def self.get_core_server_address
    core_server_zookeeper_path = Rails.application.config.zookeeper[:core_server_path]
    instance_id = ::ZookeeperDiscovery.get(core_server_zookeeper_path)

    instance_data = ::ZookeeperDiscovery.get_json("/#{core_server_zookeeper_path}/#{instance_id}")

    "#{instance_data['address']}:#{instance_data['port']}"
  end

  def self.report_error(error, message)
    Rails.logger.error(
      "#{error.class}: #{error} (on #{message}):\n\n#{error.backtrace}"
    )
    Airbrake.notify_or_ignore(
      error,
      error_message: message
    )
  end

end
