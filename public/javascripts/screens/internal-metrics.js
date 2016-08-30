var metricsNS = blist.namespace.fetch('blist.metrics');

$(function()
{
    var kpiGen = function(svc, isAvg)
    {
        var svcFull = 'com.blist.services.' + svc,
            hash = {label: svc, numerator: svcFull + '-time'};
        if (isAvg)
          hash.denominator = svcFull + '-requests';
        return hash;
    },
    generateChartChildren = function(services)
    {
        return _.map([{title: 'KPI - Average Request Time (ms)', isAvg: true},
                      {title: 'KPI - Total Request Time (ms)', isAvg: false}],
            function(config) {
                return {text: config.title, series: _.map(services,
                    function(service) {
                        return kpiGen(service, config.isAvg);
                    })
                };
            }
        );
    },
    keyServices = [
        'views.RowsService',
        'ImportsService',
        'SearchService',
        'UsersService',
        'DomainsService'
    ];

    var screen = $('#analyticsDataContainer').metricsScreen({
        urlBase: '/api/internal_metrics.json',
        chartSections:  [
            {id: 'internalChart',
                chartType: 'line',
                loading: blist.metrics.chartLoading,
                stacking: false,
                type: 'kpi',
                children: generateChartChildren(keyServices)
            }
        ],
        topListSections: [
            {
                id: 'topApps', displayName: 'Top Applications',
                heading: 'Requests', renderTo: 'leftColumn',
                callback: blist.metrics.topAppTokensCallback,  top: 'APPLICATIONS'
            }
        ]
    });

    $('#analyticsTimeControl').metricsTimeControl({
        metricsScreen: screen
    });

    $('.additionalKpibutton').click(function(event){
        event.preventDefault();
        keyServices.push($('.additionalKpi').val());
        $('.additionalKpi').val('');
        $('#internalChart').metricsChartUpdate({
            children: generateChartChildren(keyServices)
        });
        screen.trigger('metricsChartRedraw');
    });
});

