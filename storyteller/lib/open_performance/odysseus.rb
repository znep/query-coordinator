require 'addressable/uri'
require 'request_store'
require 'http_response'

class OpenPerformance::Odysseus

  def self.get_goal(uid)
    ::RequestStore.store["goal-data-#{uid}"] ||=
      odysseus_http_request(
        path: "/api/stat/v1/goals/#{uid}"
      )
  end

  def self.get_goal_narrative(uid)
    ::RequestStore.store["goal-migration-data-#{uid}"] ||=
      odysseus_http_request(
        path: "/api/stat/v2/goals/#{uid}/narrative-migration-metadata"
      )
  end

  def self.set_goal_visibility(uid, is_public)
    # We need to bypass the cached goal; see further comments below.
    goal = odysseus_http_request(
      path: "/api/stat/v1/goals/#{uid}"
    )

    raise "Unable to fetch latest version of goal #{uid} before update, got #{goal.code}" unless goal.ok?

    odysseus_http_request(
      verb: :put,
      path: "/api/stat/v1/goals/#{uid}",
      body: {
        is_public: is_public
      },
      headers: {
        # This header is useful for making sure that clients don't overwrite
        # previous edits when in conflict, but in this case we know that we want
        # our update to "win". It's safe because we're only attempting to set
        # the one property we care about, whereas the Odysseus client code
        # usually tries to send an entire goal back at once.
        #
        # By fetching the latest goal info before making this call, we don't
        # need to track the goal's last-updated timestamp (another pattern that
        # Odysseus uses).
        'If-Match' => goal.json['version']
      }
    )
  end

  def self.copy_goal(uid, dashboard_uid, title)
    odysseus_http_request(
      verb: :post,
      path: "/api/stat/v2/goals/#{uid}/copyToDashboard",
      query_params: {
        dashboard: dashboard_uid,
        name: title
      }
    )
  end

  def self.list_dashboards
    ::RequestStore.store['dashboard-data'] ||=
      odysseus_http_request(
        path: '/api/stat/v1/dashboards'
      )
  end

  def self.list_goals(format = 'json')
    ::RequestStore.store['goals'] ||=
      odysseus_http_request(
        path: "/api/stat/v1/goals.#{format}"
      )
  end

  private

  def self.odysseus_http_request(options)
    raise ArgumentError.new("':path' is required.") unless options[:path].present?

    # Destructure options and provide sane defaults.
    verb = options[:verb] || :get

    body = JSON.dump(options[:body]) if options[:body].present?
    query_params = options[:query_params]

    headers = options[:headers] || {}
    headers['Content-Type'] = 'application/json'

    path = options[:path]
    path << "?#{query_params.to_query}" unless query_params.blank?

    # Build a request object with the options and get its response.
    uri = URI("#{odysseus_service_uri}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    request = "Net::HTTP::#{verb.capitalize}".constantize.new(uri)
    request.body = body

    session_headers.merge(headers).each do |key, value|
      request[key] = value
    end

    response = HttpResponse.new(http.request(request))

    raise "Unexpected non-json non-csv response from Odysseus: #{response}" unless response.json || response.csv
    raise "Unexpected server error response from Odysseus: #{response}" if response.server_error?
    # Procrustes likes to throw 400s for goals that are misconfigured. Technically, these
    # should be 200s containing an explanatory payload (it's not the fault of the
    # requester that the goal is messed up, nor is it a server error as the invalid goal
    # data was provided as part of a past request).
    # For now, since the user can't reasonably recover from this state, we'll raise
    # an error.
    raise "Unexpected 400 response from Procrustes: #{response}" if response.bad_request?

    response
  end

  def self.odysseus_service_uri
    Rails.application.config.odysseus_service_uri
  end

  def self.session_headers
    ::RequestStore.store[:socrata_session_headers] || {}
  end

end
