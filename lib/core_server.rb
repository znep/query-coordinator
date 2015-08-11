require 'retries'
require 'addressable/uri'

class CoreServer

  def self.get_view(uid, headers)
    view_request(uid: uid, verb: :get, headers: headers)
  end

  def self.update_view(uid, headers, view_data)
    view_request(uid: uid, verb: :put, headers: headers, data: view_data)
  end

  def self.current_user(headers)
    core_server_request_options = {
      verb: :get,
      path: '/users/current.json',
      headers: headers.merge('Content-type' => 'application/json')
    }

    core_server_request_with_retries(core_server_request_options)
  end

  # Generate Cookie and X-Socrata-Host headers from the given request.
  def self.headers_from_request(request)
    authentication_cookie = request.env['HTTP_COOKIE']

    {
      'Cookie' => authentication_cookie,
      'X-Socrata-Host' => request.host
    }
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
      if attempt_number === 3
        AirbrakeNotifier.report_error(
          exception,
          "CoreServer::core_server_request() failed with 3 retries after #{total_delay.to_s} seconds."
        )
      end
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

  def self.view_request(options)
    raise ArgumentError("':uid' is required.") unless options.key?(:uid)
    raise ArgumentError("':verb' is required.") unless options.key?(:verb)
    raise ArgumentError("':headers' is required.") unless options.key?(:headers)

    verb = options[:verb]
    path = "/views/#{options[:uid]}.json"

    core_server_request_options = {
      verb: verb,
      path: path,
      headers: options[:headers].merge(
        'Content-type' => 'application/json'
      )
    }

    if options[:data].present?
      core_server_request_options[:body] = options[:data]
    end

    core_server_request_with_retries(core_server_request_options)
  end

  def self.core_server_request_with_retries(request_options)
    core_server_response = nil
    json_response = nil

    begin

      with_retries(retry_options) do
        core_server_response = core_server_http_request(request_options)
      end

      status_code = core_server_response.code.to_i
      response_body = core_server_response.body

      if status_code == 200
        json_response = JSON.parse(response_body)
      end

    rescue => error
      error_message = "[#{request_options[:verb].upcase} #{request_options[:path]}"
      error_message << " - HTTP #{status_code}" unless status_code.blank?
      error_message << " - '#{response_body.inspect}'" unless response_body.blank?

      AirbrakeNotifier.report_error(error, error_message)
    end

    json_response
  end

  def self.core_server_http_request(options)
    raise ArgumentError.new("':verb' is required.") unless options[:verb].present?
    raise ArgumentError.new("':path' is required.") unless options[:path].present?

    options[:headers] = {} unless options.has_key?(:headers)

    unless Rails.application.config.core_service_app_token.blank?
      options[:headers]['X-App-Token'] = Rails.application.config.core_service_app_token
    end

    core_server_address = Rails.application.config.core_service_uri

    uri = Addressable::URI.parse("#{core_server_address}#{options[:path]}")

    http = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = Rails.application.config.core_service_request_open_timeout
    http.read_timeout = Rails.application.config.core_service_request_read_timeout

    core_request = "Net::HTTP::#{options[:verb].to_s.capitalize}".constantize.new(uri.request_uri)

    options[:headers].each { |key, value| core_request[key] = value }

    body = options.fetch(:body, nil)

    if body.present?
      core_request.body = JSON.dump(body)
    end

    http.request(core_request)
  end

end
