# Wrapper around the phidippides service, for functions related to page
# metadata. Also handles managing rollup tables in soda fountain.
class PageMetadataManager

  include CommonMetadataTransitionMethods

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

    # First provision a new page 4x4, so we can let the data lens know what to
    # point to.
    # This is also what we'll have to do in metadata_transition_phase_2 anyway.
    new_page_id = phidippides.request_new_page_id(page_metadata, options)
    raise Phidippides::NewPageException.new('could not provision new page id') unless new_page_id
    page_metadata['pageId'] = new_page_id

    # Make sure that there is a table card
    has_table_card = page_metadata['cards'].any? do |card|
      card['fieldName'] == '*' || card['cardType'] == 'table'
    end

    page_metadata['cards'] << table_card unless has_table_card

    create_or_update(:create, page_metadata, options)
  end

  # Updates an existing page.
  # Note that phidippides will simply overwrite the existing value with the
  # given value, so any missing keys will become missing in the datastore.
  def update(page_metadata, options = {})
    raise Phidippides::NoDatasetIdException.new('cannot create page with no dataset id') unless page_metadata.key?('datasetId')
    raise Phidippides::NoPageIdException.new('cannot create page with no page id') unless page_metadata.key?('pageId')

    create_or_update(:update, page_metadata, options)
  end

  private

  # Creates or updates a page. This takes care of updating phidippides, as well
  # as rollup tables in soda fountain and the core datalens link.
  def create_or_update(method, page_metadata, options = {})
    unless page_metadata['pageId'].present?
      raise Phidippides::NoPageIdException.new('page id must be provisioned first.')
    end
    page_id = page_metadata['pageId']
    dataset_id = page_metadata.fetch('datasetId')

    # Data lens page creation disabled until permissions issues have been dealt with
    # catalog_view_it = create_or_update_new_view(method, page_id, page_metadata)
    # page_metadata['catalogViewId'] = catalog_view_id

    # Need to find the largest time nugget for rollups because rollups are not magic
    # We will only be able to roll-up dates on the largest time span. For example,
    # if we have a 3 columns on the page with different date granularities, i.e.
    # one is best displayed by 'y', another by 'ym', and another by 'ymd', we will
    # only be able to show time rolled-up by 'y', the largest time span.

    largest_time_span_days = largest_time_span_in_days_in_dataset(dataset_id, options)
    page_metadata['largestTimeSpanDays'] = largest_time_span_days
    page_metadata['defaultDateTruncFunction'] = date_trunc_function(largest_time_span_days)

    # Since we provision the page id beforehand, a create is the same as an
    # update.
    result = phidippides.update_page_metadata(page_metadata, options)

    if result.fetch(:status) == '200'
      rollup_soql = build_rollup_soql(page_metadata, options)

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

  def create_or_update_new_view(method, page_id, page_metadata)
    # First update the data lens. We do this so that we can save the
    # catalogViewId into the page_metadata, so that next time we need to
    # update the page_metadata, we can also update the catalog view data
    # lens that links to it (and has its own copy of the title/description).
    if method == :create
      catalog_view_id = new_view_manager.create(
        page_id,
        page_metadata['name'],
        page_metadata['description']
      )
    else
      # Fetch the existing page, so we can get the id of the catalog view
      # data lens.
      result = phidippides.fetch_page_metadata(page_id)
      begin
        catalog_view_id = result.fetch(:body, {})[:catalogViewId]
        if catalog_view_id
          # Update the catalog view data lens
          new_view_manager.update(
            catalog_view_id,
            page_metadata['name'],
            page_metadata['description']
          )
        end
      rescue => e
        Airbrake.notify(
          :error_class => "UnexpectedPageMetadataResponseFormat",
          :error_message => "Could not make sense of Phidippides response: " \
            "#{result.inspect} (Error: #{e.inspect})"
        )
      end
    end
    catalog_view_id
  end

  def build_rollup_soql(page_metadata, options = {})
    if metadata_transition_phase_0?
      column_field_name = 'name'
      logical_datatype_name = 'logicalDatatype'
    else
      column_field_name = 'fieldName'
      logical_datatype_name = 'fred'
    end

    result = dataset_metadata(page_metadata['datasetId'], options)
    columns = result.fetch(:body).fetch('columns')

    # Since columns is a hash in metadata transition phases 1 and 2
    # (not the array that it was before) we can create an intermediate
    # representation in order to avoid modifying the logic that determines
    # whether a column should be rolled up.
    if metadata_transition_phase_1? || metadata_transition_phase_2?
      columns = columns.map do |key, value|
        value[column_field_name] = key
        value
      end
    end

    # TODO Need to consider the construction of the WHERE clause for page's
    # default filter.
    cards = page_metadata['cards']
    columns_to_roll_up = columns.select do |column|
      column_used_by_any_card?(column[column_field_name], cards) &&
        (column[logical_datatype_name] == 'category' ||
        (column[logical_datatype_name] == 'location' && column['physicalDatatype'] == 'number'))
    end

    columns_to_roll_up_by_date_trunc = []

    unless metadata_transition_phase_0?
      columns_to_roll_up_by_date_trunc = columns.select do |column|
        column_used_by_any_card?(column[column_field_name], cards) &&
          column['physicalDatatype'] == 'floating_timestamp'
      end
    end

    # Nothing to roll up
    return if columns_to_roll_up.blank? && columns_to_roll_up_by_date_trunc.blank?

    if !metadata_transition_phase_0? &&
      columns_to_roll_up_by_date_trunc.any? &&
        page_metadata['defaultDateTruncFunction'].blank?
          raise Phidippides::NoDefaultDateTruncFunction.new(
            "page does not have default date trunc function set for pageId: #{page_metadata['pageId']}"
          )
    end

    rolled_up_columns_soql = (columns_to_roll_up.pluck(column_field_name) +
      columns_to_roll_up_by_date_trunc.pluck(column_field_name).map do |field_name|
        "#{page_metadata['defaultDateTruncFunction']}(#{field_name})"
      end).join(', ')

    soql = 'select '
    # TODO This will have to respect different aggregation functions, i.e. "sum"
    soql << rolled_up_columns_soql
    soql << ', count(*) as value '
    soql << 'group by '
    soql << rolled_up_columns_soql
  end

  def column_used_by_any_card?(column_field_name, cards)
    cards.any? { |card| card['fieldName'] == column_field_name }
  end

  # This is pulled from datasetPrecision calculation in cardVisualizationTimelineChart
  # If the max date is > 20 years after the start date: YEAR
  # If the max date is > 1 year after the start date: MONTH
  # Else: DAY
  def date_trunc_function(days)
    return unless days

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

  def largest_time_span_in_days_in_dataset(dataset_id, options)
    dataset_metadata(dataset_id, options).fetch(:body).fetch('columns').
      select { |_, values| values['physicalDatatype'] == 'floating_timestamp' }.
      map { |field_name, _| time_range_in_column(dataset_id, field_name) }.compact.max
  end

  def time_range_in_column(dataset_id, field_name)
    result = fetch_min_max_date_in_column(dataset_id, field_name)
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

  def soda_fountain
    @soda_fountain ||= SodaFountain.new
  end

  def phidippides
    @phidippides ||= Phidippides.new
  end

  def new_view_manager
    @new_view_manager ||= NewViewManager.new
  end

end
