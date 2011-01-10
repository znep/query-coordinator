;blist.namespace.fetch('blist.metrics');

$(function()
{
    var screen = $('#analyticsDataContainer').metricsScreen($.extend({
        urlBase: '/api/views/' + blist.metrics.viewID +  '/balboa_metrics.json',
        chartSections:  [
            {id: 'performanceChart',
                loading: blist.metrics.chartLoading,
                children: [
                    {text: 'Bytes Out',    series: [{method: 'bytes-out'}]},
                    {text: 'Views Loaded', series: [{method: 'view-loaded'}]},
                    {text: 'Rows Loaded',
                     series: [{method: 'rows-loaded-api',     label: 'API'},
                              {method: 'rows-loaded-website', label: 'Website'},
                              {method: 'rows-loaded-widget',  label: 'SDP'}]}
                ]
            }
        ],
        detailSections: [
            {id: 'detailFilters',   displayName: 'Filters',  detail: 'filters-created'},
            {id: 'detailCharts',    displayName: 'Charts',   detail: 'charts-created'},
            {id: 'detailMaps',      displayName: 'Maps',     detail: 'maps-created'},
            {id: 'detailRatings',   displayName: 'Ratings',  detail: 'ratings-count'},
            {id: 'detailComments',  displayName: 'Comments', detail: 'comments-created'}
        ],
        summarySections: [
            {
                id: 'summaryViews',     displayName: 'Views',
                summary: {
                    plus: 'visits',  verbPhrase: 'pages viewed',
                    verbPhraseSingular: 'page viewed'
                }
            },
            {
                id: 'summaryDownloads', displayName: 'Downloads',
                summary: {
                    plus: 'downloads', verbPhrase: 'downloads',
                    verbPhraseSingular: 'download'
                }
            },
            {
                id: 'summaryEmbeds',    displayName: 'Embeds',
                summary: {
                    plus: 'embeds', verbPhrase: 'embeds',
                    verbPhraseSingular: 'embed'
                }
            }
        ],
        topListSections: [
            {
                id: 'topViews', displayName: 'Top Embeds',
                heading: 'Embeds', className: 'expanding', renderTo: 'leftColumn',
                callback: blist.metrics.urlMapCallback,  top: 'EMBEDS'
            },
            {
                id: 'topReferrers', displayName: 'Top Referrers',
                heading: 'Referrals', className: 'expanding', renderTo: 'rightColumn',
                callback: blist.metrics.urlMapCallback, top: 'REFERRERS'
            }
        ]
    }, blist.metrics.metricsScreenOptions));

     $('#analyticsTimeControl').metricsTimeControl({
        metricsScreen: screen
    });
});

