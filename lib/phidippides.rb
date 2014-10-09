class Phidippides

  class ConnectionError < RuntimeError; end

  # curl -k -v -X POST -H "X-Socrata-Host: localhost" -H "X-Socrata-Wink: iAmASocrataEmployee" -d @dataset_metadata.json http://localhost:2401/datasets
  # curl -k -v -X GET  -H "X-Socrata-Host: localhost" http://localhost:2401/datasets/q77b-s2zi
  # curl -k -v -X PUT  -H "X-Socrata-Host: localhost" -H "X-Socrata-Wink: iAmASocrataEmployee" -d @dataset_metadata.json http://localhost:2401/datasets/q77b-s2zi
  # curl -k -v -X POST -H "X-Socrata-Host: localhost" -H "X-Socrata-Wink: iAmASocrataEmployee" -d @page_metadata.json http://localhost:2401/pages
  # curl -k -v -X GET  -H "X-Socrata-Host: localhost" http://localhost:2401/pages/5epr-2bty
  # curl -k -v -X PUT  -H "X-Socrata-Host: localhost" -H "X-Socrata-Wink: iAmASocrataEmployee" -d @page_metadata.json http://localhost:2401/pages/desk-chek

  # Create dataset metadata:  POST http://address:port/datasets dataset_metadata.json
  # Read dataset metadata:     GET http://address:port/datasets/four-four
  # Update dataset metadata    PUT http://address:port/datasets/four-four dataset_metadata.json
  # Create page metadata:     POST http://address:port/pages page_metadata.json
  # Read page metadata:        GET http://address:port/pages/four-four
  # Update page metadata       PUT http://address:port/pages/four-four page_metadata.json

  def connection_details
    # Port is typically 2401 in development mode and 1303 in production
    zookeeper_path = ENV['ZOOKEEPER_PHIDIPPIDES_PATH'] || 'com.socrata/soda/services/phidippides'
    instance_id = ::ZookeeperDiscovery.get(zookeeper_path)
    begin
      ::ZookeeperDiscovery.get_json("/#{zookeeper_path}/#{instance_id}")
    rescue ZK::Exceptions::BadArguments => error
      Rails.logger.error(error_message = "Unable to determine phidippides connection details due to error: #{error.to_s}")
      raise ::Phidippides::ConnectionError.new(error_message)
    end
  end

  def address
    ENV['PHIDIPPIDES_ADDRESS'] || connection_details.fetch('address')
  end

  def port
    ENV['PHIDIPPIDES_PORT'] || connection_details.fetch('port')
  end

  def end_point
    "http://#{address}:#{port}"
  end

  def fetch_pages_for_dataset(dataset_id, options = {})
    issue_request(
      :verb => :get,
      :path => "datasets/#{dataset_id}/pages",
      :request_id => options[:request_id],
      :cookies => options[:cookies]
    )
  end

  def fetch_page_metadata(page_id, options = {})
    issue_request(
      :verb => :get,
      :path => "pages/#{page_id}",
      :request_id => options[:request_id],
      :cookies => options[:cookies]
    )
  end

  def create_page_metadata(json, options = {})
    raise ArgumentError.new('datasetId is required') unless json.key?('datasetId')
    issue_request(
      :verb => :post,
      :path => 'pages',
      :data => json,
      :request_id => options[:request_id],
      :cookies => options[:cookies]
    )
  end

  def update_page_metadata(json, options = {})
    raise ArgumentError.new('pageId is required') unless json.key?('pageId')
    issue_request(
      :verb => :put,
      :path => "pages/#{json['pageId']}",
      :data => json,
      :request_id => options[:request_id],
      :cookies => options[:cookies]
    )
  end

  def fetch_dataset_metadata(dataset_id, options = {})
    issue_request(
      :verb => :get,
      :path => "datasets/#{dataset_id}",
      :request_id => options[:request_id],
      :cookies => options[:cookies]
    )
  end

  def create_dataset_metadata(data, options = {})
    raise ArgumentError.new('id is required') unless data.key?('id')
    issue_request(
      :verb => :post,
      :path => 'datasets',
      :data => data,
      :request_id => options[:request_id],
      :cookies => options[:cookies]
    )
  end

  def update_dataset_metadata(data, options = {})
    json = JSON.parse(data)
    issue_request(
      :verb => :put,
      :path => "datasets/#{json['id']}",
      :data => json,
      :request_id => options[:request_id],
      :cookies => options[:cookies]
    )
  end

  def issue_request(options)
    raise ArgumentError.new('Missing option :verb') unless options[:verb].present?
    raise ArgumentError.new('Missing option :path') unless options[:path].present?

    verb            = options.fetch(:verb).to_s.capitalize
    path            = options.fetch(:path)
    phidippides_url = "#{end_point}/#{path}"
    request         = "Net::HTTP::#{verb}".constantize.new(phidippides_url)

    if [:post, :put].include?(options.fetch(:verb)) && options[:data].present?
      request.body = JSON.dump(options[:data])
    end

    Rails.logger.debug("#{verb.upcase} to phidippides at #{phidippides_url} started with request body #{request.body.inspect}")

    request['X-Socrata-Host']      = CurrentDomain.domain.cname
    request['X-Socrata-Wink']      = 'iAmASocrataEmployee'
    request['X-Socrata-RequestId'] = options[:request_id] if options[:request_id].present?
    request['Cookie']              = options[:cookies]    if options[:cookies].present?
    request['Content-Type']        = 'application/json'

    Rails.logger.debug("X-Socrata-Host is #{CurrentDomain.domain.cname}")

    begin
      response = Net::HTTP.start(address, port) { |http| http.request(request) }
    # Sigh... one day we'll be able to use Faraday or HTTParty
    rescue Timeout::Error, Errno::EINVAL, Errno::ECONNRESET, EOFError, Errno::ECONNREFUSED,
      Net::HTTPBadResponse, Net::HTTPHeaderSyntaxError, Net::ProtocolError => error
      raise ConnectionError.new(error.to_s)
    end

    if response.kind_of?(Net::HTTPSuccess)
      begin
        result = { status: response.code }
        result[:body] = JSON.parse(response.body) if response.body.present?
        Rails.logger.debug("#{verb.upcase} to phidippides at #{phidippides_url} succeeded with response: #{response}")
      rescue JSON::ParserError => error
        Rails.logger.error("#{verb.upcase} to phidippides at #{phidippides_url} failed with error: #{error}")
        result = { status: '500', body: response.body, error: error.to_s }
      end
    else
      Rails.logger.error("#{verb.upcase} to phidippides at #{phidippides_url} failed with response: #{response}")
      result = { status: response.code, body: response.body, error: response.body }
    end

    result.with_indifferent_access
  end

end
