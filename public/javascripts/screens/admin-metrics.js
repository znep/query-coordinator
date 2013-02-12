;blist.namespace.fetch('blist.metrics');

$(function()
{
    blist.metrics.datasetPostfix = '/stats';
    var screen = $('#analyticsDataContainer').metricsScreen(
        $.extend({}, blist.metrics.sitewideShared,
    {
        chartSections:  [
            {id: 'performanceChart',
                loading: blist.metrics.chartLoading,
                children: [
                    {text: 'Page Views',
                     series: [{method: 'page-views', label: 'Requests'},
                              {method: 'js-page-views', label: 'Browser'}]},
                    {text: 'Disk Usage',   series: [{method: 'disk-usage'}],
                                           transform: 'smooth'},
                    {text: 'Bytes Out',    series: [{method: 'bytes-out'}]},
                    {text: 'Views Loaded', series: [{method: 'view-loaded'}]},
                    {text: 'Rows Loaded',
                     series: [{method: 'rows-loaded-api',     label: 'API'},
                              {method: 'rows-loaded-website', label: 'Website'},
                              {method: 'rows-loaded-widget',  label: 'SDP'}]}
                ]
            }
        ],
        topListSections: blist.metrics.sitewideShared.topListSections.concat(
            {
                id: 'topApps', displayName: 'Top Applications',
                heading: 'Requests', renderTo: 'leftColumn',
                callback: blist.metrics.topAppTokensCallback, top: 'APPLICATIONS'
            },
            {
                id: 'topDownloads', displayName: 'Top Downloads',
                heading: 'Downloads', renderTo: 'rightColumn',
                callback: blist.metrics.topDatasetsCallback, top: 'DOWNLOADS'
            }
        )
    }));

    $('#analyticsTimeControl').metricsTimeControl({
        metricsScreen: screen
    });
});
