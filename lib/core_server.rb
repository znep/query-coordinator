require 'retries'
require 'addressable/uri'
require 'request_store'

class CoreServer

  def self.get_view(uid)
    view_request(uid: uid, verb: :get)
  end

  def self.update_view(uid, view_data, query_params = nil)
    view_request(uid: uid, verb: :put, data: view_data, query_params: query_params)
  end

  def self.create_view(title, query_params = nil)
    view_request(verb: :post, data: view_with_title(title), query_params: query_params)
  end

  def self.update_permissions(uid, query_params)
    permissions_request(uid: uid, verb: :put, query_params: query_params)
  end

  def self.current_user
    core_server_request_with_retries(verb: :get, path: '/users/current.json')
  end

  def self.current_domain
    core_server_request_with_retries(verb: :get, path: '/domains')
  end

  # Gets the configuration based on id
  def self.get_configuration(id)
    configuration_request(id: id, verb: :get)
  end

  def self.create_or_update_configuration(id, configuration_data)
    configuration_request(id: id, verb: :post, data: configuration_data)
  end

  def self.delete_configuration(id)
    configuration_request(id: id, verb: :delete)
  end

  def self.story_themes
    configurations_request(verb: :get, type: 'story_theme', default_only: false, merge: false)
  end

  def self.current_user_authorization(user, uid)
    if user.present? && uid.present?
      view = CoreServer.get_view(uid)

      if view.present?
        corresponding_grant = lambda { |grant| grant['userId'] == user['id'] }
        is_primary_owner = view['owner']['id'] == user['id']
        has_user_grant = view['grants'].present? && view['grants'].one?(&corresponding_grant)

        if is_primary_owner
          {
            'role' => 'owner',
            'rights' => view['rights'],
            'primary' => true
          }
        elsif has_user_grant
          {
            'role' => view['grants'].find(&corresponding_grant)['type'],
            'rights' => view['rights']
          }
        else
          {
            'role' => 'unknown',
            'rights' => view['rights']
          }
        end
      end
    end
  end

  # Generate Cookie, X-CSRF-Token, X-Socrata-RequestId, and X-Socrata-Host
  # headers from the given request.
  #
  # If X-Socrata-RequestId is present on the incoming request, its value
  # is passed through to the return value. Otherwise, the request's uuid is
  # used.
  def self.headers_from_request(request = nil)
    headers = {}

    authentication_cookie = request.env['HTTP_COOKIE']
    parsed_cookie = CGI::Cookie.parse(authentication_cookie)

    csrf_token = nil
    unless parsed_cookie['socrata-csrf-token'].empty?
      csrf_token = parsed_cookie['socrata-csrf-token'].first
    end

    headers['Cookie'] = authentication_cookie
    headers['X-Socrata-Host'] = request.host
    headers['X-Socrata-RequestId'] = request.env['HTTP_X_SOCRATA_REQUESTID'] ||
      request.env['action_dispatch.request_id'].gsub('-', '')
    headers['X-CSRF-Token'] = csrf_token unless csrf_token.blank?

    headers
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

  def self.generate_query_params(params)
    if params.is_a?(String)
      params
    elsif params.is_a?(Hash)
      params.to_query
    end
  end

  def self.view_request(options)
    raise ArgumentError.new("':uid' is required.") if options[:verb] != :post && options.key?(:uid) == false
    raise ArgumentError.new("':verb' is required.") unless options.key?(:verb)

    verb = options[:verb]
    path = if verb == :post
      "/views.json"
    else
      "/views/#{options[:uid]}.json"
    end

    query_params = generate_query_params(options[:query_params])
    path << "?#{query_params}" unless query_params.blank?

    core_server_request_options = {
      verb: verb,
      path: path
    }

    if options[:data].present?
      core_server_request_options[:body] = options[:data]
    end

    core_server_request_with_retries(core_server_request_options)
  end

  def self.permissions_request(options)
    raise ArgumentError.new("':uid' is required.") unless options.key?(:uid)
    raise ArgumentError.new("':verb' is required.") unless options.key?(:verb)
    raise ArgumentError.new("':query_params' is required.") unless options.key?(:query_params)

    verb = options[:verb]
    path = "/views/#{options[:uid]}.json?#{generate_query_params(options[:query_params])}"

    core_server_request_options = {
      verb: verb,
      path: path
    }

    core_server_permissions_request_with_retries(core_server_request_options)
  end

  def self.configuration_request(options)
    raise ArgumentError.new("':verb' is required.") unless options.key?(:verb)

    verb = options[:verb]
    config_id = options[:id]
    path = '/configurations.json'

    if config_id.present?
      path << "/#{config_id}"

      # since we have an ID, we will need to PUT
      if verb == :post
        verb = :put
      end
    end

    core_server_request_options = {
      verb: verb,
      path: path,
      return_errors: true
    }

    if options[:data].present?
      core_server_request_options[:body] = options[:data]
    end
    response = core_server_request_with_retries(core_server_request_options)

    # For any update actions, we need to add/update properties.
    unless [:delete, :get].include?(verb)
      config_id ||= response['id']

      if [:put, :post].include?(verb) && config_id.present? && options[:data].key?('properties')
        configuration_properties_request(config_id: config_id, verb: verb, data: options[:data]['properties'], return_errors: true)
      end

      response = core_server_request_with_retries(verb: :get, path: "/configurations/#{config_id}")
    end

    response
  end

  def self.configuration_properties_request(options)
    configuration_id = options[:config_id]
    verb = options[:verb]
    properties = options[:data]
    path = nil

    base_path = "/configurations/#{configuration_id}/properties"

    properties.each do |property|
      if verb == :post
        path = "#{base_path}.json"
      else
        path = "#{base_path}/#{CGI.escape(property['name'])}"
      end

      core_server_request_options = {
        verb: verb,
        path: path,
        body: property,
        return_errors: true
      }

      # When attempting to update an existing configuration where the configuration has new properties
      # we will get errors when trying to update a property that does not exist 
      # so we need to add the property in the case where it doesn't currently exist in 
      # the configuration. This is due to the way the configurations API is defined where properties are
      # managed separate from their configurations.
      result = core_server_request_with_retries(core_server_request_options)

      if result.try(:[], 'code') == 'not_found'
        result = core_server_request_with_retries(
          {
            verb: :post,
            path: "#{base_path}.json",
            body: property,
            return_errors: true
          }
        )
      end

      raise result['message'] if result['error'].present?
    end
  end

  def self.configurations_request(options)
    raise ArgumentError.new("':type' is required.") unless options.key?(:type)

    verb = options[:verb] || :get

    query_params = generate_query_params(
      type: options[:type],
      defaultOnly: options.fetch(:default_only, true),
      merge: options.fetch(:merge, true)
    )
    path = "/configurations.json?#{query_params}"

    core_server_request_options = {
      verb: verb,
      path: path
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

      if (status_code == 200 && request_options[:verb] != :delete) ||
          (response_body.present? && request_options[:return_errors])
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

  def self.core_server_permissions_request_with_retries(request_options)
    core_server_response = nil

    begin
      with_retries(retry_options) do
        core_server_response = core_server_http_request(request_options)
      end

      core_server_response.code.to_i == 200
    rescue => error
      error_message = "[#{request_options[:verb].upcase}] #{request_options[:path]}"
      error_message << " - HTTP #{status_code}" unless status_code.blank?
      error_message << " - '#{response_body.inspect}'" unless response_body.blank?

      AirbrakeNotifier.report_error(error, error_message)
      false
    end
  end

  def self.core_server_http_request(options)
    raise ArgumentError.new("':verb' is required.") unless options[:verb].present?
    raise ArgumentError.new("':path' is required.") unless options[:path].present?

    headers = session_headers.merge('Content-type' => 'application/json')

    unless Rails.application.config.core_service_app_token.blank?
      headers['X-App-Token'] = Rails.application.config.core_service_app_token
    end

    core_server_address = Rails.application.config.core_service_uri

    uri = Addressable::URI.parse("#{core_server_address}#{options[:path]}")

    http = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = Rails.application.config.core_service_request_open_timeout
    http.read_timeout = Rails.application.config.core_service_request_read_timeout

    # instantiates a class of Net:HTTP::Get (or insert other verb)
    core_request = "Net::HTTP::#{options[:verb].to_s.capitalize}".constantize.new(uri.request_uri)

    headers.each { |key, value| core_request[key] = value }

    body = options.fetch(:body, nil)

    if body.present?
      core_request.body = JSON.dump(body)
    end

    http.request(core_request)
  end

  def self.view_with_title(title)
    {
      name: title,
      metadata: {
        renderTypeConfig: {
          visible: {
            href: true
          }
        },
        accessPoints: {
          story: 'https://www.socrata.com/'
        },
        availableDisplayTypes: ['story'],
        jsonQuery: {},
        initialized: false
      },
      displayType: 'story',
      displayFormat: {},
      query: {}
    }
  end

  def self.session_headers
    ::RequestStore.store[:socrata_session_headers] || {}
  end
end
