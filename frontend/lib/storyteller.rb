require 'httparty'

module Storyteller
  def self.get_tile(id, cookie_string, request_id)
    endpoint = "https://#{CurrentDomain.cname}/stories/s/#{id}/tile.json"
    request_options = {
      format: :json,
      headers: {
        'Content-Type' => 'application/json',
        'Cookie' => cookie_string,
        'X-Socrata-Host' => CurrentDomain.cname,
        'X-Socrata-RequestId' => request_id
      }.compact
    }
    response = HTTParty.get(endpoint, request_options)

    response.success? ? response.parsed_response : {}
  end

  def self.get_tile_image(id, cookie_string, request_id)
    get_tile(id, cookie_string, request_id)['image']
  end
end
