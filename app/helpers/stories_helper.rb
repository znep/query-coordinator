module StoriesHelper

  def user_story_json
    @story.as_json.merge(
      {
        :title => core_attributes['name'] || '',
        :description => core_attributes['description'] || ''
      }
    ).to_json
  end

  # Maps the component type stored in the database to the partial used to render it
  def component_partial_name(component_type)
    component_type_mapping = {
      'html' => 'component_html',
      'youtube.video' => 'component_youtube_video',
      'socrata.visualization.columnChart' => 'component_socrata_visualization_column_chart',
      'assetSelector' => 'component_asset_selector'
    }

    if component_type_mapping[component_type].nil?
      raise "Missing partial mapping for component type: #{component_type}"
    end

    "stories/block-components/#{component_type_mapping[component_type]}"
  end

  # Generates classes for component containers
  # Param ex: '6'
  def component_container_classes(column_width)
    classes = []

    classes << 'component-container'
    classes << "col#{column_width}"

    classes.join(' ').html_safe
  end

  # Generates classes for components
  # Param ex: 'youtube.video'
  def component_classes(component_type)
    classes = []

    classes << 'component'
    classes << type_to_class_name_for_component_type(component_type)

    classes.join(' ').html_safe
  end

  # Turns component classes into css class names
  # IMPORTANT: Needs to mirror the javascript method typeToClassNameForComponentType
  # Ex: socrata.visualization.columnChart => socrata-visualization-column-chart
  def type_to_class_name_for_component_type(type)
    # replace dots with hyphens
    # replace capital letters with hyphen+lowercase letter
    'component-' + type.gsub(/\./, '-').underscore.dasherize
  end


  private

  def core_attributes
    CoreServer::get_view(@story.uid, CoreServer::headers_from_request(request)) || {}
  end

end
