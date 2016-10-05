# This class provides access to Open Performance goals.
# Minimal implementation, we may want to factor out a SocrataService
# class from lib/core_server.rb and use it here as requirements expand.

require 'request_store'
require 'http_response'

class OpenPerformance::Goal
  attr_reader :uid

  def initialize(uid)
    @uid = uid
  end

  def accessible?
    odysseus_goal_data_response.ok?
  end

  private

  def odysseus_goal_data_response
    response = odysseus_get_request("/api/stat/v1/goals/#{@uid}.json")
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

  def odysseus_get_request(path)
    uri = URI("#{odysseus_service_uri}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Get.new(uri)
    session_headers.each do |key, value|
      request[key] = value
    end

    HttpResponse.new(http.request(request))
  end

  def odysseus_service_uri
    Rails.application.config.odysseus_service_uri
  end

  def session_headers
    ::RequestStore.store[:socrata_session_headers] || {}
  end
end
