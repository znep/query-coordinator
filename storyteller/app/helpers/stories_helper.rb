module StoriesHelper

  def is_published_view?
    action_name == 'show'
  end

  def user_story_json
    @story.as_json.merge(
      {
        :tileConfig => @story_metadata.tile_config,
        :title => @story_metadata.title,
        :description => @story_metadata.description,
        :permissions => @story_metadata.permissions
      }
    ).to_json
  end

  def google_font_code_embed
    return unless @story.present?
    raw(Theme.find_by_class_name(@story.theme).try(:google_font_code))
  end

  def settings_panel_print_story_link
    content_tag('a',
      href: "#{@story_url_for_preview}?print=true",
      class: 'menu-list-item-header',
      role: 'button',
      target: '_blank') do

      yield if block_given?
    end
  end

  def settings_panel_story_stats_link
    content_tag('a',
      href: can_see_story_stats? ? "/d/#{@story.uid}/stats" : nil,
      class: 'menu-list-item-header',
      role: 'button',
      target: '_blank') do

      yield if block_given?
    end
  end

  def settings_panel_help_link
    support_stub = @story_metadata.goal? ? '200161248-Open-Performance' : '202604608-Perspectives'

    content_tag('a',
      href: "https://support.socrata.com/hc/en-us/categories/#{support_stub}",
      class: 'settings-help-link',
      target: '_blank') do

      yield if block_given?
    end
  end

  # Maps the component type stored in the database to the partial used to render it
  def component_partial_name(component_type)
    component_type_mapping = {
      'assetSelector' => 'component_asset_selector',
      'embeddedHtml' => 'component_embedded_html',
      'hero' => 'component_hero',
      'author' => 'component_author',
      'html' => 'component_html',
      'horizontalRule' => 'component_horizontal_rule',
      'image' => 'component_image',
      'socrata.visualization.classic' => 'component_socrata_visualization_classic',
      'socrata.visualization.choroplethMap' => 'component_socrata_visualization_region_map', # legacy
      'socrata.visualization.regionMap' => 'component_socrata_visualization_region_map',
      'socrata.visualization.barChart' => 'component_socrata_visualization_bar_chart',
      'socrata.visualization.columnChart' => 'component_socrata_visualization_column_chart',
      'socrata.visualization.comboChart' => 'component_socrata_visualization_combo_chart',
      'socrata.visualization.histogram' => 'component_socrata_visualization_histogram',
      'socrata.visualization.pieChart' => 'component_socrata_visualization_pie_chart',
      'socrata.visualization.table' => 'component_socrata_visualization_table',
      'socrata.visualization.timelineChart' => 'component_socrata_visualization_timeline_chart',
      'socrata.visualization.featureMap' => 'component_socrata_visualization_feature_map',
      'spacer' => 'component_spacer',
      'story.tile' => 'component_story_tile',
      'story.widget' => 'component_story_tile',
      'goal.embed' => 'component_goal_embed',
      'goal.tile' => 'component_goal_tile',
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

  def embed_code_iframe_sandbox_allowances
    %w(
      allow-popups
      allow-popups-to-escape-sandbox
      allow-scripts
      allow-same-origin
      allow-forms
    ).join(' ')
  end

  def image_srcset_from_component(image_component)
    if image_component.has_thumbnails?
      Document::THUMBNAIL_SIZES.map {|size, pixels| "#{image_component.url(size)} #{pixels}w"}.join(', ')
    end
  end

  def image_sizes_from_number_of_columns(columns)
    # accounting for media blocks that are in a multiple column layout
    column_width = columns.to_f / 12

    [
      "(min-width: 1400px) calc(#{column_width} * 1090px)",
      "(min-width: 1200px) calc(#{column_width} * 910px)",
      "(min-width: 800px) calc(#{column_width} * 650px)",
      '94vw' # the smallest breakpoint has images at 94% of the viewport
    ].join(', ')
  end

  def hero_component_classes(hero_component)
    classes = ['hero']
    classes << 'hero-no-image' if hero_component.url(:xlarge).blank?
    classes << 'hero-default-height' if hero_component.layout.blank?
    classes.join(' ')
  end

  def should_load_print_styles?
    request.query_parameters['print'] == 'true'
  end

  def story_custom_theme_css_url
    story_domain = CoreServer::get_view(@story.uid).try(:[], 'domainCName') || request.host
    "https://#{story_domain}/stories/themes/custom.css"
  end
end
