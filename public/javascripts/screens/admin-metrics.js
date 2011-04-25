;blist.namespace.fetch('blist.metrics');

$(function()
{
    var screen = $('#analyticsDataContainer').metricsScreen(
        $.extend(true, blist.metrics.sitewideShared,
    {
        chartSections:  [
            {id: 'performanceChart',
                loading: blist.metrics.chartLoading,
                children: [
                    {text: 'Page Views',   series: [{method: 'page-views'}]},
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
        ]
    }));

     $('#analyticsTimeControl').metricsTimeControl({
        metricsScreen: screen
    });
});
