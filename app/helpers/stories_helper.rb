module StoriesHelper

  def is_published_view?
    action_name == 'show'
  end

  def core_attributes
    @core_attributes ||= CoreServer.get_view(@story.uid) || {}
  end

  def user_story_json
    @story.as_json.merge(
      {
        :title => core_attributes['name'] || '',
        :description => core_attributes['description'] || '',
        :permissions => determine_permissions_from_core_attributes
      }
    ).to_json
  end

  def google_font_code_embed
    return unless @story.present?
    raw(Theme.find_by_class_name(@story.theme).try(:google_font_code))
  end

  # Maps the component type stored in the database to the partial used to render it
  def component_partial_name(component_type)
    component_type_mapping = {
      'assetSelector' => 'component_asset_selector',
      'embeddedHtml' => 'component_embedded_html',
      'html' => 'component_html',
      'horizontalRule' => 'component_horizontal_rule',
      'image' => 'component_image',
      'socrata.visualization.classic' => 'component_socrata_visualization_classic',
      'socrata.visualization.choroplethMap' => 'component_socrata_visualization_choropleth_map',
      'socrata.visualization.columnChart' => 'component_socrata_visualization_column_chart',
      'socrata.visualization.table' => 'component_socrata_visualization_table',
      'socrata.visualization.timelineChart' => 'component_socrata_visualization_timeline_chart',
      'socrata.visualization.featureMap' => 'component_socrata_visualization_feature_map',
      'spacer' => 'component_spacer',
      'story.widget' => 'component_story_widget',
      'youtube.video' => 'component_youtube_video'
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
    typeset_component_types = %w{html spacer horizontalRule assetSelector image youtube.video embeddedHtml}
    media_component_types = %w{image youtube.video assetSelector}

    classes = []

    classes << 'component'
    classes << 'typeset' if typeset_component_types.include?(component_type)
    classes << type_to_class_name_for_component_type(component_type)

    if component_type == 'html'
      classes << 'squire-formatted'
    elsif media_component_types.include?(component_type) || component_type.include?('visualization')
      classes << 'component-media'
    end

    classes.join(' ').html_safe
  end

  # Turns component classes into css class names
  # IMPORTANT: Needs to mirror the javascript method typeToClassNameForComponentType
  # Ex: socrata.visualization.columnChart => socrata-visualization-column-chart
  def type_to_class_name_for_component_type(type)
    # replace dots with hyphens
    # turn camelCase into underscores, then dashes
    'component-' + type.gsub(/\./, '-').underscore.dasherize
  end

  def render_site_chrome_header_styles(styles)
    " style=\"background-color: #{styles['$bg-color']}; color: #{styles['$font-color']};\""
  end

  def render_site_chrome_menu_button_styles(styles)
    " style=\"color: #{styles['$font-color']}; border-color: #{styles['$font-color']};\""
  end

  def site_chrome_should_show_header_logo?(content)
    content['logoUrl'].present?
  end

  def site_chrome_should_show_link_1?(content)
    content['link1Url'].present? && content['link1Label'].present?
  end

  def site_chrome_should_show_link_2?(content)
    content['link2Url'].present? && content['link2Label'].present?
  end

  def site_chrome_should_show_link_3?(content)
    content['link3Url'].present? && content['link3Label'].present?
  end

  def site_chrome_should_show_header_menu?(content)
    (
      (content['link1Url'].present? && content['link1Label'].present?) ||
      (content['link2Url'].present? && content['link2Label'].present?) ||
      (content['link3Url'].present? && content['link3Label'].present?)
    )
  end

  def site_chrome_should_show_footer?(content)
    content['footerText']
  end

  def embed_code_iframe_sandbox_allowances
    %w(
      allow-popups
      allow-scripts
    ).join(' ')
  end

  private

  def determine_permissions_from_core_attributes
    grants = core_attributes['grants'] || []

    {
      isPublic: grants.any? { |grant| (grant['flags'] || []).include?('public') }
    }
  end
end
