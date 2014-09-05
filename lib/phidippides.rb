module Phidippides

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

  def phidippides_connection_details
    # Port is typically 2401 in development mode and 1303 in production
    instance_id = ::ZookeeperDiscovery.get('com.socrata/soda/services/phidippides')
    begin
      ::ZookeeperDiscovery.get_json("/com.socrata/soda/services/phidippides/#{instance_id}")
    rescue ZK::Exceptions::BadArguments => e
      Rails.logger.error(error_message = "Unable to determine phidippides connection details due to error: #{e.to_s}")
      raise ::Phidippides::ConnectionError.new(error_message)
    end
  end

  def phidippides_address
    phidippides_connection_details['address']
  end

  def phidippides_port
    phidippides_connection_details['port']
  end

  def service_end_point
    "http://#{phidippides_address}:#{phidippides_port}"
  end

  def fetch_pages_for_dataset(dataset_id, options = {})
    issue_phidippides_request(:verb => :get, :path => "datasets/#{dataset_id}/pages", :request_id => options[:request_id])
  end

  def fetch_page_metadata(page_id, options = {})
    issue_phidippides_request(:verb => :get, :path => "pages/#{page_id}", :request_id => options[:request_id])
  end

  def create_page_metadata(data, options = {})
    raise ArgumentError unless data.key?('datasetId')
    issue_phidippides_request(:verb => :post, :path => 'pages', :data => data, :request_id => options[:request_id])
  end

  def update_page_metadata(page_id, options = {})
    issue_phidippides_request(:verb => :put, :path => "pages/#{page_id}", :data => options[:data], :request_id => options[:request_id])
  end

  def fetch_dataset_metadata(dataset_id, options = {})
    issue_phidippides_request(:verb => :get, :path => "datasets/#{dataset_id}", :request_id => options[:request_id])
  end

  def create_dataset_metadata(data, options = {})
    raise ArgumentError unless data.key?('id')
    issue_phidippides_request(:verb => :post, :path => 'datasets', :data => data, :request_id => options[:request_id])
  end

  def update_dataset_metadata(dataset_id, options = {})
    issue_phidippides_request(:verb => :put, :path => "datasets/#{dataset_id}", :data => options[:data], :request_id => options[:request_id])
  end

  def issue_phidippides_request(options)
    raise ArgumentError.new('Missing option :verb') unless options[:verb].present?
    raise ArgumentError.new('Missing option :path') unless options[:path].present?

    verb = options[:verb].to_s.capitalize
    path = options[:path]

    request = "Net::HTTP::#{verb}".constantize.new("#{service_end_point}/#{path}")

    if [:post, :put].include?(options[:verb]) && options[:data].present?
      request.body = JSON.dump(options[:data])
    end

    Rails.logger.debug("#{verb.upcase} to phidippides at #{path} started with request body #{request.body.inspect}")

    request['X-Socrata-Host'] = CurrentDomain.domain
    request['X-Socrata-Wink'] = 'iAmASocrataEmployee'
    request['X-Socrata-RequestId'] = options[:request_id] if options[:request_id].present?

    begin
      response = Net::HTTP.start(phidippides_address, phidippides_port) do |http|
        http.request(request)
      end
    # Sigh... one day we'll be able to use Faraday or HTTParty
    rescue Timeout::Error, Errno::EINVAL, Errno::ECONNRESET, EOFError,
      Net::HTTPBadResponse, Net::HTTPHeaderSyntaxError, Net::ProtocolError => e
      result = { status: '500', body: nil, error: e.to_s }
    end

    if response.kind_of?(Net::HTTPSuccess)
      begin
        result = { status: response.code }
        result[:body] = JSON.parse(response.body) if response.body.present?
        Rails.logger.debug("#{verb.upcase} to phidippides at #{path} succeeded with response: #{response}")
      rescue JSON::ParserError => e
        Rails.logger.error("#{verb.upcase} to phidippides at #{path} failed with error: #{e}")
        result = { status: '500', body: response.body, error: e.to_s }
      end
    else
      Rails.logger.error("#{verb.upcase} to phidippides at #{path} failed with response: #{response}")
      result = { status: response.code, body: response.body, error: response.body }
    end

    result.with_indifferent_access
  end

  private

  def request_id
    request.headers['X-Socrata-RequestId'] || request.headers['action_dispatch.request_id']
  end

end
