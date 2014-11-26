class SocrataHttp

  class ConnectionError < RuntimeError; end
  class ConfigurationError < RuntimeError; end

  def issue_request(options)
    raise ArgumentError.new('Missing option :verb') unless options[:verb].present?
    raise ArgumentError.new('Missing option :path') unless options[:path].present?

    headers = options.fetch(:headers, {})
    verb = options.fetch(:verb).to_s.capitalize
    path = options.fetch(:path)
    url = "#{end_point}/#{path}"
    request = "Net::HTTP::#{verb}".constantize.new(url)

    if [:post, :put].include?(options.fetch(:verb)) && options[:data].present?
      request.body = JSON.dump(options[:data])
    end

    Rails.logger.debug("#{verb.upcase} at #{url} started with request body #{request.body.inspect}")

    headers.each { |key, value| request[key] = value }
    request['X-Socrata-Host'] = cname
    request['X-Socrata-RequestId'] = options[:request_id] if options[:request_id].present?
    request['Cookie'] = options[:cookies] if options[:cookies].present?

    Rails.logger.debug("X-Socrata-Host is #{cname}")

    begin
      response = Net::HTTP.start(address, port) { |http| http.request(request) }
        # Sigh... one day we'll be able to use Faraday or HTTParty
    rescue Timeout::Error, Errno::EINVAL, Errno::ECONNRESET, EOFError, Errno::ECONNREFUSED,
        Net::HTTPBadResponse, Net::HTTPHeaderSyntaxError, Net::ProtocolError => error
      raise ConnectionError.new(error.to_s)
    end

    if response.kind_of?(Net::HTTPSuccess)
      result = on_success(response, url, verb)
    else
      result = on_failure(response, url, verb)
    end

    result.with_indifferent_access
  end

  def on_success(response, url, verb)
    begin
      result = {status: response.code}
      result[:body] = JSON.parse(response.body) if response.body.present?
      Rails.logger.debug("#{verb.upcase} at #{url} succeeded with response: #{response}")
    rescue JSON::ParserError => error
      Rails.logger.error("#{verb.upcase} at #{url} failed with error: #{error}")
      result = {status: '500', body: response.body, error: error.to_s}
    end

    result
  end

  def on_failure(response, url, verb)
    Rails.logger.error("#{verb.upcase} at #{url} failed with response: #{response}")
    {status: response.code, body: response.body, error: response.body}
  end

  def cname
    CurrentDomain.domain.cname
  end

  def end_point
    raise ConfigurationError.new("Invalid endpoint for #{self.class} - address cannot be nil") unless address.present?
    options = { host: address }
    options[:port] = port.to_i unless port.nil?
    URI::HTTP.build(options).to_s
  end

  def port
    connection_details.fetch('port', nil)
  end

  def address
    connection_details.fetch('address')
  end

  def connection_details
    raise RuntimeError.new('To be implemented by extending class')
  end

end
