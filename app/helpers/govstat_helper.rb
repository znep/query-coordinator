module GovstatHelper

  def progress_indicator(metric_prefix = '')
    metric_prefix += '.' if !metric_prefix.blank?
    { type: 'Text', customClass: 'goalProgress',
      htmlClass: 'progress-{' + metric_prefix + 'compute.progress ||none}',
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
            { type: 'Title', text: '{_groupValue}', customClass: 'categoryTitle' },
            {
              type: 'Repeater',
              htmlClass: 'goalList',
              contextId: '_groupItems',
              childProperties: { htmlClass: 'goalItem' },
              container: { type: 'GridContainer', cellWidth: 225, cellHeight: 225, cellSpacing: 0 },
              children: [
                progress_indicator('goal.metrics.0'),
                { type: 'Title', customClass: 'goalTitle', text: '{goal.name}' },
                { type: 'Text', customClass: 'goalDetails',
                  html: '<a href="/goal/{goal.id}"><span class="description">{goal.subject}</span><div class="more">More<span class="ss-icon">directright</span></div></a>' }
              ]
            }
            ]
          }
          ]
        }
      },

      list: {
        data: {
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
            { type: 'Title', text: '{_groupValue}', htmlClass: 'categoryTitle' },
            {
              type: 'Repeater',
              htmlClass: 'goalList',
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
      }
    }
    configs[name] || configs[:list]
  end
end
