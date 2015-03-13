# Wrapper around the phidippides service, for functions related to page metadata.
# Also handles managing rollup tables in soda fountain.
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
    merge_new_card_data_with_default('*', 'table')
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

    # First provision a new page 4x4, so we can let the data lens know what to point to.
    # This is also what we'll have to do in metadata_transition_phase_2 anyway.
    new_page_id = phidippides.request_new_page_id(page_metadata, options)
    raise Phidippides::NewPageException.new('could not provision new page id') unless new_page_id
    page_metadata['pageId'] = new_page_id

    # Make sure that there is a table card
    if page_metadata['cards'].present?

      table_card = page_metadata['cards'].find do |card|
        card['fieldName'] == '*' || card['cardType'] == 'table'
      end

      unless table_card
        if metadata_transition_phase_0? || metadata_transition_phase_1?
          table_card = V0_CARD_TEMPLATE.deep_dup
        else
          table_card = V1_CARD_TEMPLATE.deep_dup
        end

        table_card.merge!(
          'fieldName' => '*',
          'cardSize' => 2,
          'cardType' => 'table',
        )
        page_metadata['cards'] << table_card
      end
    end

    create_or_update(:create, page_metadata, options)
  end

  # Updates an existing page.
  # Note that phidippides will simply overwrite the existing value with the given value, so any
  # missing keys will become missing in the datastore.
  def update(page_metadata, options = {})
    raise Phidippides::NoDatasetIdException.new('cannot create page with no dataset id') unless page_metadata.key?('datasetId')
    raise Phidippides::NoPageIdException.new('cannot create page with no page id') unless page_metadata.key?('pageId')

    create_or_update(:update, page_metadata, options)
  end

  private

  # Creates or updates a page. This takes care of updating phidippides, as well as rollup tables in
  # soda fountain and the core datalens link.
  def create_or_update(method, page_metadata, options = {})
    unless page_metadata['pageId'].present?
      raise Phidippides::NoPageIdException.new('page id must be provisioned first.')
    end
    page_id = page_metadata['pageId']

    # First update the data lens. We do this so that we can save the data_lens_id into the
    # page_metadata, so that next time we need to update the page_metadata, we can also update the
    # data_lens that links to it (and has its own copy of the title/description).
    if method == :create
      data_lens_id = new_view_manager.create(
        page_id,
        page_metadata['name'],
        page_metadata['description']
      )
    else
      # Fetch the existing page, so we can get the id for the data lens.
      result = phidippides.fetch_page_metadata(page_id)
      begin
        data_lens_id = result.fetch(:body, {})[:data_lens_id]
        if data_lens_id
          # Update the data lens
          new_view_manager.update(
            data_lens_id,
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

    page_metadata['data_lens_id'] = data_lens_id

    # Since we provision the page id beforehand, a create is the same as an update
    result = phidippides.update_page_metadata(page_metadata, options)

    if result.fetch(:status) == '200'
      rollup_soql = build_rollup_soql(page_metadata, options)

      # if we can roll up anything for this query, do so
      if rollup_soql
        args = {
          dataset_id: page_metadata.fetch('datasetId'),
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

  def build_rollup_soql(page_metadata, options = {})
    if metadata_transition_phase_0?
      column_field_name = 'name'
      logical_datatype_name = 'logicalDatatype'
    else
      column_field_name = 'fieldName'
      logical_datatype_name = 'fred'
    end

    result = phidippides.fetch_dataset_metadata(page_metadata['datasetId'], options)
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

    # TODO Figure out how to deal with time which can aggregated at different levels of granularity (e.g. day, week, month)
    # TODO Need to consider the construction of the WHERE clause for page's default filter
    columns_to_roll_up = columns.select do |column|
      card_matches_column = page_metadata['cards'].any? { |card| card['fieldName'] == column[column_field_name] }
      card_matches_column &&
        (column[logical_datatype_name] == 'category' ||
        (column[logical_datatype_name] == 'location' && column['physicalDatatype'] == 'number'))
    end

    # Nothing to roll up
    return if columns_to_roll_up.blank?

    soql = 'select '
    soql << columns_to_roll_up.pluck(column_field_name).join(', ')
    soql << ', count(*) as value ' # TODO This will have to respect different aggregation functions, i.e. "sum"
    soql << 'group by '
    soql << columns_to_roll_up.pluck(column_field_name).join(', ')
  end

  def update_rollup_table(args)
    response = soda_fountain.create_or_update_rollup_table(args)

    if response.fetch(:status) != '204'
      Rails.logger.warn("Unable to update rollup table for page #{args.fetch(:page_id)} due to error: #{response.inspect}")
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
