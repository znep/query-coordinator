blist.namespace.fetch('blist.metrics');

$(function() {
  function t(str, props) {
    return $.t('screens.stats.' + str, props);
  }

  var storiesEnabled = !!blist.feature_flags.stories_enabled;
  var storiesMetricName = 'lense-story-published-v1';
  var datasetsMetricName = 'datasets-published-' + blist.feature_flags.datasets_published_count_version;
  var pageViewsName = t('browser_page_views');
  var datasetsListHeader = blist.feature_flags.embetter_analytics_browser_views_only ?
    pageViewsName : '';

  blist.metrics.sitewideShared = {
    urlBase: '/api/site_metrics.json',
    chartSections: [{
      id: 'performanceChart',
      loading: blist.metrics.chartLoading,
      children: [{
        text: pageViewsName,
        series: [{
          method: 'js-page-view',
          label: pageViewsName,
          options: {
            stacking: null
          }
        }]
      }, {
        text: t('rows_loaded'),
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
      }]
    }],
    detailSections: _.filter([{
      id: 'detailLenses',
      displayName: t('data_lens_pages_added'),
      summary: {
        plus: 'lense-data_lens-published-v1',
        verbPhrase: t('data_lens_pages_created'),
        verbPhraseSingular: t('data_lens_page_created'),
        deltaPhrase: t('data_lens_pages')
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'detailDatasets',
      displayName: t('datasets_added'),
      summary: {
        plus: datasetsMetricName,
        range: true,
        verbPhrase: t('datasets_created_lowercase'),
        verbPhraseSingular: t('dataset_created_lowercase'),
        deltaPhrase: t('datasets_lowercase')
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'detailPublicGoals',
      displayName: t('public_goals'),
      summary: {
        plus: ['govstat-goal-isPublic-true'],
        verbPhrase: t('goals_created'),
        verbPhraseSingular: t('goal_created')
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    }, {
      id: 'detailPrivateGoals',
      displayName: t('private_goals'),
      summary: {
        plus: 'govstat-goal-isPublic-false',
        verbPhrase: t('goals_created'),
        verbPhraseSingular: t('goal_created')
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    }, {
      id: 'detailWithRelatedMeasures',
      displayName: t('goals_with_related_measures'),
      summary: {
        plus: 'govstat-goal-hasRelatedMeasures-true',
        verbPhrase: t('goals_created'),
        verbPhraseSingular: t('goal_created')
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    }, {
      id: 'detailWithoutRelatedMeasures',
      displayName: t('goals_without_related_measures'),
      summary: {
        plus: 'govstat-goal-hasRelatedMeasures-false',
        verbPhrase: t('goals_created'),
        verbPhraseSingular: t('goal_created')
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    }, {
      id: 'detailBlobs',
      displayName: t('downloadable_files'),
      summary: {
        plus: ['lense-blob-published-v1'],
        verbPhrase: t('downloadable_files_created'),
        verbPhraseSingular:t('downloadable_file_created'),
        deltaPhrase: t('downloadable_files_lowercase')
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    }, {
      id: 'detailBlobs',
      displayName: t('downloadable_files_added'),
      summary: {
        plus: ['lense-blob-published-v1'],
        verbPhrase: t('downloadable_files_created'),
        verbPhraseSingular: t('downloadable_file_created'),
        deltaPhrase: t('downloadable_files_lowercase')
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'detailCharts',
      displayName: t('charts'),
      summary: {
        plus: ['lense-chart-published-v1'],
        verbPhrase: t('charts_created'),
        verbPhraseSingular: t('chart_created')
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    }, {
      id: 'detailCharts',
      displayName: t('charts_added'),
      summary: {
        plus: 'lense-chart-published-v1',
        verbPhrase: t('charts_created'),
        verbPhraseSingular: t('chart_created'),
        deltaPhrase: t('charts_lowerccase')
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'detailFilters',
      displayName: t('filters'),
      summary: {
        plus: ['filters-created'],
        minus: ['filters-deleted'],
        verbPhrase: t('filters_created'),
        verbPhraseSingular: t('filter_created')
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    }, {
      id: 'detailFilters',
      displayName: t('filters_added'),
      summary: {
        plus: ['filters-created'],
        minus: ['filters-deleted'],
        verbPhrase: t('filters_created'),
        verbPhraseSingular: t('filter_created'),
        deltaPhrase: t('filters_lowercase')
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'detailHref',
      displayName: t('external_datasets'),
      summary: {
        plus: ['lense-href-published-v1'],
        verbPhrase: t('external_datasets_created'),
        verbPhraseSingular: t('external_dataset_created'),
        deltaPhrase: t('external_datasets_lowercase')
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    }, {
      id: 'detailHref',
      displayName: t('external_dataset_added'),
      summary: {
        plus: ['lense-href-published-v1'],
        verbPhrase: t('external_datasets_created'),
        verbPhraseSingular: t('external_dataset_created'),
        deltaPhrase: t('external_datasets_lowercase')
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'detailMaps',
      displayName: t('maps'),
      summary: {
        plus: ['lense-map-published-v1'],
        verbPhrase: t('maps_created'),
        verbPhraseSingular: t('map_created')
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    }, {
      id: 'detailMaps',
      displayName: t('maps_added'),
      summary: {
        plus: 'lense-map-published-v1',
        verbPhrase: t('maps_created'),
        verbPhraseSingular: t('map_created'),
        deltaPhrase: t('maps_lowercase')
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'detailRows',
      displayName: t('rows_created'),
      summary: {
        plus: 'rows-created',
        minus: 'rows-deleted',
        verbPhrase: 'rows created',
        verbPhraseSingular: 'row created',
        deltaPhrase: 'rows'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'detailSnapshots',
      displayName: t('snapshots'),
      summary: {
        plus: ['datasets-created-snapshot'],
        minus: ['datasets-deleted-snapshot'],
        verbPhrase: t('snapshots_created'),
        verbPhraseSingular: t('snapshot_created')
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    }, {
      id: 'detailSnapshots',
      displayName: t('snapshots_added'),
      summary: {
        plus: ['datasets-created-snapshot'],
        minus: ['datasets-deleted-snapshot'],
        verbPhrase: t('snapshots_created'),
        verbPhraseSingular: t('snapshot_created'),
        deltaPhrase: t('snapshots_lowercase')
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }], function(section) {
      return section.enabled !== false;
    }),
    summarySections: _.filter([{
      id: 'summaryVisits',
      displayName: pageViewsName,
      summary: {
        plus: 'js-page-view',
        total: false,
        verbPhrase: t('pages_viewed'),
        verbPhraseSingular: t('page_viewed'),
        deltaPhrase: t('page_views_lowercase')
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'summaryVisits',
      displayName: pageViewsName,
      summary: {
        override: {
          delta: 'js-page-view'
        },
        plus: 'page-views',
        verbPhrase: t('pages_viewed'),
        verbPhraseSingular: t('page_viewed')
      },
      enabled: !blist.feature_flags.embetter_analytics_page || false
    }, {
      id: 'summaryDash',
      displayName: t('total_dashboards'),
      summary: {
        plus: 'govstat-total-dash',
        verbPhrase: t('dashbards_created'),
        verbPhraseSingular: t('dashbard_created')
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    }, {
      id: 'summaryGoals',
      displayName: t('total_goals'),
      summary: {
        plus: 'govstat-total-goals',
        verbPhrase: t('goals_created'),
        verbPhraseSingular: t('goal_created')
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    }, {
      id: 'summaryDatasets',
      displayName: t('total_datasets'),
      summary: {
        plus: datasetsMetricName,
        range: false,
        verbPhrase: t('datasets_created_lowercase'),
        verbPhraseSingular: t('dataset_created_lowercase'),
        deltaPhrase: t('datasets_lowercase')
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    }, {
      id: 'summaryStories',
      displayName: t('total_stories'),
      summary: {
        plus: storiesMetricName,
        range: false,
        verbPhrase: t('stories_created'),
        verbPhraseSingular: t('story_created'),
        deltaPhrase: t('stories_lowercase')
      },
      enabled: (!blist.feature_flags.embetter_analytics_page && storiesEnabled)
    }, {
      id: 'summaryRows',
      displayName: t('total_rows'),
      summary: {
        plus: 'rows-created',
        minus: 'rows-deleted',
        verbPhrase: t('rows_created'),
        verbPhraseSingular: t('row_created'),
        deltaPhrase: t('rows_lowercase')
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    }, {
      id: 'summaryEmbeds',
      displayName: t('embeds'),
      summary: {
        plus: 'embeds',
        verbPhrase: t('embeds_lowercase'),
        verbPhraseSingular: t('embed'),
        deltaPhrase: t('embeds_lowercase'),
        total: true
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    }, {
      id: 'summaryEmbeds',
      displayName: t('embed_views'),
      summary: {
        plus: 'embeds',
        verbPhrase: t('embeds_lowercase'),
        verbPhraseSingular: t('embed'),
        deltaPhrase: t('embeds_lowercase'),
        total: false
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }], function(section) {
      return section.enabled !== false;
    }),
    topListSections: _.compact([{
      id: 'topDatasets',
      displayName: t('top_datasets'),
      heading: datasetsListHeader,
      renderTo: 'leftColumn',
      callback: blist.metrics.topDatasetsCallback,
      top: 'DATASETS'
    }, {
      id: 'topReferrers',
      displayName: t('top_datasets_referrers'),
      heading: t('referrals'),
      className: 'expanding',
      renderTo: 'rightColumn',
      callback: blist.metrics.urlMapCallback,
      top: 'REFERRERS'
    },
      storiesEnabled ? {
          id: 'topStories',
          displayName: t('top_stories'),
          heading: datasetsListHeader,
          renderTo: 'leftColumn',
          callback: blist.metrics.topStoriesCallback,
          top: 'STORIES'
        } : null,
      storiesEnabled ? {
          id: 'topStoryReferrers',
          displayName: t('top_story_referrers'),
          heading: t('referrals'),
          className: 'expanding',
          renderTo: 'rightColumn',
          callback: blist.metrics.urlMapCallback,
          top: 'STORY_REFERRERS'
        } : null, {
        id: 'topSearches',
        displayName: t('top_search_terms'),
        heading: t('count'),
        renderTo: 'leftColumn',
        callback: function($context) {
          blist.metrics.updateTopSearchesCallback($context, 'top-dataset-searches');
        },
        top: 'SEARCHES'
      }, {
        id: 'topEmbeds',
        displayName: t('top_embeds'),
        heading: t('embeds'),
        className: 'expanding',
        renderTo: 'rightColumn',
        callback: blist.metrics.urlMapCallback,
        top: 'EMBEDS'
      }
    ])
  };
});
