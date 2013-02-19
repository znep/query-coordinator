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
    render 'custom_content/generic_page', :locals => { :custom_styles => 'screen-govstat-goal-page' }
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
    @reports = Page.find('$order' => ':updated_at', '$limit' => 10)
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
