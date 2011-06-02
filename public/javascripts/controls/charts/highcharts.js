(function($)
{
    $.socrataChart.highcharts = function(options, dom)
    {
        this.settings = $.extend({}, $.socrataChart.highcharts.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.socrataChart.highcharts, $.socrataChart.extend(
    {
        defaults:
        {
        },

        prototype:
        {
            initializeChart: function()
            {
                var chartObj = this;
                chartObj._chartType = chartObj.settings
                    .view.displayFormat.chartType;

                var limit = Dataset.chart.types[chartObj._chartType].displayLimit;
                if (limit.points)
                { chartObj._maxRows = limit.points; }
            },

            columnsLoaded: function()
            {
                var chartObj = this;

                if (chartObj.settings.view.displayFormat.pointColor
                    && chartObj._valueColumns.length > 0
                    && !chartObj._gradient)
                {
                    chartObj._gradient = $.gradient(chartObj._numSegments,
                        chartObj.settings.view.displayFormat.color || '#042656',
                        { maxValue: 80 });
                }

                // Set up x-axis
                if (_.isArray(chartObj._fixedColumns) &&
                    chartObj._fixedColumns.length == 1)
                { chartObj._xColumn = chartObj._fixedColumns[0]; }
                if (!isDateTime(chartObj) && !$.isBlank(chartObj._xColumn))
                { chartObj._xCategories = []; }

                // Cache data
                chartObj._seriesCache = [];

                // Grab all remaining cols; pick out numeric columns for data,
                // and associate all following non-nuneric columns with that line
                chartObj._yColumns = [];
                _.each(chartObj._valueColumns, function(vc)
                {
                    var obj = {data: vc.column};
                    _.each(vc.supplementalColumns || [], function(sc)
                    {
                        if (sc.renderTypeName == 'text' && $.isBlank(obj.title))
                        { obj.title = sc; }
                        else
                        {
                            obj.metadata = obj.metadata || [];
                            obj.metadata.push(sc);
                        }
                    });
                    chartObj._yColumns.push(obj);
                });

                chartObj._seriesRemainders = _.map(chartObj._yColumns, function(col)
                    { return col.data.aggregates.sum; });

                var colCount = chartObj._yColumns.length;

                // Set up y-axes
                _.each(chartObj._yColumns, function(cs, colIndex)
                {
                    var series = {name: $.htmlEscape(cs.data.name),
                        data: [], column: cs.data};
                    if (chartObj._chartType == 'donut')
                    {
                        var segment = 100 / (chartObj._yColumns.length + 1);
                        $.extend(series, {
                            innerSize:    Math.round(segment * (colIndex+1)) + '%',
                            size:         Math.round(segment * (colIndex+2)) + '%',
                            showInLegend: colIndex == 0,
                            dataLabels:   { enabled: colIndex == colCount - 1 }
                        });
                    }
                    if (!_.isUndefined(chartObj.chart))
                    { chartObj.chart.addSeries(series, false); }
                    if (!_.isUndefined(chartObj.secondChart))
                    { chartObj.secondChart.addSeries(series, false); }
                    chartObj._seriesCache.push(series);
                });

                // Adjust scale to make sure series are synched with axis
                if (!_.isUndefined(chartObj.chart))
                { chartObj.chart.xAxis[0].setScale(); }
                if (!_.isUndefined(chartObj.secondChart))
                { chartObj.secondChart.xAxis[0].setScale(); }

                // Register columns as loaded, render data if needed
                chartObj._columnsLoaded = true;
                if (!_.isUndefined(chartObj._pendingRows))
                {
                    _.each(chartObj._pendingRows,
                        function(r) { chartObj.renderRow(r); });
                    delete chartObj._pendingRows;
                    chartObj.rowsRendered();
                }

                // Once we've gotten the columns, create the chart
                createChart(chartObj);
            },

            renderRow: function(row)
            {
                var chartObj = this;
                if (!chartObj._columnsLoaded)
                {
                    chartObj._pendingRows = chartObj._pendingRows || [];
                    chartObj._pendingRows.push(row);
                    return true;
                }

                // Get useable value for x-axis
                var basePt = xPoint(chartObj, row);
                // Null dates can't really be rendered in a timeline; not sure
                // if that holds for other chart types, though
                if (isDateTime(chartObj) && _.isNull(basePt.x)) { return true; }

                if (!_.isUndefined(chartObj._xCategories))
                {
                    var xCat = basePt.x;
                    xCat = row[chartObj._xColumn.lookup];
                    xCat = renderXValue(xCat, chartObj._xColumn);
                    chartObj._xCategories.push(xCat);
                }

                var hasPoints = false;
                // Render data for each series
                _.each(chartObj._yColumns, function(cs, i)
                {
                    var value = parseFloat(row[cs.data.id]);
                    if (_.isNaN(value)) { value = null; }

                    // First check if this should be subsumed into a remainder
                    var sliceTooSmall = !_.isNull(value) &&
                        !_.isUndefined(chartObj.settings
                            .view.displayFormat.pieJoinAngle) &&
                        !$.isBlank(cs.data.aggregates.sum) &&
                        (value / cs.data.aggregates.sum) * 360 <
                            chartObj.settings.view.displayFormat.pieJoinAngle;

                    // Render point and cache it
                    var point = yPoint(chartObj, row, value, i, basePt, cs.data);
                    if (_.isNull(point)) { return; }

                    if ($.isBlank(point.y))
                    {
                        if (!chartObj._nullCache) { chartObj._nullCache = []; }
                        chartObj._nullCache.push(point);
                        return;
                    }
                    else if (chartObj._nullCache && !$.isBlank(point.y))
                    {
                        _.each(chartObj._nullCache, function(n)
                            { addPoint(chartObj, n, i); });
                        chartObj._nullCache = undefined;
                    }
                    addPoint(chartObj, point, i, !sliceTooSmall);

                    hasPoints = true;
                });

                // We failed to have any points; remove the x-category
                if (!hasPoints && !_.isUndefined(chartObj._xCategories))
                { chartObj._xCategories.pop(); }

                return true;
            },

            rowsRendered: function()
            {
                var chartObj = this;
                if (!chartObj._columnsLoaded) { return; }

                // Check if there are remainders to stick on the end
                if (!_.isUndefined(chartObj._seriesRemainders) &&
                    (Dataset.chart.types[chartObj._chartType].renderOther ||
                    chartObj.settings.view.displayFormat.renderOther))
                {
                    if (!$.isBlank(chartObj._otherIndex))
                    {
                        chartObj._xCategories.splice(chartObj._otherIndex, 1);
                        for (var i = 0; i < chartObj._seriesRemainders.length; i++)
                        {
                            if (!$.isBlank(chartObj.chart) &&
                                !$.isBlank(chartObj.chart.series[i].data[chartObj._otherIndex]))
                            { chartObj.chart.series[i].data[chartObj._otherIndex].remove(); }
                            if (!$.isBlank(chartObj.secondChart) &&
                                !$.isBlank(chartObj.secondChart.series[i].data[chartObj._otherIndex]))
                            { chartObj.secondChart.series[i].data[chartObj._otherIndex].remove(); }
                            chartObj._seriesCache[i].data.splice(chartObj._otherIndex, 1);
                        }
                    }

                    var otherPt = xPoint(chartObj, null, 'Other');
                    if (!_.isUndefined(chartObj._xCategories))
                    { chartObj._xCategories.push('Other'); }
                    _.each(chartObj._seriesRemainders, function(sr, i)
                    {
                        if (sr > 0)
                        {
                            var col = chartObj._yColumns[i].data;
                            var point = yPoint(chartObj, null, sr, i, otherPt, col);
                            if (!_.isUndefined(chartObj.chart))
                            { chartObj.chart.series[i].addPoint(point, false); }
                            if (!_.isUndefined(chartObj.secondChart))
                            { chartObj.secondChart.series[i].addPoint(
                                point, false); }
                            chartObj._otherIndex = chartObj._seriesCache[i].data.length;
                            chartObj._seriesCache[i].data.push(point);
                        }
                    });

                    if (!_.isUndefined(chartObj.chart))
                    { chartObj.chart.redraw(); }
                    if (!_.isUndefined(chartObj.secondChart))
                    { chartObj.secondChart.redraw(); }
                }

                if (!_.isUndefined(chartObj.chart))
                {
                    setCategories(chartObj);

                    if (chartObj.settings.view.snapshotting)
                    {
                        prepareToSnapshot(chartObj);
                    }
                }
                if (!_.isUndefined(chartObj.secondChart))
                {
                    chartObj.secondChart.xAxis[0].setCategories(
                            chartObj._xCategories, true);
                    setInitialDetailBounds(chartObj);
                }
            },

            resetData: function()
            {
                var chartObj = this;
                delete chartObj._xCategories;
                delete chartObj._categoriesLoaded;
                delete chartObj._xColumn;
                delete chartObj._yColumns;
                delete chartObj._columnsLoaded;
                delete chartObj._pendingRows;
                delete chartObj._seriesRemainders;
                delete chartObj._seriesCache;
                delete chartObj._curMin;
                delete chartObj._curMax;
                delete chartObj._loadedOnce;

                if (!_.isUndefined(chartObj.chart))
                {
                    chartObj.chart.destroy();
                    delete chartObj.chart;
                }
                if (!_.isUndefined(chartObj.secondChart))
                {
                    chartObj.secondChart.destroy();
                    delete chartObj.secondChart;
                }
            },

            getRequiredJavascripts: function()
            {
                return blist.assets.highcharts;
            },

            generateFlyoutLayout: function(columns, valueColumn)
            {
                var fCols = this.settings.view.displayFormat.fixedColumns;
                var titleId = fCols ? fCols[0] : null;
                var reqFields = [valueColumn];
                if (this.settings.view.displayFormat.pointColor)
                { reqFields.push(this.settings.view.displayFormat.pointColor); }
                if (this.settings.view.displayFormat.pointSize)
                { reqFields.push(this.settings.view.displayFormat.pointSize); }
                _.each(_.uniq(valueColumn.supplementalColumns || []), function(col)
                { reqFields.push({ tableColumnId: col }); });
                columns = _.compact(_.uniq(reqFields).concat(columns));
                return this.generateFlyoutLayoutDefault(columns, titleId);
            }
        }
    }));

    var createChart = function(chartObj)
    {
        var xTitle = chartObj.settings.view.displayFormat.titleX;
        var yTitle = chartObj.settings.view.displayFormat.titleY;

        var legendPos = chartObj.settings.view.displayFormat.legend;

        // Make a copy of colors so we don't reverse the original
        var colors;
        if (!_.isUndefined(chartObj.settings.view.displayFormat.colors))
        { colors = chartObj.settings.view.displayFormat.colors.slice(); }
        else if (!_.isUndefined(chartObj.settings.view.displayFormat.color))
        { colors = [ chartObj.settings.view.displayFormat.color ]; }
        else
        {
            colors = _.map(chartObj._valueColumns, function(vc)
            { return vc.color; });
        }

        // Map recorded type to what Highcharts wants
        var seriesType = chartObj._chartType;
        if (seriesType == 'line' && chartObj.settings.view.displayFormat.smoothLine)
        { seriesType = 'spline'; }
        if (seriesType == 'timeline') { seriesType = 'line'; }
        if (seriesType == 'donut') { seriesType = 'pie'; }
        if (seriesType == 'bubble')
        {
            if (chartObj.settings.view.displayFormat.showLine)
            { seriesType = 'line'; }
            else
            { seriesType = 'scatter'; }
        }

        var clipFormatter = function()
        {
            var abbreviateNumbers = function(num)
            {
                // Are you really a number?
                // yColumn numbers will always come back as numbers.
                // xColumn numbers will come back as strings, but may be intended as strings.
                if (!_.isNumber(num) && !(num.match && num.match(/^[-+]?[0-9,]*\.?[0-9]+$/)))
                { return num; }

                if (num.match && num.match(/,/)) { num = num.replace(/[^0-9\.]/g, ''); }
                return blist.util.toHumaneNumber(num, 2);
            };
            var maxLen = 20;
            var v = abbreviateNumbers(this.value);
            if (v.length > maxLen)
            { return v.slice(0, maxLen) + '...'; }
            return v;
        };

        // Main config
        var chartConfig =
        {
            chart: {
                animation: false,
                renderTo: chartObj.$dom()[0],
                defaultSeriesType: seriesType,
                events: { load: function() { chartObj.finishLoading(); } },
                inverted: chartObj._chartType == 'bar'
            },
            credits: { enabled: false },
            legend: { enabled: legendPos != 'none',
                layout: _.include(['left', 'right'], legendPos) ?
                    'vertical' : 'horizontal',
                backgroundColor: '#ffffff',
                borderWidth: 1 },
            plotOptions: {},
            title: { text: null },
            xAxis: { title:
                { enabled: xTitle !== '' && !_.isUndefined(xTitle), text: xTitle,
                    style: { backgroundColor: '#ffffff',
                        border: '1px solid #909090', padding: '3px' } },
                dateTimeLabelFormats: {
                    day: '%e %b',
                    week: '%e %b',
                    month: '%b %Y'
                }, labels: {formatter: clipFormatter} },
            yAxis: { title:
                { enabled: yTitle !== '' && !_.isUndefined(yTitle), text: yTitle,
                    style: { backgroundColor: '#ffffff',
                        border: '1px solid #909090', padding: '3px' } },
                labels: {formatter: clipFormatter} }
        };
        if (_.include(['top', 'bottom'], legendPos))
        { chartConfig.legend.verticalAlign = legendPos; }
        if (_.include(['left', 'right'], legendPos))
        {
            chartConfig.legend.align = legendPos;
            chartConfig.legend.verticalAlign = 'top';
        }
        if (_.include(['donut'], chartObj._chartType))
        { chartConfig.chart.spacingTop = 35; } // Fix data labels on donut charts
        if (_.include(['line', 'area', 'timeline', 'bubble'], chartObj._chartType))
        { chartConfig.chart.marginBottom = legendPos == 'bottom' ? 120 : 90; }

        if (!_.isUndefined(colors)) { chartConfig.colors = colors; }

        // If we already have data loaded, use it
        if (!_.isEmpty(chartObj._seriesCache))
        { chartConfig.series = chartObj._seriesCache; }

        // If we already have categories loaded, use it
        if (!_.isEmpty(chartObj._xCategories))
        { chartConfig.xAxis.categories = chartObj._xCategories; }

        if (isDateTime(chartObj))
        {
            chartConfig.xAxis.type = 'datetime';
            chartConfig.tooltip = { formatter: function()
            {
                return '<p><strong>' + this.series.name +
                    (this.point.name && this.series.name != this.point.name ?
                        ': ' + this.point.name : '') + '</strong></p>' +
                    (this.point.subtitle ?
                        '<p>' + this.point.subtitle + '</p>' : '') +
                    '<p>' + this.y + ' at ' +
                    blist.data.types.date.filterRender(this.x / 1000,
                        chartObj._xColumn) + '</p>';
            } };
        }
        else
        {
            if (!chartConfig.chart.inverted)
            {
                $.extend(chartConfig.xAxis.labels,
                    { rotation: 320, align: 'right' });
            }
            else
            { chartConfig.xAxis.labels.rotation = 340; }
            if (Dataset.chart.types[chartObj._chartType].displayLimit.labels)
            { chartConfig.xAxis.labels.step = Math.ceil(
                (chartObj.settings.view.totalRows || chartObj._maxRows) /
                Dataset.chart.types[chartObj._chartType].displayLimit.labels); }
        }



        // Set up config for this particular chart type
        var typeConfig = {allowPointSelect: true, showInLegend: true};

        // Disable marker if no point size set
        if (chartObj.settings.view.displayFormat.pointSize == '0')
        { typeConfig.marker = {enabled: false}; }

        // If we already loaded and are just re-rendering, don't animate
        if (chartObj._loadedOnce || chartObj.settings.view.snapshotting)
        { typeConfig.animation = false; }

        // Make sure lineSize is defined, so we don't hide the line by default
        if (!_.isUndefined(chartObj.settings.view.displayFormat.lineSize))
        { typeConfig.lineWidth = parseInt(chartObj.settings
            .view.displayFormat.lineSize); }

        var tooltipTimeout;
        typeConfig.point = { events: {
            mouseOver: function() {
                clearTimeout(tooltipTimeout);
                customTooltip(chartObj, this);
            },
            mouseOut: function() {
                var $tooltip = $("#highcharts_tooltip");
                tooltipTimeout = setTimeout(function(){
                    if (!$tooltip.data('mouseover'))
                    {  $tooltip.hide(); }
                }, 500);
            }
        }};

        // Type config goes under the type name
        chartConfig.plotOptions[seriesType] = typeConfig;

        if (chartObj.settings.view.displayFormat.stacking
            && chartObj._yColumns.length > 1)
        { chartConfig.plotOptions.series = $.extend(chartConfig.plotOptions.series,
                                                    { stacking: 'normal' }); }

        $.extend(chartConfig, { tooltip: { enabled: false }});

        // We don't actually enable exporting
        chartConfig.exporting = {
            enabled: false
        };

        // Create the chart
        chartObj.startLoading();

        var loadChart = function() {
            chartObj.chart = new Highcharts.Chart(chartConfig);

            if (!chartObj._categoriesLoaded)
            { setCategories(chartObj); }
            if (chartObj._chartType == 'bar')
            { chartObj.chart.setSize(chartObj.chart.chartWidth,
                                     chartObj.chart.chartHeight, false); }

            if (!_.isUndefined(colors))
            {
                // Set colors after chart is created so they don't get merged
                // with the default colors; we want to override them, instead
                chartObj.chart.options.colors = colors;
            }

            if (isDateTime(chartObj)) { createDateTimeOverview(chartObj); }

            chartObj._loadedOnce = true;

            if (chartObj.settings.view.snapshotting)
            {
                prepareToSnapshot(chartObj);
            }

        };
        // IE7 seems to have some problem creating the chart right away;
        // add a delay and it seems to work.  Do I know why (for either part)? No
        _.defer(function() { loadChart(); });
    };

    // Once the chart's ready to draw, let' take a picture
    var prepareToSnapshot = function(chartObj)
    {
        if (!$.isBlank(chartObj._snapshot_timer))
        {
            clearTimeout(chartObj._snapshot_timer);
            chartObj._snapshot_timer = null;
        }

        chartObj._snapshot_timer = setTimeout(chartObj.settings.view.takeSnapshot, 1000);
    };

    var xPoint = function(chartObj, row, value)
    {
        var pt = {x: value};

        if (isDateTime(chartObj))
        {
            if (!$.isBlank(row) && !row.invalid[chartObj._xColumn.lookup])
            { pt.x = row[chartObj._xColumn.id]; }
            else { pt.x = ''; }
            if (_.isNumber(pt.x)) { pt.x *= 1000; }
            else if (!$.isBlank(pt.x)) { pt.x = Date.parse(pt.x).valueOf(); }
        }
        else if (!_.isUndefined(chartObj._xCategories))
        { pt.x = chartObj._xCategories.length; }

        return pt;
    };

    var yPoint = function(chartObj, row, value, seriesIndex, basePt, col)
    {
        var isPieTypeChart = _.include(['pie', 'donut'], chartObj._chartType);
        if (_.isNull(value) && isPieTypeChart)
        { return null; }

        var point = {y: value || 0, pretty: {}, label: {} };
        point.pretty.y = col.renderType.filterRender(value, col, true);
        if (!_.isNull(basePt) && !_.isUndefined(basePt))
        { _.extend(point, basePt); }

        var colSet = chartObj._yColumns[seriesIndex];
        if (!_.isUndefined(colSet.title) && !_.isNull(row))
        { point.name = $.htmlEscape(row[colSet.title.id]); }

        else if (isPieTypeChart)
        { point.name = chartObj._xCategories[point.x] || point.x; }

        else { point.name = chartObj._seriesCache[seriesIndex].name; }

        if (!_.isUndefined(colSet.metadata) && !_.isNull(row))
        {
            point.subtitle = '';
            _.each(colSet.metadata, function(c)
            { point.subtitle += $.htmlEscape(row[c.id]); });
        }

        if (isPieTypeChart &&
            !_.isUndefined(chartObj.settings.view.displayFormat.colors))
        {
            point.color = chartObj.settings.view.displayFormat
                .colors[chartObj._seriesCache[seriesIndex].data.length %
                chartObj.settings.view.displayFormat.colors.length];
        }
        else if (chartObj._chartType == 'bubble')
        {
            if (!point.states) { point.states = {}; }
            if (chartObj._pointColor && chartObj._segments[chartObj._pointColor.id])
            {
                var pCol = chartObj._pointColor;
                point.label.color = pCol.name;
                for (var i = 0; i < chartObj._numSegments; i++)
                { if (parseFloat(row[pCol.id]) <= chartObj._segments[pCol.id][i])
                    {
                        point.pretty.color = pCol.renderType
                            .filterRender(row[pCol.id], pCol, true);
                        point.fillColor = "#"+$.rgbToHex(chartObj._gradient[i]);
                        point.states.hover = $.extend(point.states.hover,
                            { fillColor: '#'+$.rgbToHex($.brighten(point.fillColor)) });
                        break;
                    }
                }
            }
            if (chartObj._pointSize && chartObj._segments[chartObj._pointSize.id])
            {
                var pCol = chartObj._pointSize;
                point.label.size = pCol.name;
                for (var i = 0; i < chartObj._numSegments; i++)
                { if (parseFloat(row[pCol.id]) <= chartObj._segments[pCol.id][i])
                    {
                        point.pretty.size = pCol.renderType
                            .filterRender(row[pCol.id], pCol, true);
                        point.radius = 4+(4*i);
                        point.states.hover = $.extend(point.states.hover,
                            { radius: point.radius + 2 });
                        break;
                    }
                }
            }
        }
        if (row && row.color)
        {
            point.color = row.color;
            point.fillColor = row.color;
            if (point.states)
            { point.states.hover = $.extend(point.states.hover,
                { fillColor: '#'+$.rgbToHex($.brighten(point.fillColor)) }); }
        }

        // Construct a fake row for the Other point
        if (!row)
        {
            var title = chartObj._fixedColumns[seriesIndex];
            row = { id: 'Other', invalid: {}, error: {}, changed: {} };
            row[title ? title.id : 'fake'] = 'Other';
            row[chartObj._valueColumns[seriesIndex].column.id] = point.y;
        }

        point.flyoutDetails = chartObj.renderFlyout(row,
            chartObj._valueColumns[seriesIndex].column.tableColumnId,
            chartObj.settings.view);

        return point;
    };

    // Handle rendering values for different column types here
    var renderXValue = function(val, col)
    {
        return col.renderType.renderer(val, col, true);
    };

    var isDateTime = function(chartObj)
    {
        return !_.isUndefined(chartObj._xColumn) &&
            (chartObj._xColumn.renderTypeName == 'date' ||
                chartObj._xColumn.renderTypeName == 'calendar_date');
    };


    var createDateTimeOverview = function(chartObj)
    {
        // Caught in middle of refresh?
        if ($.isBlank(chartObj.chart)) { return; }

        var $secondChart = chartObj.$dom().find('.secondaryChart');
        if ($secondChart.length < 1)
        {
            chartObj.$dom().append('<div class="secondaryChart"></div>');
            $secondChart = chartObj.$dom().find('.secondaryChart');
        }

        var config = {
            chart: {
                animation: false,
                renderTo: $secondChart[0],
                defaultSeriesType: 'line',
                zoomType: 'x',
                marginTop: 10,
                marginBottom: 20,
                events: {
                    selection: function(event)
                    { return secondChartSelect(chartObj, event); }
                }
            },
            colors: chartObj.chart.options.colors,
            credits: { enabled: false },
            legend: { enabled: false },
            plotOptions: { line: {
                animation: !chartObj._loadedOnce,
                lineWidth: 1,
                marker: { enabled: false },
                shadow: false
            } },
            title: { text: null },
            tooltip: { formatter: function() { return false; } },
            xAxis: { type: 'datetime', title: { enabled: false },
                minPadding: 0.03, maxPadding: 0.03,
                dateTimeLabelFormats:
                    chartObj.chart.options.xAxis.dateTimeLabelFormats },
            yAxis: { labels: { enabled: false }, title: { text: null } }
        };

        // If we already have data loaded, use it
        if (!_.isEmpty(chartObj._seriesCache))
        { config.series = chartObj._seriesCache; }

        // If we already have categories loaded, use it
        if (!_.isEmpty(chartObj._xCategories))
        { config.xAxis.categories = chartObj._xCategories; }

        config.chart.marginLeft = chartObj.chart.plotLeft;
        config.chart.marginRight = chartObj.chart.chartWidth
            - chartObj.chart.plotLeft - chartObj.chart.plotWidth;

        chartObj.secondChart = new Highcharts.Chart(config);

        setInitialDetailBounds(chartObj);
    };

    var setInitialDetailBounds = function(chartObj)
    {
        if ($.isBlank(chartObj.secondChart)) { return; }

        if ($.isBlank(chartObj._curMin))
        {
            var extremes = chartObj.secondChart.xAxis[0].getExtremes();
            chartObj._curMax = extremes.max;
            chartObj._curMin = ((extremes.max - extremes.min) * 0.7 +
                extremes.min) || undefined;
        }
        if (!$.isBlank(chartObj._curMin) && !$.isBlank(chartObj._curMax))
        { adjustDetailBounds(chartObj, chartObj._curMin, chartObj._curMax); }
    };

    var secondChartSelect = function(chartObj, event)
    {
        var eAxis = event.xAxis[0];
        adjustDetailBounds(chartObj, eAxis.min, eAxis.max);
        return false;
    };

    var adjustDetailBounds = function(chartObj, min, max)
    {
        if ($.isBlank(chartObj.chart)) { return; }

        chartObj._curMin = min;
        chartObj._curMax = max;

        var detailAxis = chartObj.chart.xAxis[0];
        detailAxis.setExtremes(min, max);

        var overviewAxis = chartObj.secondChart.xAxis[0];
        var overviewExtremes = overviewAxis.getExtremes();

        overviewAxis.removePlotLine('min-value');
        overviewAxis.addPlotLine({
            id: 'min-value',
            value: min,
            width: 1,
            color: 'rgba(0, 0, 0, 0.5)'
        });

        overviewAxis.removePlotBand('mask-before');
        overviewAxis.addPlotBand({
            id: 'mask-before',
            from: overviewExtremes.min,
            to: min,
            color: 'rgba(0, 0, 0, 0.2)'
        });

        overviewAxis.removePlotLine('max-value');
        overviewAxis.addPlotLine({
            id: 'max-value',
            value: max,
            width: 1,
            color: 'rgba(0, 0, 0, 0.5)'
        });

        overviewAxis.removePlotBand('mask-after');
        overviewAxis.addPlotBand({
            id: 'mask-after',
            from: max,
            to: overviewExtremes.max,
            color: 'rgba(0, 0, 0, 0.2)'
        });
    };

    var addPoint = function(chartObj, point, seriesIndex, showPoint)
    {
        if (!_.isUndefined(chartObj.chart) && showPoint)
        { chartObj.chart.series[seriesIndex].addPoint(point, false); }
        if (!_.isUndefined(chartObj.secondChart) && showPoint)
        { chartObj.secondChart.series[seriesIndex].addPoint(point, false); }

        if (showPoint)
        {
            chartObj._seriesCache[seriesIndex].data.push(point);
            chartObj._seriesRemainders[seriesIndex] -= point.y;
        }
    };

    var customTooltip = function(chartObj, point)
    {
        var $box = chartObj.$dom().siblings('#highcharts_tooltip');
        if ($box.length < 1)
        {
            chartObj.$dom().after('<div id="highcharts_tooltip"></div>');
            $box = chartObj.$dom().siblings('#highcharts_tooltip').hide();
        }

        if (!point.flyoutDetails) { $box.hide(); return; }

        var $point = $(point.graphic.element);
        var radius = parseInt($point[0].getAttribute('r'));
        var position = $point.offset();
        if (radius)
        {
            position.top += radius;
            position.left += radius;
        }
        var $container = $(chartObj.currentDom);
        var offset = $container.offset();
        position.top -= offset.top;
        position.left -= offset.left;

        var boxOffset = 10;
        if (_.include(['line', 'bubble'], chartObj._chartType))
        { boxOffset = 2; }
        position.top += boxOffset;
        position.left += boxOffset;

        $box.empty()
            .append(point.flyoutDetails)
            .css({ top: position.top + 'px', left: position.left + 'px' })
            .show();

        if (!$box.data('events-attached'))
        {
            $box.hover(
                   function(event)
                   { $(this).data('mouseover', true); event.stopPropagation(); },
                   function()
                   { $(this).data('mouseover', false).hide(); })
                .data('events-attached', true);
        }

        if ($container.width() <= position.left + $box.width())
        { $box.css({ left: ($container.width() - $box.width() - 20) + 'px' }); }

        var too_low = $container.height() - (position.top + $box.height());
        if (too_low < 0)
        { $box.css({ top: (position.top + too_low - 20) + 'px' }); }
    };

    var setCategories = function(chartObj)
    {
        // Make sure data is cleaned, or sometimes setCategories will throw an error
        _.each(chartObj.chart.series, function(s) { s.cleanData(); });
        // Now that we have data, make sure the axes are updated
        chartObj.chart.redraw(false);
        chartObj.chart.xAxis[0].setCategories(chartObj._xCategories, true);
        chartObj._categoriesLoaded = true;
    };

})(jQuery);
