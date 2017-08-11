require 'retries'
require 'addressable/uri'
require 'request_store'
require 'http_response'

class CoreServer

  def self.get_view(uid)
    options = { uid: uid, verb: :get, path: view_url(uid) }
    response = core_server_request_with_retries(options)
    response.json if response.ok?
  end

  def self.view_accessible?(uid)
    get_view(uid).present?
  end

  def self.view_inaccessible?(uid)
    !view_accessible?(uid)
  end

  def self.update_view(uid, view_data, query_params = nil)
    options = { uid: uid, verb: :put, body: view_data, query_params: query_params, path: view_url(uid) }
    response = core_server_http_request(options)
    response.json if response.ok?
  end

  def self.create_view(title, query_params = nil)
    new_view = nil
    creation_options = {
      verb: :post,
      path: view_url,
      body: story_view_with_title(title),
      query_params: query_params
    }

    response = core_server_http_request(creation_options)

    if response.ok?
      working_copy = response.json
      publication_options = {
        verb: :post,
        path: view_url(working_copy['id']) << '/publication.json'
      }

      response = core_server_http_request(publication_options)

      if response.ok?
        new_view = response.json
      else
        delete_options = { verb: :delete, path: view_url(working_copy['id']) }
        core_server_request_with_retries(delete_options)
      end
    end

    new_view
  end

  def self.update_permissions(uid, query_params)
    options = { uid: uid, verb: :put, query_params: query_params }
    permissions_request(options)
  end

  def self.current_user
    response = core_server_request_with_retries(verb: :get, path: '/users/current.json')
    response.json if response.ok?
  end

  def self.current_domain
    response = core_server_request_with_retries(verb: :get, path: '/domains')
    response.json if response.ok?
  end

  def self.get_asset(id)
    core_server_request_with_retries(verb: :get, path: "/assets/#{id}")
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

  def self.get_feature_set(domain_cname)
    response = core_server_request_with_retries(verb: get, path: '/configurations?type=feature_set')

    response.json.select {
      |feature_set| feature_set['properties']['domainCName'] == domain_cname
    } if response.ok?
  end

  def self.story_themes
    configurations_request(verb: :get, type: 'story_theme', default_only: false, merge: false)
  end

  def self.current_user_story_authorization
    authorization = nil
    stored_authorization = ::RequestStore.store[:current_user_story_authorization]

    return stored_authorization if stored_authorization.present?

    user = CoreServer.current_user

    if user.present?
      uid = ::RequestStore.store[:story_uid]
      domain_rights = user['rights'] || []
      authorization = {
        'domainRights' => domain_rights,
        'viewRole' => 'unknown',
        'viewRights' => []
      }

      authorization['superAdmin'] = true if (user['flags'] || []).include?('admin')

      if uid.present?
        view = CoreServer.get_view(uid)

        if view.present?
          view_rights = view['rights'] || []
          corresponding_grant = lambda { |grant| grant['userId'] == user['id'] }
          is_primary_owner = view['owner']['id'] == user['id']
          has_user_grant = view['grants'].present? && view['grants'].one?(&corresponding_grant)

          if is_primary_owner
            authorization.merge!({
              'viewRole' => 'owner',
              'viewRights' => view_rights,
              'primary' => true
            })
          elsif has_user_grant
            authorization.merge!({
              'viewRole' => view['grants'].find(&corresponding_grant)['type'],
              'viewRights' => view_rights
            })
          else
            authorization.merge!({
              'viewRole' => 'unknown',
              'viewRights' => view_rights
            })
          end
        end
      end
    end

    ::RequestStore.store[:current_user_story_authorization] = authorization
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
          message: "CoreServer::core_server_request() failed with 3 retries after #{total_delay.to_s} seconds."
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

  def self.view_url(uid = nil)
    uid ? "/views/#{uid}" : '/views'
  end

  def self.generate_query_params(params)
    if params.is_a?(String)
      params
    elsif params.is_a?(Hash)
      params.to_query
    end
  end

  def self.permissions_request(options)
    raise ArgumentError.new("':uid' is required.") unless options.key?(:uid)
    raise ArgumentError.new("':verb' is required.") unless options.key?(:verb)
    raise ArgumentError.new("':query_params' is required.") unless options.key?(:query_params)

    core_server_request_options = {
      verb: options[:verb],
      path: view_url(options[:uid]),
      query_params: options[:query_params]
    }

    response = core_server_request_with_retries(core_server_request_options)
    response.ok?
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

    core_server_request_options[:body] = options[:data] if options[:data].present?

    response = core_server_request_with_retries(core_server_request_options)

    # For any update actions, we need to add/update properties.
    unless [:delete, :get].include?(verb)
      config_id ||= response.json['id']

      if [:put, :post].include?(verb) && config_id.present? && options[:data].key?('properties')
        configuration_properties_request(config_id: config_id, verb: verb, data: options[:data]['properties'], return_errors: true)
      end

      response = core_server_request_with_retries(verb: :get, path: "/configurations/#{config_id}")
    end

    response.json
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
      response = core_server_request_with_retries(core_server_request_options)

      if response.not_found?
        response = core_server_request_with_retries(
          verb: :post, path: "#{base_path}.json", body: property, return_errors: true
        )
      end

      raise response.json['message'] if response.json['error'].present?
    end
  end

  def self.configurations_request(options)
    raise ArgumentError.new("':type' is required.") unless options.key?(:type)

    verb = options[:verb] || :get
    path = '/configurations.json'

    core_server_request_options = {
      verb: verb,
      path: path,
      query_params: {
        type: options[:type],
        defaultOnly: options.fetch(:default_only, true),
        merge: options.fetch(:merge, true)
      }
    }
    core_server_request_options[:body] = options[:data] if options[:data].present?

    response = core_server_request_with_retries(core_server_request_options)
    response.json if response.ok?
  end

  def self.core_server_request_with_retries(request_options)
    core_server_response = HttpResponse.new

    begin
      with_retries(retry_options) do
        core_server_response = core_server_http_request(request_options)
      end
    rescue => error
      error_message = "[#{request_options[:verb].upcase} #{request_options[:path]}"

      if core_server_response.raw
        error_message << " - HTTP #{core_server_response.raw.code}"
        error_message << " - '#{core_server_response.raw.body.inspect}'"
      end

      AirbrakeNotifier.report_error(error, message: error_message)
    end

    core_server_response
  end

  def self.core_server_http_request(options)
    raise ArgumentError.new("':verb' is required.") unless options[:verb].present?
    raise ArgumentError.new("':path' is required.") unless options[:path].present?

    redirections = options[:redirections] || 0

    raise Error.new("Redirections reached limit.") unless redirections < 10

    cached_response = ::RequestStore.store[request_uid(core_server_headers, options)]
    return cached_response if cached_response.present?

    verb = options[:verb].to_s.capitalize
    body = JSON.dump(options[:body]) if options[:body].present?
    query_params = generate_query_params(options[:query_params])

    path = options[:path]
    path = options[:path] << "?#{query_params}" unless query_params.blank?
    path = path.start_with?('http') ? path : "#{coreservice_uri}#{path}"
    uri = Addressable::URI.parse(path)

    http = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = core_request_open_timeout
    http.read_timeout = core_request_read_timeout

    # instantiates a class of Net:HTTP::Get (or insert other verb)
    core_request = "Net::HTTP::#{verb}".constantize.new(uri)
    core_request.body = body
    core_server_headers.each do |key, value|
      core_request[key] = value
    end

    response = http.request(core_request)

    # Follow 302 Redirection.

    if response.instance_of?(Net::HTTPFound)
      response = core_server_http_request(
        {
          verb: options[:verb],
          path: response['location'],
          redirections: redirections + 1
        }
      )
    end

    response = HttpResponse.new(response)
    if options[:verb] == :get && response.ok?
      # We cache GET requests to the same core resources per storyteller request
      ::RequestStore.store[request_uid(core_server_headers, options)] = response
    end

    response
  end

  # EN-5496 - Published stories are 404ing
  #
  # I am not certain that this is the root cause, but the fact that copies
  # of stories are created with the HREF view type by nature of our not passing
  # the `isStorytellerAsset: true` metadata property was causing many of our
  # customers' assets to not conform to our expectation that all stories are
  # of view type Story. We now include the `isStorytellerAsset: true` metadata
  # property when creating new story views in the Rails code base in addition to
  # in the frontend/js code base (where we were already doing the right thing).
  def self.story_view_with_title(title)
    {
      displayFormat: {},
      displayType: 'story',
      metadata: {
        availableDisplayTypes: ['story'],
        # Since Storyteller has its own datastore, we will need to treat this
        # asynchonously. Tagging the metadata with `initialized: false` should
        # at least allow us to understand how many of the two-phase story
        # creation actions fail, and should also allow us to do some garbage
        # collection down the road.
        initialized: false,
        # Because of an unfortunate legacy in Core Server, the way that we
        # ensure that the newly-created asset is of viewType 'story' is by
        # putting a property called 'isStorytellerAsset' on the metadata
        # object.
        isStorytellerAsset: true,
        jsonQuery: {},
        renderTypeConfig: {
          visible: {
            story: true
          }
        }
      },
      name: title,
      query: {}
    }
  end

  def self.request_uid(headers, request_options)
    Digest::MD5.hexdigest({
      :headers => headers,
      :request_options => request_options
    }.to_s)
  end

  def self.core_server_headers
    headers = session_headers.merge('Content-Type' => 'application/json')
    headers['X-App-Token'] = core_app_token if core_app_token.present?
    headers['X-Socrata-Federation'] = 'Honey Badger'
    headers
  end

  def self.session_headers
    ::RequestStore.store[:socrata_session_headers] || {}
  end

  def self.coreservice_uri
    Rails.application.config.coreservice_uri
  end

  def self.core_request_open_timeout
    Rails.application.config.core_service_request_open_timeout
  end

  def self.core_request_read_timeout
    Rails.application.config.core_service_request_read_timeout
  end

  def self.core_app_token
    Rails.application.config.core_service_app_token
  end
end
