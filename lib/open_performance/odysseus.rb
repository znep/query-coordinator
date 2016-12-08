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

  private

  def self.odysseus_http_request(options)
    raise ArgumentError.new("':path' is required.") unless options[:path].present?

    verb = (options[:verb] || :get).to_s.capitalize

    path = options[:path]
    path << "?#{options[:query_params].to_query}" unless options[:query_params].blank?

    uri = URI("#{odysseus_service_uri}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    request = "Net::HTTP::#{verb}".constantize.new(uri)
    session_headers.each do |key, value|
      request[key] = value
    end

    response = HttpResponse.new(http.request(request))

    raise "Unexpected non-json response from Odysseus: #{response}" unless response.json
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
