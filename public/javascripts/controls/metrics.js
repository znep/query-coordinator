;var metricsNS = blist.namespace.fetch('blist.metrics');

(function($)
{
    /*
     * Helper Functions
     */
    var fireSectionUpdate = function(section, $screen, urlBase, startDate, endDate, previousDate, slice)
    {
        var $section = $screen.find('#' + section.id),
            series = $section.data(metricsNS.SERIES_KEY),
            url = urlBase + '?start=' + startDate.getTime() +
                            '&end='   + endDate.getTime() +
                            (previousDate ? '&previous=' + previousDate.getTime() : '') +
                            // core requires an integer; treat "true" as 1
                            '&embetter=' + (+blist.feature_flags.embetter_analytics_page);

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
        chart.data(metricsNS.TRANSFORM, $link.attr(metricsNS.TRANSFORM));
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
            currentStartDate, currentEndDate, currentPreviousDate, currentSlice)
    {
        _.each(sections, function(section)
        { fireSectionUpdate(section, $screen, opts.urlBase,
              currentStartDate, currentEndDate, currentPreviousDate, currentSlice); });
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
      $chart.data(metricsNS.SERIES_KEY, section.children[0].series);
      $chart.data(metricsNS.TRANSFORM, section.children[0].transform);
      var $menu = $chart.closest('.chartContainer').find('select.chartSeries').empty();
      $.each(section.children, function() {
          var $option = $('<option>').text(this.text).appendTo($menu);
          $option.data(metricsNS.SERIES_KEY, this.series);
          $option.data(metricsNS.TRANSFORM, this.transform);
      });
      $menu.uniform();
    },

    equiWidth = function($container)
    {
        var $children = $container.find('> div');
        $children.width((100 / $children.length) + '%');
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
            $exportLink     = $screen.find('.exportMetricsLink'),
            currentSlice    = opts.initialSliceDepth,
            startDate       = null,
            endDate         = null,
            previousDate    = null,
            chartSections   = mergeItems(opts.chartSections, opts.chartDefaults),
            detailSections  = mergeItems(opts.detailSections, opts.detailDefaults),
            summarySections = mergeItems(opts.summarySections, opts.summaryDefaults),
            sections = chartSections
                .concat(detailSections)
                .concat(summarySections)
                .concat(opts.topListSections);

        var $summaryDisplay = $screen.find('.summaryDisplay').append(
            $.renderTemplate('metricsSummaryItem', summarySections,
                    opts.summaryDirective));
        equiWidth($summaryDisplay);


        var $detailDisplay = $screen.find('.detailDisplay').append(
            $.renderTemplate('metricsSummaryItem', detailSections,
                  opts.summaryDirective));
        equiWidth($detailDisplay);

        // Load each of the charts and create their menus
        var chartTemplate = 'metricsChartsV1';
        var chartDisplay =  $.renderTemplate(chartTemplate,
            chartSections, opts.chartDirective);

        _.each(chartSections, function(section)
        {
            var $chart = chartDisplay.find('#' + section.id);
            $chart.parent().loadingSpinner({showInitially: true});
            generateChartMenu($chart, section);
        });

        $screen.find('.chartsDisplay').append(chartDisplay);

        $screen.find('select.chartSeries').change(function(event) {
            var $option = $(event.target).find(':selected');
            var $chart = $(event.target).closest('.chartContainer').find('.chartContent');

            $chart.data(metricsNS.SERIES_KEY, $option.data(metricsNS.SERIES_KEY));
            $chart.data(metricsNS.TRANSFORM, $option.data(metricsNS.TRANSFORM));

            // Re-draw chart via callback
            redrawChart($chart, currentSlice);
        });

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

        if (blist.feature_flags.embetter_analytics_page) {
            $exportLink.addClass('button');
            $screen.addClass('embetterV1');
        }

        var updateExportLink = function()
        {
            if ($exportLink.length > 0)
            {
                $exportLink.attr('href', $exportLink.data('exportbase') +
                    'start=' + startDate.getTime() + '&end=' + endDate.getTime() +
                    '&slice=' + currentSlice);
            }
        };

        // Listen for a custom event to trigger data refresh
        $screen.bind('metricsTimeChanged', function(event, newStartDate, newEndDate, newPreviousDate, newSlice)
        {
            var sectionsToUpdate = null;
            if (newStartDate != startDate || newEndDate != endDate || newPreviousDate != previousDate)
            { sectionsToUpdate = sections; }
            else if (newSlice != currentSlice)
            { sectionsToUpdate = chartSections; }

            if (sectionsToUpdate)
            {
                refreshData($screen, sectionsToUpdate, opts,
                    newStartDate, newEndDate, newPreviousDate, newSlice);
            }

            startDate       = newStartDate;
            endDate         = newEndDate;
            previousDate    = newPreviousDate;
            currentSlice    = newSlice;

            updateExportLink();
        });

        // Only charts need to listen to a time slice change
        $screen.bind('metricsSliceChanged', function(event, newSlice)
        {
            if (newSlice != currentSlice)
            {
                refreshData($screen, chartSections, opts,
                    startDate, endDate, previousDate, newSlice);
            }
            currentSlice = newSlice;
            updateExportLink();
        });

        $screen.bind('metricsChartRedraw', function(event)
        {
            refreshData($screen, chartSections, options,
                  startDate, endDate, previousDate, currentSlice);
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

        return this;
    };

    $.fn.metricsTimeControl = function(options)
    {
        var opts       = $.extend({}, $.fn.metricsTimeControl.defaults, options),
            today      = Date.parse('today'),
            monthStart = today.clone().moveToFirstDayOfMonth(),
            monthEnd   = today,
            $this      = $(this),
            $timeslice = $this.find('.currentTimeSlice'),
            $slicer    = $('.sliceDepth');

        var updateDateParams = function(startDate, endDate, previousDate, $slicer)
        {
            var sliceDepth;
            _.each(opts.rolloverDays, function(roll)
            {
                if (!sliceDepth && startDate.clone().addDays(roll.days) > endDate)
                { sliceDepth = roll.slice; }
            });
            sliceDepth || (sliceDepth = opts.largestSlice);

            var $sliceDepth = $slicer.find('[value="' + sliceDepth + '"]');

            $sliceDepth.prop('disabled', false)
                .prevAll().prop('disabled', false)
                    .end()
                .nextAll().prop('disabled', true);

            if (startDate.clone().addMonths(1) < endDate)
            {
                $slicer.find('[value="Hourly"]').attr('disabled', 'disabled');
            }

            $slicer.val(sliceDepth);
            $.uniform.update($slicer);

            opts.metricsScreen.trigger('metricsTimeChanged',
                [startDate, endDate.addDays(1).addMilliseconds(-1), previousDate,
                 sliceDepth.toUpperCase()]);
        };
        var url = window.location.href;
        var params = ['start', 'end'];
        var paramValues = {};

        _.each(params, function(param) {
            var fromUrl = $.urlParam(url, param);
            if (fromUrl)
            {
                paramValues[param] = Date.parse(unescape(fromUrl));
            }
        });

        var monthToDateRange = {
            text: $.t('plugins.daterangepicker.month_to_date'),
            previousText: $.t('plugins.daterangepicker.last_month'),
            dateStart: function(){ return Date.parse('today').moveToFirstDayOfMonth(); },
            dateEnd: function() { return Date.parse('today'); },
            datePrevious: function() { return Date.parse('1 month ago').moveToFirstDayOfMonth(); },
            enabled: !blist.feature_flags.embetter_analytics_page
        };
        var last30DaysRange = {
            text: $.t('plugins.daterangepicker.last_30_days'),
            previousText: $.t('plugins.daterangepicker.preceding_30_days'),
            dateStart: function() { return Date.today().addDays(-30); },
            dateEnd: function() { return Date.parse('yesterday'); },
            enabled: blist.feature_flags.embetter_analytics_page
        };
        var defaultRange = blist.feature_flags.embetter_analytics_page ? last30DaysRange : monthToDateRange;
        var initialRange = defaultRange;
        if (paramValues.start || paramValues.end) {
            initialRange = {
                dateStart: function() { return paramValues.start || defaultRange.dateStart(); },
                dateEnd: function() { return paramValues.end || defaultRange.dateEnd(); }
            }
        }
        var dateRangeChanged = function() {
            updateDateParams(
                $timeslice.data('range-start').clone().setTimezoneOffset(0),
                $timeslice.data('range-end').clone().setTimezoneOffset(0),
                $timeslice.data('range-previous') &&
                    $timeslice.data('range-previous').clone().setTimezoneOffset(0),
                $slicer
            );
        };
        $timeslice.daterangepicker({
            dateFormat: opts.displayDateFormat,
            doneButtonText: $.t('screens.stats.apply'),
            earliestDate: opts.minimumDate,
            latestDate: today,
            onClose: function() {
                _.defer(dateRangeChanged);
            },
            posY: $timeslice.offset().top + $timeslice.outerHeight() + opts.yOffset,
            rangeSplitter: opts.separator,
            initialRange: initialRange,
            presetRanges: _.filter([
                {
                    text: $.t('plugins.daterangepicker.today'),
                    previousText: $.t('plugins.daterangepicker.yesterday'),
                    dateStart: 'today',
                    dateEnd: 'today',
                    datePrevious: 'yesterday',
                    enabled: !blist.feature_flags.embetter_analytics_page
                },
                {
                    text: $.t('plugins.daterangepicker.week_to_date'),
                    previousText: $.t('plugins.daterangepicker.last_week'),
                    dateStart: function() { return Date.parse('today').moveToDayOfWeek(0, -1); },
                    dateEnd: 'today',
                    datePrevious: function() { return Date.parse('1 week ago').moveToDayOfWeek(0, -1); },
                    enabled: !blist.feature_flags.embetter_analytics_page
                },
                defaultRange,
                {
                    text: $.t('plugins.daterangepicker.year_to_date'),
                    previousText: $.t('plugins.daterangepicker.last_year'),
                    dateStart: function(){ var x= Date.parse('today'); x.setMonth(0); x.setDate(1); return x; },
                    dateEnd: 'today',
                    datePrevious: function() { return Date.parse('1 year ago').moveToMonth(0, -1).moveToFirstDayOfMonth(); },
                    enabled: true
                },
                {
                    text: $.t('plugins.daterangepicker.last_week'),
                    previousText: $.t('plugins.daterangepicker.preceding_week'),
                    dateStart: function() { return Date.parse('1 week ago').moveToDayOfWeek(0, -1); },
                    dateEnd: function() { return Date.parse('1 week ago').moveToDayOfWeek(6, 1); },
                    datePrevious: function() { return Date.parse('2 weeks ago').moveToDayOfWeek(0, -1); },
                    enabled: blist.feature_flags.embetter_analytics_page
                },
                {
                    text: $.t('plugins.daterangepicker.last_month'),
                    previousText: $.t('plugins.daterangepicker.preceding_month'),
                    dateStart: function(){ return Date.parse('1 month ago').moveToFirstDayOfMonth();  },
                    dateEnd: function(){ return Date.parse('1 month ago').moveToLastDayOfMonth();  },
                    datePrevious: function() { return Date.parse('2 months ago').moveToFirstDayOfMonth(); },
                    enabled: true
                }
            ], function(preset) { return !!preset.enabled; }),
            presets: _.pick({
              specificDate: $.t('plugins.daterangepicker.specific_date'),
              dateRange: $.t('plugins.daterangepicker.date_range'),
              theWeekOf: $.t('plugins.daterangepicker.the_week_of'),
              theMonthOf: $.t('plugins.daterangepicker.the_month_of'),
              theYearOf: $.t('plugins.daterangepicker.the_year_of')
            }, function (value, key) {
                return key === 'dateRange' || !blist.feature_flags.embetter_analytics_page;
            }),
            rangeStartTitle: $.t('plugins.daterangepicker.start_date'),
            rangeEndTitle: $.t('plugins.daterangepicker.end_date'),
            nextLinkText: $.t('plugins.daterangepicker.next'),
            prevLinkText: $.t('plugins.daterangepicker.prev'),
            doneButtonText: $.t('plugins.daterangepicker.done')
        });

        $slicer.uniform().change(function(event)
        { opts.metricsScreen.trigger('metricsSliceChanged', [$(this).val().toUpperCase()]); });

        dateRangeChanged();

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
            callback: metricsNS.summarySectionCallback,
            dataKeys: ['summary']
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
        metricsScreen: null,
        minimumDate: Date.parse('2008-01-01'),
        parseDateFormat: 'MMM D, YYYY',
        separator: '-',
        // This array (whose order *matters*) determines after how many days
        // to switch to the next slice interval. e.g. {'Hourly': 4, 'Daily': 64}
        // means that if the date difference is greater than 4 days,
        // hourly is out of the question and we must slice 'Daily'
        rolloverDays: [
            {slice: 'Hourly', days: 4},
            {slice: 'Daily', days: 64},
            {slice: 'Weekly', days: 128}
        ],
        largestSlice: 'Monthly',
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
