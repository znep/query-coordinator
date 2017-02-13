class DisplayFormat < Model

  # We have to write this accessor because data_lens_page_metadata's value is a hash and Model's
  # method_missing tries to instantiate a model for every property whose value is a hash, based
  # on the property's name. We just want access to the value instead of creating a new model.
  def data_lens_page_metadata
    data['data_lens_page_metadata']
  end

  def has_data_lens_metadata?
    data_lens_page_metadata.is_a?(Hash)
  end

  def visualization_canvas_metadata
    metadata = default_visualization_canvas_metadata.
      merge(data.fetch('visualizationCanvasMetadata', {})).
      with_indifferent_access

    restore_required_vif_metadata(metadata)
  end

  def default_visualization_canvas_metadata
    {
      :version => 1,
      :vifs => [],
      :filters => []
    }
  end

  private

  # EN-13706: Core's serialization strips out any properties that have null or "empty" values. For
  # example, if you post this to Core:
  # {
  #   "filters": [],
  #   "columnName": "wombats",
  #   "arguments": null
  # }
  #
  # Core will save only this:
  # {
  #   "columnName": "wombats"
  # }
  #
  # frontend-visualizations assumes that its required properties will always be there and currently
  # cannot gracefully fall back to any defaults. It also has a couple of properties whose values
  # are intentionally null, and not including them will prevent the visualization from rendering.
  #
  # This method is a bandaid to compensate for this disagreement, at least until
  # frontend-visualizations can handle missing properties. Are there other required properties that
  # Core is stripping out? Potentially/probably. Add them here if you run into them.
  def restore_required_vif_metadata(metadata)
    if metadata.fetch(:vifs, []).any? { |vif| vif.dig(:format, :version) != 2 }
      raise ArgumentError.new('Invalid VIF version: must be v2')
    end

    # Clone the metadata
    restored_metadata = {}.merge(metadata).with_indifferent_access

    restored_metadata[:vifs].each do |vif|
      vif[:series] ||= []
      vif[:series].each do |series|
        series[:dataSource] ||= {}
        series[:dataSource][:filters] ||= []

        # Add the missing arguments filter to noop filters
        series[:dataSource][:filters] = restore_noop_filters(series[:dataSource][:filters])
      end
    end

    # Restore missing filters metadata
    restored_metadata[:filters] = restore_noop_filters(restored_metadata[:filters])

    restored_metadata
  end

  def restore_noop_filters(filters)
    filters.map do |filter|
      restored_filter = {}.merge(filter).with_indifferent_access

      if restored_filter[:function] == 'noop'
        restored_filter[:arguments] = nil
      end

      restored_filter
    end
  end
end
