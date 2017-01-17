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
    data.fetch(
      'visualizationCanvasMetadata',
      default_visualization_canvas_metadata
    ).with_indifferent_access
  end

  def default_visualization_canvas_metadata
    {
      :version => 1,
      :vifs => [],
      :filters => []
    }
  end
end
