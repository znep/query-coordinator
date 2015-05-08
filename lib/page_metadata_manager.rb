# Wrapper around the phidippides service, for functions related to page
# metadata. Also handles managing rollup tables in soda fountain.
class PageMetadataManager

  include CommonMetadataTransitionMethods

  attr_accessor :column_field_name, :logical_datatype_name

  V0_CARD_TEMPLATE = {
    'fieldName' => nil,
    'cardSize' => 1,
    'cardCustomStyle' => {},
    'expandedCustomStyle' => {},
    'displayMode' => 'visualization',
    'expanded' => false,
  }.freeze

  V1_CARD_TEMPLATE = {
    'appliedFilters' => [],
    'cardSize' => 1,
    'cardType' => 'invalid',
    'description' => '',
    'expanded' => false,
    'fieldName' => nil,
    'name' => ''
  }.freeze

  def table_card
    merge_new_card_data_with_default('*', 'table').merge('cardSize' => 2)
  end

  def merge_new_card_data_with_default(field_name, card_type, cardinality=nil)
    if metadata_transition_phase_0? || metadata_transition_phase_1?
      V0_CARD_TEMPLATE.deep_dup.merge(
        'fieldName' => field_name,
        'cardinality' => cardinality,
        'cardType' => card_type
      )
    else
      V1_CARD_TEMPLATE.deep_dup.merge(
        'fieldName' => field_name,
        'cardType' => card_type
      )
    end
  end

  # Creates a new page
  def create(page_metadata, options = {})
    unless page_metadata.key?('datasetId')
      raise Phidippides::NoDatasetIdException.new('cannot create page with no dataset id')
    end

    unless page_metadata.key?('cards')
      raise Phidippides::NoCardsException.new('no cards entry on page metadata')
    end

    initialize_metadata_transition_phase_key_names

    # The core lens id for this page is the same one we use to refer to it in
    # phidippides
    new_page_id = new_view_manager.create(
      page_metadata['name'],
      page_metadata['description'],
      dataset_category(page_metadata['datasetId'])
    )

    page_metadata['pageId'] = new_page_id

    # Make sure that there is a table card
    has_table_card = page_metadata['cards'].any? do |card|
      card['fieldName'] == '*' || card['cardType'] == 'table'
    end

    page_metadata['cards'] << table_card unless has_table_card

    update_page_metadata(page_metadata, options)
  end

  # Updates an existing page.
  # Note that phidippides will simply overwrite the existing value with the
  # given value, so any missing keys will become missing in the datastore.
  def update(page_metadata, options = {})
    raise Phidippides::NoDatasetIdException.new('cannot create page with no dataset id') unless page_metadata.key?('datasetId')
    raise Phidippides::NoPageIdException.new('cannot create page with no page id') unless page_metadata.key?('pageId')

    initialize_metadata_transition_phase_key_names

    new_view_manager.update(page_metadata['pageId'], page_metadata['name'], page_metadata['description'])

    # TODO: verify that phidippides does auth checks for this
    update_page_metadata(page_metadata, options)
  end

  def delete(id, options = {})
    # Delete the core pointer to the page
    begin
      result = View.delete(id)
    rescue CoreServer::ResourceNotFound => error
      report_error(
        "Page #{id} not found in core during delete. " +
        'Proceeding with phidippides delete, in case it was an orphaned page.',
        error
      )
    rescue CoreServer::Error => error
      report_error('Core server error', error)
      return { body: {
        body: "Core server error (#{error.error_code}): #{error.error_message}"
      }, status: '500' }
    end

    # Delete the actual page
    # Need to get the page_metadata in order to get the dataset_id
    page_metadata = phidippides.fetch_page_metadata(id, options)
    if page_metadata[:status] !~ /^2[0-9][0-9]$/
      return { body: { body: 'Not found' }, status: '404' }
    end
    begin
      phidippides_response = phidippides.delete_page_metadata(id, options)
    rescue Phidippides::ConnectionError
      return { body: { body: 'Phidippides connection error' }, status: '500' }
    end
    if phidippides_response.fetch(:status) !~ /^2[0-9][0-9]$/
      report_error("Error deleting page #{id} in phidippides: #{phidippides_response.inspect}")
      return phidippides_response
    end

    # Delete any rollups created for the page
    response = soda_fountain.delete_rollup_table(
      dataset_id: page_metadata.fetch(:body, {}).fetch(:datasetId),
      rollup_name: id
    )
    if response.fetch(:status) !~ /^2[0-9][0-9]$/
      report_error("Error deleting rollup table for page #{id}: #{response.inspect}")
    end

    phidippides_response
  end

  private

  def initialize_metadata_transition_phase_key_names
    if metadata_transition_phase_0?
      @column_field_name = 'name'
      @logical_datatype_name = 'logicalDatatype'
    else
      @column_field_name = 'fieldName'
      @logical_datatype_name = 'fred'
    end
  end

  # Creates or updates a page. This takes care of updating phidippides, as well
  # as rollup tables in soda fountain and the core datalens link.
  def update_page_metadata(page_metadata, options = {})
    unless page_metadata['pageId'].present?
      raise Phidippides::NoPageIdException.new('page id must be provisioned first.')
    end
    page_id = page_metadata['pageId']
    dataset_id = page_metadata.fetch('datasetId')
    cards = page_metadata['cards']

    dataset_metadata_result = dataset_metadata(dataset_id, options)
    if dataset_metadata_result.fetch(:status) != '200'
      raise Phidippides::NoDatasetMetadataException.new(
        "could not fetch dataset metadata for id: #{dataset_id}"
      )
    end
    columns = dataset_metadata_result.fetch(:body).fetch('columns')

    update_date_trunc_function(page_metadata, columns, cards, options)

    # Since we provision the page id beforehand, a create is the same as an
    # update.
    result = phidippides.update_page_metadata(page_metadata, options)

    if result.fetch(:status) == '200'
      rollup_soql = build_rollup_soql(page_metadata, columns, cards, options)

      # if we can roll up anything for this query, do so
      if rollup_soql
        args = {
          dataset_id: dataset_id,
          rollup_name: page_id,
          page_id: page_id,
          soql: rollup_soql
        }
        args.reverse_merge!(options)
        update_rollup_table(args)
      end
    end

    # Replace the page metadata in the result, since FlexPhidippides
    # actually will not return the metadata blob that we just posted
    # to it.
    if !metadata_transition_phase_0? && !metadata_transition_phase_1?
      result[:body] = page_metadata
    end

    result
  end

  def build_rollup_soql(page_metadata, columns, cards, options = {})
    non_date_card_types_for_rollup = %w{column choropleth}
    normalized_columns = transformed_columns(columns)

    # TODO Need to consider the construction of the WHERE clause for page's
    # default filter.
    columns_to_roll_up = cards.
      select { |card| non_date_card_types_for_rollup.include?(card['cardType']) }.
      pluck(column_field_name)

    # Nothing to roll up
    return if columns_to_roll_up.blank? && columns_to_roll_up_by_date_trunc(normalized_columns, cards).blank?

    if !metadata_transition_phase_0? &&
      columns_to_roll_up_by_date_trunc(normalized_columns, cards).any? &&
      page_metadata['defaultDateTruncFunction'].blank?
        raise Phidippides::NoDefaultDateTruncFunction.new(
          "page does not have default date trunc function set for pageId: #{page_metadata['pageId']}"
        )
    end

    rolled_up_columns_soql = (columns_to_roll_up +
      columns_to_roll_up_by_date_trunc(normalized_columns, cards).map do |field_name|
        "#{page_metadata['defaultDateTruncFunction']}(#{field_name})"
      end).join(', ')

    soql = 'select '
    # TODO This will have to respect different aggregation functions, i.e. "sum"
    soql << rolled_up_columns_soql
    soql << ', count(*) as value '
    soql << 'group by '
    soql << rolled_up_columns_soql
  end

  def update_date_trunc_function(page_metadata, columns, cards, options)
    # Need to find the largest time nugget for rollups because rollups are not magic
    # We will only be able to roll-up dates on the largest time span. For example,
    # if we have a 3 columns on the page with different date granularities, i.e.
    # one is best displayed by 'y', another by 'ym', and another by 'ymd', we will
    # only be able to show time rolled-up by 'y', the largest time span.
    largest_time_span_days = largest_time_span_in_days_being_used_in_columns(
      columns_to_roll_up_by_date_trunc(transformed_columns(columns), cards),
      page_metadata['datasetId']
    )
    page_metadata['largestTimeSpanDays'] = largest_time_span_days
    page_metadata['defaultDateTruncFunction'] = date_trunc_function(largest_time_span_days)
  end

  def transformed_columns(columns)
    # Since columns is a hash in metadata transition phases 1 and 2
    # (not the array that it was before) we can create an intermediate
    # representation in order to avoid modifying the logic that determines
    # whether a column should be rolled up.
    if metadata_transition_phase_0?
      columns
    else
      columns.map do |key, value|
        value[column_field_name] = key
        value
      end
    end
  end

  def columns_to_roll_up_by_date_trunc(columns, cards)
    if metadata_transition_phase_0?
      []
    else
      columns.select do |column|
        column_used_by_any_card?(column[column_field_name], cards) &&
          column['physicalDatatype'] == 'floating_timestamp'
      end.pluck(column_field_name)
    end
  end

  def column_used_by_any_card?(field_name, cards)
    cards.any? { |card| card['fieldName'] == field_name }
  end

  # This is pulled from datasetPrecision calculation in cardVisualizationTimelineChart
  # If the max date is > 20 years after the start date: YEAR
  # If the max date is > 1 year after the start date: MONTH
  # Else: DAY
  def date_trunc_function(days)
    # Default to the largest granularity if we don't have
    # a time range (possibly because all timestamp columns
    # have no data).
    return 'date_trunc_y' if days.to_i == 0

    years = (days / 365.25).to_i
    prec = 'y'
    prec << 'm' if years <= 20
    prec << 'd' if years <= 1
    "date_trunc_#{prec}"
  end

  def update_rollup_table(args)
    response = soda_fountain.create_or_update_rollup_table(args)

    if response.fetch(:status) != '204'
      Rails.logger.warn(
        "Unable to update rollup table for page #{args.fetch(:page_id)} " \
        "due to error: #{response.inspect}"
      )
    end
  end

  def dataset_metadata(dataset_id, options)
    phidippides.fetch_dataset_metadata(dataset_id, options)
  end

  def largest_time_span_in_days_being_used_in_columns(time_column_names, dataset_id)
    time_column_names.map do |column_name|
      begin
        time_range_in_column(dataset_id, column_name)
      rescue Phidippides::NoMinMaxInDateColumnException => error
        report_error("No min and max available for column: #{column_name}", error)
        nil
      end
    end.compact.max
  end

  def time_range_in_column(dataset_id, field_name)
    result = fetch_min_max_date_in_column(dataset_id, field_name)
    unless result && result['start'] && result['end']
      raise Phidippides::NoMinMaxInDateColumnException.new(
        "unable to fetch min and max from dataset_id: #{dataset_id}, field_name: #{field_name}"
      )
    end
    (Date.parse(result['end']) - Date.parse(result['start'])).to_i.abs
  end

  def fetch_min_max_date_in_column(dataset_id, field_name)
    begin
      JSON.parse(CoreServer::Base.connection.get_request(
        "/id/#{dataset_id}.json?" <<
        URI.encode("$query=select min(#{field_name}) AS start, max(#{field_name}) AS end")
      )).first
    rescue CoreServer::Error => error
      error_msg = "Core server error while retrieving min and max of date column #{field_name} " <<
        "(#{dataset_id}): #{error}"
      Rails.logger.error(error_msg)
      Airbrake.notify(
        :error_class => 'CoreServer::Error',
        :error_message => error_msg
      )
      nil
    end
  end

  def report_error(error_message, exception = nil, options = {})
    Airbrake.notify(
      exception,
      options.merge(
        :error_class => 'PageMetadataManager',
        :error_message => error_message
      )
    )
    Rails.logger.error(error_message)
    nil
  end

  def soda_fountain
    @soda_fountain ||= SodaFountain.new
  end

  def phidippides
    @phidippides ||= Phidippides.new
  end

  def new_view_manager
    @new_view_manager ||= NewViewManager.new
  end

  # Attempt to determine the category for a given dataset. First look in the OBE
  # dataset, then fallback to the NBE dataset, then give up. Since we don't know
  # with certainty that the datasetId passed in here is NBE or OBE, we just fetch
  # it and ask for the migrations and look explicitly for an obeId. It's only then
  # that we can know for sure which flavor of datasetId we're holding.
  def dataset_category(datasetId)
    begin
      ambiguous_dataset = View.find(datasetId)
      begin
        obe_dataset = View.find(ambiguous_dataset.migrations['obeId'])
        dataset_category = obe_dataset.category
      rescue CoreServer::ResourceNotFound
        # If a migration cannot be found for the datasetId, then we know at this
        # point that the datasetId must be for an NBE dataset. Here we try to
        # fallback to the category on NBE dataset. Notwithstanding expecting
        # that the NBE dataset category will be nil anyway.
        dataset_category = ambiguous_dataset.category
      end
    rescue CoreServer::Error => error
      report_error(
        "Core server error while attempting to read dataset metadata for id: #{datasetId}",
        error
      )
    end

    dataset_category
  end

end
