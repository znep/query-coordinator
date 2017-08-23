# Wrapper around page metadata.
class PageMetadataManager

  include CommonMetadataMethods
  include CommonMetadataTransitionMethods
  include ApplicationHelper

  attr_accessor :column_field_name

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

  def merge_new_card_data_with_default(field_name, card_type, cardinality = nil)
    V1_CARD_TEMPLATE.deep_dup.merge(
      'fieldName' => field_name,
      'cardType' => card_type
    )
  end

  # This is where we poke spandex to index the dataset so search cards can autocomplete
  def request_soda_fountain_secondary_index(dataset_id, options = {})
    secondary_group_identifier = APP_CONFIG.secondary_group_identifier
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

    # Emit the stupid troublesome metrics.
    log_datalens_access(id)

    begin
      result = data_lens_manager.fetch(id)
    rescue
      result = nil
    end

    case result[:displayType]
      when 'data_lens'
        page_metadata = result[:displayFormat][:data_lens_page_metadata].with_indifferent_access
      else
        raise "data lens #{id} is backed by metadb but is not of display type data_lens. DisplayType: #{result[:displayType]}"
    end
    page_metadata = ensure_page_metadata_properties(page_metadata)

    # Migrate page metadata to the newest schema version before serving to client.
    page_metadata = migrated_page_metadata(page_metadata, options)

    page_metadata[:permissions] = permissions.stringify_keys!
    page_metadata[:moderationStatus] = result[:moderationStatus]
    page_metadata[:shares] = View.new(result).shares
    page_metadata[:rights] = result[:rights]
    page_metadata[:provenance] = result[:provenance]
    page_metadata[:ownerId] = result[:owner][:id]
    page_metadata[:ownerDisplayName] = result[:owner][:displayName]

    page_metadata
  end

  # Creates a new page
  def create(page_metadata, options = {})
    metadata = page_metadata.with_indifferent_access

    unless metadata.key?('datasetId')
      raise Phidippides::NoDatasetIdException.new('cannot create page with no dataset id')
    end

    unless metadata.key?('cards')
      raise Phidippides::NoCardsException.new('no cards entry on page metadata')
    end

    initialize_metadata_key_names

    # Make sure that there is a table card
    has_table_card = metadata['cards'].any? do |card|
      card['fieldName'] == '*' || card['cardType'] == 'table'
    end

    metadata['cards'] << table_card unless has_table_card

    # The core lens id for this page is the same one we use to refer to it in phidippides
    new_page_id = data_lens_manager.create(dataset_category(metadata['datasetId']), metadata)

    metadata['pageId'] = new_page_id

    unless metadata['isFromDerivedView']
      update_metadata_rollup_table(metadata, options)
      if contains_search_cards?(metadata)
        request_soda_fountain_secondary_index(metadata['datasetId'], options)
      end
    end

    { :body => metadata, :status => 200 }
  end

  # Updates an existing page - if the page is using metadb for its metadata, update metadb.
  # Else update the Phiddy metadata.
  # Note that the update will simply overwrite the existing value with the
  # given value, so any missing keys will become missing in the datastore.
  def update(page_metadata, options = {})
    if page_metadata['datasetId'].blank?
      raise Phidippides::NoDatasetIdException.new('cannot create page with no dataset id')
    end
    if page_metadata['pageId'].blank?
      raise Phidippides::NoPageIdException.new('cannot create page with no page id')
    end

    initialize_metadata_key_names

    begin
      metadb_metadata = data_lens_manager.fetch(page_metadata['pageId'])
    rescue
      metadb_metadata = nil
    end

    metadb_metadata['provenance'] = page_metadata['provenance']
    strip_page_metadata_properties!(page_metadata)

    # Update the name and description of the lens in metadb.
    # Note that this *only* affects the lenses name and description, *not*
    # the page_metadata in displayFormat.
    data_lens_manager.update(page_metadata['pageId'],
      :name => page_metadata['name'],
      :description => page_metadata['description']
    )
    if contains_search_cards?(page_metadata)
      request_soda_fountain_secondary_index(page_metadata['datasetId'], options)
    end
    update_metadb_page_metadata(page_metadata, metadb_metadata, options)
  end

  def delete(id, options = {})
    begin
      metadb_metadata = data_lens_manager.fetch(id)
    rescue CoreServer::TimeoutError => error
      report_error('Core server timeout error', error)
      return { body: {
        body: "Core server timeout error (#{error.error_code}): #{error.error_message}"
      }, status: '500' }
    rescue CoreServer::ConnectionError => error
      report_error('Core server connection error', error)
      return { body: {
        body: "Core server connection error (#{error.error_code}): #{error.error_message}"
      }, status: '500' }
    end

    # Delete the core pointer to the page.
    # Don't delete metadata from metadb; since the entry in the lenses table
    # is already marked as soft-deleted (deleted_at), we can ignore the metadata
    # rather than deleting it.
    begin
      View.delete(id)
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

    page_metadata = metadb_metadata['displayFormat']['data_lens_page_metadata']

    unless page_metadata['isFromDerivedView']
      # Delete any rollups created for the page
      response = soda_fountain.delete_rollup_table(
        dataset_id: page_metadata['datasetId'],
        identifier: id
      )
      if response.fetch(:status) !~ /^2[0-9][0-9]$/
        report_error("Error deleting rollup table for page #{id}: #{response.inspect}")
      end
    end

    { body: '', status: '200' }
  end

  def build_rollup_soql(page_metadata, columns, cards)
    normalized_columns = transformed_columns(columns)

    # Get cards info, specifically the field names
    column_chart_rollups = cards.
      select { |card| card['cardType'] == 'column' }.
      pluck(column_field_name).
      uniq

    choropleth_rollups = cards.
      select { |card| card['cardType'] == 'choropleth' }.
      pluck('computedColumn').
      uniq

    # Nothing to roll up
    return if column_chart_rollups.blank? &&
      choropleth_rollups.blank? &&
      columns_to_roll_up_by_date_trunc(normalized_columns, cards).blank? &&
      cards.select { |card| card['cardType'] == 'histogram' }.empty?

    rolled_up_columns_soql = (
      column_chart_rollups +
      choropleth_rollups +
      date_trunc_column_queries(page_metadata['datasetId'], cards) +
      bucketed_column_queries(page_metadata['datasetId'], cards)
    ).compact.join(', ')

    aggregation_clause = cards_aggregation_clause(page_metadata)
    "select #{rolled_up_columns_soql}, #{aggregation_clause} group by #{rolled_up_columns_soql}"
  end

  # Phidippides call for the dataset metadata - needed to fetch columns for both
  # metadb and phidippides backed page metadata.
  def fetch_dataset_columns(dataset_id, options)
    begin
      dataset_metadata = fetch_dataset_metadata(dataset_id, options)
    rescue => ex
      Rails.logger.error(ex)
      raise Phidippides::NoDatasetMetadataException.new(
        "could not fetch dataset metadata for id: #{dataset_id}"
      )
    end

    dataset_metadata.fetch('columns')
  end

  def migrated_page_metadata(page_metadata, options)
    page_metadata = HashWithIndifferentAccess.new(page_metadata)
    return page_metadata unless enable_data_lens_page_metadata_migrations?

    version = page_metadata[:version]
    return page_metadata unless version.present?

    migrations = DataLensMigrations.active_migrations
    return page_metadata unless migrations.present?

    while version < migrations.keys.max do
      version += 1
      migration = migrations[version]

      begin
        page_metadata = migration.call(page_metadata, options)
      rescue DataLensMigrations::DataLensMigrationException => exception
        Airbrake.notify(exception)
        Rails.logger.error(exception)
        version -= 1
        break
      end
    end

    page_metadata[:version] = version

    page_metadata
  end

  # Page metadata keys we don't want in the inner page_metadata
  def self.keys_to_skip
    %w(permissions moderationStatus shares rights displayType provenance ownerId parentLensId)
  end

  def page_metadata_from_vif(vif, vif_lens_id, permissions)
    page_metadata = {
      :sourceVif => vif,
      :datasetId => vif[:datasetUid],
      :cards => [card_from_vif(vif)],
      :description => vif[:description],
      :name => vif[:title],
      :pageId => vif_lens_id,
      :permissions => permissions,
      :primaryAggregation => vif[:aggregation][:function],
      :primaryAmountField => vif[:aggregation][:field],
      :version => 4
    }.with_indifferent_access

    page_metadata
  end

  private

  # When page metadata is returned from metadb, null-valued properties may be
  # stripped out. We should ensure that properties are present by supplying nil
  # defaults where needed. This doesn't affect the phidippides read path.
  # See https://docs.google.com/document/d/1IE-vWpY-HzHvxwWRh6XRny10BOZXcbTpjUG4Lm8ObV8
  # for the set of properties to check.
  def ensure_page_metadata_properties(metadata)
    metadata[:primaryAggregation] ||= nil
    metadata[:primaryAmountField] ||= nil

    if metadata[:version] >= 4
      metadata[:cards].each { |card|
        card[:aggregationField] ||= nil
        card[:aggregationFunction] ||= nil
      }
    end

    metadata
  end

  def initialize_metadata_key_names
    @column_field_name = 'fieldName'
  end

  # Strip out outer keys we don't want in the inner page_metadata
  def strip_page_metadata_properties!(page_metadata)
    self.class.keys_to_skip.each do |property|
      page_metadata.delete(property)
    end
  end

  # NOTE - currently this is "last write wins", meaning that if multiple users are editing the
  # metadata at the same time, the last one to save will obliterate any changes other users
  # may have made. This should be fixed with versioning within the metadata.
  def update_metadb_page_metadata(page_metadata, metadb_metadata, options)
    strip_page_metadata_properties!(page_metadata)

    unless page_metadata['isFromDerivedView']
      update_metadata_rollup_table(page_metadata, options)
    end

    url = "/views/#{CGI::escape(metadb_metadata['id'])}.json"
    payload = { :displayFormat => { :data_lens_page_metadata => page_metadata } }

    # We have to fake the status code 200 because the consumer of page_metadata_manager expects
    # a response with a body and a status (because we previously forwarded the status code from
    # Phidippides).
    # Since we didn't raise an exception by this point, we can assume a status of 200.
    {
      :body => CoreServer::Base.connection.update_request(url, JSON.dump(payload)),
      :status => 200
    }
  end

  def update_metadata_rollup_table(page_metadata, options = {})
    page_id = page_metadata['pageId']
    dataset_id = page_metadata.fetch('datasetId')
    cards = page_metadata['cards']
    columns = fetch_dataset_columns(dataset_id, options)
    rollup_soql = build_rollup_soql(page_metadata, columns, cards)

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

  # This is pulled from datasetPrecision calculation in TimelineChartController
  # If the max date is > 20 years after the start date: YEAR
  # If the max date is > 1 year after the start date: MONTH
  # Else: DAY
  def date_trunc_function_for_time_range(days)
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

  # Collects all timeline charts, uses a heuristic to determine the optimal
  # date trunc function for each, creates a rollup query clause, and
  # dedupes the resulting array.
  def date_trunc_column_queries(dataset_id, cards)
    cards.select { |card| card['cardType'] == 'timeline' }.
      map do |card|
        field_name = card['fieldName']
        days = time_range_in_column(dataset_id, field_name)
        date_trunc_function = date_trunc_function_for_time_range(days)
        "#{date_trunc_function}(#{field_name})"
      end.
      uniq
  end

  # Returns an array of strings containing fragments of SoQL queries for
  # retrieving bucketed data. Used by build_rollup_soql to construct rollup
  # tables for distribution charts. We call uniq at the end because there
  # could be multiple cards for the same column using identical bucketing
  # functions.
  def bucketed_column_queries(dataset_id, cards)
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

  def cards_aggregation_clause(page_metadata)
    result = page_metadata[:cards].map do |card|
      func = card['aggregationFunction']
      field = card['aggregationField']
      if func && field
        "#{func}(#{field})"
      else
        nil
      end
    end

    #if no card aggregation, use the default page metadata aggregation
    #if no page aggregation metadata, then default to count(*)

    if page_metadata['primaryAggregation'].present? && page_metadata['primaryAmountField'].present?
      page_aggregation = "#{page_metadata['primaryAggregation']}(#{page_metadata['primaryAmountField']}) as COLUMN_ALIAS_GUARD__VALUE"
      result << page_aggregation
    else
      result << 'count(*) as COLUMN_ALIAS_GUARD__VALUE'
    end

    result.compact.uniq.join(', ')
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

  def card_from_vif(vif)
    configuration = vif.try(:[], :configuration) || {}

    card = {
      :activeFilters => [],
      :cardOptions => {},
      :cardSize => 1,
      :cardType => card_type_from_vif(vif),
      :expanded => true,
      :fieldName => vif[:columnName],
      # Not all VIFs will have a :computedColumnName property, which
      # lives in the :configuration hash.
      #
      # The frontend may still assume this property is always present
      # and that it can be null, so we override nil to ensure that we
      # always output a value even if we don't have one on the input.
      :computedColumn => configuration[:computedColumnName],
      :aggregationFunction => vif[:aggregation][:function],
      :aggregationField => vif[:aggregation][:field]
    }.with_indifferent_access

    # histograms will figure out what bucketType it thinks is best, but we need to pass it in
    # explicity to polaroid if we want it to respect the saved bucketType
    if vif[:type] == 'histogramChart'
      card[:bucketType] = configuration[:bucketType]
    end

    card
  end

  def card_type_from_vif(vif)
    case vif[:type]
      when 'columnChart' then 'column'
      when 'histogramChart' then 'histogram'
      when 'timelineChart' then 'timeline'
      when 'choroplethMap' then 'choropleth'
      when 'featureMap' then 'feature'
      else raise ArgumentError.new "unrecognized vif[:type]: #{vif[:type]}"
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

  def data_lens_manager
    @data_lens_manager ||= DataLensManager.new
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

  def enable_data_lens_page_metadata_migrations?
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:enable_data_lens_page_metadata_migrations]
  end

  # NOTE; Current method of tracking view counts for catalog search and site analytics page.
  def log_datalens_access(fxf_id)
    # DataLens pages are unusual in that the metadata is not requested
    # from core on load; which bypasses the common ViewService metrics accounting. We need to track
    # several things in balboa for DataLens.
    #  1. Access by domain and 4x4
    #  2. Total access for domain for all views, datalens included
    #  3. Access by 4x4
    # These are used in different ways to populate and sort catalog entries. The following corresponds to
    # the logAction method within core server. We add a new metric, "datalens-loaded" to make these requests
    # distinct w/in the domain entity
    domainId = CurrentDomain.domain.id.to_s
    MetricQueue.instance.push_metric(fxf_id.to_s, "view-loaded", 1)
    MetricQueue.instance.push_metric(domainId, "view-loaded", 1)
    MetricQueue.instance.push_metric(domainId, "datalens-loaded", 1)
    MetricQueue.instance.push_metric("views-loaded-" + domainId, "view-" + fxf_id.to_s, 1)
  end

  def contains_search_cards?(page_metadata)
    page_metadata['cards'].any? { |card| card['cardType'] == 'search' }
  end

end
