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
                children: _.filter([
                    {text: 'Bytes Out',    series: [{method: 'bytes-out'}]},
                    {text: 'Views Loaded', series: [{method: 'view-loaded'}]},
                    {text: 'GovStat Hits',    series: [{method: 'govstat-total-computes'}], enabled: blist.configuration.govStatMetricsEnabled  || false},
                    {text: 'Rows Loaded',
                     series: [{method: 'rows-loaded-api',     label: 'API'},
                              {method: 'rows-loaded-website', label: 'Website'},
                              {method: 'rows-loaded-widget',  label: 'SDP'}]}
                ], function(section) { return section.enabled !== false; })
            }
        ];
        summaries = [
            viewSummary,
            downloadsSummary,
            {id: 'summaryEmbeds', displayName: 'Embeds', summary: {
             plus: 'embeds', verbPhrase: 'embeds', verbPhraseSingular: 'embed' }}
        ];
        details = [
            {id: 'detailMetricsUsing',   displayName: 'Dependent Metrics',  summary: {
                plus: 'govstat-metrics-using',
                verbPhrase: 'metrics backed',
                verbPhraseSingular: 'metric backed'
                },
                enabled: blist.configuration.govStatMetricsEnabled || false},
            {id: 'detailTotalComputes',   displayName: 'Total GovStat Hits',  summary: {
                plus: 'govstat-total-computes',
                verbPhrase: 'hits served',
                verbPhraseSingular: 'hit served'
                },
                enabled: blist.configuration.govStatMetricsEnabled || false},
            {id: 'detailFilters',   displayName: 'Filters',  summary: {
                 plus: 'filters-created',
                 minus: 'filters-deleted',
                 verbPhrase: 'filters created',
                 verbPhraseSingular: 'filter created' }},
            {id: 'detailCharts',    displayName: 'Charts',   summary: {
                plus: 'charts-created',
                minus:'charts-deleted',
                verbPhrase:'charts created',
                verbPhraseSingular:'chart created'}},
            {id: 'detailMaps',      displayName: 'Maps',     summary: {
                plus: 'maps-created',
                minus:'maps-deleted',
                verbPhrase:'maps created',
                verbPhraseSingular:'map created'}},
            {id: 'detailComments',  displayName: 'Comments', summary: {
                plus: 'comments-created',
                verbPhrase:'comments created',
                verbPhraseSingular:'comment created'}}
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
        detailSections: _.filter(details, function(section) { return section.enabled !== false; }),
        summarySections: _.filter(summaries, function(section) { return section.enabled !== false; }),
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
