;var metricsNS = blist.namespace.fetch('blist.metrics');

(function($)
{
    /*
     * Helper Functions
     */
    var fireSectionUpdate = function(section, $screen, urlBase, startDate, endDate, slice)
    {
        var $section = $screen.find('#' + section.id),
            series = $section.data(metricsNS.SERIES_KEY),
            url = urlBase + '?start=' + startDate.getTime() +
                            '&end='   + endDate.getTime();

        if (_.isFunction(section.loading))
        { section.loading($section); }

        // Either a custom method, top method, or index
        if (!$.isBlank(series))
        {
            url = url + '&method=series&slice=' + slice;
            if (section.type)
                url = url + '&type=' + section.type;
        }
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
                $section
                    .data(metricsNS.DATE_START, startDate)
                    .data(metricsNS.DATE_END,   endDate)
                    .data(metricsNS.DATA_KEY,   data)
                    .closest('.container').removeClass('metricsError');
                if (_.isFunction(section.callback))
                { section.callback($section, slice, section); }
            },
            error: function(request, textStatus, error)
            {
                $section.closest('.container').addClass('metricsError');
                if (_.isFunction(section.error))
                { section.error($section, request, textStatus, error); }
            }
        });
    },

    subChartTypeChanged = function($link, sliceDepth)
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
    },

    redrawChart = function(chart, sliceDepth, animate)
    {
        chart.data('data-callback')(chart, sliceDepth,
            $.extend({}, {plotOptions: {area: {animation: animate}}},
                chart.data('options')
            ));
    },

    refreshData = function($screen, sections, opts,
            currentStartDate, currentEndDate, currentSlice)
    {
        _.each(sections, function(section)
        { fireSectionUpdate(section, $screen, opts.urlBase,
              currentStartDate, currentEndDate, currentSlice); });
    },

    expandTopSubSection = function(event)
    {
        event.preventDefault();
        $(event.target).closest('.item').find('.subContainer')
            .slideToggle();
    },

    // Merge defaults into each of the list's items
    mergeItems = function(list, defaults)
    {
        return _.map(list, function(item)
            { return $.extend({}, defaults, item); });
    },

    generateChartMenu = function($chart, section)
    {
          $chart
              .data(metricsNS.SERIES_KEY, section.children[0].series)
              .parent().siblings('.menu').empty().menu({
                  additionalJsonKeys: ['series'],
                  menuButtonContents: '<span class="contents">' +
                      section.children[0].text + '</span>',
                  menuButtonTitle: section.children[0].text,
                  contents: section.children
          });
    };

    /*
     * End helper functions
     */

    $.fn.metricsChartUpdate = function(options)
    {
        var $chart = $(this),
            mergedOptions = $.extend(true, $chart.data('options'), options);
        $chart.data('options', mergedOptions);
        generateChartMenu($chart, mergedOptions);
    };

    $.fn.metricsScreen = function(options)
    {
        var opts = $.extend({}, $.fn.metricsScreen.defaults, options),
            $screen         = $(this),
            currentSlice    = opts.initialSliceDepth,
            startDate       = null,
            endDate         = null,
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
            var $chart= chartDisplay.find('#' + section.id);
            generateChartMenu($chart, section);
        });

        $screen.find('.chartsDisplay').append(chartDisplay);

        $screen.find('.chartContainer .menu ul > li > a').live('click', function(event)
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
        $screen.bind('metricsTimeChanged', function(event, newStartDate, newEndDate, newSlice)
        {
            var sectionsToUpdate = null;
            if (newStartDate != startDate || newEndDate != endDate)
            { sectionsToUpdate = sections; }
            else if (newSlice != currentSlice)
            { sectionsToUpdate = chartSections; }

            if (sectionsToUpdate)
            {
                refreshData($screen, sectionsToUpdate, opts,
                    newStartDate, newEndDate, newSlice);
            }

            startDate       = newStartDate;
            endDate         = newEndDate;
            currentSlice    = newSlice;
        });

        // Only charts need to listen to a time slice change
        $screen.bind('metricsSliceChanged', function(event, newSlice)
        {
            if (newSlice != currentSlice)
            {
                refreshData($screen, chartSections, opts,
                    startDate, endDate, newSlice);
            }
            currentSlice = newSlice;
        });

        $screen.bind('metricsChartRedraw', function(event)
        {
            refreshData($screen, chartSections, options,
                  startDate, endDate, currentSlice);
        });

        // Store a copy of the necessary information
        _.each(sections, function(section)
        {
            var $section = $screen.find('#' + section.id);
            $section
                .data('data-callback', section.callback)
                .data('options', section);
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
            $slicer    = $('.sliceDepth');

        var updateDateParams = function(value, $slicer)
        {
            var parts       = value.split(opts.separator),
                startDate   = Date.parse(parts[0]).setTimezoneOffset(0),
                endDate     = (parts.length > 1) ?
                    Date.parse(parts[1]).setTimezoneOffset(0) : startDate,
                sliceDepth  = 'Monthly';

            if (startDate.clone().addDays(opts.maxDaysToSliceHourly) > endDate)
            {
                sliceDepth = 'Hourly';
            }
            else if (startDate.clone().addMonths(1) > endDate)
            {
                sliceDepth = 'Daily';
            }
            var $sliceDepth = $slicer.find('[value="' + sliceDepth + '"]');

            $sliceDepth.attr('disabled', '')
                .prevAll().attr('disabled', '')
                    .end()
                .nextAll().attr('disabled', 'disabled');

            if (startDate.clone().addMonths(1) < endDate)
            {
                $slicer.find('[value="Hourly"]').attr('disabled', 'disabled');
            }

            $slicer.val(sliceDepth);
            $.uniform.update($slicer);

            opts.metricsScreen.trigger('metricsTimeChanged',
                [startDate, endDate.addDays(1).addMilliseconds(-1),
                 sliceDepth.toUpperCase()]);
        };


        $timeslice.val(monthStart + ' ' + opts.separator + ' ' + monthEnd)
        .daterangepicker({
            dateFormat: opts.displayDateFormat,
            doneButtonText: 'Apply',
            earliestDate: opts.minimumDate,
            latestDate: today,
            onClose: function() {
                _.defer(function() {
                    updateDateParams($timeslice.val(), $slicer);
                });
            },
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
            callback: metricsNS.updateChartCallback,
            chartType: 'area',
            stacking: 'normal'
        },
        chartDirective: {
            '.chartContainer' : {
                'chart <-' : {
                    '.chartContent@id' : 'chart.id'
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
        xOffset: 10,
        yOffset: 5
    };

    // Don't use local timezone
    Highcharts.setOptions({
        global: {
            useUTC: true
        }
    });
})(jQuery);

