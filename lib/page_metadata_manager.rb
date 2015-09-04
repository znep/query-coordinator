# Wrapper around page metadata - metadata stored in both Phidippides and Metadb.
class PageMetadataManager

  include CommonMetadataMethods
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
    V1_CARD_TEMPLATE.deep_dup.merge(
      'fieldName' => field_name,
      'cardType' => card_type
    )
  end

  def request_soda_fountain_secondary_index(dataset_id, options = {})
    secondary_group_identifier = APP_CONFIG['secondary_group_identifier']
    unless secondary_group_identifier.blank?
      soda_fountain_secondary = SodaFountain.new(path: '/dataset-copy')
      options = options.merge(
        dataset_id: dataset_id,
        identifier: secondary_group_identifier,
        verb: :post
      )
      response = soda_fountain_secondary.issue_request(options)
      if response.fetch(:status) !~ /^2[0-9][0-9]$/
        report_error(
          "Error requesting secondary index for #{dataset_id} - \n" +
          "secondary group identifier #{secondary_group_identifier}"
        )
      end
    end
  end

  # Retrieve page metadata
  def show(id, options = {})
    # Inherit the permissions from the catalog entry that points to this page.
    permissions = fetch_permissions(id)

    begin
      result = new_view_manager.fetch(id)
    rescue
      result = nil
    end

    if is_backed_by_metadb?(result)
      page_metadata = result[:displayFormat][:data_lens_page_metadata]
      page_metadata = ensure_page_metadata_properties(page_metadata)
      page_metadata['permissions'] = permissions.stringify_keys!
      page_metadata
    else
      result = phidippides.fetch_page_metadata(id, options)

      if result[:status] !~ /^2[0-9][0-9]$/
        return { body: { body: 'Not found' }, status: '404' }
      end

      page_metadata = result[:body]
      page_metadata['permissions'] = permissions.stringify_keys! if page_metadata
      page_metadata
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

    initialize_metadata_key_names

    v2_data_lens = FeatureFlags.derive(nil, defined?(request) ? request : nil)[:create_v2_data_lens]

    # The core lens id for this page is the same one we use to refer to it in phidippides
    new_page_id = new_view_manager.create(
      page_metadata,
      dataset_category(page_metadata['datasetId']),
      v2_data_lens
    )

    page_metadata['pageId'] = new_page_id

    # Make sure that there is a table card
    has_table_card = page_metadata['cards'].any? do |card|
      card['fieldName'] == '*' || card['cardType'] == 'table'
    end

    page_metadata['cards'] << table_card unless has_table_card

    result = v2_data_lens ?
      { :body => page_metadata, :status => 200 } :
      update_phidippides_page_metadata(page_metadata, options)

    if result[:status] == '200'
      request_soda_fountain_secondary_index(page_metadata['datasetId'], options)
    end

    result
  end

  # Updates an existing page - if the page is using metadb for its metadata, update metadb.
  # Else update the Phiddy metadata.
  # Note that the update will simply overwrite the existing value with the
  # given value, so any missing keys will become missing in the datastore.
  def update(page_metadata, options = {})
    raise Phidippides::NoDatasetIdException.new('cannot create page with no dataset id') unless page_metadata['datasetId'].present?
    raise Phidippides::NoPageIdException.new('cannot create page with no page id') unless page_metadata['pageId'].present?

    initialize_metadata_key_names

    begin
      metadb_metadata = new_view_manager.fetch(page_metadata['pageId'])
    rescue
      metadb_metadata = nil
    end

    new_view_manager.update(page_metadata['pageId'], {
      :name => page_metadata['name'],
      :description => page_metadata['description']
    })

    if is_backed_by_metadb?(metadb_metadata)
      update_metadb_page_metadata(page_metadata, metadb_metadata)
    else
      # TODO: verify that phidippides does auth checks for this
      update_phidippides_page_metadata(page_metadata, options)
    end
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

    begin
      metadb_metadata = new_view_manager.fetch(id)
    rescue
      metadb_metadata = nil
    end

    # Check if metadata is stored in metadb or phiddy. If phiddy, we need to actually delete
    # the phidippides metadata.
    # In either case, we need to pluck the dataset id so that we can remove the rollup tables
    # from soda fountain.
    if is_backed_by_metadb?(metadb_metadata)
      dataset_id = metadb_metadata['displayFormat']['data_lens_page_metadata']['datasetId']
      # Don't delete metadb-backed metadata from metadb. Since the entry in the lenses table
      # is already marked as soft-deleted (deleted_at), we can ignore the metadb entry rather
      # than deleting it.
      response = { body: '', status: '200' }
    else
      # Delete the actual page
      # Need to get the page_metadata in order to get the dataset_id
      page_metadata = phidippides.fetch_page_metadata(id, options)
      dataset_id = page_metadata.fetch(:body, {}).fetch(:datasetId)
      if page_metadata[:status] !~ /^2[0-9][0-9]$/
        return { body: { body: 'Not found' }, status: '404' }
      end
      begin
        phidippides_response = phidippides.delete_page_metadata(id, options)
      rescue Phidippides::ConnectionError => error
        report_error('Phidippides connection error on delete', error)
        return { body: {
          body: "Phidippides connection error on delete (#{error.error_code}): #{error.error_message}"
        }, status: '500' }
      end
      if phidippides_response.fetch(:status) !~ /^2[0-9][0-9]$/
        report_error("Error deleting page #{id} in phidippides: #{phidippides_response.inspect}")
        return phidippides_response
      end
      response = phidippides_response
    end

    # Delete any rollups created for the page
    response = soda_fountain.delete_rollup_table(
      dataset_id: dataset_id,
      identifier: id
    )
    if response.fetch(:status) !~ /^2[0-9][0-9]$/
      report_error("Error deleting rollup table for page #{id}: #{response.inspect}")
    end

    response
  end

  private

  # Examine the given metadata and determine whether it has the hallmarks which
  # indicate that the complete page metadata is stored in in metadb.
  # If this method returns false, we assume that phiddy holds the page metadata.
  def is_backed_by_metadb?(metadb_page_metadata)
    return false if metadb_page_metadata.nil?

    has_metadb_display_type = metadb_page_metadata[:displayType] == 'data_lens'
    # future work may check other properties and &&-together on the line below
    has_metadb_display_type
  end

  # When page metadata is returned from metadb, null-valued properties may be
  # stripped out. We should ensure that properties are present by supplying nil
  # defaults where needed. This doesn't affect the phidippides read path.
  # See https://docs.google.com/document/d/1IE-vWpY-HzHvxwWRh6XRny10BOZXcbTpjUG4Lm8ObV8
  # for the set of properties to check.
  def ensure_page_metadata_properties(metadata)
    metadata[:primaryAggregation] ||= nil
    metadata[:primaryAmountField] ||= nil
    metadata[:largestTimeSpanDays] ||= nil
    metadata
  end

  def initialize_metadata_key_names
    @column_field_name = 'fieldName'
    @logical_datatype_name = 'fred'
  end

  # Creates or updates a metadb backed page.
  # NOTE - currently this is "last write wins", meaning that if multiple users are editing the
  # metadata at the same time, the last one to save will obliterate any changes other users
  # may have made. This should be fixed with versioning within the metadata.
  def update_metadb_page_metadata(page_metadata, metadb_metadata)
    url = "/views/#{CGI::escape(metadb_metadata['id'])}.json"
    payload = {
      :displayFormat => {
        :data_lens_page_metadata => page_metadata
      }
    }

    # We have to fake the status code 200 because the consumer of page_metadata_manager expects
    # a response with a body and a status (because we previously forwarded the status code from
    # Phidippides).
    # Since we didn't raise an exception by this point, we can assume a status of 200.
    {
      :body => CoreServer::Base.connection.update_request(url, JSON.dump(payload)),
      :status => 200
    }

  end

  # Creates or updates a Phidippides backed page. This takes care of updating phidippides, as well
  # as rollup tables in soda fountain and the core datalens link.
  def update_phidippides_page_metadata(page_metadata, options = {})
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
          identifier: page_id,
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
    result[:body] = page_metadata

    result
  end

  def build_rollup_soql(page_metadata, columns, cards, options = {})
    non_date_card_types_for_rollup = %w{column choropleth}
    normalized_columns = transformed_columns(columns)

    columns_to_roll_up = cards.
      select { |card| non_date_card_types_for_rollup.include?(card['cardType']) }.
      pluck(column_field_name)

    # Nothing to roll up
    return if columns_to_roll_up.blank? &&
      columns_to_roll_up_by_date_trunc(normalized_columns, cards).blank? &&
      cards.select { |card| card['cardType'] == 'histogram' }.empty?

    if columns_to_roll_up_by_date_trunc(normalized_columns, cards).any? &&
      page_metadata['defaultDateTruncFunction'].blank?
        raise Phidippides::NoDefaultDateTruncFunction.new(
          "page does not have default date trunc function set for pageId: #{page_metadata['pageId']}"
        )
    end

    rolled_up_columns_soql = (
      columns_to_roll_up +
      columns_to_roll_up_by_date_trunc(normalized_columns, cards).map do |field_name|
        "#{page_metadata['defaultDateTruncFunction']}(#{field_name})"
      end +
      bucketed_column_queries(page_metadata['datasetId'], cards)
    ).compact.join(', ')

    aggregation_function = page_metadata['primaryAggregation'] || 'count'
    aggregation_field = page_metadata['primaryAmountField'] || '*'
    aggregation_clause = "#{aggregation_function}(#{aggregation_field}) as value"

    soql = 'select '
    soql << rolled_up_columns_soql
    soql << ', '
    soql << aggregation_clause
    soql << ' group by '
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
    columns.map do |key, value|
      value[column_field_name] = key
      value
    end
  end

  def columns_to_roll_up_by_date_trunc(columns, cards)
    columns.select do |column|
      column_used_by_any_card?(column[column_field_name], cards) &&
        column['physicalDatatype'] == 'floating_timestamp'
    end.pluck(column_field_name)
  end

  def column_used_by_any_card?(field_name, cards, card_type = nil)
    cards.any? do |card|
      card['fieldName'] == field_name && (card_type.nil? || card['cardType'] == card_type)
    end
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

    years = (days / 365.25)
    prec = 'y'
    prec << 'm' if years <= 20
    prec << 'd' if years <= 1
    "date_trunc_#{prec}"
  end

  # Returns an array of strings containing fragments of SoQL queries for
  # retrieving bucketed data. Used by build_rollup_soql to construct rollup
  # tables for distribution charts. We call uniq at the end because there
  # could be multiple cards for the same column using identical bucketing
  # functions.
  def bucketed_column_queries(dataset_id, cards)
    logarithmic_threshold = 2000

    cards.select { |card| card['cardType'] == 'histogram' }.map do |card|

      field_name, bucket_type, card_options = card.values_at('fieldName', 'bucketType', 'cardOptions')
      bucket_size = card_options['bucketSize'] if card_options

      # If the bucket type has explicitly been set to logarithmic or the
      # frontend code has specified a logarithmic bucket type, use
      # signed_magnitude_10. Otherwise, if the bucket_size exists, then
      # assume signed_magnitude_linear (the bucket_type may not be "linear"
      # because the bucket type may not be explicitly set). Otherwise, there
      # is a high probability that it is a histogram rendering as a column
      # chart, so use the default group by.
      if bucket_size == 'logarithmic' || bucket_type == 'logarithmic'
        next "signed_magnitude_10(#{field_name})"
      elsif bucket_size.is_a? Numeric
        next "signed_magnitude_linear(#{field_name}, #{bucket_size})"
      elsif bucket_type.nil? && bucket_size.nil?
        next field_name
      end
    end.compact.uniq
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
      rescue Phidippides::NoMinMaxInColumnException => error
        report_error("No min and max available for date column: #{column_name}", error)
        nil
      end
    end.compact.max
  end

  def time_range_in_column(dataset_id, field_name)
    result = fetch_min_max_in_column(dataset_id, field_name)
    unless result && result['min'] && result['max']
      raise Phidippides::NoMinMaxInColumnException.new(
        "unable to fetch min and max from dataset_id: #{dataset_id}, field_name: #{field_name}"
      )
    end
    (Date.parse(result['max']) - Date.parse(result['min'])).to_i.abs
  end

  def fetch_min_max_in_column(dataset_id, field_name)
    begin
      JSON.parse(CoreServer::Base.connection.get_request(
        "/id/#{dataset_id}.json?" <<
        URI.encode("$query=select min(#{field_name}) AS min, max(#{field_name}) AS max")
      )).first
    rescue CoreServer::Error => error
      error_msg = "Core server error while retrieving min and max of column #{field_name} " <<
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
