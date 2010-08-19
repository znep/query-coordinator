;blist.namespace.fetch('blist.metrics');

$(function()
{
    var screen = $('#analyticsDataContainer').metricsScreen({
        urlBase: '/api/site_metrics.json',
        chartSections:  [
            {id: 'performanceChart',
                displayName: 'Performance',
                loading: blist.metrics.chartLoading,
                children: [
                    {text: 'Bytes Out', series: [{method: 'bytes-out'}]},
                    {text: 'Views Loaded', series: [{method: 'view-loaded'}]},
                    {text: 'Page Views', series: [{method: 'page-views'}]}
                ]
            },
            {id: 'rowsChart',
                displayName: 'Row Requests',
                loading: blist.metrics.chartLoading,
                children: [
                    {text: 'Rows Loaded',
                     series: [{method: 'rows-loaded-api',     label: 'API'},
                              {method: 'rows-loaded-website', label: 'Website'},
                              {method: 'rows-loaded-widget',  label: 'SDP'}]},
                    {text: 'Rows Accessed',
                     series: [{method: 'rows-accessed-website', label: 'Website'},
                              {method: 'rows-accessed-widget',  label: 'SDP'}]}
                ]
            }
        ],
        summarySections: [
            {
                id: 'summaryDatasets',    displayName: 'Datasets',
                summary: {plus: 'datasets-created', minus: 'datasets-deleted',
                    verbPhrase: 'datasets created', verbPhraseSingular: 'dataset created'
                }
            },
            {
                id: 'summaryRows',        displayName: 'Rows',
                summary: {plus: 'rows-created',     minus: 'rows-deleted',
                    verbPhrase: 'rows created', verbPhraseSingular: 'row created'
                }
            },
            {
                id: 'summaryVisits',      displayName: 'Visits',
                summary: {plus: 'page-views', verbPhrase: 'pages viewed',
                    verbPhraseSingular: 'page viewed'
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
                heading: 'Hits', renderTo: 'leftColumn',
                callback: blist.metrics.topDatasetsCallback,  top: 'DATASETS'
            },
            {
                id: 'topReferrers', displayName: 'Top Referrers',
                heading: 'Hits', className: 'expanding', renderTo: 'rightColumn',
                callback: blist.metrics.urlMapCallback, top: 'REFERRERS'
            },
            {
                id: 'topSearches', displayName: 'Top Search Terms',
                heading: 'Searches', renderTo: 'leftColumn',
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
    });

     $('#analyticsTimeControl').metricsTimeControl({
        metricsScreen: screen
    });
});
