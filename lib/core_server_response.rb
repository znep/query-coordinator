class CoreServerResponse
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

  private

  def json?
    raw && raw.try(:[], 'Content-Type') &&
      raw['Content-Type'].include?('application/json') && raw.body.size > 1
  end
end
