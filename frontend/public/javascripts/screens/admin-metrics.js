(function() {
  'use strict';

  blist.namespace.fetch('blist.metrics');

  function t(str, props) {
    return $.t('screens.stats.' + str, props);
  }

  var pageViewsSection;
  if (blist.feature_flags['embetter_analytics_browser_views_only']) {
    pageViewsSection = {
      text: t('browser_page_views'),
      title: t('browser_page_views'),
      series: [{
        method: 'js-page-view',
        label: t('browser_page_views'),
        options: {
          stacking: null
        }
      }]
    };
  } else {
    pageViewsSection = {
      text: t('page_views'),
      title: t('page_views'),
      series: [{
        method: 'page-views',
        label: t('page_requests'),
        options: {
          stacking: null,
          type: 'line'
        }
      }, {
        method: 'js-page-view',
        label: t('browser_page_views'),
        options: {
          stacking: null,
          type: 'line'
        }
      }]
    };
  }

  $(function() {
    blist.metrics.datasetPostfix = '/stats';
    var storiesEnabled = !!blist.feature_flags.stories_enabled;
    var screen = $('#analyticsDataContainer').metricsScreen(
      $.extend({}, blist.metrics.sitewideShared, {
        chartSections: [{
          id: 'performanceChart',
          loading: blist.metrics.chartLoading,
          children: _.filter([
            pageViewsSection, {
              text: t('browsers'),
              title: t('browsers'),
              series: [{
                method: 'browser-chrome',
                label: 'Chrome',
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'browser-firefox',
                label: 'Firefox',
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'browser-safari',
                label: 'Safari',
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'browser-ie',
                label: 'IE',
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'browser-other',
                label: t('browser_other'),
                options: {
                  stacking: null,
                  type: 'line'
                }
              }]
            }, {
              text: t('page_types'),
              title: t('page_types'),
              series: _.compact([{
                method: 'js-page-view-homepage',
                label: t('homepage'),
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'js-page-view-dataset',
                label: t('dataset'),
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'js-page-view-dataslate',
                label: t('dataslate'),
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'js-page-view-admin',
                label: t('admin'),
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'js-page-view-profile',
                label: t('profile'),
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'js-page-view-govstat',
                label: t('op'),
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'js-page-view-browse',
                label: t('catalog'),
                options: {
                  stacking: null,
                  type: 'line'
                }
              }, {
                method: 'js-page-view-newux',
                label: t('data_lens'),
                options: {
                  stacking: null,
                  type: 'line'
                }
              },
                storiesEnabled ? {
                    method: 'js-page-view-story',
                    label: t('stories'),
                    options: {
                      stacking: null,
                      type: 'line'
                    }
                  } : null, {
                  method: 'js-page-view-other',
                  label: t('other'),
                  options: {
                    stacking: null,
                    type: 'line'
                  }
                }
              ])
            }, {
              text: t('dashboard_views'),
              title: t('dashboard_views'),
              series: [{
                method: 'govstat-dash-gets',
                label: t('dashboard_requests')
              }],
              enabled: blist.configuration.govStatMetricsEnabled || false
            }, {
              text: t('goal_views'),
              title: t('goal_views'),
              series: [{
                method: 'govstat-goal-gets',
                label: t('goal_requests')
              }],
              enabled: blist.configuration.govStatMetricsEnabled || false
            }, {
              text: t('disk_usage'),
              series: [{
                method: 'disk-usage'
              }],
              title: t('disk_usage'),
              transform: 'smooth'
            }, {
              text: t('bytes_out'),
              title: t('bytes_out'),
              series: [{
                method: 'bytes-out'
              }]
            }, {
              text: t('views_loaded'),
              title: t('views_loaded'),
              series: [{
                method: 'view-loaded'
              }]
            }, {
              text: t('rows_loaded'),
              title: t('rows_loaded'),
              series: [{
                method: 'rows-loaded-api',
                label: t('api')
              }, {
                method: 'rows-loaded-website',
                label: t('website')
              }, {
                method: 'rows-loaded-widget',
                label: t('sdp')
              }]
            }
          ], function(section) {
            return section.enabled !== false;
          })
        }],
        topListSections: blist.metrics.sitewideShared.topListSections.concat({
          id: 'topApps',
          displayName: t('top_applications'),
          heading: t('requests'),
          renderTo: 'leftColumn',
          callback: blist.metrics.topAppTokensCallback,
          top: 'APPLICATIONS'
        }, {
          id: 'topDownloads',
          displayName: t('top_downloads'),
          heading: t('downloads'),
          renderTo: 'rightColumn',
          callback: blist.metrics.topViewsCallbackNoFilter,
          top: 'DOWNLOADS'
        })
      }));

    $('#analyticsTimeControl').metricsTimeControl({
      metricsScreen: screen
    });
  });

})();
