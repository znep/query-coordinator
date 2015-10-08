class StandaloneVisualizationManager

  # dataset_id: of the underlying dataset
  def create(vif, category, dataset_id, is_official, options = {})
    # where do we say whether it's official?
    map_types = %w(choroplethMap featureMap)
    chart_types = %w(columnChart histogramChart timelineChart)
    display_type = 'data_lens_chart' if chart_types.include? vif['type']
    display_type = 'data_lens_map' if map_types.include? vif['type']
    unless display_type
      raise "unknown vif['type']: #{vif['type']}"
    end
    # save VIF in core
    payload = {
      :name => vif[:title],
      :description => vif[:description],
      :metadata => {
        :availableDisplayTypes => ['data_lens'],
        :jsonQuery => {}
      },
      :displayType => display_type,
      :displayFormat => {
        :visualization_interchange_format_v1 => JSON.dump(vif)
      },
      :query => {},
      :flags => ['default'], # ???
      :id => dataset_id,
      :originalViewId => dataset_id,
      :category => category
    }
    # if is_official, save provenance as OFFICIAL. otherwise provenance column is left blank (null in DB)
    if is_official
      payload[:provenance] = 'OFFICIAL'
    end
    core_result = CoreServer::Base.connection.create_request('/views', JSON.dump(payload))
    parsed_core_result = JSON.parse(core_result).with_indifferent_access

    # create rollup table for vif
    rollup_soql = build_rollup_soql(vif, parsed_core_result[:id], options)
    rollup_options = {
      :dataset_id => vif[:datasetUid],
      :identifier => parsed_core_result[:id],
      :soql => rollup_soql,
      :cookies => options[:cookies],
      :request_id => options[:request_id]
    }
    SodaFountain.new.create_or_update_rollup_table(rollup_options)

    {id: parsed_core_result[:id]}
  end

  def build_rollup_soql(vif, vif_lens_id, options)
    page_metadata = page_metadata_from_vif(vif, vif_lens_id, nil)
    page_metadata_manager = PageMetadataManager.new
    columns = page_metadata_manager.fetch_dataset_columns(vif[:datasetUid], options).select do |col_name, col_info|
      col_name == vif[:columnName]
    end
    page_metadata_manager.build_rollup_soql(page_metadata, columns, page_metadata[:cards])
  end

  def page_metadata_from_vif(vif, vif_lens_id, permissions)
    page_metadata = {
      :datasetId => vif[:datasetUid],
      :cards => [card_from_vif(vif)],
      :defaultDateTruncFunction => nil,
      :description => vif[:description],
      :displayType => display_type_from_vif(vif),
      :largestTimeSpanDays => nil,
      :name => vif[:title],
      :pageId => vif_lens_id,
      :permissions => permissions,
      :primaryAggregation => vif[:aggregation][:function],
      :primaryAmountField => vif[:aggregation][:columnName],
      :version => 1
    }.with_indifferent_access

    # update_metadata_date_trunc(page_metadata)
    page_metadata
  end

  private

  def card_from_vif(vif)
    {
      :activeFilters => [],
      :cardOptions => {},
      :cardSize => 1,
      :cardType => card_type_from_vif(vif),
      :expanded => true,
      :fieldName => vif[:columnName]
    }.with_indifferent_access
  end

  def display_type_from_vif(vif)
    case vif[:type]
      when 'columnChart', 'histogramChart', 'timelineChart'
        'data_lens_chart'
      when 'choroplethMap', 'featureMap'
        'data_lens_map'
      else
        raise ArgumentError.new "unrecognized vif[:type]: #{vif[:type]}"
    end
  end

  def card_type_from_vif(vif)
    case vif[:type]
      when 'columnChart'
        'column'
      when 'histogramChart'
        'histogram'
      when 'timelineChart'
        'timeline'
      when 'choroplethMap'
        'choropleth'
      when 'featureMap'
        'feature'
      else
        raise ArgumentError.new "unrecognized vif[:type]: #{vif[:type]}"
    end
  end

end
