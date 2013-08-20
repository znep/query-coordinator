;blist.namespace.fetch('blist.metrics');

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
    detailSections: [
          {id: 'detailCharts',    displayName: 'Charts',   summary: { plus: ['charts-created'], minus: ['charts-deleted'] } },
          {id: 'detailFilters',   displayName: 'Filters',  summary: { plus: ['filters-created'], minus: ['filters-deleted'] } },
          {id: 'detailMaps',      displayName: 'Maps',     summary: { plus: ['maps-created'], minus: ['maps-deleted'] } },
          {id: 'detailSnapshots', displayName: 'Snapshots', summary: { plus: ['datasets-created-snapshot'], minus: ['datasets-deleted-snapshot'] } },
          {id: 'detailBlobs',     displayName: 'Downloadable Files', summary: { plus: ['datasets-created-blobby'], minus: ['datasets-deleted-blobby'] } },
          {id: 'detailHref',      displayName: 'External Datasets', summary: { plus: ['datasets-created-href'], minus: ['datasets-deleted-href'] } }
    ],
    summarySections: [
        {
            id: 'summaryVisits',      displayName: 'Page Views',
            summary: {plus: 'page-views', verbPhrase: 'pages viewed',
                verbPhraseSingular: 'page viewed'
            }
        },
        {
            id: 'summaryDatasets',    displayName: 'Total Datasets',
            summary: {
                plus: ['datasets-created', 'datasets-deleted-snapshot'],
                minus: ['datasets-deleted', 'datasets-created-snapshot'],
                verbPhrase: 'datasets created', verbPhraseSingular: 'dataset created'
            }
        },
        {
            id: 'summaryRows',        displayName: 'Total Rows',
            summary: {plus: 'rows-created', minus: 'rows-deleted',
                verbPhrase: 'rows created', verbPhraseSingular: 'row created'
            }
        },
        {
            id: 'summaryEmbeds',      displayName: 'Embeds',
            summary: {plus: 'embeds', verbPhrase: 'embeds',
                verbPhraseSingular: 'embed'
            }
        }
    ],
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
