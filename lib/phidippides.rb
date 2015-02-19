class Phidippides < SocrataHttp

  include CommonMetadataTransitionMethods

  # TODO: Should these actually be ignore-case?
  # Note - these are aligned so as to exemplify the differences between the regexes
  COLUMN_ID_REGEX =    /(:@)?([a-z][a-z_0-9\-]*)/i
  SYSTEM_COLUMN_ID_REGEX = /:([a-z][a-z_0-9\-]*)/i
  UID_REGEXP = /\w{4}-\w{4}/

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

    options[:headers]['X-Socrata-Wink'] = 'iAmASocrataEmployee'

    super(options)
  end

  # Dataset Metadata requests

  def fetch_dataset_metadata(dataset_id, options = {})
    if metadata_transition_phase_0?
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
    if metadata_transition_phase_0?
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

  def migrate_dataset_metadata_to_v1(dataset_metadata)
    if metadata_transition_phase_1? || metadata_transition_phase_2?

      dataset_id = dataset_metadata.try(:[], :body).try(:[], :id)

      unless dataset_id.present?
        Airbrake.notify(
          :error_class => "DatasetMetadataMigrationError",
          :error_message => "Could not migrate dataset to v1: could not determine dataset id.",
          :context => { :response => dataset_metadata }
        )
        return
      end

      pages_for_dataset = fetch_pages_for_dataset(dataset_id)

      first_page_id = pages_for_dataset.try(:[], :body).try(:[], :publisher).try(:first).try(:[], :pageId)

      if first_page_id.present?
        dataset_metadata[:body][:defaultPage] = first_page_id
        update_dataset_metadata(dataset_metadata[:body].to_json)
      else
        Airbrake.notify(
          :error_class => "DatasetMetadataMigrationError",
          :error_message => "Could not migrate dataset to v1: no valid publisher pageId found.",
          :datastId => dataset_id,
          :context => { :response => dataset_metadata }
        )
      end
    end
  end

  # Page Metadata requests

  def create_page_metadata(json, options = {})

    raise ArgumentError.new('datasetId is required') unless json.key?('datasetId')

    if metadata_transition_phase_0? || metadata_transition_phase_1?
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
    if metadata_transition_phase_0? || metadata_transition_phase_1?
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

    if metadata_transition_phase_0? || metadata_transition_phase_1?
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

  def delete_page_metadata(page_id, options = {})

    if metadata_transition_phase_2?
      issue_request(
        :verb => :delete,
        :path => "v1/pages/#{page_id}",
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

    # nil responds to :id, so we have to guard against it
    if dataset_or_id && dataset_or_id.respond_to?(:id)
      dataset_id = dataset_or_id.id
    end

    if dataset_or_id.respond_to?(:with_indifferent_access)
      dataset_id ||= dataset_or_id.with_indifferent_access[:id]
    end

    dataset_id ||= dataset_or_id

    raise ArgumentError.new('could not determine dataset id') unless dataset_id =~ UID_REGEXP

    if metadata_transition_phase_0? || metadata_transition_phase_1?
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
