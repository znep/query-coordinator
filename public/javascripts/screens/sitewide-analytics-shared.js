;blist.namespace.fetch('blist.metrics');

var datasetsMetricName,
    pageViewsSummary,
    mapsSummary,
    dataLensesEnabled,
    datasetsListHeader,
    totalPrefix,
    addedSuffix,
    pageViewsName;

if(blist.feature_flags.dataset_count_v2){
  datasetsMetricName = 'datasets-published-v2';
} else {
  datasetsMetricName = 'datasets';
}
if (blist.feature_flags.embetter_analytics_page) {
    pageViewsSummary = {plus: 'js-page-view', total: false};
    mapsSummary = {plus: 'lense-map-published-v1', range: false}
    dataLensesEnabled = true;
    datasetsListHeader = 'Browser Page Views';
    totalPrefix = '';
    addedSuffix = ' Added';
    pageViewsName = 'Browser Page Views';
} else {
    pageViewsSummary = {
        plus: 'page-views',
        verbPhrase: 'pages viewed',
        verbPhraseSingular: 'page viewed'
    };
    mapsSummary = {plus: ['maps-created'], minus: ['maps-deleted']};
    dataLensesEnabled = false;
    datasetsListHeader = '';
    totalPrefix = 'Total ';
    addedSuffix = '';
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
                 series: [{method: 'rows-loaded-api',     label: 'API'},
                          {method: 'rows-loaded-website', label: 'Website'},
                          {method: 'rows-loaded-widget',  label: 'SDP'}]}
            ]
        }
    ],
    detailSections: _.filter([
        {id: 'detailPublicGoals',      displayName: 'Public Goals',
            summary: {plus: ['govstat-goal-isPublic-true'],
                verbPhrase: 'goals created', verbPhraseSingular: 'goal created'
            },
            enabled: blist.configuration.govStatMetricsEnabled || false
        },
        {id: 'detailPrivateGoals',      displayName: 'Private Goals',
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
        {id: 'detailCharts',    displayName: 'Charts' + addedSuffix,   summary: { plus: ['charts-created'], minus: ['charts-deleted'] } },
        {id: 'detailLenses',    displayName: 'Data Lens Pages', summary: { plus: 'lense-new_view-published-v1', range: false }, enabled: dataLensesEnabled },
        {id: 'detailFilters',   displayName: 'Filters' + addedSuffix,  summary: { plus: ['filters-created'], minus: ['filters-deleted'] } },
        {id: 'detailMaps',      displayName: 'Maps',     summary: mapsSummary },
        {id: 'detailSnapshots', displayName: 'Snapshots' + addedSuffix, summary: { plus: ['datasets-created-snapshot'], minus: ['datasets-deleted-snapshot'] } },
        {id: 'detailBlobs',     displayName: 'Downloadable Files' + addedSuffix, summary: { plus: ['datasets-created-blobby'], minus: ['datasets-deleted-blobby'] } },
        {id: 'detailHref',      displayName: 'External Datasets' + addedSuffix, summary: { plus: ['datasets-created-href'], minus: ['datasets-deleted-href'] } }
    ], function(section) { return section.enabled !== false; }),
    summarySections: _.filter([
        {
            id: 'summaryVisits',
            displayName: pageViewsName,
            summary: pageViewsSummary
        },
        {
            id: 'summaryDash',        displayName: totalPrefix + 'Dashboards',
            summary: {
		plus: 'govstat-total-dash',
                verbPhrase: 'dashboards created', 
		verbPhraseSingular: 'dashboards created'
            },
            enabled: blist.configuration.govStatMetricsEnabled || false
        },
        {
            id: 'summaryGoals',        displayName: totalPrefix + 'Goals',
            summary: {
		plus: 'govstat-total-goals',
                verbPhrase: 'goals created', 
		verbPhraseSingular: 'goal created'
            },
            enabled: blist.configuration.govStatMetricsEnabled || false
        },
        {
            id: 'summaryDatasets',    displayName: totalPrefix + 'Datasets',
            summary: {
                plus: datasetsMetricName,
                range: false,
                verbPhrase: 'datasets created',
		verbPhraseSingular: 'dataset created'
            }
        },
        {
            id: 'summaryRows',        displayName: totalPrefix + 'Rows' + addedSuffix,
            summary: {
		plus: 'rows-created', 
		minus: 'rows-deleted',
                verbPhrase: 'rows created', 
		verbPhraseSingular: 'row created',
                deltaPhrase: 'rows'
            }
        },
        {
            id: 'summaryEmbeds',      displayName: 'Embeds' + addedSuffix,
            summary: {
		plus: 'embeds', 
		verbPhrase: 'embeds',
                verbPhraseSingular: 'embed'
            }
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
