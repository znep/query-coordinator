module GovstatHelper

  def progress_indicator(metric_prefix = '')
    metric_prefix += '.' if !metric_prefix.blank?
    { type: 'Text', customClass: 'goalProgress',
      htmlClass: 'progress-{' + metric_prefix + 'compute.progress}',
      ifValue: metric_prefix + 'compute.delta',
        html:
          '<div class="good">On Track<span class="ss-icon">directup</span></div>' +
          '<div class="flat">In Progress<span class="ss-icon">directright</span></div>' +
          '<div class="poor">Needs Improvement<span class="ss-icon">directdown</span></div>'
    }
  end

  def govstat_homepage_config(name = '')
    configs = {
      grid_flow: {
        data: {
          goals: { type: 'goalList' }
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
            children: [
            { type: 'Title', text: '{_groupValue}', customClass: 'categoryTitle' },
            {
              type: 'Repeater',
              htmlClass: 'goalList',
              contextId: '_groupItems',
              childProperties: { htmlClass: 'goalItem' },
              container: { type: 'GridContainer', cellWidth: 200, cellHeight: 150, cellSpacing: 0 },
              children: [
                progress_indicator('goal.metrics.0'),
                { type: 'Title', text: '{goal.name}' },
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
          goals: { type: 'goalList' }
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
                { type: 'Text', htmlClass: 'barValue',
                  html: 'Complete<span class="bar" ' +
                  'style="width:{goal.metrics.0.compute.delta}%;"></span>' },
                { type: 'Text', htmlClass: 'textValue', html: '{goal.metrics.0.compute.delta}%' },
                ]
              },
              { type: 'Text', customClass: 'goalProgress',
                htmlClass: 'progress-{goal.metrics.0.compute.progress}' },
              { type: 'Title', text: '{goal.name}' },
              { type: 'Text', html: '{goal.subject}' }
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
