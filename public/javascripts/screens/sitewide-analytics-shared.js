;blist.namespace.fetch('blist.metrics');

var datasetsMetricName,
    datasetsListHeader,
    pageViewsName;

if(blist.feature_flags.dataset_count_v2){
  datasetsMetricName = 'datasets-published-v2';
} else {
  datasetsMetricName = 'datasets';
}
if (blist.feature_flags.embetter_analytics_page) {
  datasetsListHeader = 'Browser Page Views';
  pageViewsName = 'Browser Page Views';
} else {
  datasetsListHeader = '';
  pageViewsName = 'Page Views';
}

blist.metrics.sitewideShared = {
  urlBase: '/api/site_metrics.json',
  chartSections:  [
    {id: 'performanceChart',
      loading: blist.metrics.chartLoading,
      children: [
        {text: pageViewsName,
         series: [{method: 'js-page-view', label: 'Browser Page Views', options: { stacking: null}}]},
        {text: 'Rows Loaded',
         series: [{method: 'rows-loaded-api',   label: 'API'},
                  {method: 'rows-loaded-website', label: 'Website'},
                  {method: 'rows-loaded-widget',  label: 'SDP'}]}
      ]
    }
  ],
  detailSections: _.filter([
    {
      id: 'detailLenses',
      displayName: 'Data Lens Pages Added',
      summary: {
        plus: 'lense-new_view-published-v1',
        verbPhrase: 'Data Lens pages created',
        verbPhraseSingular: 'Data Lens page created',
        deltaPhrase: 'Data Lens pages'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    },
    {
      id: 'detailDatasets',
      displayName: 'Datasets Added',
      summary: {
        plus: datasetsMetricName,
        range: true,
        verbPhrase: 'datasets created',
        verbPhraseSingular: 'dataset created',
        deltaPhrase: 'datasets'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    },
    {id: 'detailPublicGoals',    displayName: 'Public Goals',
      summary: {plus: ['govstat-goal-isPublic-true'],
        verbPhrase: 'goals created', verbPhraseSingular: 'goal created'
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    },
    {id: 'detailPrivateGoals',    displayName: 'Private Goals',
      summary: {plus: 'govstat-goal-isPublic-false',
        verbPhrase: 'goals created', verbPhraseSingular: 'goal created'
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    },
    {id: 'detailWithRelatedMeasures',  displayName: 'Goals With Related Measures',
      summary: {plus: 'govstat-goal-hasRelatedMeasures-true',
        verbPhrase: 'goals created', verbPhraseSingular: 'goal created'
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    },
    {id: 'detailWithoutRelatedMeasures',  displayName: 'Goals Without Related Measures',
      summary: {plus: 'govstat-goal-hasRelatedMeasures-false',
        verbPhrase: 'goals created', verbPhraseSingular: 'goal created'
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    },
    {
      id: 'detailCharts',
      displayName: 'Charts',
      summary: {
        plus: ['charts-created'],
        minus: ['charts-deleted'],
        verbPhrase: 'charts created',
        verbPhraseSingular: 'chart created',
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'detailCharts',
      displayName: 'Charts Added',
      summary: {
        plus: 'lense-chart-published-v1',
        verbPhrase: 'charts created',
        verbPhraseSingular: 'chart created',
        deltaPhrase: 'charts'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    },
    {
      id: 'detailFilters',
      displayName: 'Filters',
      summary: {
        plus: ['filters-created'],
        minus: ['filters-deleted'],
        verbPhrase: 'filters created',
        verbPhraseSingular: 'filter created'
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'detailMaps',
      displayName: 'Maps',
      summary: {
        plus: ['maps-created'],
        minus: ['maps-deleted'],
        verbPhrase: 'maps created',
        verbPhraseSingular: 'map created',
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'detailMaps',
      displayName: 'Maps Added',
      summary: {
        plus: 'lense-map-published-v1',
        verbPhrase: 'maps created',
        verbPhraseSingular: 'map created',
        deltaPhrase: 'maps'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    },
    {
      id: 'detailFilters',
      displayName: 'Filters Added',
      summary: {
        plus: ['filters-created'],
        minus: ['filters-deleted'],
        verbPhrase: 'filters created',
        verbPhraseSingular: 'filter created',
        deltaPhrase: 'filters'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    },
    {
      id: 'detailSnapshots',
      displayName: 'Snapshots',
      summary: {
        plus: ['datasets-created-snapshot'],
        minus: ['datasets-deleted-snapshot'],
        verbPhrase: 'snapshots created',
        verbPhraseSingular: 'snapshot created',
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'detailHref',
      displayName: 'External Datasets Added',
      summary: {
        plus: ['datasets-created-href'],
        minus: ['datasets-deleted-href'],
        verbPhrase: 'external datasets created',
        verbPhraseSingular: 'external dataset created',
        deltaPhrase: 'external datasets'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    },
    {
      id: 'detailBlobs',
      displayName: 'Downloadable Files',
      summary: {
        plus: ['datasets-created-blobby'],
        minus: ['datasets-deleted-blobby'],
        verbPhrase: 'downloadable files created',
        verbPhraseSingular: 'downloadable file created',
        deltaPhrase: 'downloadable files'
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'detailBlobs',
      displayName: 'Downloadable Files Added',
      summary: {
        plus: ['datasets-created-blobby'],
        minus: ['datasets-deleted-blobby'],
        verbPhrase: 'downloadable files created',
        verbPhraseSingular: 'downloadable file created',
        deltaPhrase: 'downloadable files'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    },
    {
      id: 'detailHref',
      displayName: 'External Datasets',
      summary: {
        plus: ['datasets-created-href'],
        minus: ['datasets-deleted-href'],
        verbPhrase: 'external datasets created',
        verbPhraseSingular: 'external dataset created',
        deltaPhrase: 'external datasets'
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'detailRows',
      displayName: 'Rows Added',
      summary: {
        plus: 'rows-created',
        minus: 'rows-deleted',
        verbPhrase: 'rows created',
        verbPhraseSingular: 'row created',
        deltaPhrase: 'rows'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    },
    {
      id: 'detailSnapshots',
      displayName: 'Snapshots Added',
      summary: {
        plus: ['datasets-created-snapshot'],
        minus: ['datasets-deleted-snapshot'],
        verbPhrase: 'snapshots created',
        verbPhraseSingular: 'snapshot created',
        deltaPhrase: 'snapshots'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }
  ], function(section) { return section.enabled !== false; }),
  summarySections: _.filter([
    {
      id: 'summaryVisits',
      displayName: pageViewsName,
      summary: {
        plus: 'js-page-view',
        total: false,
        verbPhrase: 'pages viewed',
        verbPhraseSingular: 'page viewed',
        deltaPhrase: 'page views'
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    },
    {
      id: 'summaryVisits',
      displayName: pageViewsName,
      summary: {
        plus: 'page-views',
        verbPhrase: 'pages viewed',
        verbPhraseSingular: 'page viewed'
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'summaryDash',    displayName: 'Dashboards',
      summary: {
        plus: 'govstat-total-dash',
        verbPhrase: 'dashboards created',
        verbPhraseSingular: 'dashboards created'
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    },
    {
      id: 'summaryGoals',    displayName: 'Goals',
      summary: {
        plus: 'govstat-total-goals',
        verbPhrase: 'goals created',
        verbPhraseSingular: 'goal created'
      },
      enabled: blist.configuration.govStatMetricsEnabled || false
    },
    {
      id: 'summaryDatasets',
      displayName: 'Total Datasets',
      summary: {
        plus: datasetsMetricName,
        range: false,
        verbPhrase: 'datasets created',
        verbPhraseSingular: 'dataset created',
        deltaPhrase: 'datasets'
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'summaryRows',
      displayName: 'Total Rows',
      summary: {
        plus: 'rows-created',
        minus: 'rows-deleted',
        verbPhrase: 'rows created',
        verbPhraseSingular: 'row created',
        deltaPhrase: 'rows'
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'summaryEmbeds',
      displayName: 'Embeds',
      summary: {
        plus: 'embeds',
        verbPhrase: 'embeds',
        verbPhraseSingular: 'embed',
        deltaPhrase: 'embeds',
        total: true
      },
      enabled: !blist.feature_flags.embetter_analytics_page
    },
    {
      id: 'summaryEmbeds',
      displayName: 'Embed Views',
      summary: {
        plus: 'embeds',
        verbPhrase: 'embeds',
        verbPhraseSingular: 'embed',
        deltaPhrase: 'embeds',
        total: false
      },
      enabled: blist.feature_flags.embetter_analytics_page || false
    }
  ], function(section) { return section.enabled !== false; }),
  topListSections: [
    {
      id: 'topDatasets', displayName: 'Top Datasets',
      heading: datasetsListHeader, renderTo: 'leftColumn',
      callback: blist.metrics.topDatasetsCallback,  top: 'DATASETS'
    },
    {
      id: 'topReferrers', displayName: 'Top Referrers',
      heading: 'Referrals', className: 'expanding', renderTo: 'rightColumn',
      callback: blist.metrics.urlMapCallback, top: 'REFERRERS'
    },
    {
      id: 'topSearches', displayName: 'Top Search Terms',
      heading: 'Count', renderTo: 'leftColumn',
      callback: function($context) {
        blist.metrics.updateTopSearchesCallback($context, 'top-dataset-searches');
      },  top: 'SEARCHES'
    },
    {
      id: 'topEmbeds', displayName: 'Top Embeds',
      heading: 'Embeds', className: 'expanding', renderTo: 'rightColumn',
      callback: blist.metrics.urlMapCallback, top: 'EMBEDS'
    }
  ]
};
