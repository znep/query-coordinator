;blist.namespace.fetch('blist.metrics');

var datasetsMetricName;

if(blist.feature_flags.dataset_count_v2){
  datasetsMetricName = 'datasets-published-v2';
} else {
  datasetsMetricName = 'datasets';
}

blist.metrics.sitewideShared = {
    urlBase: '/api/site_metrics.json',
    chartSections:  [
        {id: 'performanceChart',
            loading: blist.metrics.chartLoading,
            children: [
                {text: 'Page Views',
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
        {id: 'detailCharts',    displayName: 'Charts',   summary: { plus: ['charts-created'], minus: ['charts-deleted'] } },
        {id: 'detailFilters',   displayName: 'Filters',  summary: { plus: ['filters-created'], minus: ['filters-deleted'] } },
        {id: 'detailMaps',      displayName: 'Maps',     summary: { plus: ['maps-created'], minus: ['maps-deleted'] } },
        {id: 'detailSnapshots', displayName: 'Snapshots', summary: { plus: ['datasets-created-snapshot'], minus: ['datasets-deleted-snapshot'] } },
        {id: 'detailBlobs',     displayName: 'Downloadable Files', summary: { plus: ['datasets-created-blobby'], minus: ['datasets-deleted-blobby'] } },
        {id: 'detailHref',      displayName: 'External Datasets', summary: { plus: ['datasets-created-href'], minus: ['datasets-deleted-href'] } }
    ], function(section) { return section.enabled !== false; }),
    summarySections: _.filter([
        {
            id: 'summaryVisits',      displayName: 'Page Views',
            summary: {
		plus: 'page-views', 
		verbPhrase: 'pages viewed',
                verbPhraseSingular: 'page viewed'
            }
        },
        {
            id: 'summaryDash',        displayName: 'Total Dashboards',
            summary: {
		plus: 'govstat-total-dash',
                verbPhrase: 'dashboards created', 
		verbPhraseSingular: 'dashboards created'
            },
            enabled: blist.configuration.govStatMetricsEnabled || false
        },
        {
            id: 'summaryGoals',        displayName: 'Total Goals',
            summary: {
		plus: 'govstat-total-goals',
                verbPhrase: 'goals created', 
		verbPhraseSingular: 'goal created'
            },
            enabled: blist.configuration.govStatMetricsEnabled || false
        },
        {
            id: 'summaryDatasets',    displayName: 'Total Datasets',
            summary: {
                plus: datasetsMetricName,
		range: false,
                verbPhrase: 'datasets created', 
		verbPhraseSingular: 'dataset created'
            }
        },
        {
            id: 'summaryLenses',
            displayName: 'Total Data Lenses',
            summary: {
                plus: 'lense-new_view-published-v1',
                range: false,
                verbPhrase: 'lenses created',
                verbPhraseSingular: 'lens created'
            }
        },
        {
            id: 'summaryRows',        displayName: 'Total Rows',
            summary: {
		plus: 'rows-created', 
		minus: 'rows-deleted',
                verbPhrase: 'rows created', 
		verbPhraseSingular: 'row created'
            }
        },
        {
            id: 'summaryEmbeds',      displayName: 'Embeds',
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
            heading: '', renderTo: 'leftColumn',
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
