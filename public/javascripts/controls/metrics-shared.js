;var metricsNS = blist.namespace.fetch('blist.metrics');
blist.namespace.fetch('blist.metrics.transforms');

metricsNS.SERIES_KEY = 'data-series';
metricsNS.DATA_KEY   = 'data-metrics';
metricsNS.DATE_START = 'data-date-start';
metricsNS.DATE_END   = 'data-date-end';
metricsNS.TRANSFORM  = 'data-transform';
metricsNS.SHOW_COUNT = 5;

/*
 * Publicly accessible callback functions for shared analytics
 * functionality between sitewide and dataset-specific data
 *
 */

// Common render function to take a list of data and make table
metricsNS.renderTopList = function(data, $target)
{
    var table = $target.find('.metricsList');

    // Clear out the table if we're loading the first set of rows
    if ($target.data('count') <= metricsNS.SHOW_COUNT)
    { table.find('tbody').remove().end(); }

    if (data.length > 0)
    {
        table.parent()
            .removeClass('noDataAvailable loadingMore')
                .end()
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
    var mapped   = [],
        sorted   = $context.data('sorted-data');
    if ($.isBlank(sorted))
    {
        // Cache a sorted, arrayified version of the data
        // so we don't generate it every time they click 'Show More'
        sorted = metricsNS.sortData(data);
        $context.data('sorted-data', sorted);
    }

    var count    = $context.data('count'),
        newCount = count + metricsNS.SHOW_COUNT,
        dataPart = sorted.slice(count, newCount);

    $context.data('count', newCount);

    _.each(dataPart, function(entry)
    {
        if (_.isFunction(mapFunction))
        { mapFunction(entry.item, entry.data, mapped); }
        else
        { mapped.push({name: entry.item, value: entry.data,
               textValue: Highcharts.numberFormat(entry.data, 0)}); }
    });

    $context
        .toggleClass('moreDataAvailable', newCount < sorted.length);

    if (_.isFunction(postProcess))
    { postProcess(mapped, $context); }
    else
    { metricsNS.renderTopList(mapped, $context); }
};

metricsNS.showMoreClicked = function(section)
{
    var $context = $('#' + section.id);
    $context.addClass('loadingMore');
    section.callback($context);
};

metricsNS.sortData = function(data)
{
    var array = [];
    // Turn associative array (hash) into key/value pair (item, count) array
    for (var key in data)
    {
        if (!key.startsWith('__') && data.hasOwnProperty(key))
        {
            var dataPoint = data[key],
                count     = dataPoint;
            if (typeof(dataPoint) !== 'number')
            {
                count = _.reduce(dataPoint, function(memo, num) { return memo + num; }, 0);
            }
            array.push({item: key, count: count, data: dataPoint});
        }
    }
    // Sort descending
    array.sort(function(a, b) {
        return (b.count || 0) - (a.count || 0);
    });
    return array;
};

// This one's pretty easy
metricsNS.updateTopSearchesCallback = function($context, key)
{
    var data = $context.data(metricsNS.DATA_KEY)[key];

    // HACK HACK HACK
    if(data)
    {
        delete data["''"];
        delete data["null"];
    }

    metricsNS.updateTopListWrapper($context, data);
};

// Need to do some extra work here because only UIDs are returned from balboa
metricsNS.topDatasetsCallback = function($context)
{
    metricsNS.updateTopListWrapper($context,
        $context.data(metricsNS.DATA_KEY),
        function(key, value, results) {
            $.socrataServer.makeRequest({url: '/views/' + key  + '.json', type: 'get', batch: true,
                success: function(responseData)
                {
                    results.push({linkText: responseData.name,
                        value: value,
                        textValue: Highcharts.numberFormat(value, 0),
                        href: new Dataset(responseData).url + '/stats'
                    });
                }
            });
        },
        function(data, $context) {
            var render = function() {
                metricsNS.renderTopList(data, $context);
            };
            // Some of the batch may have resulted in error, just
            // process what we have
            $.socrataServer.sendBatch(render, render);
        }
    );
};

// Grab the name and info for an app_token, including thumbnail URL (if present)
metricsNS.topAppTokensCallback = function($context)
{
    metricsNS.updateTopListWrapper($context,
        $context.data(metricsNS.DATA_KEY),
        function(key, value, results) {
            $.socrataServer.makeRequest({url: '/api/app_tokens/' + key + '.json',
                batch: true, type: 'get',
                success: function(response)
                {
                    var thumbed = response.thumbnailSha,
                        klass = thumbed ? 'showThumbnail' : '',
                        thumbnail = thumbed ? ('/api/file_data/' + response.thumbnailSha +
                            '?size=tiny') : '';

                    var owner = new User(response.owner);
                    results.push({linkText: response.name || '(deleted)',
                        extraClass: klass,
                        href: owner.getProfileUrl() + '/app_tokens/' + response.id,
                        value: value,
                        textValue: Highcharts.numberFormat(value, 0),
                        thumbnail: thumbnail
                    });
                }
            });
        },
        function(data, $context) {
            var render = function() {
                metricsNS.renderTopList(data, $context);
            };
            // Some of the batch may have resulted in error, just
            // process what we have
            $.socrataServer.sendBatch(render, render);
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
                      summaries.verbPhrase) + ' ' + region;
        }
    };

    summaryCalculator('total', '-total');
    summaryCalculator('delta');

    summaryToolTip('total', 'total');
    summaryToolTip('delta', 'during this time period');

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
    var data   = $chart.data(metricsNS.DATA_KEY),
        series = $chart.data(metricsNS.SERIES_KEY),
        start  = $chart.data(metricsNS.DATE_START),
        end    = $chart.data(metricsNS.DATE_END);

    $chart.siblings('.loadingSpinner').hide();

    if (!$.isBlank(data) && data.length > 0)
    {
        $chart.parent().removeClass('noDataAvailable');
        metricsNS.renderMetricsChart(data, $chart,
            start.getTime(), end.getTime(), sliceType, series, options);
    }
    else
    {
        _.defer(function() {
            $chart.parent().addClass('noDataAvailable').fadeIn();
        });
    }
};

// Removes jagged drops to zero, which are probably the result
// of data not being recorded for that period
metricsNS.transforms.smooth = function(data)
{
    var lastVal;
    for (var i = 0; i < data.length; i++)
    {
        var item = data[i];
        if (item) { lastVal = item; }
        else if (lastVal)
        {
            data[i] = lastVal;
        }
    }
    return data;
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
          '@class+'          : 'topItem.extraClass',
          '.thumbnail@src'   : 'topItem.thumbnail',
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
