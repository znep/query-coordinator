module GovstatHelper

  def progress_indicator(metric_prefix = '')
    metric_prefix += '.' if !metric_prefix.blank?
    { type: 'Text', customClass: 'goalProgress',
      htmlClass: 'progress-{' + metric_prefix + 'computed_values.progress ||none}',
        html:
          '<div class="good ss-upwardsbarchart"><span class="text">On Track</span></div>' +
          '<div class="flat ss-hyphen"><span class="text">In Progress</span></div>' +
          '<div class="poor ss-downwardsbarchart"><span class="text">Needs Improvement</span></div>' +
          '<div class="none ss-linechartclipboard"><span class="text">Collecting Data</span></div>'
    }
  end

  def govstat_homepage_config(name = '')
    configs = {
      grid_flow: {
        data: {
          categories: { type: 'govstatCategoryList' },
          goals: { type: 'goalList', search: { isPublic: true } }
        },
        content: {
          type: 'Container',
          id: 'govstatHomeRoot',
          htmlClass: 'gridFlowLayout',
          children: [
          {
            type: 'Repeater',
            htmlClass: 'categoryList',
            contextId: 'goals',
            groupBy: { value: '{goal.category}' },
            childProperties: { htmlClass: 'categoryItem' },
            noResultsChildren: [
              { type: 'Title', text: 'No Goals', htmlClass: 'noResults' }
            ],
            children: [
            {
              type: 'Container',
              contextId: 'categories_{_groupValue}',
              children: [
              { type: 'Title', text: '{category.name ||Draft}', customClass: 'categoryTitle',
                styles: { 'color' => '{category.color}' } },
              {
                type: 'Repeater',
                htmlClass: 'goalList',
                contextId: '_groupItems',
                container: { type: 'GridContainer', cellWidth: 200, cellHeight: 200, cellSpacing: 0 },
                children: [{
                  type: 'Container', htmlClass: 'goalItem singleItem',
                  styles: { 'background-color' => '{category.color}' },
                  children: [{
                    type: 'Container', htmlClass: 'singleInner',
                    children: [
                      { type: 'Title', customClass: 'goalTitle title', text: '{goal.name}' },
                      { type: 'Text', customClass: 'goalSubject', html: '{goal.subject}' },
                      progress_indicator('goal.metrics.0'),
                      #{ type: 'Text', customClass: 'goalProgress', ifValue: 'goal.metrics.0.computed_values.delta',
                        #html: 'Status: <span class="value">{goal.metrics.0.computed_values.delta ||}%</span>' },
                      { type: 'Text', customClass: 'goalLink primaryAction',
                        html: '<a href="/goal/{goal.id}"><div class="actionDetails ss-right"></div></a>' }
                    ]
                  }]
                }]
              }
              ]
            }
            ]
          }
          ]
        }
      },

      list: {
        data: {
          categories: { type: 'govstatCategoryList' },
          goals: { type: 'goalList', search: { isPublic: true } }
        },
        content: {
          type: 'Container',
          id: 'govstatHomeRoot',
          htmlClass: 'listLayout',
          children: [
          {
            type: 'Repeater',
            htmlClass: 'categoryList',
            contextId: 'goals',
            groupBy: { value: '{goal.category}' },
            childProperties: { htmlClass: 'categoryItem' },
            noResultsChildren: [
            { type: 'Title', text: 'No Goals', htmlClass: 'noResults' }
            ],
            children: [
            {
              type: 'Container',
              contextId: 'categories_{_groupValue}',
              children: [
              { type: 'Title', text: '{category.name ||Draft}', htmlClass: 'categoryTitle' },
              {
                type: 'Repeater',
                htmlClass: 'goalList',
                styles: { 'background-color' => '{category.color}' },
                contextId: '_groupItems',
                childProperties: { htmlClass: 'goalItem' },
                children: [
                { type: 'Container', customClass: 'progressDetails',
                  ifValue: 'goal.metrics.0.compute.delta',
                  children: [
                  { type: 'Text', htmlClass: 'barValue progress-{goal.metrics.0.compute.progress}',
                    html: 'Complete<span class="bar" ' +
                    'style="width:{goal.metrics.0.compute.deltaFoo ||25}%;"></span>' },
                  { type: 'Text', htmlClass: 'textValue', html: '{goal.metrics.0.compute.delta}%' },
                  ]
                },
                { type: 'Text', customClass: 'goalProgress',
                  htmlClass: 'progress-{goal.metrics.0.compute.progress}' },
                { type: 'Title', text: '{goal.name}', htmlClass: 'goalTitle' },
                { type: 'Text', html: '{goal.subject}', htmlClass: 'goalSubject' },
                { type: 'Text', customClass: 'goalDetails',
                  html: '<a href="/goal/{goal.id}"><span class="description">{goal.subject}</span><div class="more">More<span class="ss-icon">directright</span></div></a>' }
                ]
              }
              ]
            }
            ]
          }
          ]
        }
      }
    }
    configs[name] || configs[:list]
  end
end
