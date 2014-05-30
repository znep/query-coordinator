module GovstatHelper

  def progress_indicator(metric_prefix = '')
    metric_prefix += '.' if !metric_prefix.blank?
    { type: 'Text', customClass: 'goalProgress',
      htmlClass: 'progress-{' + metric_prefix + 'computed_values.progress ||none}',
        html:
          '<div class="good ss-check">On Track</div>' +
          '<div class="flat ss-right">In Progress</div>' +
          '<div class="poor ss-delete">Needs Improvement</div>' +
          '<div class="none ss-linechartclipboard">Collecting Data</div>'
    }
  end

  def goal_statement(metric_prefix = '')
    "{#{metric_prefix}goal.subject ||We} will " +
      "{#{metric_prefix}goal.metadata.comparison_function /</reduce/ />/increase/ ||change} " +
      "{#{metric_prefix}goal.name ||results} by {#{metric_prefix}goal.goal_delta %[,0] ||0}{#{metric_prefix}goal.goal_delta_is_pct /true/%/ ||} " +
      "by {#{metric_prefix}goal.end_date @[%B %Y] ||sometime}"
  end

  def dataset_icon
    { type: 'Text', customClass: 'tileIcon',
      htmlClass: 'type-{dataset.displayType} default-{dataset.flags /.*default.*/true/} ss-{dataset.displayType /table/list/ ' +
      '/map/compass/ /chart/barchart/ /api/downloadcloud/ /blob/attach/}' }
  end

  def govstat_category_map
    categories = GovstatCategory.find
    result = {}
    categories.each{ |category| result[category.id] = category.name }
    result
  end

  def govstat_homepage_config(is_public = true, dashboard_layout = nil)
    search = {}
    search[:isPublic] = is_public unless is_public.nil?

    config = CurrentDomain.configuration('gov_stat')
    show_all = config.nil? ? nil : config.properties.show_all
    show_all = true if show_all.nil? || show_all == 'true'
    show_all = false if show_all == 'false'

    dashboard_layout = config.properties.dashboard_layout if !config.nil?
    if dashboard_layout.nil?
      config = CurrentDomain.properties.gov_stat || Hashie::Mash.new
      dashboard_layout = config.dashboard_layout
    end

    configs = {
      grid_flow: {
        data: {
          categories: { type: 'govstatCategoryList' },
          goals: { type: 'goalList', search: search, draftGoals: false }
        },
        content: {
          type: 'Container',
          id: 'govstatHomeRoot',
          htmlClass: 'gridFlowLayoutNew',
          children: [{
            type: 'Share',
            currentPage: true
          }, {
            type: 'Repeater',
            htmlClass: 'categoryList',
            contextId: 'goals',
            groupBy: { value: '{goal.category}' },
            childProperties: { htmlClass: 'categoryItem' },
            noResultsChildren: [
              { type: 'Title', text: 'No Goals', htmlClass: 'noResults' }
            ],
            children: [{
              type: 'Container',
              contextId: 'categories_{_groupValue}',
              children: [
                { type: 'Title', text: '{category.name ||Untitled Category}', customClass: 'categoryTitle',
                  styles: { 'color' => '{category.color}', 'border-color' => '{category.color}' } },
                {
                  type: 'Repeater',
                  htmlClass: 'goalList',
                  contextId: '_groupItems',
                  childProperties: { customClass: 'singleItemWrapper' },
                  children: [{
                    type: 'Button',
                    notButton: true, # hahahaha
                    htmlClass: 'goalItem singleItem public-{goal.is_public ||false}',
                    href: '/goal/{goal.id}',
                    styles: { 'background-color' => '{category.color}' },
                    text: '<div class="singleInner">' +
                      '<h3 class="itemTitle goalName">{goal.name ||Untitled Goal}</h3>' +
                      '<p class="goalValue progress-{goal.metrics.0.computed_values.progress ||none} {goal.metrics.0.computed_values.metric_value /.+/hasValue/ ||}">{goal.metrics.0.computed_values.metric_value %[h] ||}</p>' +
                      '<p class="goalUnit">{goal.metrics.0.unit ||}</p>' +
                      '<div class="goalIcon ss-{goal.metadata.icon} {goal.metadata.icon /^.+$/hasIcon/ ||}"></div>' +
                      '<div class="goalProgress">' +
                        '<div class="progressIcon progress-{goal.metrics.0.computed_values.progress ||none} ss-{goal.metrics.0.computed_values.progress /good/check/ /progressing/right/ /poor/delete/ /bad/delete/ /none/linechartclipboard/ ||linechartclipboard}"></div>' +
                        '<div class="progressText progress-{goal.metrics.0.computed_values.progress ||none}">{goal.metrics.0.computed_values.progress /none/Collecting Data/ /good/On Track/ /progressing/In Progress/ /poor/Needs Improvement/ /bad/Needs Improvement/ ||Collecting Data}</div>' +
                      '</div></div>' +
                      '<div class="singleCaption"><div class="captionText">Details</div><div class="captionIcon ss-icon">next</div></div>' # hahahaha D:
                  }]
                }
              ]
            }]
          }]
        }
      },

      list: {
        data: {
          categories: { type: 'govstatCategoryList' },
          goals: { type: 'goalList', search: search, draftGoals: false }
        },
        content: {
          type: 'Container',
          id: 'govstatHomeRoot',
          htmlClass: 'listLayout',
          children: [
          {
            type: 'Share',
            currentPage: true
          }, {
            type: 'Container',
            htmlClass: 'filterSection',
            children: [
            { type: 'Title', text: 'Categories' },
            {
              type: 'Pager',
              pagedContainerId: 'categoryPages',
              selectorStyle: 'buttons',
              buttonStyle: 'sidebarTabs',
              associatedLabels: govstat_category_map
            }
            ]
          },
          {
            type: 'Repeater',
            htmlClass: 'categoryList',
            contextId: 'goals',
            groupBy: { value: '{goal.category}' },
            childProperties: { htmlClass: 'categoryItem', label: '{_groupValue}' },
            container: {
              type: 'PagedContainer',
              id: 'categoryPages',
              htmlClass: 'categoryItem',
              children: (show_all ? [ list_repeater('goals', 'All') ] : [])
            },
            noResultsChildren: [
            { type: 'Title', text: 'No Goals', htmlClass: 'noResults' }
            ],
            children: [
            {
              type: 'Container',
              contextId: 'categories_{_groupValue}',
              children: [
                list_repeater('_groupItems')
              ]
            }
            ]
          }
          ]
        }
      }
    }
    configs[dashboard_layout.try(:to_sym)] || configs[:list]
  end

  def list_repeater(context_id, label = nil)
    {
      label: label,
      type: 'Repeater',
      htmlClass: 'itemList goalList',
      contextId: context_id,
      childProperties: { htmlClass: 'singleItem goalItem progress-{goal.metrics.0.computed_values.progress ||none} public-{goal.is_public ||false}' },
      children: [
      {
        type: 'Container',
        htmlClass: 'mainSection',
        children: [
        { type: 'Title', text: '{goal.name ||Untitled Goal}', htmlClass: 'itemTitle' },
        {
          type: 'Text',
          htmlClass: 'itemSubtitle',
          html: goal_statement
        },
        {
          type: 'Container',
          customClass: 'goalValue',
          htmlClass: 'progress-{goal.metrics.0.computed_values.progress ||none}',
          children: [
          { type: 'Text', customClass: '{goal.metrics.0.computed_values.metric_value /.+/hasValue/ ||}', htmlClass: 'value', html: '{goal.metrics.0.computed_values.metric_value %[,3] ||}' },
          { type: 'Text', htmlClass: 'unit', html: '{goal.metrics.0.unit ||}' }
          ]
        }
        ]
      },
      {
        type: 'Container',
        htmlClass: 'expandedSection',
        hidden: true,
        children: [
        { type: 'Text', customClass: 'close', html: '<a href="#" class="ss-delete"></a>' },
        {
          type: 'HorizontalContainer',
          children: [
          {
            type: 'Container',
            weight: 7,
            htmlClass: 'goalDetails',
            children: [
            {

              # this is my fallback solution
              type: 'Container',
              customClass: 'goalVisualization',
              ifValue: 'goal.related_datasets.0',
              context: {
                type: 'dataset',
                datasetId: '{goal.related_datasets.0}'
              },
              children: [
              { type: 'Title', htmlClass: 'chartTitle', text: '{dataset.name}' },
              { type: 'Visualization', height: 250 }
              ]

              # this is what i wanted to do but the repeater or carousel or something seems unhappy
#                       type: 'Container',
#                       customClass: 'goalVisualizations',
#                       onlyIf: '{goal.related_datasets.0}',
#                       children: [
#                       {
#                         type: 'Repeater',
#                         contextId: 'goal.related_datasets',
#                         container: {
#                           type: 'Carousel',
#                           id: 'relatedDatasets',
#                           switchInterval: 10000,
#                           animate: false
#                         },
#                         children: [
#                         {
#                           type: 'Container',
#                           context: {
#                             type: 'dataset',
#                             datasetId: '{value}'
#                           },
#                           children: [
#                           { type: 'Title', htmlClass: 'chartTitle', text: '{dataset.name}' },
#                           { type: 'Visualization', height: 250 }
#                           ]
#                         }
#                         ]
#                       },
#                       {
#                         type: 'Pager',
#                         customClass: 'incrPager',
#                         pagedContainerId: 'relatedDatasets',
#                         selectorStyle: 'navigate'
#                       },
#                       {
#                         type: 'Pager',
#                         customClass: 'dotPager',
#                         buttonStyle: 'sidebarTabs',
#                         pagedContainerId: 'relatedDatasets',
#                         selectorStyle: 'buttons',
#                         hideButtonText: true
#                       }
#                       ]
            },
            {
              type: 'Text',
              customClass: 'goalDescription',
              ifValue: 'goal.metadata.description',
              html: '<p>{goal.metadata.description /\n/<\/p><p>/g ||}</p>'
            },
            {
              type: 'Text',
              customClass: 'goalFallback',
              html: 'This goal is measured by tracking <strong>{goal.metrics.0.title ||the Prevailing Metric}</strong> in <strong>{goal.metrics.0.unit ||units}</strong>'
            },
            {
              type: 'Text',
              customClass: 'goalLink',
              html: '<a href="/goal/{goal.id}" class="button ss-navigateright right">Goal Details</a>'
            }
            ]
          },
          {
            type: 'Container',
            weight: 3,
            htmlClass: 'metricContainer',
            children: [
            {
              type: 'Container',
              htmlClass: 'metric baselineValue',
              children: [ {
                type: 'Text',
                customClass: 'metricType',
                html: 'Baseline'
              },
              {
                type: 'Text',
                htmlClass: 'metricValue',
                html: '{goal.metrics.0.computed_values.baseline_value %[,3] ||}'
              },
              {
                type: 'Text',
                htmlClass: 'metricUnit',
                html: '{goal.metrics.0.unit ||}'
              },
              {
                type: 'Text',
                htmlClass: 'metricTime',
                html: '{goal.start_date @[%B %Y] ||}'
              }
              ]
            },
            {
              type: 'Container',
              htmlClass: 'metric targetValue',
              children: [ {
                type: 'Text',
                customClass: 'metricType',
                html: 'Target'
              },
              {
                type: 'Text',
                htmlClass: 'metricValue',
                html: '{goal.metrics.0.computed_values.target_value %[,3] ||}'
              },
              {
                type: 'Text',
                htmlClass: 'metricUnit',
                html: '{goal.metrics.0.unit ||}'
              },
              {
                type: 'Text',
                htmlClass: 'metricTime',
                html: '{goal.end_date @[%B %Y] ||}'
              }
              ]
            }
            ]
          }
          ]
        }
        ]
      }
    ]
    }
  end
end
