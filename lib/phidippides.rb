class Phidippides < SocrataHttp
  # TODO: Should these actually be ignore-case?
  # Note - these are aligned so as to exemplify the differences between the regexes
  COLUMN_ID_REGEX =    /(:@)?([a-z][a-z_0-9\-]*)/i
  SYSTEM_COLUMN_ID_REGEX = /:([a-z][a-z_0-9\-]*)/i
  UID_REGEXP = /\w{4}-\w{4}/

  def metadata_transition_phase
    FeatureFlags.derive(nil, nil)[:metadata_transition_phase].to_s.downcase
  end

  def metadata_transition_phase_none?
    metadata_transition_phase == '0' || metadata_transition_phase == 'false'
  end

  def metadata_transition_phase_dataset?
    metadata_transition_phase == '1'
  end

  def metadata_transition_phase_page?
    metadata_transition_phase == '2'
  end

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
    options[:headers]['Content-Type'] = 'application/json'

    if metadata_transition_phase_none?
      options[:headers]['X-Socrata-Wink'] = 'iAmASocrataEmployee'
    end

    super(options)
  end

  # Dataset Metadata requests

  def fetch_dataset_metadata(dataset_id, options = {})

    if metadata_transition_phase_none?
      issue_request(
        :verb => :get,
        :path => "datasets/#{dataset_id}",
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      issue_request(
        :verb => :get,
        :path => "v1/id/#{dataset_id}/dataset",
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    end
  end

  def update_dataset_metadata(json, options = {})

    if metadata_transition_phase_none?
      issue_request(
        :verb => :put,
        :path => "datasets/#{json['id']}",
        :data => json,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      issue_request(
        :verb => :put,
        :path => "v1/id/#{json['id']}/dataset",
        :data => json,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    end
  end

  # Page Metadata requests

  def create_page_metadata(json, options = {})

    raise ArgumentError.new('datasetId is required') unless json.key?('datasetId')

    if metadata_transition_phase_none? || metadata_transition_phase_dataset?
      issue_request(
        :verb => :post,
        :path => 'pages',
        :data => json,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      issue_request(
        :verb => :post,
        :path => "v1/id/#{json['datasetId']}/pages",
        :data => json,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    end
  end

  def fetch_page_metadata(page_id, options = {})

    if metadata_transition_phase_none? || metadata_transition_phase_dataset?
      issue_request(
        :verb => :get,
        :path => "pages/#{page_id}",
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      issue_request(
        :verb => :get,
        :path => "v1/pages/#{page_id}",
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    end
  end

  def update_page_metadata(json, options = {})

    raise ArgumentError.new('pageId is required') unless json.key?('pageId')

    if metadata_transition_phase_none? || metadata_transition_phase_dataset?
      issue_request(
        :verb => :put,
        :path => "pages/#{json['pageId']}",
        :data => json,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      issue_request(
        :verb => :put,
        :path => "v1/id/#{json['datasetId']}/pages/#{json['pageId']}",
        :data => json,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    end
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
  def fetch_pages_for_dataset(dataset_or_id, options = {})

    dataset_id = nil
    dataset_id ||= dataset_or_id.id if (dataset_or_id && dataset_or_id.respond_to?(:id))
    if dataset_or_id.respond_to?(:key?) && dataset_or_id.with_indifferent_access.key?(:id)
      dataset_id ||= dataset_or_id.with_indifferent_access.fetch(:id)
    end
    dataset_id ||= dataset_or_id

    raise ArgumentError.new('could not determine dataset id') unless dataset_id =~ UID_REGEXP

    if metadata_transition_phase_none? || metadata_transition_phase_dataset?
      issue_request(
        :verb => :get,
        :path => "datasets/#{dataset_id}/pages",
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      issue_request(
        :verb => :get,
        :path => "v1/id/#{dataset_id}/pages",
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    end
  end

end
