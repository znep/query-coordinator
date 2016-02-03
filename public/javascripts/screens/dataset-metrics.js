;blist.namespace.fetch('blist.metrics');

$(function()
{
    var t = function(str, props) { return $.t('screens.stats.' + str, props); };
    // Shared between tabular and non-tabular
    var viewSummary = {id: 'summaryViews', displayName: t('views'), summary: {
             plus: 'visits',  verbPhrase: t('pages_viewed'),
             verbPhraseSingular: t('page_viewed') }};

    var downloadsAction = (blist.dataset.viewType == 'href' ||
        blist.dataset.viewType == 'blobby') ?  'files-downloaded' : 'downloads';

    var downloadsSummary = {id: 'summaryDownloads', displayName: $.capitalize(t('downloads')),
            summary: { plus: downloadsAction, verbPhrase: t('downloads'),
                       verbPhraseSingular: t('download') }};

    var charts, summaries, details, topLists;
    if (blist.dataset.viewType == 'tabular')
    {
        charts = [
            {
                id: 'performanceChart',
                loading: blist.metrics.chartLoading,
                children: _.filter([
                    {text: t('bytes_out'),    series: [{method: 'bytes-out'}]},
                    {text: t('views_loaded'), series: [{method: 'view-loaded'}]},
                    {text: t('govstat_hits'), series: [{method: 'govstat-total-computes'}], enabled: blist.configuration.govStatMetricsEnabled  || false},
                    {text: t('rows_loaded'),
                     series: [{method: 'rows-loaded-api',     label: t('api')},
                              {method: 'rows-loaded-website', label: t('website')},
                              {method: 'rows-loaded-widget',  label: t('sdp')}]}
                ], function(section) { return section.enabled !== false; })
            }
        ];
        summaries = [
            viewSummary,
            downloadsSummary,
            {id: 'summaryEmbeds', displayName: $.capitalize(t('embeds')), summary: {
             plus: 'embeds', verbPhrase: t('embeds'), verbPhraseSingular: t('embed') }}
        ];
        details = [
            {id: 'detailMetricsUsing',   displayName: t('dependent_metrics'),  summary: {
                plus: 'govstat-metrics-using',
                verbPhrase: t('metrics_backed'),
                verbPhraseSingular: t('metric_backed')
                },
                enabled: blist.configuration.govStatMetricsEnabled || false},
            {id: 'detailTotalComputes',   displayName: t('total_govstat_hits'),  summary: {
                plus: 'govstat-total-computes',
                verbPhrase: t('hits_served'),
                verbPhraseSingular: t('hit_served')
                },
                enabled: blist.configuration.govStatMetricsEnabled || false},
            {id: 'detailFilters',   displayName: t('filters'),  summary: {
                 plus: 'filters-created',
                 verbPhrase: t('filters_created'),
                 verbPhraseSingular: t('filter_created') }},
            {id: 'detailCharts',    displayName: t('charts'),   summary: {
                plus: 'charts-created',
                verbPhrase: t('charts_created'),
                verbPhraseSingular: t('chart_created')}},
            {id: 'detailMaps',      displayName: t('maps'),     summary: {
                plus: 'maps-created',
                verbPhrase: t('maps_created'),
                verbPhraseSingular: t('map_created')}},
            {id: 'detailComments',  displayName: t('comments'), summary: {
                plus: 'comments-created',
                verbPhrase: t('comments_created'),
                verbPhraseSingular: t('comment_created')}}
        ];
        topLists = [
            {
                id: 'topViews', displayName: t('top_embeds'),
                heading: $.capitalize(t('embeds')), className: 'expanding', renderTo: 'leftColumn',
                callback: blist.metrics.urlMapCallback,  top: 'EMBEDS'
            },
            {
                id: 'topReferrers', displayName: t('top_referrers'),
                heading: t('referrals'), className: 'expanding', renderTo: 'rightColumn',
                callback: blist.metrics.urlMapCallback, top: 'REFERRERS'
            }
        ];
    } else if (blist.dataset.displayType == 'story') {
            summaries = [
                {
                  id: 'summaryVisits',
                  displayName: t('browser_page_views'),
                  summary: {
                    plus: 'js-page-view',
                    total: false,
                    verbPhrase: t('pages_viewed'),
                    verbPhraseSingular: t('page_viewed'),
                    deltaPhrase: t('browser_page_views')
                  }
                }
            ]
            charts = [
                {
                    id: 'performanceChart',
                    loading: blist.metrics.chartLoading,
                    children: [ { text: t('browser_page_views'), series: [ { method: 'js-page-view' } ] } ]
                }
            ];
            topLists = [
                {
                    id: 'topReferrers', displayName: t('top_referrers'),
                    heading: t('referrals'), className: 'expanding', renderTo: 'leftColumn',
                    callback: blist.metrics.urlMapCallback, top: 'REFERRERS'
                }
            ];
    } else {
        charts = [
            {
                id: 'performanceChart',
                loading: blist.metrics.chartLoading,
                children: [ {text: t('views_loaded'), series: [{method: 'view-loaded'}]} ]
            }
        ];
        summaries = [
            viewSummary,
            downloadsSummary
        ];
        topLists = [
            {
                id: 'topViews', displayName: t('top_embeds'),
                heading: $.capitalize(t('embeds')), className: 'expanding', renderTo: 'leftColumn',
                callback: blist.metrics.urlMapCallback,  top: 'EMBEDS'
            },
            {
                id: 'topReferrers', displayName: t('top_referrers'),
                heading: t('referrals'), className: 'expanding', renderTo: 'rightColumn',
                callback: blist.metrics.urlMapCallback, top: 'REFERRERS'
            }
        ];
    }

    var screen = $('#analyticsDataContainer').metricsScreen($.extend({
        urlBase: '/api/views/' + blist.metrics.viewID +  '/metrics.json',
        chartSections:  charts,
        detailSections: _.filter(details, function(section) { return section.enabled !== false; }),
        summarySections: _.filter(summaries, function(section) { return section.enabled !== false; }),
        topListSections: _.filter(topLists, function(section) { return section.enabled !== false; })
    }, blist.metrics.metricsScreenOptions));

     $('#analyticsTimeControl').metricsTimeControl({
        metricsScreen: screen
    });
});
