# Utility wrapper around Net::HTTP* responses.
class HttpResponse
  attr_reader :raw, :json

  def initialize(http_response = nil)
    @raw = http_response
    begin
      @json = JSON.parse(raw.body) if json?
    rescue JSON::ParserError => error
      @json = nil
    end
  end

  def ok?
    raw && raw.instance_of?(Net::HTTPOK)
  end

  def not_found?
    raw && raw.instance_of?(Net::HTTPNotFound)
  end

  def server_error?
    raw && raw.is_a?(Net::HTTPServerError)
  end

  def bad_request?
    raw && raw.is_a?(Net::HTTPBadRequest)
  end

  def to_s
    "URI: #{raw.uri} Code: #{raw.code} Body: #{raw.body}"
  end

  private

  def json?
    raw && raw.try(:[], 'Content-Type') &&
      raw['Content-Type'].include?('application/json') && raw.body.size > 1
  end
end
