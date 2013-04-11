class GovstatController < ApplicationController
  include GovstatHelper
  include CustomContentHelper
  include BrowseActions
  before_filter :check_govstat_enabled, :check_domain_member
  skip_before_filter :require_user, :only => [:goal_page]
  skip_before_filter :check_domain_member, :only => [:goal_page]

  def goals
  end

  def goal_page
    @page = get_page(goal_page_config(params[:id]), request.path,
                     'Goal | ' + CurrentDomain.strings.site_title, params)
    render 'custom_content/generic_page', :locals => { :custom_styles => 'screen-govstat-goal-page',
      :custom_javascript => 'screen-govstat-goal-page' }
  end

  def manage
    ds_counts = []
    base_req = {:limit => 1, :datasetView => 'dataset', :limitTo => 'tables', :nofederate => true}
    CoreServer::Base.connection.batch_request do |batch_id|
      Clytemnestra.search_views(base_req, batch_id)
      Clytemnestra.search_views(base_req.merge({ :for_user => current_user.id }), batch_id)
    end.each_with_index do |r, i|
      p = JSON.parse(r['response'], {:max_nesting => 25})
      ds_counts.push(p['count'])
    end

    own_reports, other_reports = get_reports
    all_reports_count = own_reports.length + other_reports.length
    goals = Goal.find({ isPublic: true })
    goals.reject!{ |goal| goal.category.blank? } if goals.length > 0
    users = User.find(:method => 'findPrivilegedUsers')

    config = govstat_homepage_config(nil)
    config[:content][:children].unshift({ type: 'Container', htmlClass: 'subHubSection', children: [
      { type: 'Title', htmlClass: 'subHubTitle', text: 'Welcome to GovStat.' },
      { type: 'Text', htmlClass: 'subHubIntro', html: 'You can check out the current status of your goals below, or dig into these hubs for a deeper look.' },
      { type: 'HorizontalContainer', htmlClass: 'subHubNavigation', children: [
        { type: 'Button', htmlClass: 'data', href: manage_data_path, notButton: true,
          text: '<span class="mainIcon ss-icon">hdd</span><p class="header">Data</p>' +
            '<p class="explanation">Upload, update, analyze, view, and share datasets.</p>' +
            '<ul class="metadata">' +
              '<li><span class="value">' + ds_counts[0].to_s + '</span> ' +
                'dataset'.pluralize(ds_counts[0]) + ' total</li>' +
              '<li><span class="value">' + ds_counts[1].to_s + '</span> ' +
                'dataset'.pluralize(ds_counts[1]) + ' by me</li>' +
            '</ul>' +
            '<div class="button">Browse Data <span class="ss-icon">next</span></div>' },
        { type: 'Button', htmlClass: 'reports', href: manage_reports_path, notButton: true,
          text: '<span class="mainIcon ss-icon">notepad</span><p class="header">Reports</p>' +
            '<p class="explanation">Build and share reports to help analyze your goals and data.</p>' +
            '<ul class="metadata">' +
              '<li><span class="value">' + all_reports_count.to_s + '</span> ' +
                'report'.pluralize(all_reports_count) + ' total</li>' +
              '<li><span class="value">' + own_reports.length.to_s + '</span> ' +
                'report'.pluralize(own_reports.length) + ' by me</li>' +
            '</ul>' +
            '<div class="button">Manage Reports <span class="ss-icon">next</span></div>' },
        { type: 'Button', htmlClass: 'configuration', href: manage_site_config_path, notButton: true,
          text: '<span class="mainIcon ss-icon">wrench</span><p class="header">Configuration</p>' +
            '<p class="explanation">Set up goals and users, and tweak various settings about GovStat.</p>' +
            '<ul class="metadata">' +
              '<li><span class="value">' + goals.length.to_s + '</span> ' +
                'active ' + 'goal'.pluralize(goals.length) + '</li>' +
              '<li><span class="value">' + users.length.to_s + '</span> ' +
                'user'.pluralize(users.length) + ' total</li>' +
            '</ul>' +
            '<div class="button">Configure GovStat <span class="ss-icon">next</span></div>' }
      ]}
    ]})
    @page = get_page(config, request.path, 'Manage | ' + CurrentDomain.strings.site_title, params)
    render 'custom_content/generic_page', :locals => { :custom_styles => 'screen-govstat-manage',
      :custom_javascript => 'screen-govstat-dashboard' }
  end

  protect_from_forgery :except => :manage_data
  def manage_data
    @page = get_page(manage_data_config(params), request.path,
                     'Manage Data | ' + CurrentDomain.strings.site_title, params)
    render 'custom_content/generic_page', :locals => { :custom_styles => 'screen-govstat-manage',
      :custom_javascript => 'screen-govstat-manage' }
  end

  def manage_reports
    @own_reports, @other_reports = get_reports
  end

  def manage_config
  end

  def manage_template
    config = CurrentDomain.configuration('gov_stat')
    dashboard_layout = config.nil? ? nil : config.properties.dashboard_layout
    if dashboard_layout.nil?
      config = CurrentDomain.properties.gov_stat || Hashie::Mash.new
      dashboard_layout = config.dashboard_layout
    end
    @template = dashboard_layout || 'grid_flow'
  end

  def manage_template_update
    config = ::Configuration.get_or_create('gov_stat', {'name' => 'GovStat'})
    config.update_or_create_property('dashboard_layout', params['template'])
    CurrentDomain.flag_out_of_date!(CurrentDomain.cname)
    respond_to do |format|
      format.html do
        flash[:notice] = 'Saved Paradigm'
        redirect_to manage_template_path
      end
      format.data { render :json => params['template'].to_json }
    end
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

  def check_domain_member
    if CurrentDomain.member?(current_user)
      return true
    else
      render_forbidden
      return false
    end
  end

  def get_reports
    reports = Page.find('$order' => ':updated_at')
    own_reports = []
    other_reports = []
    reports.each do |r|
      next if r.page_type == 'export' || r.path.include?('/:')
      if r.owner == current_user.id
        own_reports.push(r)
      else
        other_reports.push(r)
      end
    end
    return own_reports, other_reports
  end

  def goal_page_config(goal_id)
    show_status = current_user && current_user.role == 'admin'
    {
      data: {
        categories: { type: 'govstatCategoryList' },
        goalContext: { type: 'goal', goalId: goal_id }
      },
      content: {
        type: 'Container',
        id: 'goalPageRoot',
        contextId: 'goalContext',
        children: [ {
          type: 'Container',
          htmlClass: 'heroImageContainer',
          children: [ {
            type: 'Picture',
            url: '{goal.metadata.title_image ||/stylesheets/images/content/govstat_default_hero.jpg}'
          }, {
            type: 'Container',
            htmlClass: 'heroGradient'
          } ]
        }, {
          type: 'Container',
          contextId: 'categories_{goal.category}',
          htmlClass: 'titleContainer',
          styles: { 'border-color' => '{category.color}' },
          children: [ {
            type: 'Container',
            customClass: 'goalBox',
            children: [ {
              type: 'Title',
              customClass: 'categoryTitle',
              styles: { color: '{category.color}' },
              text: '{category.name ||}'
            }, {
              type: 'Title',
              customClass: 'goalTitle customTitle {goal.metadata.custom_title /.+/hasCustomTitle/ ||}',
              text: '{goal.metadata.custom_title}'
            }, {
              type: 'Title',
              customClass: 'goalTitle defaultTitle',
              text: goal_statement
            }, {
              type: 'Text',
              htmlClass: 'goalSubtitle',
              html: 'This goal is measured by tracking <strong>{goal.metrics.0.title ||the Prevailing Metric}</strong> in <strong>{goal.metrics.0.unit ||units}</strong>'
            }, {
              type: 'HorizontalContainer',
              htmlClass: 'prevailingMetric',
              children: [ {
                type: 'Container',
                weight: 5.5,
                htmlClass: 'metric currentValue',
                children: [ {
                  type: 'Text',
                  htmlClass: 'metricValue progress-{goal.metrics.0.computed_values.progress ||none}',
                  html: '<span class="value">{goal.metrics.0.computed_values.metric_value %[,3] ||}</span> <span class="unit">{goal.metrics.0.unit ||}</span>'
                }, {
                  type: 'Text',
                  htmlClass: 'metricTime',
                  ifValue: 'goal.metrics.0.computed_values.as_of',
                  html: 'measured {goal.metrics.0.computed_values.as_of @[%b %Y] ||}'
                }, progress_indicator('goal.metrics.0') ]
              }, {
                type: 'Container',
                weight: 4.5,
                htmlClass: 'nonCurrent',
                children: [ {
                  type: 'Container',
                  htmlClass: 'metric baselineValue',
                  children: [ {
                    type: 'Text',
                    customClass: 'metricType',
                    html: 'Baseline'
                  }, {
                    type: 'Text',
                    htmlClass: 'metricValue',
                    html: '{goal.metrics.0.computed_values.baseline_value %[,3] ||}'
                  }, {
                    type: 'Text',
                    htmlClass: 'metricUnit',
                    html: '<strong>{goal.metrics.0.unit ||}</strong>'
                  }, {
                    type: 'Text',
                    htmlClass: 'metricTime',
                    html: '{goal.start_date @[%B %Y] ||}'
                  } ]
                }, {
                  type: 'Container',
                  htmlClass: 'metric targetValue',
                  children: [ {
                    type: 'Text',
                    customClass: 'metricType',
                    html: 'Target'
                  }, {
                    type: 'Text',
                    htmlClass: 'metricValue',
                    html: '{goal.metrics.0.computed_values.target_value %[,3] ||}'
                  }, {
                    type: 'Text',
                    htmlClass: 'metricUnit',
                    html: '<strong>{goal.metrics.0.unit ||}</strong>'
                  }, {
                    type: 'Text',
                    htmlClass: 'metricTime',
                    html: '{goal.end_date @[%B %Y] ||}'
                  } ]
                } ]
              } ]
            }, {
              type: 'Share',
              currentPage: true
            }, {
              type: 'Text',
              customClass: 'chartArea',
              ifValue: '?leafChart',
              html: '<span class="goalUid">{goal.id}</span>' +
                    '<div class="constrain"><div class="nowTip"><div class="nowTipFill"></div></div></div>' +
                    '<div class="dataSeriesLeftBuffer"></div><div class="dataSeriesRightBuffer"></div>' +
                    '<div class="meter"><div class="rangeTop"></div><div class="rangeBottom"></div></div>' +
                    '<div class="bubble marker projectionMarker">Projected<div class="tip"></div></div><div class="bubble marker currentMarker">Current<div class="tip"></div></div><div class="bubble marker targetMarker">Target<div class="tip"></div></div>'
            }]
          } ]
        }, {
          type: 'Repeater',
          contextId: 'goal.metrics',
          htmlClass: 'metricsBlock',
          children: [
          {
            type: 'HorizontalContainer',
            htmlClass: 'metricItem index-{_repeaterIndex}',
            children: [
            {
              weight: 16,
              type: 'Container',
              children: [
                { type: 'Title', htmlClass: 'metricTitle', text: '{title ||}' },
                progress_indicator
              ]
            },
            {
              weight: 8,
              type: 'Container',
              contextId: 'categories_{goal.category}',
              htmlClass: 'indicatorContainer progress-{computed_values.progress ||none}',
              children: [
                { type: 'Text', htmlClass: 'current value', html: '{computed_values.metric_value %[,3] ||}' },
                { type: 'Text', htmlClass: 'current unit', html: '{unit ||}' },
                { type: 'Text', ifValue: 'computed_values.as_of', htmlClass: 'current type', html: 'measured {computed_values.as_of @[%B %Y] ||}' }
              ]
            },
            {
              weight: 8,
              type: 'Container',
              htmlClass: 'indicatorContainer',
              children: [
                { type: 'Text', htmlClass: 'baseline value', html: '{computed_values.baseline_value %[,3] ||}' },
                { type: 'Text', htmlClass: 'baseline unit', html: '{unit ||}' },
                { type: 'Text', htmlClass: 'baseline type', html: '{goalContext.goal.start_date @[%B %Y] ||} baseline' }
              ]
            },
            {
              weight: 8,
              type: 'Container',
              htmlClass: 'indicatorContainer',
              children: [
                { type: 'Text', htmlClass: 'current value', html: '{computed_values.target_value %[,3] ||}' },
                { type: 'Text', htmlClass: 'current unit', html: '{unit ||}' },
                { type: 'Text', htmlClass: 'current type', html: '{goalContext.goal.end_date @[%B %Y] ||} target' }
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
          childProperties: { htmlClass: '{_evenOdd}' },
          children: [
          {
            type: 'Container',
            context: {
              type: 'dataset',
              datasetId: '{value}'
            },
            children: [
              { type: 'Title', htmlClass: 'chartTitle', text: '{dataset.name}' },
              { type: 'Visualization', height: 220 },
              { type: 'Text', htmlClass: 'chartDescription', html: '{dataset.description ||}', ifValue: 'dataset.description' },
              { type: 'Button', htmlClass: 'exploreLink ss-right right', notButton: true,
                href: '/d/{dataset.id}', text: 'Explore this data' }
            ]
          }
          ]
        },
        {
          type: 'Title',
          customClass: 'sectionTitle',
          text: 'More Information'
        },
        {
          type: 'Text', htmlClass: 'goalDescription clearfix',
          html: '<p>{goal.metadata.description /\n/<\/p><p>/g ||}</p>'
        },
        {
          type: 'Text',
          style: { display: 'none' },
          # TODO: minify
          html: '<!--[if lte IE 8]><script src="/javascripts/plugins/vis/r2d3.v3.js" charset="utf-8"></script><![endif]--><!--[if gte IE 9]><!--><script src="/javascripts/plugins/vis/d3.v3.js"></script><!--<![endif]-->'
        }
        ]
      }
    }
  end

  def manage_data_config(params)
    cats = View.category_tree.reject { |c| c.blank? }.values.sort_by { |v| v[:text] }.map do |v|
      if !v[:children].nil? && (params[:category] == v[:value] ||
                                v[:children].any? { |vv| vv[:value] == params[:category] })
        [v].concat(v[:children].map { |vv| { text: vv[:text], value: vv[:value], item: 'child' } })
      else
        v
      end
    end.flatten.compact.map { |v|
      { value: v[:value], text: v[:text], current: params[:category] == v[:value], item: v[:item] } }
    cats.unshift({ value: '', text: 'All', current: params[:category].blank? })
    opts = { nofederate: true, publication_stage: 'published', limit: 20 }

    view_types = view_types_facet[:options].each { |o| o[:current] = (params[:view_type] == o[:value]) }
    view_types.unshift({ value: '', text: 'All', current: params[:view_type].blank? })

    if params[:view_type].present?
      case params[:view_type]
      when 'unpublished'
        opts[:limitTo] = 'tables'
        opts[:datasetView] = 'dataset'
        opts[:publication_stage] = 'unpublished'
      when 'datasets'
        opts[:limitTo] = 'tables'
        opts[:datasetView] = 'dataset'
      when 'filters'
        opts[:limitTo] = 'tables'
        opts[:datasetView] = 'view'
      else
        opts[:limitTo] = params[:view_type]
      end
    end

    search_params = {}
    [:category, :view_type, :q].each { |p| search_params[p] = params[p] if params[p].present? }
    non_default = !search_params.empty?
    [:category, :q].each { |p| opts[p] = params[p] unless params[p].blank? }

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
        privateData: true,
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
              type: 'Button', href: '?' + search_params.reject { |k, v| k == :category }.
                map { |k, v| k.to_s + '=' + v.to_s }.join('&') + '&category={value ||}',
              htmlClass: 'value{value ||__default} current-{current} item-{item ||parent}', text: '{text}'
            }]
          },
          { type: 'Title', text: 'View Types' },
          {
            type: 'Repeater',
            context: { type: 'list', list: view_types },
            childProperties: { customClass: 'filterItem' },
            children: [{
              type: 'Button', href: '?' + search_params.reject { |k, v| k == :view_type }.
                map { |k, v| k.to_s + '=' + v.to_s }.join('&') + '&view_type={value ||}',
              htmlClass: 'value{value ||__default} current-{current}', text: '{text}'
            }]
          },
          { type: 'Title', text: 'Search' },
          {
            type: 'Text', customClass: 'searchBlock',
            html: '<form action="/manage/data" " method="get">' +
              search_params.reject { |k, v| k == :q }.map { |k, v|
                '<input type="hidden" name="' + k.to_s + '" value="' + v.to_s + '" />' }.join('') +
              '<input type="text" name="q" value="' + (search_params[:q] || '') + '" />' +
              (search_params[:q].present? ? '<a href="?' + search_params.reject { |k, v| k == :q }.
                map { |k, v| k.to_s + '=' + v.to_s }.join('&') + '" class="clearSearch ss-delete" ' +
                'title="Clear Search"></a>' : '') +
              '<input type="submit" value="Search" class="button" />' +
              '</form>'
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
              ifValue: (non_default ? '' : 'count'),
              container: { type: 'GridContainer', cellWidth: 180, cellHeight: 200,
                cellSpacing: 10, cellVSpacing: 10,
                # This hack to insert a fixed initial item is pretty awesome
                children: (non_default ? [] : [
                { type: 'Text', customClass: 'addBox', htmlClass: 'singleItem addNewItem',
                  html: '<a class="primaryAction" href="' + new_dataset_path + '">' +
                  '<span class="actionDetails ss-uploadcloud">Upload New Data</span></a>' }
              ]) },
              noResultsChildren: [{
                type: 'Title', text: 'No data available'
              }],
              children: [{
                type: 'Container', htmlClass: 'datasetItem singleItem publication-{dataset.publicationStage}',
                children: [{
                  type: 'Container', htmlClass: 'singleInner',
                  children: [
                    dataset_icon,
                    { type: 'Title', customClass: 'datasetTitle title', text: '{dataset.name}' },
                    { type: 'Text', customClass: 'primaryAction',
                      html: '<a href="/d/{dataset.id}"><div class="actionDetails ss-right"></div></a>' },
                    { type: 'Text', customClass: 'secondaryAction',
                      html: '<a href="#delete" class="delete button" data-dsId="{dataset.id}">' +
                        '<span class="actionDetails ss-trash">Delete</span></a>' }
                  ]
                } ]
              } ]
            }, (non_default ? nil : {
              type: 'Container',
              ifValue: { negate: true, key: 'count' },
              htmlClass: 'noDataSection',
              children: [
                { type: 'Title', text: "You don't have any data yet. So let's..." },
                {
                type: 'Button', htmlClass: 'noData', notButton: true, href: new_dataset_path, text:
                '<div class="callToAction ss-plus">Add Some Data</div>' +
                '<input class="button ss-navigateright right" value="Add Data" />'
                }
              ]
            }) ]
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
