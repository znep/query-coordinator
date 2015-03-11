class Phidippides < SocrataHttp

  include CommonMetadataTransitionMethods
  include CardTypeMapping

  class NewPageException < RuntimeError; end
  class PageIdException < RuntimeError; end
  class NoDatasetIdException < RuntimeError; end
  class NoPageIdException < RuntimeError; end

  # TODO: Should these actually be ignore-case?
  # Note - these are aligned so as to exemplify the differences between the regexes
  # COLUMN_ID_REGEX matches valid fieldNames for the front-end.
  COLUMN_ID_REGEX =    /(:@)?([a-z][a-z_0-9\-]*)/i
  SYSTEM_COLUMN_ID_REGEX = /:([a-z][a-z_0-9\-]*)/i
  UID_REGEXP = /\w{4}-\w{4}/

  def connection_details
    zookeeper_path = ENV['ZOOKEEPER_PHIDIPPIDES_PATH'] || 'com.socrata/soda/services/phidippides'
    instance_id = ::ZookeeperDiscovery.get(zookeeper_path)

    begin
      ::ZookeeperDiscovery.get_json("/#{zookeeper_path}/#{instance_id}")
    rescue ZK::Exceptions::BadArguments => error
      Rails.logger.error(error_message = "Unable to determine phidippides connection details due to error: #{error.to_s}")
      raise Phidippides::ConnectionError.new(error_message)
    end
  end

  def address
    ENV['PHIDIPPIDES_ADDRESS'] || connection_details.fetch('address')
  end

  def port
    # Port is typically 2401 in development mode and 1303 in production
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

  def update_dataset_metadata(dataset_metadata, options = {})
    if metadata_transition_phase_0?
      issue_request(
        :verb => :put,
        :path => "datasets/#{dataset_metadata['id']}",
        :data => dataset_metadata,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      issue_request(
        :verb => :put,
        :path => "v1/id/#{dataset_metadata['id']}/dataset",
        :data => dataset_metadata,
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
          :error_class => 'DatasetMetadataMigrationError',
          :error_message => 'Could not migrate dataset to v1: could not determine dataset id.',
          :context => { :response => dataset_metadata }
        )
        return
      end

      pages_for_dataset = fetch_pages_for_dataset(dataset_id)

      begin
        first_page_id = pages_for_dataset.try(:[], :body).try(:[], :publisher).try(:first).try(:[], :pageId)
      rescue TypeError => error
        error_message = 'Could not migrate dataset to v1: encountered error ' \
          "trying to find first available page (#{error})."
        Airbrake.notify(
          :error_class => 'DatasetMetadataMigrationError',
          :error_message => error_message,
          :datasetId => dataset_id,
          :context => { :response => pages_for_dataset }
        )
        first_page_id = nil
      end

      if first_page_id.present?
        dataset_metadata[:body][:defaultPage] = first_page_id
        update_dataset_metadata(dataset_metadata[:body].to_json)
      else
        Airbrake.notify(
          :error_class => 'DatasetMetadataMigrationError',
          :error_message => 'Could not migrate dataset to v1: no valid publisher pageId found.',
          :datastId => dataset_id,
          :context => { :response => dataset_metadata }
        )
      end
    end
  end

  def set_default_and_available_card_types_to_columns!(dataset_metadata)
    if metadata_transition_phase_3?

      dataset_id = dataset_metadata.try(:[], :body).try(:[], :id)
      unless dataset_id.present?
        error_message = 'Could not compute default and available card types ' \
          'for dataset: unable to determine dataset id.'
        Airbrake.notify(
          :error_class => 'DatasetMetadataCardTypeComputationError',
          :error_message => error_message,
          :context => { :response => dataset_metadata }
        )
        return
      end

      columns = dataset_metadata.try(:[], :body).try(:[], :columns)

      unless columns.present?
        error_message = 'Could not compute default and available card types ' \
          'for dataset: no columns found.'
        Airbrake.notify(
          :error_class => 'DatasetMetadataCardTypeComputationError',
          :error_message => error_message,
          :context => { :response => dataset_metadata }
        )
        return
      end

      # Note that this mutates the columns in-place.
      columns.each do |field_name, column|
        column['defaultCardType'] = default_card_type_for(column, dataset_size(dataset_id))
        column['availableCardTypes'] = available_card_types_for(column, dataset_size(dataset_id))
      end
    end
  end

  # Page Metadata requests

  def request_new_page_id(page_metadata = {}, options = {})
    if metadata_transition_phase_0? || metadata_transition_phase_1?
      # Meh. Create whatever they give us. It'll get overridden right after anyway.
      response = issue_request(
        :verb => :post,
        :path => 'pages',
        :data => page_metadata,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      response = issue_request(
        :verb => :post,
        :path => 'v1/idgen',
        :data => nil,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    end

    status = response[:status]
    if response[:status] != '200'
      raise Phidippides::NewPageException.new('could not provision new page id')
    end

    return response[:body].fetch(:id, response[:body][:pageId])
  end

  def create_page_metadata(page_metadata, options = {})
    raise ArgumentError.new('datasetId is required') unless page_metadata.key?('datasetId')

    if metadata_transition_phase_0? || metadata_transition_phase_1?
      issue_request(
        :verb => :post,
        :path => 'pages',
        :data => page_metadata,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      raise ArgumentError.new('pageId is required') unless page_metadata.key?('pageId')

      # Note that this is a PUT, not a POST like might be expected.
      # The reason for this is that by the time that we call
      # create_page_metadata we have already generated a page id
      # using request_new_page_id.
      #
      # As such, we already know the name of the resource that we
      # want to 'create', and therefore use PUT.
      issue_request(
        :verb => :put,
        :path => "v1/id/#{page_metadata['datasetId']}/pages/#{page_metadata['pageId']}",
        :data => page_metadata,
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

  def update_page_metadata(page_metadata, options = {})
    raise ArgumentError.new('pageId is required') unless page_metadata.key?('pageId')

    if metadata_transition_phase_0? || metadata_transition_phase_1?
      issue_request(
        :verb => :put,
        :path => "pages/#{page_metadata['pageId']}",
        :data => page_metadata,
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      raise ArgumentError.new('datasetId is required') unless page_metadata.key?('datasetId')

      issue_request(
        :verb => :put,
        :path => "v1/id/#{page_metadata['datasetId']}/pages/#{page_metadata['pageId']}",
        :data => page_metadata,
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
      normalize_pages_for_dataset_response!(
        issue_request(
          :verb => :get,
          :path => "v1/id/#{dataset_id}/pages",
          :request_id => options[:request_id],
          :cookies => options[:cookies]
        )
      )
    end
  end

  private

  def normalize_pages_for_dataset_response!(pages_for_dataset_response)
    if pages_for_dataset_response[:status] == '200' && pages_for_dataset_response[:body].present?
      response_body = pages_for_dataset_response[:body]
      if response_body.respond_to?('values')
        pages_for_dataset_response[:body] = { :publisher => response_body.values, :user => [] }
      end
    end
    pages_for_dataset_response
  end

  def dataset_size(dataset_id)
    # Get the size of the dataset so we can compare it against the cardinality when creating cards
    @dataset_size ||= begin
      JSON.parse(
        CoreServer::Base.connection.get_request("/id/#{dataset_id}?%24query=select+count(0)")
      )[0]['count_0'].to_i
    rescue CoreServer::Error => e
      Rails.logger.error(
        'Core server error while retrieving dataset size of dataset ' \
        "(#{dataset_id}): #{e}"
      )
      nil
    end
  end

end
