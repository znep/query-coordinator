# Wrapper around the phidippides service, for functions related to page metadata.
# Also handles managing rollup tables in soda fountain.
class PageMetadataManager
  CARD_TEMPLATE = {
    'fieldName' => nil,
    'cardSize' => 1,
    'cardCustomStyle' => {},
    'expandedCustomStyle' => {},
    'displayMode' => 'visualization',
    'expanded' => false,
  }.freeze

  # Creates a new page
  def create(data, options = {})
    data = JSON.parse(data) if data.is_a?(String)
    # Make sure that there is a table card
    if data['cards'].present?
      table_card = data['cards'].find do |card|
        card['fieldName'] == '*' || card['cardType'] == 'table'
      end
      unless table_card
        table_card = CARD_TEMPLATE.deep_dup
        table_card.merge!(
          'fieldName' => '*',
          'cardSize' => 2,
          'cardType' => 'table',
        )
        data['cards'] << table_card
      end
    end

    result = create_or_update(data, :create_page_metadata, options)
    if result && result['body']
      new_view_manager.create(
        result['body']['pageId'],
        result['body']['name'],
        result['body']['description']
      )
    end
    result
  end

  # Updates an existing page.
  # Note that phidippides will simply overwrite the existing value with the given value, so any
  # missing keys will become missing in the datastore.
  def update(data, options = {})
    create_or_update(data.is_a?(String) ? JSON.parse(data) : data, :update_page_metadata, options)
  end

  private

  # Creates or updates a page. This takes care of updating phidippides, as well as the rollup tables
  # in soda fountain.
  def create_or_update(json, method, options = {})
    result = phidippides.send(method, json, options)
    if result.fetch(:status) == '200'
      rollup_soql = build_rollup_soql(json, options)
      # if we can roll up anything for this query, do so
      if rollup_soql
        page_id = result.fetch(:body).fetch(:pageId)
        args = {
          dataset_id: json.fetch('datasetId'),
          rollup_name: page_id,
          page_id: page_id,
          soql: rollup_soql
        }
        args.reverse_merge!(options)
        update_rollup_table(args)
      end
    end
    result
  end

  def update_rollup_table(args)
    response = soda_fountain.create_or_update_rollup_table(args)
    if response[:status] != 204
      Rails.logger.warn("Unable to update rollup table for page #{args.fetch(:page_id)} due to error: #{response.inspect}")
    end
  end

  def build_rollup_soql(page_metadata, options = {})
    result = phidippides.fetch_dataset_metadata(page_metadata['datasetId'], options)
    columns = result.fetch(:body).fetch(:columns)
    soql = 'select '
    # TODO Figure out how to deal with time which can aggregated at different levels of granularity (e.g. day, week, month)
    # TODO Need to consider the construction of the WHERE clause for page's default filter
    columns.select! do |column|
      card_matches_column = page_metadata['cards'].any? { |card| card['fieldName'] == column['name'] }
      card_matches_column &&
        (column['logicalDatatype'] == 'category' ||
        (column['logicalDatatype'] == 'location' && column['physicalDatatype'] == 'number'))
    end

    # Nothing to roll up
    return if columns.blank?

    soql << columns.pluck('name').join(', ')
    soql << ', count(*) as value ' # TODO This will have to respect different aggregation functions, i.e. "sum"
    soql << 'group by '
    soql << columns.pluck('name').join(', ')
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
