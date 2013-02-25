class GovstatController < ApplicationController
  include GovstatHelper
  include CustomContentHelper
  include BrowseActions
  before_filter :check_govstat_enabled

  def goals
  end

  def goal_page
    @page = get_page(goal_page_config(params[:id]), request.path,
                     'Goal | ' + CurrentDomain.strings.site_title, params)
    render 'custom_content/generic_page', :locals => { :custom_styles => 'screen-govstat-goal-page',
      :custom_javascript => 'screen-govstat-goal-page' }
  end

  def manage
    govstat_config = CurrentDomain.properties.gov_stat || Hashie::Mash.new
    config = govstat_homepage_config((govstat_config.dashboard_layout || '').to_sym)
    config[:content][:children].unshift({ type: 'HorizontalContainer', htmlClass: 'actionLinks', children: [
      { type: 'Button', href: manage_data_path, notButton: true,
        text: '<span class="ss-icon">database</span><p>Data and Analysis</p>' },
      { type: 'Button', href: manage_reports_path, notButton: true,
        text: '<span class="ss-icon">openbook</span><p>Reports</p>' },
      { type: 'Button', href: manage_site_config_path, notButton: true,
        text: '<span class="ss-icon">checkcalendar</span><p>Goals and Users</p>' }
    ] })
    @page = get_page(config, request.path, 'Manage | ' + CurrentDomain.strings.site_title, params)
    render 'custom_content/generic_page', :locals => { :custom_styles => 'screen-govstat-manage' }
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
    @reports = Page.find('$order' => ':updated_at')
  end

  def manage_config
  end

  def manage_template
  end

protected
  def check_govstat_enabled
    if CurrentDomain.module_enabled?(:govStat)
      return true
    else
      render_404
      return false
    end
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
          htmlClass: 'headerLine',
          children: [
          {
            type: 'Button',
            href: home_path,
            htmlClass: 'button backLink',
            text: '<span class="ss-navigateleft">Back</span>'
          },
          progress_indicator('goal.metrics.0')
          ]
        },
        {
          type: 'Title',
          htmlClass: 'goalTitle',
          text: '{goal.subject ||We} will ' +
            '{goal.metadata.comparison_function /</reduce/ />/increase/ ||reduce/increase} '+
            '{goal.name $[u] ||results} by {goal.goal_delta %[,0]}{goal.goal_delta_is_pct /true/%/ ||} ' +
            'before {goal.end_date @[%B %Y] ||sometime}'
        },
        {
          type: 'Repeater',
          contextId: 'goal.metrics',
          htmlClass: 'metricsBlock',
          children: [
          {
            type: 'HorizontalContainer',
            htmlClass: 'metricItem index-{_repeaterIndex}',
            children: [
            {
              weight: 32,
              type: 'Container',
              children: [
                { type: 'Text', customClass: 'metricType prevailing', html: 'Prevailing Metric' },
                { type: 'Text', customClass: 'metricType additional', html: 'Additional Metric' },
                { type: 'Title', htmlClass: 'metricTitle', text: '{title}' }
              ]
            },
            {
              weight: 6,
              type: 'Container',
              htmlClass: 'indicatorContainer',
              children: [
                { type: 'Text', htmlClass: 'baseline value', html: '{computed_values.baseline_value %[,3] ||}' },
                { type: 'Text', htmlClass: 'baseline date', html: '{goalContext.goal.start_date @[%b %Y] ||}' }
              ]
            },
            {
              weight: 6,
              type: 'Container',
              htmlClass: 'indicatorContainer',
              children: [
                { type: 'Text', htmlClass: 'current value', html: '{computed_values.metric_value %[,3] ||}' },
                { type: 'Text', htmlClass: 'current date', html: '{computed_values.as_of @[%b %Y] ||}' }
              ]
            },
            {
              weight: 7,
              type: 'Container',
              htmlClass: 'progressContainer',
              children: [
                #{ type: 'Text', htmlClass: 'metricStatus', html: '{compute.delta}%' },
                progress_indicator
              ]
            }
            ]
          }
          ]
        },
        {
          type: 'Repeater',
          contextId: 'goal.related_datasets',
          htmlClass: 'relatedVisualizations',
          container: { type: 'GridContainer', cellWidth: 500, cellHeight: 400, rowSpacing: 30,
            cellSpacing: 35, cellBorderWidth: 1, rowBorderWidth: 1 },
          children: [
          {
            type: 'Container',
            context: {
              type: 'dataset',
              datasetId: '{value}'
            },
            children: [
              { type: 'Title', htmlClass: 'chartTitle', text: '{dataset.name}' },
              { type: 'Chart', chartType: '{dataset.displayFormat.chartType}', height: 330 }
            ]
          }
          ]
        },
        {
          type: 'Text', htmlClass: 'goalDescription clearfix',
          html: '<p>{goal.metadata.description /\n/<\/p><p>/g}</p>'
        }
        ]
      }
    }
  end

end
