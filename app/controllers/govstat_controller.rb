class GovstatController < ApplicationController
  include GovstatHelper
  include BrowseActions
  before_filter :set_govstat_theme

  def goals
  end

  def goal_page
    path = request.path
    Canvas2::DataContext.reset
    Canvas2::Util.set_params(params)
    Canvas2::Util.set_debug(false)
    Canvas2::Util.is_private(false)
    Canvas2::Util.set_env({
      domain: CurrentDomain.cname,
      renderTime: Time.now.to_i,
      path: path,
      siteTheme: CurrentDomain.theme
    })
    Canvas2::Util.set_path(path)
    config = goal_page_config(params[:id])
    @page = Page.new(config.merge({path: path, name: CurrentDomain.strings.site_title}).
                     with_indifferent_access)
  end

  def manage
  end

  def manage_data
    @processed_browse = process_browse(request, {
      nofederate: true,
      sortBy: 'newest',
      for_user: current_user.id,
      publication_stage: ['published', 'unpublished'],
      limit: 10,
      facets: [],
      disable: { pagination: true, sort: true, counter: true, table_header: true },
      grid_items: { largeImage: true, richSection: true },
      footer_config: {},
      browse_in_container: true,
      suppress_dataset_creation: true
    })
  end

  def manage_reports
    @reports = Page.find('$order' => ':updated_at', '$limit' => 10)
  end

  def manage_config
  end

  def manage_template
  end

protected
  def set_govstat_theme
    @use_govstat_theme = true
  end

  def goal_page_config(goal_id)
    {
      data: {
        goalContext: { type: 'goal', goalId: goal_id }
      },
      content: {
        type: 'Container',
        id: 'goalPageRoot',
        contextId: 'goalContext',
        children: [
        {
          type: 'HorizontalContainer',
          htmlClass: 'metricsStats',
          children: [
          {
            weight: 1,
            type: 'Container',
            children: [
            { type: 'Title', text: 'Overall Progress' },
            { type: 'Text', htmlClass: 'overallStatus', html: '{goal.metrics.0.compute.delta}%' },
            progress_indicator('goal.metrics.0')
            ]
          },
          {
            weight: 3,
            type: 'Repeater',
            contextId: 'goal.metrics',
            container: { type: 'HorizontalContainer' },
            children: [
            { type: 'Title', text: '{title}' },
            { type: 'Text', htmlClass: 'current date', html: '{env.renderTime @[%B %Y]}' },
            { type: 'Text', htmlClass: 'current value', html: '{compute.metric_value %[,0]}' },
            { type: 'Text', htmlClass: 'baseline date', html: '{goalContext.goal.start_date @[%B %Y]}' },
            { type: 'Text', htmlClass: 'baseline value', html: '{compute.baseline_value %[,0]}' },
            { type: 'Text', htmlClass: 'metricStatus', html: '{compute.delta}%' },
            progress_indicator
            ]
          }
          ]
        },
        {
          type: 'Repeater',
          contextId: 'goal.metric_datasets',
          container: { type: 'GridContainer' },
          children: [
          {
            type: 'Container',
            context: {
              type: 'dataset',
              datasetId: '{value}'
            },
            children: [
              { type: 'Title', text: '{dataset.name}' },
              { type: 'Chart', chartType: '{dataset.displayFormat.chartType}' }
            ]
          }
          ]
        }
        ]
      }
    }
  end

end
