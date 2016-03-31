(function() {
  'use strict';

  blist.namespace.fetch('blist.metrics');

  var t = function(str, props) { return $.t('screens.stats.' + str, props); };

  var pageViewsSection;
  if (blist.feature_flags['embetter_analytics_page']) {
    pageViewsSection = {
      text: 'Browser Page Views',
      title: 'Browser Page Views',
      series: [
        {
          method: 'js-page-view',
          label: 'Browser Page Views',
          options: {stacking: null}
        }
      ]
    };
  } else {
    pageViewsSection = {
      text: 'Page Views',
      title: 'Page Views',
      series: [
        {
          method: 'page-views',
          label: 'Page Requests',
          options: {stacking: null, type: 'line'}
        },
        {
          method: 'js-page-view',
          label: t('browser_page_views'),
          options: {stacking: null, type: 'line'}
        }
      ]
    };
  }

  $(function() {
    blist.metrics.datasetPostfix = '/stats';
    var storiesEnabled = !!blist.feature_flags.stories_enabled;
    var screen = $('#analyticsDataContainer').metricsScreen(
      $.extend({}, blist.metrics.sitewideShared,
        {
          chartSections: [
            {
              id: 'performanceChart',
              loading: blist.metrics.chartLoading,
              children: _.filter([
                pageViewsSection,
                {
                  text: 'Browsers',
                  title: 'Browsers',
                  series: [
                    {
                      method: 'browser-chrome',
                      label: 'Chrome',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'browser-firefox',
                      label: 'Firefox',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'browser-safari',
                      label: 'Safari',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'browser-ie',
                      label: 'IE',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'browser-other',
                      label: 'Other',
                      options: {stacking: null, type: 'line'}
                    }
                  ]
                },
                {
                  text: 'Page Types',
                  title: 'Page Types',
                  series: _.compact([
                    {
                      method: 'js-page-view-homepage',
                      label: 'Homepage',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'js-page-view-dataset',
                      label: 'Dataset',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'js-page-view-dataslate',
                      label: 'Dataslate',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'js-page-view-admin',
                      label: 'Admin',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'js-page-view-profile',
                      label: 'Profile',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'js-page-view-govstat',
                      label: 'OP',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'js-page-view-browse',
                      label: 'Catalog',
                      options: {stacking: null, type: 'line'}
                    },
                    {
                      method: 'js-page-view-newux',
                      label: 'Data Lens',
                      options: {stacking: null, type: 'line'}
                    },
                    storiesEnabled ? {
                      method: 'js-page-view-story',
                      label: 'Stories',
                      options: {stacking: null, type: 'line'}
                    } : null,
                    {
                      method: 'js-page-view-other',
                      label: 'Other',
                      options: {stacking: null, type: 'line'}
                    }
                  ])
                },
                {
                  text: 'Dashboard Views',
                  title: 'Dashboard Views',
                  series: [{
                    method: 'govstat-dash-gets',
                    label: 'Dashboard Requests'
                  }],
                  enabled: blist.configuration.govStatMetricsEnabled || false
                },
                {
                  text: 'Goal Views',
                  title: 'Goal Views',
                  series: [{
                    method: 'govstat-goal-gets',
                    label: 'Goal Requests'
                  }],
                  enabled: blist.configuration.govStatMetricsEnabled || false
                },
                {
                  text: 'Disk Usage', series: [{method: 'disk-usage'}],
                  title: 'Disk Usage',
                  transform: 'smooth'
                },
                {
                  text: 'Bytes Out',
                  title: 'Bytes Out',
                  series: [{method: 'bytes-out'}]
                },
                {
                  text: 'Views Loaded',
                  title: 'Views Loaded',
                  series: [{method: 'view-loaded'}]
                },
                {
                  text: 'Rows Loaded',
                  title: 'Rows Loaded',
                  series: [
                    { method: 'rows-loaded-api', label: 'API' },
                    { method: 'rows-loaded-website', label: 'Website' },
                    { method: 'rows-loaded-widget', label: 'SDP' }
                  ]
                }
              ], function(section) {
                return section.enabled !== false;
              })
            }
          ],
          topListSections: blist.metrics.sitewideShared.topListSections.concat(
            {
              id: 'topApps', displayName: 'Top Applications',
              heading: 'Requests', renderTo: 'leftColumn',
              callback: blist.metrics.topAppTokensCallback, top: 'APPLICATIONS'
            },
            {
              id: 'topDownloads', displayName: 'Top Downloads',
              heading: 'Downloads', renderTo: 'rightColumn',
              callback: blist.metrics.topDatasetsCallback, top: 'DOWNLOADS'
            }
          )
        }));

    $('#analyticsTimeControl').metricsTimeControl({
      metricsScreen: screen
    });
  });

})();
