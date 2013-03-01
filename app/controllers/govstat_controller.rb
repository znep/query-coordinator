class GovstatController < ApplicationController
  include GovstatHelper
  include CustomContentHelper
  include BrowseActions
  before_filter :check_govstat_enabled
  skip_before_filter :require_user, :only => [:goal_page]

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
    config[:content][:children].unshift({ type: 'Container', htmlClass: 'subHubSection', children: [
      { type: 'Title', htmlClass: 'subHubTitle', text: 'Welcome to GovStat.' },
      { type: 'Text', htmlClass: 'subHubIntro', html: 'You can check out the current status of your goals below, or dig into these hubs for a deeper look.' },
      { type: 'HorizontalContainer', htmlClass: 'subHubNavigation', children: [
        { type: 'Button', htmlClass: 'data', href: manage_data_path, notButton: true,
          text: '<span class="mainIcon ss-icon">hdd</span><p class="header">Data</p><p class="explanation">Upload, update, analyze, view, and share datasets.</p><div class="button">Browse Data <span class="ss-icon">next</span></div>' },
        { type: 'Button', htmlClass: 'reports', href: manage_reports_path, notButton: true,
          text: '<span class="mainIcon ss-icon">notepad</span><p class="header">Reports</p><p class="explanation">Build and share reports to help
analyze your goals and data.</p><div class="button">Manage Reports <span class="ss-icon">next</span></div>' },
        { type: 'Button', htmlClass: 'configuration', href: manage_site_config_path, notButton: true,
          text: '<span class="mainIcon ss-icon">wrench</span><p class="header">Configuration</p><p class="explanation">Set up goals and users, and tweak various settings about GovStat.</p><div class="button">Configure GovStat <span class="ss-icon">next</span></div>' }
      ]}
    ]})
    @page = get_page(config, request.path, 'Manage | ' + CurrentDomain.strings.site_title, params)
    render 'custom_content/generic_page', :locals => { :custom_styles => 'screen-govstat-manage' }
  end

  def manage_data
    @page = get_page(manage_data_config(params), request.path,
                     'Manage Data | ' + CurrentDomain.strings.site_title, params)
    render 'custom_content/generic_page', :locals => { :custom_styles => 'screen-govstat-manage' }
  end

  def manage_reports
    reports = Page.find('$order' => ':updated_at')
    @own_reports = []
    @other_reports = []
    reports.each do |r|
      next if r.page_type == 'export' || r.path.include?('/:')
      if r.owner == current_user.id
        @own_reports.push(r)
      else
        @other_reports.push(r)
      end
    end
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
          type: 'Container',
          htmlClass: 'titleContainer {goal.metadata.title_image /^.+$/hasImage/ ||}',#!
          children: [ {
            type: 'Picture',
            url: '{goal.metadata.title_image ||}' #!
          }, {
            type: 'Container',
            customClass: 'goalTitle',
            children: [ {
              type: 'Title',
              customClass: 'categoryTitle',
              context: {
                id: 'category',
                type: 'govstatCategory',
                categoryId: '{goal.category}'
              },
              text: '{category.name}'
            }, {
              type: 'Title',
              text: '{goal.subject ||We} will ' +
                '{goal.metadata.comparison_function /</reduce/ />/increase/ ||reduce/increase} '+
                '{goal.name $[d] ||results} by {goal.goal_delta %[,0] ||0}{goal.goal_delta_is_pct /true/%/ ||} ' +
                'before {goal.end_date @[%B %Y] ||sometime}'
            } ]
          }
          ]
        },
        {
          type: 'Title',
          customClass: 'sectionTitle',
          text: 'Metrics'
        },
        {
          type: 'Text',
          html: '<script type="text/javascript">window.setTimeout($(function() { $(".metricProgress .progressBar").each(function() { var $this = $(this); var start = parseInt($this.attr("data-start")) * 1000; var end = parseInt($this.attr("data-end")) * 1000; $this.css("width", (((new Date()).getTime() - start) / (end - start)) + "%"); }); }), 0);</script>'
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
                { type: 'Text', customClass: 'metricIntro prevailing', html: 'This goal is being measured by tracking' },
                { type: 'Title', htmlClass: 'metricTitle', text: '{title}' },
                { type: 'Text', customClass: 'metricProgress', html: '<div class="progressText">Remaining Time</div><div class="progressContainer"><div class="progressBar" data-start="{start_date}" data-end="{end_date}"></div></div>' }
              ]
            },
            {
              weight: 6,
              type: 'Container',
              htmlClass: 'indicatorContainer',
              children: [
                { type: 'Text', htmlClass: 'baseline type', html: 'Baseline' },
                { type: 'Text', htmlClass: 'baseline date',
                  html: '(as of {goalContext.goal.start_date @[%b %Y] ||})' },
                { type: 'Text', htmlClass: 'baseline value', html: '{computed_values.baseline_value %[,3] ||}' },
                { type: 'Text', htmlClass: 'baseline unit', html: '{unit ||}' }
              ]
            },
            {
              weight: 6,
              type: 'Container',
              htmlClass: 'indicatorContainer',
              children: [
                { type: 'Text', htmlClass: 'current type', html: 'Current' },
                { type: 'Text', htmlClass: 'current date',
                  html: '(as of {computed_values.as_of @[%b %Y] ||})' },
                { type: 'Text', htmlClass: 'current value', html: '{computed_values.metric_value %[,3] ||}' },
                { type: 'Text', htmlClass: 'current unit', html: '{unit ||}' }
              ]
            },
            {
              weight: 6,
              type: 'Container',
              htmlClass: 'indicatorContainer',
              #ifValue: 'computed_values.target_value',
              children: [
                { type: 'Text', htmlClass: 'current type', html: 'Target' },
                { type: 'Text', htmlClass: 'current date',
                  html: '({goalContext.goal.end_date @[%b %Y] ||})' },
                { type: 'Text', htmlClass: 'current value', html: '{computed_values.metric_value %[,3] ||}' },
                { type: 'Text', htmlClass: 'current unit', html: '{unit ||}' }
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
          type: 'Title',
          customClass: 'sectionTitle',
          text: 'Related Data'
        },
        {
          type: 'Repeater',
          contextId: 'goal.related_datasets',
          htmlClass: 'relatedVisualizations',
          container: { type: 'GridContainer', cellWidth: 400, cellHeight: 300, rowSpacing: 20,
            cellSpacing: 20, cellBorderWidth: 1, rowBorderWidth: 1 },
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
          type: 'Title',
          customClass: 'sectionTitle',
          text: 'Description'
        },
        {
          type: 'Text', htmlClass: 'goalDescription clearfix',
          html: '<p>{goal.metadata.description /\n/<\/p><p>/g ||}</p>'
        }
        ]
      }
    }
  end

  def manage_data_config(params)
    cats = [{ value: '', text: 'All', current: params[:category].blank? }].
      concat(View.categories.keys.reject { |c| c.blank? }.map { |c|
        { value: c, text: c, current: params[:category] == c } })
    opts = { nofederate: true, publication_stage: 'published', limit: 20 }
    [:category].each { |p| opts[p] = params[p] unless params[p].blank? }
    {
      data: {
        myDatasets: { type: 'datasetList', search: opts.merge({
          sortBy: 'newest', for_user: current_user.id,
          publication_stage: ['published', 'unpublished'] }) },
        allDatasets: { type: 'datasetList', search: opts }
      },
      content: {
        type: 'Container',
        id: 'manageDataPage',
        children: [
        {
          type: 'Text', customClass: 'canvas_nav', htmlClass: 'subnavigation',
          html: '<ul class="breadcrumb">' +
            '<li class="root"><a class="ss-icon" href="/manage">Home</a></li>' +
            '<li><span class="ss-icon">navigateright</span></li>' +
            '<li class="main"><a href="/manage/data">Data</a></li>' +
            '</ul>'
        },
        {
          type: 'Container',
          htmlClass: 'filterSection',
          children: [
          { type: 'Title', text: 'Categories' },
          {
            type: 'Repeater',
            context: { type: 'list', list: cats },
            childProperties: { customClass: 'filterItem' },
            children: [{
              type: 'Button', href: '?category={value ||}',
              htmlClass: 'value{value ||__default} current-{current}', text: '{text}'
            }]
          }
          ]
        },
        {
          type: 'Container',
          htmlClass: 'gridFlowLayout',
          children: [
          {
            type: 'Container',
            htmlClass: 'myDatasets categoryItem',
            contextId: 'myDatasets',
            children: [
            { type: 'Title', text: 'My Data', htmlClass: 'categoryTitle' },
            {
              type: 'Repeater',
              ifValue: 'count',
              container: { type: 'GridContainer', cellWidth: 180, cellHeight: 200,
                cellSpacing: 10, cellVSpacing: 10,
                # This hack to insert a fixed initial item is pretty awesome
                children: [
                { type: 'Text', customClass: 'addBox', htmlClass: 'singleItem addNewItem',
                  html: '<a class="primaryAction" href="' + new_dataset_path + '">' +
                  '<span class="actionDetails ss-uploadcloud">Upload New Data</span></a>' }
              ]},
              children: [{
                type: 'Container', htmlClass: 'datasetItem singleItem publication-{dataset.publicationStage}',
                children: [{
                  type: 'Container', htmlClass: 'singleInner',
                  children: [
                    dataset_icon,
                    { type: 'Title', customClass: 'datasetTitle title', text: '{dataset.name}' },
                    { type: 'Text', customClass: 'primaryAction',
                      html: '<a href="/d/{dataset.id}"><div class="actionDetails ss-right"></div></a>' }
                  ]
                } ]
              } ]
            }, {
              type: 'Container',
              ifValue: { negate: true, key: 'count' },
              htmlClass: 'noDataSection',
              children: [
                { type: 'Title', text: "You don't have any data yet. So let's..." },
                {
                type: 'Button', htmlClass: 'noData', notButton: true, href: new_dataset_path, text:
                '<div class="callToAction ss-plus">Add Some Data</div>' +
                '<div class="button ss-navigateright right">Add Data</div>'
                }
              ]
            } ]
          }, {
            type: 'Container',
            htmlClass: 'allDatasets categoryItem',
            contextId: 'allDatasets',
            ifValue: 'count',
            children: [
            { type: 'Title', text: 'All Data', htmlClass: 'categoryTitle' },
            {
              type: 'Repeater',
              container: { type: 'GridContainer', cellWidth: 180, cellHeight: 200,
                cellSpacing: 10, rowSpacing: 10 },
              children: [{
                type: 'Container', htmlClass: 'datasetItem singleItem',
                children: [{
                  type: 'Container', htmlClass: 'singleInner',
                  children: [
                    dataset_icon,
                    { type: 'Title', customClass: 'datasetTitle title', text: '{dataset.name}' },
                    { type: 'Text', customClass: 'primaryAction',
                      html: '<a href="/d/{dataset.id}"><div class="actionDetails ss-right"></div></a>' }
                  ]
                } ]
              } ]
            } ]
          } ]
        } ]
      }
    }
  end

end
