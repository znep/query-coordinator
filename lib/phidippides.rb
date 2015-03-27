class Phidippides < SocrataHttp

  include CommonMetadataTransitionMethods
  include CardTypeMapping

  class NewPageException < RuntimeError; end
  class PageIdException < RuntimeError; end
  class NoDatasetIdException < RuntimeError; end
  class NoCardsException < RuntimeError; end
  class NoPageIdException < RuntimeError; end
  class NoDefaultDateTruncFunction < RuntimeError; end

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
      error_message = "Unable to determine phidippides connection details " \
        "due to error: #{error}"
      Airbrake.notify(
        :error_class => 'ZookeeperDiscoveryError',
        :error_message => error_message
      )
      Rails.logger.error(error_message)
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
      fetched_response = issue_request(
        :verb => :get,
        :path => "datasets/#{dataset_id}",
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    else
      fetched_response = issue_request(
        :verb => :get,
        :path => "v1/id/#{dataset_id}/dataset",
        :request_id => options[:request_id],
        :cookies => options[:cookies]
      )
    end

    unless fetched_response[:body].blank? || fetched_response[:status] != '200'
      augment_dataset_metadata!(dataset_id, fetched_response[:body])
    end

    fetched_response
  end

  # Given a dataset ID and metadata, this decorate the metadata based on whether
  # there is a migrated old backend dataset available, otherwise it will use a
  # new backend dataset
  def augment_dataset_metadata!(dataset_id, dataset_metadata)
    status = migration_status_or_nil(dataset_id)
    if status.nil?
      backend_view = dataset_view(dataset_id)
    else
      backend_view = dataset_view(status[:obeId])
    end

    mirror_nbe_column_metadata!(backend_view, dataset_metadata) unless backend_view.nil?
  end

  # Given a backend_view and a new backend dataset, this will attempt to
  # decorate the metadata with position and hidden properties
  def mirror_nbe_column_metadata!(backend_view, nbe_dataset)
    backend_view.columns.each do |column|
      if metadata_transition_phase_0?
        nbe_column = nbe_dataset['columns'].detect { |nbe_column| nbe_column[:name] == column.fieldName }
      else
        nbe_column = nbe_dataset[:columns][column.fieldName.to_sym]
      end
      unless nbe_column.nil?
        nbe_column[:position] = column.position
        nbe_column[:hideInTable] = column.flag?('hidden')
      end
    end
    nbe_dataset
  end

  def dataset_view(id)
    begin
      View.find(id)
    rescue => error
      error_message = %Q(Error while retrieving old backend view of "(#{id.inspect}): #{error}")
      Airbrake.notify(
        :error_class => 'DatasetViewError',
        :error_message => error_message
      )
      Rails.logger.warn(error_message)
      nil
    end
  end

  def migration_status_or_nil(id)
    begin
      response = CoreServer::Base.connection.get_request(
        "/migrations/#{id}"
      )
      status = JSON.parse(response).with_indifferent_access
      if status.has_key?(:obeId) && status.has_key?(:nbeId)
        status
      else
        nil
      end
    rescue => error
      error_message = %Q(Error while retrieving migration status of "(#{id.inspect}): #{error}")
      Airbrake.notify(
        :error_class => 'MigrationStatusError',
        :error_message => error_message
      )
      Rails.logger.warn(error_message)
      nil
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
    unless metadata_transition_phase_0?

      dataset_id = dataset_metadata.try(:[], :body).try(:[], :id)

      unless dataset_id.present?
        error_message = "Could not migrate dataset to v1: could not " \
          "determine dataset_id (dataset_metadata: #{dataset_metadata.inspect})."
        Airbrake.notify(
          :error_class => 'DatasetMetadataMigrationError',
          :error_message => error_message
        )
        Rails.logger.error(error_message)
        return
      end

      pages_for_dataset = fetch_pages_for_dataset(dataset_id)

      begin
        first_page_id = pages_for_dataset.try(:[], :body).try(:[], :publisher).try(:first).try(:[], :pageId)
      rescue TypeError => error
        # This TypeError will be recorded by the error condition below in which
        # first_page_id.present? is falsey.
        first_page_id = nil
      end

      if first_page_id.present?
        dataset_metadata[:body][:defaultPage] = first_page_id
        update_dataset_metadata(dataset_metadata[:body].to_json)
      else
        error_message = "Could not migrate dataset to v1: no valid " \
          "publisher pageId found (dataset_metadata: " \
          "#{dataset_metadata.inspect} pages_for_dataset: " \
          "#{pages_for_dataset.inspect})."
        Airbrake.notify(
          :error_class => 'DatasetMetadataMigrationError',
          :error_message => error_message
        )
        Rails.logger.error(error_message)
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
          :error_message => error_message
        )
        Rails.logger.error(error_message)
        return
      end

      columns = dataset_metadata.try(:[], :body).try(:[], :columns)

      unless columns.present?
        error_message = "Could not compute default and available card types " \
          "for dataset: no columns found (dataset_metadata: " \
          "#{dataset_metadata.inspect})."
        Airbrake.notify(
          :error_class => 'DatasetMetadataCardTypeComputationError',
          :error_message => error_message,
        )
        Rails.logger.error(error_message)
        return
      end

      this_dataset_size = get_dataset_size(dataset_id)

      # Note that this mutates the columns in-place.
      columns.each do |field_name, column|
        # Only compute card types for non-system columns
        unless SYSTEM_COLUMN_ID_REGEX.match(field_name)
          column['defaultCardType'] = default_card_type_for(column, this_dataset_size)
          column['availableCardTypes'] = available_card_types_for(column, this_dataset_size)
        end
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
        exclude_non_v1_or_above_pages_in_phase_3!(
          issue_request(
            :verb => :get,
            :path => "v1/id/#{dataset_id}/pages",
            :request_id => options[:request_id],
            :cookies => options[:cookies]
          )
        )
      )
    end
  end

  private

  def normalize_pages_for_dataset_response!(pages_for_dataset_response)

    if pages_for_dataset_response[:status] == '200' &&
      pages_for_dataset_response[:body].present? &&
      (metadata_transition_phase_2? || metadata_transition_phase_3?)

      response_body = pages_for_dataset_response[:body]
      if response_body.respond_to?('values')
        pages_for_dataset_response[:body] = { :publisher => response_body.values, :user => [] }
      end
    end
    pages_for_dataset_response
  end

  def exclude_non_v1_or_above_pages_in_phase_3!(pages_for_dataset_response)

    if pages_for_dataset_response[:status] == '200' &&
      pages_for_dataset_response[:body].present? &&
      metadata_transition_phase_3?

      pages_for_dataset_response[:body].select! do |page_id, page_data|
        page_data[:version].to_i > 0
      end
    end
    pages_for_dataset_response
  end

  def get_dataset_size(dataset_id)
    # Get the size of the dataset so we can compare it against the cardinality
    # when creating cards.
    begin
      core_server_response = CoreServer::Base.connection.get_request(
        "/id/#{dataset_id}?%24query=select+count(0)"
      )
      dataset_size = JSON.parse(core_server_response)[0]['count_0'].to_i
    rescue CoreServer::Error => error
      error_message = "Could not determine dataset size: server error " \
          "(#{error})) (core_server_response: #{core_server_response.inspect})."
      Airbrake.notify(
        :error_class => "DatasetSizeError",
        :error_message => error_message
      )
      Rails.logger.error(error_message)
      # Default to some sufficiently-high dataset size in order to not affect
      # cardinality decisions.
      dataset_size = 5_000_000
    end

    dataset_size
  end

end
