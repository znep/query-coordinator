class PageMetadataManager

  def create(data, options = {})
    create_or_update(data, :create_page_metadata, options)
  end

  def fetch(id, options = {})
    phidippides.fetch_page_metadata(id, options)
  end

  def update(data, options = {})
    create_or_update(data, :update_page_metadata, options)
  end

  def pages_for_dataset(dataset_or_id, options = {})
    dataset_id = nil
    dataset_id ||= dataset_or_id.id if dataset_or_id.respond_to?(:id)
    if dataset_or_id.respond_to?(:key?) && dataset_or_id.with_indifferent_access.key?(:id)
      dataset_id ||= dataset_or_id.with_indifferent_access.fetch(:id)
    end
    dataset_id ||= dataset_or_id
    phidippides.fetch_pages_for_dataset(dataset_id, options)
  end

  private

  def create_or_update(data, method, options = {})
    json = JSON.parse(data)
    result = phidippides.send(method, json, options)
    if result.fetch(:status) == '200'
      page_id = result.fetch(:body).fetch(:pageId)
      args = {
        dataset_id: json.fetch('datasetId'),
        rollup_name: page_id,
        page_id: page_id,
        soql: build_soql(json)
      }
      args.reverse_merge!(options)
      update_soda_fountain(args)
    end
    result
  end

  def update_soda_fountain(args)
    response = soda_fountain.create_or_update_rollup_table(args)
    if response[:status] != 204
      Rails.logger.warn("Unable to update rollup table for page #{args.fetch(:page_id)} due to error: #{response.inspect}")
    end
  end

  def build_soql(page_metadata)
    result = phidippides.fetch_dataset_metadata(page_metadata['datasetId'])
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

end
