class Phidippides < SocrataHttp

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
      raise ::SocrataHttp::ConnectionError.new(error_message)
    end
  end

  def address
    ENV['PHIDIPPIDES_ADDRESS'] || connection_details.fetch('address')
  end

  def port
    ENV['PHIDIPPIDES_PORT'] || connection_details.fetch('port')
  end

  def issue_request(options)
    options[:headers] = {} unless options.has_key?(:headers)
    options[:headers]['X-Socrata-Wink'] = 'iAmASocrataEmployee'
    options[:headers]['Content-Type'] = 'application/json'

    super(options)
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


end
