;var metricsNS = blist.namespace.fetch('blist.metrics');

metricsNS.SERIES_KEY = 'data-series';
metricsNS.DATA_KEY   = 'data-metrics';

/*
 * Publicly accessible callback functions for shared analytics
 * functionality between sitewide and dataset-specific data
 *
 */

// Common render function to take a list of data and make table
metricsNS.renderTopList = function(data, $target)
{
    var table = $target.find('.metricsList')
        .find('tbody').remove().end();

    if (data.length > 0)
    {
        table.parent().removeClass('noDataAvailable').end()
            .append(
                $.renderTemplate('metricsTopItem', data,
                    metricsNS.topListItemDirective))
                .trigger('update')
                .trigger('sorton', [[[1,1]]])
                .end().fadeIn();
    }
    else
    { table.parent().addClass('noDataAvailable').fadeIn(); }
};

// Shared data processing function to turn balboa metrics hash, call
// appropriate transformation then rendering function
metricsNS.updateTopListWrapper = function($context, data, mapFunction, postProcess)
{
    var mapped   = [];

    for (var key in data)
    {
        if (!key.startsWith('__') && data.hasOwnProperty(key))
        {
            if (_.isFunction(mapFunction))
            { mapFunction(key, data[key], mapped); }
            else
            { mapped.push({name: key, value: data[key],
                           textValue: Highcharts.numberFormat(data[key], 0)}); }
        }
    }

    if (_.isFunction(postProcess))
    { postProcess(mapped, $context); }
    else
    { metricsNS.renderTopList(mapped, $context); }
};

// This one's pretty easy
metricsNS.updateTopSearchesCallback = function($context, key)
{
    metricsNS.updateTopListWrapper($context, $context.data(metricsNS.DATA_KEY)[key]);
};

// Need to do some extra work here because only UIDs are returned from balboa
metricsNS.topDatasetsCallback = function($context)
{
    metricsNS.updateTopListWrapper($context,
        $context.data(metricsNS.DATA_KEY),
        function(key, value, results) {
            $.socrataServer.addRequest({
                cache: false,
                url: '/views/' + key  + '.json',
                type: 'GET',
                success: function(responseData) {
                    results.push({linkText: responseData.name,
                        value: value,
                        textValue: Highcharts.numberFormat(value, 0),
                        href: $.generateViewUrl(responseData)
                    });
                }
            });
        },
        function(data, $context) {
            // Success won't be called if data is empty
            if (!$.socrataServer.runRequests({
                    success: function() {
                        metricsNS.renderTopList(data, $context);
                    }
                }))
            { metricsNS.renderTopList(data, $context); }
        }
    );
};

// Take the url maps and transform them into usable links with sublinks
metricsNS.urlMapCallback = function($context)
{
    metricsNS.updateTopListWrapper($context,
        $context.data(metricsNS.DATA_KEY),
        function(key, urlHash, results) {
            var totalCount = 0,
                subLinks = [];
            for (var subKey in urlHash)
            {
                if (urlHash.hasOwnProperty(subKey))
                {
                    totalCount += urlHash[subKey];
                    subLinks.push({linkText: subKey,
                        href: key + subKey,
                        value: urlHash[subKey]
                    });
                }
            }
            results.push({linkText: key, value: totalCount,
                textValue: Highcharts.numberFormat(totalCount, 0),
                href: '#expand', linkClass: 'expandTopSection',
                children: _.sortBy(subLinks, function(subItem) {
                    return -subItem.value;
                })
            });
        }
    );
};

metricsNS.summarySectionCallback = function($context)
{
    var summaries = $context.data('data-summary'),
        data      = $context.data(metricsNS.DATA_KEY),
        mappedData = {},
        summaryCalculator = function(key, append)
    {
        mappedData[key] = data[summaries.plus + (append || '')] || 0;

        if (!$.isBlank(summaries.minus))
        {
            mappedData[key] -= (data[summaries.minus + (append || '')] || 0);
        }
    },
        summaryToolTip = function(key, region)
    {
        if (!$.isBlank(summaries.verbPhrase))
        {
            mappedData[key + 'Text'] =
                (mappedData[key] == 0 ? 'No' : Highcharts.numberFormat(mappedData[key], 0)) +
                   ' ' + (mappedData[key] == 1 ? summaries.verbPhraseSingular :
                      summaries.verbPhrase) + ' ' +
                region + ' this time period';
        }
    };

    summaryCalculator('total', '-total');
    summaryCalculator('delta');

    // Semi-hack: balboa returns _before_ this time period as 'total',
    // but that really doesn't make much sense, so calculate the actual total
    mappedData.total += mappedData.delta;

    summaryToolTip('total', 'through');
    summaryToolTip('delta', 'during');

    if (mappedData.delta < 0)
    {
        mappedData.delta *= -1;
        mappedData.deltaClass = 'minus';
    }
    else
    {
        mappedData.deltaClass = 'plus';
    }

    mappedData.total = Highcharts.numberFormat(mappedData.total, 0);
    mappedData.delta = Highcharts.numberFormat(mappedData.delta, 0);

    metricsNS.renderSummarySection($context, mappedData,
        metricsNS.summaryDataDirective, 'metricsSummaryData');
};

metricsNS.detailSectionCallback = function($context)
{
    var detail = $context.data('data-detail'),
        data   = $context.data(metricsNS.DATA_KEY),
        mappedData = {
            total: data[detail.toLowerCase()] || 0
        };

    metricsNS.renderSummarySection($context, mappedData,
        metricsNS.detailDataDirective, 'metricsDetailData');
};

metricsNS.renderSummarySection = function($context, data, directive, templateName)
{
    $context.find('.dynamicContent').empty().append(
        $.renderTemplate(templateName, data, directive))
        .end().fadeIn();
};

metricsNS.updateChartCallback = function($chart, sliceType, options)
{
    var data = $chart.data(metricsNS.DATA_KEY),
        series = $chart.data(metricsNS.SERIES_KEY);

    $chart.siblings('.loadingSpinner').hide();

    if (!$.isBlank(data) && data.length > 0)
    {
        $chart.parent().removeClass('noDataAvailable');
        metricsNS.renderMetricsChart(data, $chart, sliceType, series, options);
    }
    else
    {
        _.defer(function() {
            $chart.parent().addClass('noDataAvailable').fadeIn();
        });
    }
};

metricsNS.chartLoading = function($chart)
{
    $chart
      .hide()
      .siblings('.loadingSpinner')
      .fadeIn();
};

metricsNS.topListItemDirective = {
  '.item' : {
      'topItem <- ': {
          '.titleText'       : 'topItem.name',
          '.titleLink'       : 'topItem.linkText',
          '.titleLink@href'  : 'topItem.href',
          '.titleLink@class+': 'topItem.linkClass',
          '.value .primaryValue' : 'topItem.value',
          '.value .primary'  : 'topItem.textValue',
          '.subLinks': {
              'subItem <- topItem.children' : {
                  '.subLink'      : 'subItem.linkText',
                  '.subLink@href' : 'subItem.href'
              }
          },
          '.subValues': {
              'subItem <- topItem.children' : {
                  '.subValue': 'subItem.value'
              }
          }
      }
  }
};

metricsNS.summaryDataDirective = {
    '.deltaValue' : 'delta',
    '.deltaBox@title' : 'deltaText',
    '.totalValue' : 'total',
    '.totalValue@title' : 'totalText',
    '.deltaBox@class+': 'deltaClass'
};

metricsNS.detailDataDirective = {
    '.totalValue' : 'total'
};
