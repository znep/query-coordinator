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

  # Creates a new page
  def create(page_metadata, options = {})
    raise Phidippides::NoDatasetIdException.new('cannot create page with no dataset id') unless page_metadata.key?('datasetId')

    # In metadata transition phase 2 and above we must first provision a new page
    # 4x4 before we can create a new page. The block below accomplishes that in a
    # way that should be transparent outside this method.
    if !metadata_transition_phase_0? && !metadata_transition_phase_1?
      new_page_id_response = phidippides.request_new_page_id
      status = new_page_id_response[:status]
      raise Phidippides::NewPageException.new('could not provision new page id') unless status == '200'
      raise Phidippides::PageIdException.new('cannot specify page id on page creation') if page_metadata.key?('pageId')

      page_metadata['pageId'] = new_page_id_response[:body][:id]
    end

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

    result = create_or_update(:create, page_metadata, options)

    result.with_indifferent_access
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
    if method == :create
      result = phidippides.create_page_metadata(page_metadata, options)
    else
      result = phidippides.update_page_metadata(page_metadata, options)
    end


    if result.fetch(:status) == '200'
      rollup_soql = build_rollup_soql(page_metadata, options)

      # if we can roll up anything for this query, do so
      if rollup_soql

        # In phase 0 or 1 the only way to determine the page id
        # is to check the result of Phidippides.create_page_metadata.
        # In phase 2 the only way to determine the page id is
        # to check the result of Phidippides.request_new_page_id.
        # We need to handle both cases.
        if metadata_transition_phase_0? || metadata_transition_phase_1?
          page_id = result.fetch(:body).fetch(:pageId)
          page_metadata['pageId'] = page_id
        else
          page_id = page_metadata.fetch('pageId')
        end

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

    if method == :create && result.fetch(:status) == '200'
      new_view_manager.create(
        result.fetch(:body).fetch(:pageId),
        page_metadata['name'],
        page_metadata['description']
      )
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
    columns = result.fetch(:body).fetch(:columns)

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
