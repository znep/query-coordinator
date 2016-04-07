class SodaFountain

  class ConnectionError < RuntimeError; end

  attr_accessor :path

  def initialize(options = {})
    @path = options[:path] || '/dataset-rollup'
  end

  def connection_details
    # Port is typically 6010 when specified in configuration (/etc/soda.conf) but is randomly assigned otherwise
    zookeeper_path = ENV['ZOOKEEPER_SODA_FOUNTAIN_PATH'] || 'com.socrata/soda/services/soda-fountain'
    instance_id = ::ZookeeperDiscovery.get(zookeeper_path)
    begin
      ::ZookeeperDiscovery.get_json("/#{zookeeper_path}/#{instance_id}")
    rescue ZK::Exceptions::BadArguments => error
      Rails.logger.error(error_message = "Unable to determine soda fountain connection details due to error: #{error.to_s}")
      raise ::SodaFountain::ConnectionError.new(error_message)
    end
  end

  def address
    ENV['SODA_FOUNTAIN_ADDRESS'] || connection_details.fetch('address')
  end

  def port
    ENV['SODA_FOUNTAIN_PORT'] || connection_details.fetch('port')
  end

  def end_point
    "http://#{address}:#{port}#{path}"
  end

  def delete_rollup_table(options)
    issue_request(
      verb: :delete,
      dataset_id: options.fetch(:dataset_id),
      identifier: options.fetch(:identifier),
      cookies: options[:cookies],
      request_id: options[:request_id]
    )
  end

  def create_or_update_rollup_table(options)
    issue_request(
      verb: :put,
      dataset_id: options.fetch(:dataset_id),
      identifier: options.fetch(:identifier),
      data: options[:soql],
      cookies: options[:cookies],
      request_id: options[:request_id]
    )
  end

  def get_extent(options)
    issue_request(
      verb: :get,
      dataset_id: options.fetch(:dataset_id),
      query: "select extent(`#{options.fetch(:field)}`) as extent",
      cookies: options[:cookies],
      request_id: options[:request_id]
    )
  end

  def issue_request(options)
    dataset_id = options.fetch(:dataset_id)
    soda_fountain_url = "#{end_point}/_#{dataset_id}"

    identifier = options[:identifier]
    if identifier.present?
      soda_fountain_url += "/#{identifier}"
    end

    query = options[:query]
    if query.present?
      query_params = URI.encode_www_form('$query' => query)
      soda_fountain_url += "?#{query_params}"
    end

    verb = options.fetch(:verb)
    request = "Net::HTTP::#{verb.capitalize}".constantize.new(soda_fountain_url)

    if :put == verb
      request.body = JSON.dump(soql: options.fetch(:data))
    end

    Rails.logger.debug("#{verb.upcase} to Soda Fountain at #{soda_fountain_url} started with request body #{request.body.inspect}")

    request['X-Socrata-Host']       = CurrentDomain.domain.cname
    request['X-Socrata-Federation'] = 'Honey Badger'
    request['X-Socrata-RequestId']  = options[:request_id] if options[:request_id].present?
    request['Cookie']               = options[:cookies]    if options[:cookies].present?
    request['Content-Type']         = 'application/json'

    Rails.logger.debug("X-Socrata-Host is #{CurrentDomain.domain.cname}")

    begin
      response = Net::HTTP.start(address, port) { |http| http.request(request) }
        # Sigh... one day we'll be able to use Faraday or HTTParty
    rescue Timeout::Error, Errno::EINVAL, Errno::ECONNRESET, EOFError, Errno::ECONNREFUSED,
      Net::HTTPBadResponse, Net::HTTPHeaderSyntaxError, Net::ProtocolError => error
      result = { status: '500', body: nil, error: error.to_s }
    end

    if response.kind_of?(Net::HTTPSuccess)
      begin
        result = { status: response.code }
        result[:body] = JSON.parse(response.body) if response.body.present?
        Rails.logger.debug("#{verb.upcase} to Soda Fountain at #{soda_fountain_url} succeeded with response: #{response}")
      rescue JSON::ParserError => error
        Rails.logger.error("#{verb.upcase} to Soda Fountain at #{soda_fountain_url} failed with error: #{error}")
        result = { status: '500', body: response.body, error: error.to_s }
      end
    else
      Rails.logger.error("#{verb.upcase} to Soda Fountain at #{soda_fountain_url} failed with response: #{response}")
      result = { status: response.code, body: response.body, error: response.body }
    end

    result.with_indifferent_access
  end

end
