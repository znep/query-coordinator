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
                summary: {plus: 'datasets-created', minus: 'datasets-deleted'}
            },
            {
                id: 'summaryRows',        displayName: 'Rows',
                summary: {plus: 'rows-created',     minus: 'rows-deleted'}
            },
            {
                id: 'summaryVisits',      displayName: 'Visits',
                summary: {plus: 'page-views'}
            },
            {
                id: 'summaryEmbeds',      displayName: 'Embeds',
                summary: {plus: 'embeds'}
            }
        ],
        topListSections: [
            {
                id: 'topDatasets', displayName: 'Top Datasets',
                heading: 'Hits', className: 'left',
                callback: blist.metrics.topDatasetsCallback,  top: 'DATASETS'
            },
            {
                id: 'topReferrers', displayName: 'Top Referrers',
                heading: 'Hits', className: 'right expanding',
                callback: blist.metrics.urlMapCallback, top: 'REFERRERS'
            },
            {
                id: 'topSearches', displayName: 'Top Search Terms',
                heading: 'Searches', className: 'left',
                callback: function($context) {
                    blist.metrics.updateTopSearchesCallback($context, 'top-dataset-searches');
                },  top: 'SEARCHES'
            },
            {
                id: 'topEmbeds', displayName: 'Top Embeds',
                heading: 'Embeds', className: 'right expanding',
                callback: blist.metrics.urlMapCallback, top: 'EMBEDS'
            }
        ]
    });

     $('#analyticsTimeControl').metricsTimeControl({
        metricsScreen: screen
    });
});
