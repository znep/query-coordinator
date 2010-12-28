;var metricsNS = blist.namespace.fetch('blist.metrics');

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
        {
            url = url + '&method=top&top=' + section.top;
            $section
                .data('count', 0)
                .data('sorted-data', null);
        }

        $.Tache.Get({
            cache: false,
            type: 'GET',
            url: url,
            success: function(data)
            {
                $section.data(metricsNS.DATA_KEY, data)
                    .closest('.container').removeClass('metricsError');
                if (_.isFunction(section.callback))
                { section.callback($section, slice); }
            },
            error: function(request, textStatus, error)
            {
                $section.closest('.container').addClass('metricsError');
                if (_.isFunction(section.error))
                { section.error($section, request, textStatus, error); }
            }
        });
    };

    var subChartTypeChanged = function($link, sliceDepth)
    {
        // Swap out the menu's text for the current selection
        var chartName = $.trim($link.text()),
            chart = $link
            .closest('.menu').find('.menuButton').attr('title', chartName)
                .find('.contents')
                    .text(chartName).end()
                .end()
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
            { return $.extend({}, defaults, item); });
    };

    $.fn.metricsScreen = function(options)
    {
        var opts = $.extend({}, $.fn.metricsScreen.defaults, options),
            $screen         = $(this),
            currentInterval = null,
            currentSlice    = opts.initialSliceDepth,
            currentStart    = null,
            chartSections   = mergeItems(opts.chartSections, opts.chartDefaults),
            detailSections  = mergeItems(opts.detailSections, opts.detailDefaults),
            summarySections = mergeItems(opts.summarySections, opts.summaryDefaults),
            sections = chartSections
                .concat(detailSections)
                .concat(summarySections)
                .concat(opts.topListSections);

        var $summaryDisplay = $screen.find('.summaryDisplay').append(
            $.renderTemplate('metricsSummaryItem', opts.summarySections,
                    opts.summaryDirective)
        );

        $summaryDisplay.equiWidth();

        var $detailDisplay = $screen.find('.detailDisplay').append(
            $.renderTemplate('metricsSummaryItem', detailSections,
                  opts.summaryDirective)
        ).equiWidth();

        // Load each of the charts and create their menus
        var chartDisplay =  $.renderTemplate('metricsCharts',
            chartSections, opts.chartDirective);

        _.each(chartSections, function(section)
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
                    .end().end(), currentSlice);
        });

        // Workaround for IE7 SVG overlay issues
        if($('html').hasClass('ie7'))
        {
            $screen.find('.chartMenu .menuButton').click(function(event)
            {
                $(event.target).closest('.chartMenu').siblings('.chartArea')
                  .find('.chartContent').empty().end()
                  .find('.emptyHint').fadeIn();
            });

            $screen.find('.chartContainer .menu ul > li > a').click(function(event)
            {
                $(event.target).closest('.chartContainer')
                    .find('.emptyHint').hide();
            });
        }

        $screen.find('.topDisplay').append(
            $.renderTemplate('metricsTopList', opts.topListSections, opts.topListDirective))
            .find('table').tablesorter(
            {
                textExtraction: function(node) {
                    return $(node).find('.primaryValue').text();
                }
            }
        );

        _.each(opts.topListSections, function(section)
        {
            $screen.find('#' + section.id)
                .find('.showMoreLink').click(function(event) {
                    event.preventDefault();
                    metricsNS.showMoreClicked(section);
                }).end()
                .appendTo($screen.find('.' + section.renderTo));
        });

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
                refreshData($screen, chartSections, opts,
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
                refreshData($screen, chartSections, opts,
                    currentStart, currentInterval, newSlice);
            }
            currentSlice = newSlice;
        });

        // Store a copy of the necessary information
        _.each(sections, function(section)
        {
            var $section = $screen.find('#' + section.id);
            $section.data('data-callback', section.callback);
            if (!$.isBlank(section.dataKeys))
            {
                _.each(section.dataKeys, function(key)
                {
                    $section.data('data-' + key, section[key] || {});
                });
            }
        });

        $.live('.expandTopSection', 'click', expandTopSubSection);

        $(window).bind('load', function(){
            $summaryDisplay.trigger('resize');
            $detailDisplay.trigger('resize');
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
        var sliceOptionForInterval = function(interval, start, end)
        {
            if (start.clone().addDays(opts.maxDaysToSliceHourly) > end)
            { return $slicer.find('option:first'); }
            else if ('Weekly' == interval )
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

                $sliceDepth = sliceOptionForInterval(interval, startDate, endDate);
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
        detailDefaults: {
            callback: metricsNS.detailSectionCallback,
            dataKeys: ['detail']
        },
        detailSections: [],
        initialSliceDepth: 'Daily',
        redrawTimeout: 50,
        summarySections: [],
        summaryDefaults: {
            callback: metricsNS.summarySectionCallback,
            dataKeys: ['summary']
        },
        summaryDirective: {
            '.summaryContainer': {
                'section <- ': {
                    '.summaryTitle': function(context) {
                        return context.item.displayName || context.item.detail;
                    },
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
        maxDaysToSliceHourly: 4,
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

