;blist.namespace.fetch('blist.metrics');

$(function()
{
    // Shared between tabular and non-tabular
    var viewSummary = {id: 'summaryViews', displayName: 'Views', summary: {
             plus: 'visits',  verbPhrase: 'pages viewed',
             verbPhraseSingular: 'page viewed' }};

    var downloadsAction = (blist.dataset.viewType == 'href' ||
        blist.dataset.viewType == 'blobby') ?  'files-downloaded' : 'downloads';

    var downloadsSummary = {id: 'summaryDownloads', displayName: 'Downloads',
            summary: { plus: downloadsAction, verbPhrase: 'downloads',
                       verbPhraseSingular: 'download' }};

    var charts, summaries, details;
    if (blist.dataset.viewType == 'tabular')
    {
        charts = [
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
        ];
        summaries = [
            viewSummary,
            downloadsSummary,
            {id: 'summaryEmbeds', displayName: 'Embeds', summary: {
             plus: 'embeds', verbPhrase: 'embeds', verbPhraseSingular: 'embed' }}
        ];
        details = [
            {id: 'detailFilters',   displayName: 'Filters',  detail: 'filters-created'},
            {id: 'detailCharts',    displayName: 'Charts',   detail: 'charts-created'},
            {id: 'detailMaps',      displayName: 'Maps',     detail: 'maps-created'},
            {id: 'detailComments',  displayName: 'Comments', detail: 'comments-created'}
        ];
    }
    else
    {
        charts = [
            {id: 'performanceChart',
                loading: blist.metrics.chartLoading,
                children: [ {text: 'Views Loaded', series: [{method: 'view-loaded'}]} ]
            }
        ];
        summaries = [
            viewSummary,
            downloadsSummary
        ];
    }

    var screen = $('#analyticsDataContainer').metricsScreen($.extend({
        urlBase: '/api/views/' + blist.metrics.viewID +  '/metrics.json',
        chartSections:  charts,
        detailSections: details,
        summarySections: summaries,
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
