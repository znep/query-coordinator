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
            { mapped.push({name: key, value: data[key]}); }
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
        mappedData = {
            total: data[summaries.plus + '-total'] || 0,
            delta: data[summaries.plus] || 0,
            deltaClass: 'plus'
        };

    if (!$.isBlank(summaries.minus))
    {
        var minusAmount = data[summaries.minus + '-total'] || 0,
            minusDelta  = data[summaries.minus] || 0;

        mappedData.total -= minusAmount;
        mappedData.delta -=  minusDelta;
    }

    if (mappedData.delta < 0)
    {
        mappedData.delta *= -1;
        mappedData.deltaClass = 'minus';
    }

    $context.find('.dynamicContent').empty().append(
        $.renderTemplate('metricsSummaryData',
            mappedData,
            metricsNS.summaryDataDirective)
    ).end().fadeIn();
};

(function($)
{
    var fireSectionUpdate = function(section, $screen, urlBase, dateStr, type, slice)
    {
        var $section = $screen.find('#' + section.id),
            series = $section.data(metricsNS.SERIES_KEY),
            url = urlBase + '?date=' + dateStr + '&type=' + type;

        if (_.isFunction(section.loading))
        { section.loading($section); }

        // Either a custom method, top method, or index
        if (!$.isBlank(series))
        { url = url + '&method=series&slice=' + slice; }
        else if (!$.isBlank(section.top))
        { url = url + '&method=top&top=' + section.top; }

        $.Tache.Get({
            cache: false,
            type: 'GET',
            url: url,
            success: function(data)
            {
                $section.data(metricsNS.DATA_KEY, data);
                if (_.isFunction(section.callback))
                { section.callback($section, slice); }
            }
        });
    };

    var subChartTypeChanged = function($link, sliceDepth)
    {
        // Swap out the menu's text for the current selection
        var chart = $link
            .closest('.menu').find('.menuButton .contents')
                .text($.trim($link.text())).end().end()
            .closest('.chartContainer').find('.chartContent');

        chart.data(metricsNS.SERIES_KEY,
            JSON.parse($link.attr(metricsNS.SERIES_KEY)));
        // Re-draw chart via callback
        redrawChart(chart, sliceDepth);
    };

    var redrawChart = function(chart, sliceDepth, animate)
    {
        chart.data('data-callback')(chart, sliceDepth,
            {plotOptions: {area: {animation: animate}}} );
    };

    var refreshData = function($screen, sections, opts,
            currentDate, currentInterval, currentSlice)
    {
        _.each(sections, function(section)
        { fireSectionUpdate(section, $screen, opts.urlBase,
              currentDate, currentInterval, currentSlice); });
    };

    var expandTopSubSection = function(event)
    {
        event.preventDefault();
        $(event.target).closest('.item').find('.subContainer')
            .slideToggle();
    };

    // Merge defaults into each of the list's items
    var mergeItems = function(list, defaults)
    {
        return _.map(list, function(item)
            { return $.extend(item, defaults); });
    };

    $.fn.metricsScreen = function(options)
    {
        var opts = $.extend({}, $.fn.metricsScreen.defaults, options),
            $screen         = $(this),
            currentInterval = null,
            currentSlice    = opts.initialSliceDepth,
            currentStart    = null,
            sections = [] // Add any page-specific sections
                .concat(mergeItems(opts.chartSections, opts.chartDefaults))
                .concat(mergeItems(opts.summarySections, opts.summaryDefaults))
                .concat(opts.topListSections);

        var $summaryDisplay = $screen.find('.summaryDisplay').append(
            $.renderTemplate('metricsSummaryItem', opts.summarySections,
                    opts.summaryDirective)
        );

        $summaryDisplay.equiWidth();

        // Load each of the charts and create their menus
        var chartDisplay =  $.renderTemplate('metricsCharts',
            opts.chartSections, opts.chartDirective);

        _.each(opts.chartSections, function(section)
        {
            var currentChart = chartDisplay.find('#' + section.id);

            currentChart.parent().siblings('.menu').menu({
                additionalJsonKeys: ['series'],
                menuButtonContents: '<span class="contents">' +
                    section.children[0].text + '</span>',
                menuButtonTitle: section.children[0].text,
                contents: section.children
            });

            currentChart.data(metricsNS.SERIES_KEY, section.children[0].series);
        });

        $screen.find('.chartsDisplay').append(chartDisplay);

        $screen.find('.chartContainer .menu ul > li > a').click(function(event)
        {
            event.preventDefault();
            subChartTypeChanged($(event.target).closest('a')
                .closest('.chartMenu').siblings('.chartArea')
                //.css('visibility','visibile')
                    .end().end(), currentSlice);
        });

        /*
        if($('body').hasClass('ie7'))
        {
            $screen.find('.chartMenu .menuButton').click(function(event)
            {
                $(event.target).closest('.chartMenu').siblings('.chartArea')
                    .css('visibility', 'hidden');
            });

            $(document).bind('click', function(event)
            {
                $screen.find('.chartArea').css('visibility', 'visible');
            });
        }
        */

        $screen.find('.topDisplay').append(
            $.renderTemplate('metricsTopList', opts.topListSections, opts.topListDirective))
            .find('table').tablesorter(
            {
                textExtraction: function(node) {
                    return $(node).find('.primary').text();
                }
            }
        );

        _.defer(function(){
            $summaryDisplay.trigger('resize');
        });

        _.each(opts.summarySections, function(section)
        { $screen.find('#' + section.id).data('data-summary', section.summary); });

        // Listen for a custom event to trigger data refresh
        $screen.bind('metricsTimeChanged', function(event, newStart, newInterval, newSlice)
        {
            if (newStart != currentStart || newInterval != currentInterval)
            {
                refreshData($screen, sections, opts,
                    newStart, newInterval, newSlice);
            }
            else if (newSlice != currentSlice)
            {
                refreshData($screen, opts.chartSections, opts,
                    newStart, newInterval, newSlice);
            }
            currentInterval = newInterval;
            currentStart    = newStart;
            currentSlice    = newSlice;
        });

        // Only charts need to listen to a time slice change
        $screen.bind('metricsSliceChanged', function(event, newSlice)
        {
            if (newSlice != currentSlice)
            {
                refreshData($screen, opts.chartSections, opts,
                    currentStart, currentInterval, newSlice);
            }
            currentSlice = newSlice;
        });

        // Store a copy of the necessary information
        _.each(sections, function(section)
        { $screen.find('#' + section.id).data('data-callback', section.callback); });

        $.live('.expandTopSection', 'click', expandTopSubSection);

        $(window).bind('resize', function(event)
        {
            _.each(opts.chartSections, function(chart)
            {
                // Redraw without animation
                if (!$.isBlank(chart.redrawTimer)) 
                { clearTimeout(chart.redrawTimer); }
                chart.redrawTimer = setTimeout(
                    function()
                    {
                        redrawChart($screen.find('#' + chart.id),
                            currentSlice, false);
                        chart.redrawTimer = null;
                    }, opts.redrawTimeout);
            });
        });
        return this;
    };

    $.fn.metricsTimeControl = function(options)
    {
        var opts       = $.extend({}, $.fn.metricsTimeControl.defaults, options)
            today      = Date.parse('today')
            monthStart = today.clone().moveToFirstDayOfMonth()
                              .toString(opts.parseDateFormat),
            monthEnd   = today.toString(opts.parseDateFormat),
            $this      = $(this),
            $timeslice = $this.find('.currentTimeSlice'),
            $slicer    = $this.find('.sliceDepth');

        // We can't slice on weekly, but it's still a valid interval
        var sliceOptionForInterval = function(interval)
        {
            if ('Weekly' == interval)
            { return $slicer.find('[value="Daily"]'); }
            return $slicer.find('[value="' + interval + '"]').prev();
        }

        var updateDateParams = function(value, $slicer)
        {
            var parts     = value.split(opts.separator),
                startDate = Date.parse(parts[0]),
                interval  = 'Daily',
                $sliceDepth = null;

            // If they picked a single day, zoom into the highest
            // level of detail
            if (parts.length < 2)
            {
                $sliceDepth = $slicer.find('option:first');
            }
            else
            {
                // Now we get to revers engineer what kind of interval they selected
                var starting = startDate.clone(),
                    endDate = Date.parse(parts[1]);

                if (starting.add({weeks: 1}).compareTo(endDate) > -1)
                { interval = 'Weekly'; }
                else if (starting.add({months: 1}).compareTo(endDate) > -1)
                { interval = 'Monthly'; }
                else
                { interval = 'Yearly'; }

                $sliceDepth = sliceOptionForInterval(interval);
            }

            // Disable slices shallower than the current range,
            // enable all others
            if (!_.isNull($sliceDepth))
            {
                $sliceDepth.attr('disabled', '')
                    .prevAll().attr('disabled', '')
                        .end()
                    .nextAll().attr('disabled', 'disabled');

                $slicer.val($sliceDepth.val());
                $.uniform.update($slicer);
            }

            var newDate = startDate.format(opts.serverDateFormat);

            opts.metricsScreen.trigger('metricsTimeChanged',
                [newDate, interval, $slicer.val().toUpperCase()]);
        };


        $timeslice.val(monthStart + ' ' + opts.separator + ' ' + monthEnd)
        .daterangepicker({
            dateFormat: opts.displayDateFormat,
            doneButtonText: 'Apply',
            earliestDate: opts.minimumDate,
            latestDate: today,
            onClose: function()
            { updateDateParams($timeslice.val(), $slicer); },
            rightAlign: $(window).width() - $timeslice.offset().left - $timeslice.outerWidth() - opts.xOffset,
            posY: $timeslice.offset().top + $timeslice.outerHeight() + opts.yOffset,
            rangeSplitter: opts.separator
        });

        $slicer.uniform().change(function(event)
        { opts.metricsScreen.trigger('metricsSliceChanged', [$(this).val().toUpperCase()]); });

        updateDateParams($timeslice.val(), $slicer);

        return this;
    };

    $.fn.metricsScreen.defaults = {
        chartSections: [],
        chartDefaults: {
            callback: metricsNS.updateChartCallback
        },
        chartDirective: {
            '.chartContainer' : {
                'chart <-' : {
                    '.chartContent@id' : 'chart.id',
                    '.chartTitle' : 'chart.displayName'
                }
            }
        },
        customSections: [],
        initialSliceDepth: 'Daily',
        redrawTimeout: 50,
        summarySections: [],
        summaryDefaults: {
            callback: metricsNS.summarySectionCallback
        },
        summaryDirective: {
            '.summaryContainer': {
                'section <- ': {
                    '.summaryTitle': 'section.displayName',
                    '@id': 'section.id'
                }
            }
        },
        topListSections: [],
        topListDirective: {
            '.metricsTopContainer': {
                'topList <- ': {
                    '.sectionTitle': 'topList.displayName',
                    'th.value .valueHeading': 'topList.heading',
                    '@id': 'topList.id',
                    '@class+': 'topList.className'
                }
            }
        },
        // Needs to be overridden to function
        urlBase: ''
    };

    $.fn.metricsTimeControl.defaults = {
        displayDateFormat: 'M d, yy',
        metricsScreen: null,
        minimumDate: Date.parse('2008-01-01'),
        parseDateFormat: 'MMM d, yyyy',
        separator: '-',
        serverDateFormat: 'm/d/Y',
        xOffset: 10,
        yOffset: 5
    };

    // Use local timezone
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });
})(jQuery);

metricsNS.topListItemDirective = {
  '.item' : {
      'topItem <- ': {
          '.titleText'       : 'topItem.name',
          '.titleLink'       : 'topItem.linkText',
          '.titleLink@href'  : 'topItem.href',
          '.titleLink@class+': 'topItem.linkClass',
          '.value .primary'  : 'topItem.value',
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
    '.totalValue' : 'total',
    '.deltaBox@class+': 'deltaClass'
};
