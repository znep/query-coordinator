(function($)
{
    var hasSVG = window.SVGAngle || document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");


    $.Control.registerMixin('highcharts', {
        initializeVisualization: function()
        {
            var chartObj = this;
            chartObj._super();

            var limit = Dataset.chart.types[chartObj._chartType].displayLimit;
            if (limit.points)
            { chartObj._maxRows = limit.points; }
        },

        columnsLoaded: function()
        {
            var chartObj = this;

            if (chartObj._displayFormat.pointColor
                && chartObj._valueColumns.length > 0
                && !chartObj._gradient)
            {
                chartObj._gradient = $.gradient(chartObj._numSegments,
                    chartObj._displayFormat.color || '#042656',
                    { maxValue: 80 });
            }

            chartObj._dataGrouping = !_.isEmpty(chartObj._seriesColumns);

            // Set up x-axis
            if (_.isArray(chartObj._fixedColumns) &&
                chartObj._fixedColumns.length == 1)
            { chartObj._xColumn = chartObj._fixedColumns[0]; }
            if (!isDateTime(chartObj) && !$.isBlank(chartObj._xColumn))
            { chartObj._xCategories = []; }

            // Cache data
            chartObj._seriesCache = [];
            chartObj._seriesByVal = {};

            chartObj._rowIndices = {};

            // Grab all remaining cols; pick out numeric columns for data,
            // and associate all following non-numeric columns with that line
            chartObj._yColumns = [];
            _.each(chartObj._valueColumns, function(vc)
            {
                var obj = {data: vc.column, color: vc.color};
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
            if (chartObj._displayFormat.stacking)
            { chartObj._yColumns = chartObj._yColumns.reverse(); }

            // If we're using data grouping to determine series, they might have
            // varying amounts of data. In that case, we want to sort them
            // by the most populous series first
            if (chartObj._dataGrouping)
            {
                var rows = [{invalid: {}}];
                _.each(chartObj._seriesColumns, function(sc)
                {
                    var newRows = [];
                    _.each(rows, function(r)
                    {
                        _.each((sc.column.cachedContents || {}).top, function(topItem)
                        {
                            r = $.extend({}, r);
                            r[sc.column.lookup] = topItem.item;
                            newRows.push(r);
                        });
                    });
                    if (chartObj._displayFormat.sortSeries)
                    { rows = _.sortBy(newRows, function(r) { return r[sc.column.lookup]; }); }
                    else
                    { rows = newRows; }
                });

                _.each(chartObj._yColumns, function(yc)
                {
                    _.each(rows, function(r)
                    { createSeries(chartObj, getSeriesName(chartObj, yc, r), yc, r); });
                });
            }

            chartObj._columnsReady = true;

            loadSeriesSums(chartObj);

            // Adjust scale to make sure series are synched with axis
            if (!_.isUndefined(chartObj.chart))
            { chartObj.chart.xAxis[0].setScale(); }
            if (!_.isUndefined(chartObj.secondChart))
            { chartObj.secondChart.xAxis[0].setScale(); }

            // Once we've gotten the columns, get total rows, then create the chart
            var getTotalRows;
            getTotalRows = function()
            {
                chartObj._primaryView.getTotalRows(function() { createChart(chartObj); },
                    function(obj)
                    {
                        if ($.subKeyDefined(obj, 'cancelled') && obj.cancelled)
                        { getTotalRows(); }
                        else
                        { throw new Error('There was a problem getting the total rows for the chart'); }
                    });
            };
            getTotalRows();
        },

        handleRowsLoaded: function()
        {
            if (!_.isEmpty(this._xCategories))
            { this._xCategories = _.without(this._xCategories, 'Other'); }
            loadSeriesSums(this);
            this._super.apply(this, arguments);
        },

        renderRow: function(row)
        {
            var chartObj = this;
            if (!chartObj._columnsLoaded || !chartObj.isValid())
            {
                chartObj._pendingRows = chartObj._pendingRows || [];
                chartObj._pendingRows.push(row);
                return true;
            }

            var xCat;
            if (!$.isBlank(chartObj._xColumn))
            { xCat = renderCellText(row, chartObj._xColumn); }

            // See if there is an existing index
            var ri = chartObj._rowIndices[row.id];
            var hasRI = true;
            if (!$.isBlank(chartObj._xCategories))
            {
                if ($.isBlank(ri) && chartObj._dataGrouping)
                {
                    var existI = _.indexOf(chartObj._xCategories, xCat);
                    if (existI > -1) { ri = {x: existI}; }
                }
                if ($.isBlank(ri))
                {
                    hasRI = false;
                    ri = {x: chartObj._xCategories.length};
                    if (!$.isBlank(chartObj._xColumn.sortAscending))
                    {
                        var items = chartObj._xCategories.slice();
                        if (!chartObj._xColumn.sortAscending) { items = items.reverse(); }
                        ri.x = _.sortedIndex(items, xCat);
                    }
                }
                ri = ri.x;
            }
            else if (!isDateTime(chartObj))
            { ri = row.index; }

            // Get useable value for x-axis
            var basePt = xPoint(chartObj, row, ri);

            // Null dates can't really be rendered in a timeline; not sure
            // if that holds for other chart types, though
            if (isDateTime(chartObj) && $.isBlank(basePt.x)) { return true; }

            var setXCategory = function()
            {
                if (!_.isUndefined(chartObj._xCategories))
                {
                    if (hasRI) { chartObj._xCategories[ri] = xCat; }
                    else
                    {
                        chartObj._xCategories.splice(ri, 0, xCat);
                        _.each(chartObj._rowIndices, function(obj, id)
                                { if (id != row.id && obj.x >= ri) { obj.x += 1; } });
                    }
                }
            };

            var renderPoint = function(series)
            {
                var value = parseFloat(row[series.yColumn.data.id]);
                if (_.isNaN(value)) { value = null; }

                var finishRenderPoint = function()
                {
                    // First check if this should be subsumed into a remainder
                    if (chartObj._useRemainders && !_.isNull(value) &&
                        !_.isUndefined(chartObj._displayFormat.pieJoinAngle) &&
                        !$.isBlank(chartObj._seriesSums[series.groupId][series.yColumn.data.id]) &&
                        (value / chartObj._seriesSums[series.groupId][series.yColumn.data.id]) * 360 <
                            chartObj._displayFormat.pieJoinAngle)
                    { return; }

                    // Render point and cache it
                    var point = yPoint(chartObj, row, value, series, basePt);
                    if (_.isNull(point)) { return; }

                    addPoint(chartObj, point, series, false, chartObj._dataGrouping ? ri : null);
                    // When we really add a point, make sure the x-category is in the array.
                    // Set hasRI so additional calls don't keep inserting it
                    setXCategory();
                    hasRI = true;
                };

                if ($.isBlank(chartObj._seriesSums[series.groupId]))
                { getSeriesSums(chartObj, series, finishRenderPoint); }
                else
                { finishRenderPoint(); }
            };

            // Render data for each series
            _.each(chartObj._yColumns, function(yc)
            {
                var seriesVal = getSeriesName(chartObj, yc, row);
                var series = chartObj._seriesByVal[seriesVal];
                if ($.isBlank(series))
                {
                    series = createSeries(chartObj, seriesVal, yc, row);
                    getSeriesSums(chartObj, series);
                }

                // If we have multiple points for the same series at the same
                // x-coordinate, we don't want them overwriting each other
                // randomly; so we bail on duplicates; but we still want to allow
                // updates for the row actually rendered at this point
                if (!$.subKeyDefined(chartObj._rowIndices, row.id + '.' + series.index) &&
                    _.any(series.data, function(datum) { return datum.x == basePt.x; }))
                { return; }
                renderPoint(series);
            });

            return true;
        },

        rowsRendered: function()
        {
            var chartObj = this;
            chartObj._super();
            if (!chartObj._columnsLoaded || !chartObj.isValid()) { return; }

            var chartRedrawCount = 1;
            var doChartRedraw = function()
            {
                if (--chartRedrawCount <= 0)
                {
                    if (!$.isBlank(chartObj.chart))
                    { chartObj.chart.redraw(); }
                    if (!$.isBlank(chartObj.secondChart))
                    { chartObj.secondChart.redraw(); }
                }
            };

            // Check if there are remainders to stick on the end
            if (chartObj._useRemainders && !_.isEmpty(chartObj._seriesRemainders) &&
                (Dataset.chart.types[chartObj._chartType].renderOther ||
                chartObj._displayFormat.renderOther))
            {
                // Create fake row for other value
                var otherRow = { invalid: {}, error: {}, changed: {} };
                otherRow[chartObj._xColumn.lookup] = 'Other';
                var cf = _.detect(chartObj._primaryView.metadata.conditionalFormatting,
                    function(cf) { return cf.condition === true; });
                if (cf) { otherRow.color = cf.color; }

                var oInd;
                if (!_.isUndefined(chartObj._xCategories))
                {
                    oInd = _.indexOf(chartObj._xCategories, 'Other');
                    if (oInd < 0)
                    {
                        oInd = chartObj._xCategories.length;
                        chartObj._xCategories.push('Other');
                    }
                }
                _.each(chartObj._seriesCache, function(series)
                {
                    var seriesRow = $.extend(true, {}, otherRow, series.seriesValues);
                    seriesRow.id = 'Other_' + series.yColumn.data.id + '_' +
                    _.map(_.keys(series.seriesValues).sort(), function(sk)
                        { return sk + ':' + series.seriesValues[sk]; }).join('_') || 'default';
                    if ((chartObj._primaryView.highlights || {})[seriesRow.id])
                    {
                        seriesRow.sessionMeta = {highlight: true,
                            highlightColumn: (chartObj._primaryView.highlightsColumn || {})[seriesRow.id]};
                    }
                    var otherPt = xPoint(chartObj, seriesRow, oInd);
                    otherPt.otherPt = true;

                    var renderOther = function()
                    {
                        var sr = chartObj._seriesRemainders[series.groupId][series.yColumn.data.id];
                        if ($.isBlank(sr)) { return; }
                        var percentage = (sr /
                            chartObj._seriesSums[series.groupId][series.yColumn.data.id]);
                        // If the remainder is less than .01%, not worth rendering
                        // due to calculation rounding errors
                        if (percentage < 0.0001) { return; }

                        seriesRow[series.yColumn.data.lookup] = sr;
                        var point = yPoint(chartObj, seriesRow, sr, series, otherPt);
                        addPoint(chartObj, point, series, true);
                        doChartRedraw();
                    };

                    chartRedrawCount++;
                    if ($.isBlank(chartObj._seriesRemainders[series.groupId]))
                    { getSeriesSums(chartObj, series, renderOther); }
                    else
                    { renderOther(); }
                });
            }

            if (!chartObj._dataGrouping)
            {
                var numSeries = chartObj._seriesCache.length;
                for (var seriesIndex = 0; seriesIndex < numSeries; seriesIndex++)
                {
                    var reindex = function(datum, index)
                    { datum.x = index; };
                    if (!$.isBlank(chartObj.chart))
                    { _.each(chartObj.chart.series[seriesIndex].data, reindex); }
                    if (!$.isBlank(chartObj.secondChart))
                    { _.each(chartObj.secondChart.series[seriesIndex].data, reindex); }
                    _.each(chartObj._seriesCache[seriesIndex].data, reindex);
                }
            }

            chartObj._seriesCache = _.reject(chartObj._seriesCache, function(serie)
                    {
                        var toRem = _.isEmpty(serie.data);
                        if (toRem)
                        {
                            delete chartObj._seriesByVal[serie.name];
                            if (!$.isBlank(chartObj.chart))
                            {
                                var existS = chartObj.chart.get(serie.name);
                                if (!$.isBlank(existS)) { existS.remove(); }
                            }
                            if (!$.isBlank(chartObj.secondChart))
                            {
                                existS = chartObj.secondChart.get(serie.name);
                                if (!$.isBlank(existS)) { existS.remove(); }
                            }
                        }
                        return toRem;
                    });
            _.each(chartObj._seriesCache, function(serie, i) { serie.index = i; });

            doChartRedraw();

            if (!_.isUndefined(chartObj.chart))
            {
                setCategories(chartObj);

                if (chartObj._primaryView.snapshotting)
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

        cleanVisualization: function()
        {
            var chartObj = this;
            chartObj._super();
            delete chartObj._xCategories;
            delete chartObj._categoriesLoaded;
            delete chartObj._xColumn;
            delete chartObj._yColumns;
            delete chartObj._columnsReady;
            delete chartObj._columnsLoaded;
            delete chartObj._pendingRows;
            delete chartObj._seriesRemainders;
            delete chartObj._seriesCache;
            delete chartObj._seriesByVal;
            delete chartObj._rowIndices;
            delete chartObj._curMin;
            delete chartObj._curMax;
            delete chartObj._loadedOnce;
            delete chartObj._dataGrouping;
            chartObj._recheckColors = true;

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
            chartObj.$dom().siblings('#highcharts_tooltip').hide();
        },

        resizeHandle: function()
        {
            var chartObj = this;
            if ($.isBlank(chartObj.chart) && !chartObj._isLoading) { return; }
            // Defer because Highcharts  also catches the resize, and gets confused if
            // it is in the middle of a reload
            _.defer(function()
            {
                if (chartObj._chartType == 'pie' || chartObj._chartType == 'donut' ||
                        // This is a case-specific fix for ctrpilot.
                        $.browser.msie && ($.browser.majorVersion < 8)
                        && chartObj._chartType == 'column'
                        && chartObj.$dom().parents('.tickerLayoutChildren').length > 0)
                { chartObj.reload(); }
            });
        },

        getRequiredJavascripts: function()
        {
            return blist.assets.libraries.highcharts;
        },

        generateFlyoutLayout: function(columns, valueColumn)
        {
            var fCols = this._displayFormat.fixedColumns;
            var reqFields = [valueColumn];
            if (this._displayFormat.pointColor)
            { reqFields.push(this._displayFormat.pointColor); }
            if (this._displayFormat.pointSize)
            { reqFields.push(this._displayFormat.pointSize); }
            _.each(_.uniq(valueColumn.supplementalColumns || []), function(col)
            { reqFields.push({ tableColumnId: col, fieldName: col }); });
            return this._super(_.compact(_.uniq(reqFields).concat(columns)));
        }
    }, null, 'socrataChart');

    var getColor = function(chartObj, id, obj)
    {
        if ($.isBlank(chartObj._availableColors) || chartObj._recheckColors)
        {
            // Make a copy of colors so we don't reverse the original
            var colors;
            if (!_.isUndefined(chartObj._displayFormat.colors))
            { colors = chartObj._displayFormat.colors.slice(); }
            else if (!_.isUndefined(chartObj._displayFormat.color))
            { colors = [ chartObj._displayFormat.color ]; }
            else
            {
                colors = _.map(chartObj._valueColumns, function(vc)
                { return vc.color; });
            }
            if (chartObj._displayFormat.stacking)
            { colors = colors.reverse(); }
            colors = _.compact(colors);

            if ($.isBlank(chartObj._availableColors) ||
                    (chartObj._origColors || {}).dataId != chartObj._primaryView.id ||
                    !_.isEqual(colors, (chartObj._origColors || {}).colors))
            {
                delete chartObj._recheckColors;
                delete chartObj._colorIndex;
                chartObj._origColors = {colors: colors.slice(), dataId: chartObj._primaryView.id};
                chartObj._availableColors = colors;
            }
        }

        chartObj._colorIndex = chartObj._colorIndex || {};
        if (!chartObj._colorIndex.hasOwnProperty(id))
        {
            if ($.subKeyDefined(obj, 'color') && _.include(chartObj._availableColors, obj.color))
            {
                chartObj._colorIndex[id] = obj.color;
                chartObj._availableColors = _.without(chartObj._availableColors, obj.color);
            }
            else
            { chartObj._colorIndex[id] = chartObj._availableColors.shift(); }
        }

        return chartObj._colorIndex[id];
    };

    var getSeriesName = function(chartObj, yCol, row)
    {
        var seriesVals = [];
        if (!chartObj._dataGrouping || chartObj._yColumns.length > 1)
        { seriesVals.push(yCol.data.name); }
        _.each(chartObj._seriesColumns, function(sc)
            { seriesVals.push(renderCellText(row, sc.column)); });
        return _.compact(seriesVals).join(', ');
    };

    var createSeries = function(chartObj, name, yCol, row)
    {
        var series = {id: name, name: name, data: [], seriesValues: {}, index: chartObj._seriesCache.length,
            yColumn: yCol, groupId: _.map(chartObj._seriesColumns,
                    function(sc) { return renderCellText(row, sc.column); }).join('|') || 'default'
        };
        _.each(chartObj._seriesColumns, function(sc)
                { series.seriesValues[sc.column.lookup] = row[sc.column.lookup]; });

        series.color = getColor(chartObj, series.name, yCol);
        if (chartObj._chartType == 'donut')
        {
            var segment = 100 / ((chartObj._seriesCache.length + 1) + 1);
            $.extend(series, {
                innerSize:    Math.round(segment * (series.index + 1)) + '%',
                size:         Math.round(segment * (series.index + 2)) + '%',
                showInLegend: series.index == 0,
                dataLabels:   { enabled: true }
            });
            if (chartObj._seriesCache.length > 0)
            { _.last(chartObj._seriesCache).dataLabels.enabled = false; }
            _.each(chartObj._seriesCache, function(s, i)
            {
                s.innerSize = Math.round(segment * (i + 1)) + '%';
                s.size = Math.round(segment * (i + 2)) + '%';
            });
        }

        if (!_.isUndefined(chartObj.chart))
        { chartObj.chart.addSeries(series, false); }
        if (!_.isUndefined(chartObj.secondChart))
        { chartObj.secondChart.addSeries(series, false); }
        chartObj._seriesCache.push(series);
        chartObj._seriesByVal[name] = series;

        return series;
    };

    var loadSeriesSums = function(chartObj)
    {
        if (!chartObj._columnsReady || $.isBlank(chartObj._totalRows)) { return; }

        chartObj._useRemainders = _.include(['pie', 'donut'], chartObj._chartType) ||
            chartObj._totalRows > chartObj._maxRows;

        var columnsDoneLoading = function()
        {
            // Register columns as loaded, render data if needed
            chartObj._columnsLoaded = true;
            if (!_.isUndefined(chartObj._pendingRows))
            {
                _.each(chartObj._pendingRows, function(r) { chartObj.renderRow(r); });
                delete chartObj._pendingRows;
                chartObj.rowsRendered();
            }
        };

        var gotSeriesSums = function()
        { if (--seriesSumsCount <= 0) { columnsDoneLoading(); } };
        var seriesSumsCount = 1;

        if (chartObj._dataGrouping)
        {
            _.each(chartObj._seriesCache, function(series)
            {
                seriesSumsCount++;
                getSeriesSums(chartObj, series, function() { gotSeriesSums(); });
            });
        }
        else
        {
            _.each(chartObj._yColumns, function(yc)
            {
                seriesSumsCount++;
                getSeriesSums(chartObj, {yColumn: yc, groupId: 'default'}, function() { gotSeriesSums(); });
            });
        }

        gotSeriesSums();
    };

    var getSeriesSums = function(chartObj, series, callback)
    {
        // Take set of series grouping values, get sum for all yColumns
        // Cache by series grouping vals, so can lookup for each yCol
        chartObj._seriesRemainders = chartObj._seriesRemainders || {};
        chartObj._seriesSums = chartObj._seriesSums || {};
        if (!chartObj._useRemainders)
        {
            chartObj._seriesRemainders[series.groupId] = {};
            chartObj._seriesRemainders[series.groupId][series.yColumn.data.id] = 0;
            chartObj._seriesSums[series.groupId] = $.extend(true, {},
                    chartObj._seriesRemainders[series.groupId]);
            if (_.isFunction(callback)) { _.defer(callback); }
            return;
        }

        if (chartObj._seriesRemainders.hasOwnProperty(series.groupId)
                && !$.isBlank(chartObj._seriesRemainders[series.groupId][series.yColumn.data.id]))
        {
            if (_.isFunction(callback)) { _.defer(callback); }
            return;
        }

        if ($.isBlank(series.seriesValues))
        {
            var srCache = chartObj._seriesRemainders[series.groupId] = {};
            _.each(chartObj._yColumns, function(col)
                    { srCache[col.data.id] = col.data.aggregates.sum; });
            chartObj._seriesSums[series.groupId] = $.extend(true, {},
                    chartObj._seriesRemainders[series.groupId]);
            if (_.isFunction(callback)) { _.defer(callback); }
            return;
        }

        chartObj._seriesRemaindersPending = chartObj._seriesRemaindersPending || {};
        if (_.isArray(chartObj._seriesRemaindersPending[series.groupId]))
        {
            chartObj._seriesRemaindersPending[series.groupId].push(callback);
            return;
        }
        else
        { chartObj._seriesRemaindersPending[series.groupId] = []; }

        var newDS = chartObj._primaryView.clone();
        var fc = {type: 'operator', value: 'AND', children: []};
        _.each(chartObj._seriesColumns, function(sc)
            {
                fc.children.push({type: 'operator', value: 'EQUALS', children: [
                    { type: 'column', columnFieldName: sc.column.fieldName },
                    { type: 'literal', value: series.seriesValues[sc.column.lookup] }
                ]});
            });
        var query = $.extend(true, {namedFilters: {}}, newDS.query);
        query.namedFilters.chartSeriesGroup = fc;
        newDS.update({query: query});

        var customAggs = {};
        _.each(chartObj._yColumns, function(c) { customAggs[c.data.id] = ['sum']; });
        newDS.getAggregates(function()
        {
            var srCache = chartObj._seriesRemainders[series.groupId] = {};
            _.each(chartObj._yColumns, function(c)
                { srCache[c.data.id] = newDS.columnForID(c.data.id).aggregates.sum; });
            chartObj._seriesSums[series.groupId] = $.extend(true, {},
                chartObj._seriesRemainders[series.groupId]);

            if (_.isFunction(callback)) { callback(); }
            _.each(chartObj._seriesRemaindersPending[series.groupId], function(srp) { srp(); });
            delete chartObj._seriesRemaindersPending[series.groupId];
        }, customAggs);
    };

    var createChart = function(chartObj)
    {
        var xTitle = chartObj._displayFormat.titleX;
        var yTitle = chartObj._displayFormat.titleY;

        var legendPos = chartObj._displayFormat.legend;

        // Map recorded type to what Highcharts wants
        var seriesType = chartObj._chartType;
        if (seriesType == 'line' && chartObj._displayFormat.smoothLine)
        { seriesType = 'spline'; }
        if (seriesType == 'timeline') { seriesType = 'line'; }
        if (seriesType == 'donut') { seriesType = 'pie'; }
        if (seriesType == 'bubble')
        {
            if (chartObj._displayFormat.showLine)
            { seriesType = 'line'; }
            else
            { seriesType = 'scatter'; }
        }

        var clipFormatter = function(xAxis, value, maxLen)
        {
            var abbreviateNumbers = function(num)
            {
                // This check comes first because it's simpler than a regex.
                if (xAxis && chartObj._xColumn)
                {
                    return chartObj._xColumn.renderType.renderer(num,
                            chartObj._xColumn, true, false, true);
                }

                // Are you really a number?
                // yColumn numbers will always come back as numbers.
                // xColumn numbers will come back as strings, but may be intended as strings.
                if (!_.isNumber(num) && !(num.match && num.match(/^[-+]?[0-9,]*\.?[0-9]+$/)))
                { return num; }

                if (_.isString(num)) { num = num.replace(/[^0-9\.\+\-]/g, ''); }

                var decimalPlaces = 2;
                if (!xAxis
                    && $.subKeyDefined(chartObj._displayFormat,
                        'yAxis.formatter.decimalPlaces'))
                { decimalPlaces = chartObj._displayFormat.yAxis.formatter.decimalPlaces; }
                return blist.util.toHumaneNumber(num, decimalPlaces);
            };
            maxLen = maxLen || 20;
            var v = abbreviateNumbers(!$.isBlank(value) ? value : this.value);
            if (v.length > maxLen)
            { return v.slice(0, maxLen) + '...'; }
            return v;
        };

        var drawNullBars = function()
        {
            if (!_.include(['column', 'bar'], chartObj._chartType) || $.isBlank(chartObj.chart) ||
                    chartObj._renderedRows < 1)
            { return; }

            var invertAxis = chartObj._chartType == 'bar';
            var stacking = chartObj._displayFormat.stacking;
            if (!chartObj._hatchPattern)
            { chartObj._hatchPattern = $('<div class="hatchPattern"></div>'); }

            var stacks = [];
            if (stacking)
            {
                _.each(chartObj.chart.series, function(serie)
                {
                    _.each(serie.data, function(datum)
                    {
                        stacks[datum.x] = stacks[datum.x] || 0;
                        stacks[datum.x] += datum.graphic.attr('height');
                    });
                });
            }

            _.each(chartObj.chart.series, function(serie)
            {
                _.each(serie.data, function(datum)
                {
                    if (!datum.isNull) { return; }
                    if (datum.$nullDiv) { datum.$nullDiv.remove(); }

                    var position;
                    if (invertAxis)
                    {
                        position = {
                            'top': chartObj.chart.plotHeight - chartObj.chart.plotTop
                                - datum.graphic.attr('x') + datum.barW / 2,
                            'left': chartObj.chart.plotLeft,
                            'width': chartObj.chart.plotWidth,
                            'height': datum.graphic.attr('width')
                        };
                        if (stacking)
                        {
                            position['left'] += stacks[datum.x];
                            position['width'] -= stacks[datum.x];
                        }
                    }
                    else
                    {
                        position = {
                            'top': chartObj.chart.plotTop,
                            'left': chartObj.chart.plotLeft + datum.graphic.attr('x'),
                            'width': datum.graphic.attr('width'),
                            'height': chartObj.chart.plotHeight
                        };
                        if (stacking)
                        {
                            position['height'] -= stacks[datum.x];
                        }
                    }

                    datum.$nullDiv = chartObj._hatchPattern.clone().css(position);
                    $(chartObj.chart.container).append(datum.$nullDiv);
                });
            });
        };

        var drawValueMarkers = function()
        {
            if (!chartObj._displayFormat.valueMarker)
            { return; }

            var invertAxis = chartObj._chartType == 'bar';
            if (!chartObj._valueMarkers)
            { chartObj._valueMarkers = []; }

            chartObj._valueMarkers = _drawMarkers(invertAxis, false, chartObj._displayFormat.valueMarker,
                chartObj._valueMarkers, chartObj.chart.series[0].yAxis);
        };

        var drawDomainMarkers = function()
        {
            if (!chartObj._displayFormat.domainMarker)
            { return; }

            var invertAxis = chartObj._chartType != 'bar';
            if (!chartObj._domainMarkers)
            { chartObj._domainMarkers = []; }

            chartObj._domainMarkers = _drawMarkers(invertAxis, !invertAxis,
                    chartObj._displayFormat.domainMarker,
                    chartObj._domainMarkers, chartObj.chart.xAxis[0]);
        };

        var drawErrorBars = function()
        {
            if (!chartObj._errorBarConfig)
            { return; }

            var invertAxis = chartObj._chartType != 'bar';
            if (!chartObj._errorBars)
            { chartObj._errorBars = []; }

            var errorBars = _(chartObj.chart.series).chain()
                .pluck('data')
                .map(function(series, index)
                { return _.map(series, function(datum) {
                    return {
                        atValue: chartObj._xCategories ? chartObj._xCategories[datum.x] : datum.x,
                        seriesOffset: datum.barX + (datum.barW / 2) - 2,
                        color: chartObj._displayFormat.errorBarColor,
                        low: datum.row && datum.row[chartObj._errorBarConfig.low.lookup],
                        high: datum.row && datum.row[chartObj._errorBarConfig.high.lookup]
                    };
                }); })
                .flatten()
                .reject(function(errorBar)
                    { return $.isBlank(errorBar.low) || $.isBlank(errorBar.high); })
                .value();

            chartObj._errorBars = _drawMarkers(invertAxis, !invertAxis, errorBars,
                chartObj._errorBars, chartObj.chart.xAxis[0], chartObj.chart.series[0].yAxis);
        };

        var _drawMarkers = function(invertAxis, zeroAtTop, format, markerStore, axis, otherAxis)
        {
            if (!_.isEmpty(markerStore) && markerStore[0].renderer)
            {
                // This is a hackaround since it doesn't look like
                // alignedObjects is ever supposed to be null.
                // TODO: Chase down the Highcharts bug.
                _.each(markerStore, function(marker)
                {
                    if (!marker.renderer.alignedObjects)
                    { marker.renderer.alignedObjects = []; }
                    if (marker.bars)
                    { _.invoke(marker.bars, 'destroy'); }
                    if (marker.handle)
                    { marker.handle.destroy(); }
                    marker.destroy();
                });
                markerStore = [];
            }
            if ($.isBlank(chartObj.chart) || _.isEmpty(chartObj.chart.series))
            { return null; }

            if ($.isBlank(markerStore))
            { markerStore = []; }

            var getPercentage = function(value, extremes, _zeroAtTop)
            {
                if (_.isString(value)) { value = parseFloat(value.replace(/[^0-9\.\+\-]/, '')); }
                return (_zeroAtTop ? (value - extremes.min) : (extremes.max - value)) /
                    (extremes.max - extremes.min);
            };

            _.each(format, function(marker, index)
            {
                var isErrorBar = !(_.isUndefined(marker.low) || _.isUndefined(marker.high));

                var lineAt = marker.atValue;
                if (axis.isXAxis && !_.isEmpty(chartObj._xCategories))
                {
                    // Attempt to look up value
                    var v = chartObj._xColumn.renderType.renderer(lineAt,
                        chartObj._xColumn, true, false, true);
                    var i = _.indexOf(chartObj._xCategories, v);
                    if (i < 0 && v > _.first(chartObj._xCategories) &&
                        v < _.last(chartObj._xCategories))
                    { i = _.sortedIndex(chartObj._xCategories, v) - 0.5; }
                    if (i > -1) { lineAt = i; }
                }
                if (_.isString(lineAt)) { lineAt = parseFloat(lineAt.replace(/[^0-9\.\+\-]/, '')); }
                if (!_.isNumber(lineAt)) { return; }

                var percentage = getPercentage(lineAt, axis.getExtremes(), zeroAtTop);
                if (percentage > 1 || percentage < 0)
                { return; }

                // FIXME: This will not work for line charts.
                var size = $.subKeyDefined(chartObj, 'chart.series.0.data.0')
                    ? chartObj.chart.series[0].data[0].graphic.attr('width')
                    : 4; // Magic number: A decent width for the error bar in case the dynamic fails.
                var commands = [];
                var handle;
                if (invertAxis)
                {
                    var offsetLeft = isErrorBar
                        ? chartObj.chart.plotLeft + Math.ceil(marker.seriesOffset)
                        : ((1 - percentage) * chartObj.chart.plotWidth) + chartObj.chart.plotLeft;
                    commands.push(['M', offsetLeft, chartObj.chart.plotTop
                        + chartObj.chart.plotHeight]);
                    commands.push(['L', offsetLeft, chartObj.chart.plotTop]);
                    handle = [offsetLeft, 10, 5];

                    if (isErrorBar)
                    {
                        commands[0][2] = (getPercentage(marker.low, otherAxis.getExtremes())
                            * chartObj.chart.plotHeight) + chartObj.chart.plotTop;
                        commands[1][2] = (getPercentage(marker.high, otherAxis.getExtremes())
                            * chartObj.chart.plotHeight) + chartObj.chart.plotTop;
                    }
                }
                else
                {
                    var offsetTop = isErrorBar
                        ? chartObj.chart.plotTop
                            + (chartObj.chart.plotHeight - Math.ceil(marker.seriesOffset))
                        : (percentage * chartObj.chart.plotHeight) + chartObj.chart.plotTop;
                    commands.push(['M', chartObj.chart.plotLeft, offsetTop]);
                    commands.push(['L', chartObj.chart.plotLeft + chartObj.chart.plotWidth, offsetTop]);
                    handle = [chartObj.chart.plotLeft + chartObj.chart.plotWidth + 1,
                              offsetTop, 5];

                    if (isErrorBar)
                    {
                        commands[0][1] = ((1 - getPercentage(marker.low, otherAxis.getExtremes(), false))
                            * chartObj.chart.plotWidth) + chartObj.chart.plotLeft;
                        commands[1][1] = ((1 - getPercentage(marker.high,otherAxis.getExtremes(), false))
                            * chartObj.chart.plotWidth) + chartObj.chart.plotLeft;
                    }
                }


                var mouseover = function(event) {
                    var $box = chartObj.$dom().siblings('#highcharts_tooltip');
                    if ($box.length < 1)
                    {
                        chartObj.$dom().after('<div id="highcharts_tooltip"></div>');
                        $box = chartObj.$dom().siblings('#highcharts_tooltip').hide();
                    }

                    var $container = $(chartObj.currentDom);
                    var position;
                    position = { 'top': handle[1] + 10, 'left': event.clientX - $container.offset().left };

                    if (!hasSVG) { position.top += 10; }

                    $box.empty()
                        .append(marker.caption)
                        .css({ top: position.top + 'px', left: position.left + 'px' })
                        .show();

                    if ($container.width() <= position.left + $box.width())
                    { $box.css({ left: ($container.width() - $box.width() - 20) + 'px' }); }

                    var too_low = $container.height() - (position.top + $box.height());
                    if (too_low < 0)
                    { $box.css({ top: (position.top + too_low - 20) + 'px' }); }
                };

                var thickStroke = _.include(['column', 'bar'], chartObj._chartType);

                var lowBar, highBar;
                if (isErrorBar)
                {
                    if (invertAxis)
                    { lowBar = [['M', commands[0][1] - (size/2) - 1, commands[0][2]],
                                ['L', commands[1][1] + (size/2) + 1, commands[0][2]]];
                      highBar = [['M', commands[0][1] - (size/2) - 1, commands[1][2]],
                                 ['L', commands[1][1] + (size/2) + 1, commands[1][2]]]; }
                    else
                    { lowBar = [['M', commands[0][1], commands[0][2] - (size/2) - 1],
                                ['L', commands[0][1], commands[1][2] + (size/2) + 1]];
                      highBar = [['M', commands[1][1], commands[0][2] - (size/2) - 1],
                                 ['L', commands[1][1], commands[1][2] + (size/2) + 1]]; }
                }

                if (hasSVG)
                {
                    var attrs = { 'zIndex': 10,
                                  'stroke': marker.color,
                                  'stroke-width': thickStroke ? 2 : 1 };
                    markerStore[index] = chartObj.chart.renderer.path(_.flatten(commands))
                        .attr(attrs)
                        .add();
                    if (!isErrorBar)
                    { markerStore[index].attr({'stroke-dasharray': '9, 5'}); }
                    else
                    {
                        markerStore[index].bars = [
                            chartObj.chart.renderer.path(_.flatten(lowBar)).attr(attrs).add(),
                            chartObj.chart.renderer.path(_.flatten(highBar)).attr(attrs).add()
                        ];
                    }

                    if (!marker.caption) { return; }

                    markerStore[index].handle =
                        chartObj.chart.renderer.circle.apply(chartObj.chart.renderer, handle)
                            .attr({
                                'zIndex': 10,
                                'fill': marker.color
                            })
                            .add();
                    _.each([markerStore[index].element,
                            markerStore[index].handle.element], function(element)
                    { $(element).hover(mouseover,
                        function() { chartObj.$dom().siblings('#highcharts_tooltip').hide(); }); });
                }
                else
                {
                    if (!markerStore[index] || markerStore[index].parent().length == 0)
                    {
                        markerStore[index] =
                            $('<div />').css({ position: 'absolute', 'zIndex': 10,
                                'border-style': 'solid' });
                        $(chartObj.chart.container).append(markerStore[index]);
                    }
                    var buildChangeSet = function(svgCmds, errorBar)
                    {
                        var direc   = errorBar ? !invertAxis : invertAxis;
                        var cTop    = direc && !errorBar ? svgCmds[1][2] : svgCmds[0][2];
                        var cLeft   = direc ? svgCmds[1][1] : svgCmds[0][1];
                        var sAxis   = direc ? 'height' : 'width';
                        var sAxis2  = direc ? 'width' : 'height';
                        var sLength = direc ? svgCmds[0][2]-svgCmds[1][2]
                                            : svgCmds[1][1]-svgCmds[0][1];
                        var sWidth = thickStroke ? 2 : 1;
                        var changeset = { 'top': cTop+'px', left: cLeft+'px',
                            'borderColor': marker.color };
                        changeset[sAxis] = Math.abs(sLength) + 'px';
                        changeset[sAxis2] = 0;
                        changeset.borderWidth = sWidth + 'px';
                        return changeset;
                    };
                    markerStore[index].css(buildChangeSet(commands));

                    if (markerStore[index].$bars)
                    { markerStore[index].$bars.remove(); }

                    if (isErrorBar)
                    {
                        _.each([lowBar, highBar], function(cmds)
                        {
                            var bar = $('<div />').css({ position: 'absolute', 'zIndex': 10,
                                'border-style': 'solid' }).addClass('errorBar');
                            bar.css(buildChangeSet(cmds, true));
                            $(chartObj.chart.container).append(bar);
                        });
                        markerStore[index].$bars = $(chartObj.chart.container).find('.errorBar');
                    }

                    if (!marker.caption)
                    {
                        if (markerStore[index].$handle)
                        { markerStore[index].$handle.remove(); }
                        return;
                    }

                    if (!markerStore[index].$handle
                        || markerStore[index].$handle.length == 0)
                    {
                        markerStore[index].$handle =
                            $('<div />').css({ position: 'relative', 'zIndex': 10,
                                               width: '10px', height: '10px' });
                        $(chartObj.chart.container).append(markerStore[index].$handle);
                    }
                    markerStore[index].$handle
                        .css({ top: (handle[1] - 5) + 'px', left: (handle[0] - 5) + 'px',
                               backgroundColor: marker.color })
                    _.each([markerStore[index],
                            markerStore[index].$handle], function($element)
                    { $element.hover(mouseover,
                        function() { chartObj.$dom().siblings('#highcharts_tooltip').hide(); }); });
                }
            });

            return _.compact(markerStore);
        };

        var chartRedraw = function(evt)
        {
            if (!$.subKeyDefined(chartObj, 'chart.series.0')) { return; }

            setTimeout(drawNullBars, 500); // Wait for animation to finish before running.
            drawValueMarkers();
            drawDomainMarkers();
            drawErrorBars();
        };

        // Main config
        var chartConfig =
        {
            chart: {
                animation: true,
                renderTo: chartObj.$dom()[0],
                defaultSeriesType: seriesType,
                events: { load: function() { chartObj.finishLoading(); }, redraw: chartRedraw },
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
            xAxis: { title: { text: $.isBlank(xTitle) ? null : xTitle,
                    style: { backgroundColor: '#ffffff',
                        border: '1px solid #909090', padding: '3px' } },
                dateTimeLabelFormats: {
                    day: '%e %b',
                    week: '%e %b',
                    month: '%b %Y'
                }, labels: {formatter: function()
                    {
                        var v = this.value;
                        var m = (chartObj._displayFormat.xAxisFormatter || '')
                            .match(/^\/(\S*)\/(.*)\/([gi]*)$/);
                        if (!_.isEmpty(m))
                        { v = v.replace(new RegExp(m[1], m[3]), m[2]); }
                        return clipFormatter(true, v);
                    }} },
            yAxis: { title:
                { text: $.isBlank(yTitle) ? null : yTitle,
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

        if (chartObj._displayFormat.yAxis)
        {
            var yAxis = chartObj._displayFormat.yAxis;
            if (_.isNumber(parseFloat(yAxis.min)))
            { chartConfig.yAxis.min = yAxis.min; }
            if (_.isNumber(parseFloat(yAxis.max)))
            { chartConfig.yAxis.max = yAxis.max; }
        }

        if (isDateTime(chartObj))
        {
            chartConfig.xAxis.type = 'datetime';
            delete chartConfig.xAxis.labels.formatter;
            chartConfig.tooltip = { formatter: function()
            {
                return $.isBlank(this) ? '' : '<p><strong>' + this.series.name +
                    (this.point.name && this.series.name != this.point.name ?
                        ': ' + this.point.name : '') + '</strong></p>' +
                    (this.point.subtitle ?
                        '<p>' + this.point.subtitle + '</p>' : '') +
                    '<p>' + this.y + ' at ' +
                    blist.datatypes.date.renderer(this.x / 1000,
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
        }



        // Set up config for this particular chart type
        var typeConfig = {stickyTracking: false, showInLegend: true};

        if (seriesType == 'pie')
        {
            var w = chartObj.$dom().width();
            var sizeRatio = w / chartObj.$dom().height();
            typeConfig.size = (sizeRatio * 20 + 30) + '%';
            var labelLength = sizeRatio * 5 + w / 50;
            typeConfig.dataLabels = {formatter: function()
                { return clipFormatter.apply(this, [false, this.point.name, labelLength]); },
                    distance: sizeRatio * 7};
        }

        if (seriesType == 'line' && chartObj._displayFormat.dataLabels)
        { typeConfig.dataLabels = { enabled: true }; }

        // Disable marker if no point size set
        if (chartObj._displayFormat.pointSize == '0')
        { typeConfig.marker = {enabled: false}; }

        // If we already loaded and are just re-rendering, don't animate
        if (chartObj._loadedOnce || chartObj._primaryView.snapshotting)
        { typeConfig.animation = false; }

        // Make sure lineSize is defined, so we don't hide the line by default
        if (!_.isUndefined(chartObj._displayFormat.lineSize))
        { typeConfig.lineWidth = parseInt(chartObj._displayFormat.lineSize); }

        var tooltipTimeout;
        typeConfig.point = { events: {
            mouseOver: function()
            {
                clearTimeout(tooltipTimeout);
                var $tooltip = customTooltip(chartObj, this);
                if (!$.isBlank($tooltip.data('currentRow')))
                { chartObj._primaryView.unhighlightRows($tooltip.data('currentRow')); }
                chartObj._primaryView.highlightRows(this.row, null, this.column);
                $tooltip.data('currentRow', this.row);
            },
            mouseOut: function()
            {
                var t = this;
                var $tooltip = $("#highcharts_tooltip");
                tooltipTimeout = setTimeout(function(){
                    if (!$tooltip.data('mouseover'))
                    {
                        chartObj._primaryView.unhighlightRows(t.row);
                        $tooltip.hide();
                    }
                }, 500);
            },
            click: function()
            {
                if ($.subKeyDefined(chartObj._primaryView, 'highlightTypes.select.' + this.row.id))
                { chartObj._primaryView.unhighlightRows(this.row, 'select'); }
                else
                { chartObj._primaryView.highlightRows(this.row, 'select', this.column); }
            }
        }};

        // Type config goes under the type name
        chartConfig.plotOptions[seriesType] = typeConfig;

        if (chartObj._displayFormat.stacking && (chartObj._yColumns.length > 1 || chartObj._dataGrouping))
        {
            chartConfig.plotOptions.series =
                $.extend(chartConfig.plotOptions.series, { stacking: 'normal' });
            chartConfig.legend.reversed = true;
        }

        $.extend(chartConfig, { tooltip: { enabled: false }});

        // We don't actually enable exporting
        chartConfig.exporting = {
            enabled: false
        };

        // Create the chart
        chartObj.startLoading();

        var loadChart = function()
        {
            // If we already have data loaded, use it
            if (!_.isEmpty(chartObj._seriesCache))
            { chartConfig.series = chartObj._seriesCache; }

            // If we already have categories loaded, use it
            if (!_.isEmpty(chartObj._xCategories))
            { chartConfig.xAxis.categories = chartObj._xCategories; }

            chartObj.chart = new Highcharts.Chart(chartConfig);

            if (!chartObj._categoriesLoaded)
            { setCategories(chartObj); }
            if (chartObj._chartType == 'bar')
            { chartObj.chart.setSize(chartObj.chart.chartWidth,
                                     chartObj.chart.chartHeight, false); }

            if (isDateTime(chartObj)) { createDateTimeOverview(chartObj); }

            chartObj._loadedOnce = true;
            delete chartObj._isLoading;

            if (chartObj._primaryView.snapshotting)
            {
                prepareToSnapshot(chartObj);
            }

        };
        // Need to know that we are in the process of loading, but because of the defer, it
        // hasn't happened yet
        chartObj._isLoading = true;
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

        chartObj._snapshot_timer = setTimeout(chartObj._primaryView.takeSnapshot, 1000);
    };

    var xPoint = function(chartObj, row, ind)
    {
        var pt = {};

        if (isDateTime(chartObj))
        {
            if (!$.isBlank(row) && ($.isBlank(row.invalid) || !row.invalid[chartObj._xColumn.lookup]))
            { pt.x = row[chartObj._xColumn.lookup]; }
            else { pt.x = ''; }
            if (_.isNumber(pt.x)) { pt.x *= 1000; }
            else if (!$.isBlank(pt.x)) { pt.x = Date.parse(pt.x).valueOf(); }
        }
        else if (!$.isBlank(ind))
        { pt.x = ind; }
        if (_.include(['pie', 'donut'], chartObj._chartType))
        { pt.name = row[chartObj._xColumn.lookup]; }

        if (!$.isBlank(chartObj._xCategories))
        {
            chartObj._rowIndices[row.id] = chartObj._rowIndices[row.id] || {};
            chartObj._rowIndices[row.id].x = ind;
        }

        return pt;
    };

    var yPoint = function(chartObj, row, value, series, basePt)
    {
        var isPieTypeChart = _.include(['pie', 'donut'], chartObj._chartType);
        if (_.isNull(value) && isPieTypeChart)
        { return null; }

        var point = {y: value || 0, label: {}, id: row.id + '_' + series.index};
        point.isNull = _.isNull(value);
        if (!_.isNull(basePt) && !_.isUndefined(basePt))
        { _.extend(point, basePt); }

        if (!_.isUndefined(series.yColumn.title) && !_.isNull(row))
        { point.name = renderCellText(row, series.yColumn.title); }

        else if (isPieTypeChart)
        {
            point.name = point.name || point.x;
            if (chartObj._displayFormat.showPercentages)
            {
                var percentage = (value/chartObj._seriesSums[series.groupId][series.yColumn.data.id])*100;
                if (percentage < 1)
                { percentage = '<1'; }
                else
                { percentage = Math.floor(percentage); }
                point.name += ' ('+ percentage +'%)';
            }
        }

        else { point.name = chartObj._seriesCache[series.index].name; }

        if (!_.isUndefined(series.yColumn.metadata) && !_.isNull(row))
        {
            point.subtitle = '';
            _.each(series.yColumn.metadata, function(c)
            { point.subtitle += renderCellText(row, c); });
        }

        if (isPieTypeChart &&
            !_.isEmpty(chartObj._displayFormat.colors))
        {
            point.color = chartObj._displayFormat.colors[point.x % chartObj._displayFormat.colors.length];
        }
        else if (chartObj._chartType == 'bubble')
        {
            if (!point.states) { point.states = {}; }
            if (chartObj._pointColor && chartObj._segments[chartObj._pointColor.id])
            {
                var pCol = chartObj._pointColor;
                point.label.color = pCol.name;
                for (var i = 0; i < chartObj._numSegments; i++)
                { if (parseFloat(row[pCol.lookup]) <= chartObj._segments[pCol.lookup][i])
                    {
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
                { if (parseFloat(row[pCol.lookup]) <= chartObj._segments[pCol.lookup][i])
                    {
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

        var sm = row.sessionMeta || {};
        if (sm.highlight && ($.isBlank(sm.highlightColumn) || sm.highlightColumn == series.yColumn.data.id))
        { point.selected = true; }

        point.row = row;
        point.column = series.yColumn.data;
        point.flyoutDetails = chartObj.renderFlyout(row,
            series.yColumn.data.tableColumnId, chartObj._primaryView);

        return point;
    };

    // Handle rendering values for different column types here
    var renderCellText = function(row, col)
    {
        var renderer = row.invalid[col.lookup] ? blist.datatypes.invalid.renderer :
            col.renderType.renderer;
        return renderer(row[col.lookup], col, true, false, {}, true);
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

        if (chartObj._displayFormat.detailBounds)
        {
            adjustDetailBounds(chartObj, chartObj._displayFormat.detailBounds.min,
                chartObj._displayFormat.detailBounds.max);
            return;
        }
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
        chartObj._primaryView.update({ displayFormat: $.extend({}, chartObj._displayFormat,
            { detailBounds: { min: eAxis.min, max: eAxis.max }}) }, false, true);
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

    var addPoint = function(chartObj, point, series, isOther, pointIndex)
    {
        var ri = (chartObj._rowIndices[point.row.id] || {})[series.index];
        if (isOther && point.y == 0)
        {
            removePoint(chartObj, point, series, isOther);
            return;
        }

        if (!$.isBlank(chartObj.chart))
        {
            var p = chartObj.chart.get(point.id);
            if ($.isBlank(p))
            { chartObj.chart.series[series.index].addPoint(point, false); }
            else if (p.color != point.color)
            {
                // Workaround for Highcharts; color doesn't update, so do a full remove/replace
                p.remove(false);
                chartObj.chart.series[series.index].addPoint(point, false);
            }
            else
            {
                if (point.selected && !p.selected) { p.select(true, true); }
                else if (!point.selected && p.selected) { p.select(false, true); }
                p.update(point, false);
            }
        }
        if (!$.isBlank(chartObj.secondChart))
        {
            var sp = chartObj.secondChart.get(point.id);
            if ($.isBlank(sp))
            { chartObj.secondChart.series[series.index].addPoint(point, false); }
            else
            { sp.update(point, false); }
        }

        if ($.isBlank(ri))
        {
            chartObj._rowIndices[point.row.id] = chartObj._rowIndices[point.row.id] || {};
            var newI = !$.isBlank(pointIndex) ? pointIndex :
                chartObj._seriesCache[series.index].data.length;
            chartObj._rowIndices[point.row.id][series.index] = newI;
            chartObj._seriesCache[series.index].data.splice(newI, 0, point);
            for (var i = newI + 1; i < chartObj._seriesCache[series.index].data.length; i++)
            {
                var p = chartObj._seriesCache[series.index].data[i];
                if (!$.isBlank(p))
                { chartObj._rowIndices[p.row.id][series.index] = i; }
            }
        }
        else
        {
            if (chartObj._useRemainders && !isOther && !$.isBlank(chartObj._seriesRemainders) &&
                    !$.isBlank(chartObj._seriesRemainders[series.groupId]) &&
                    !$.isBlank(chartObj._seriesCache[series.index].data[ri]))
            {
                chartObj._seriesRemainders[series.groupId][series.yColumn.data.id] +=
                    chartObj._seriesCache[series.index].data[ri].y;
            }
            chartObj._seriesCache[series.index].data[ri] = point;
        }
        if (chartObj._useRemainders && !isOther && !$.isBlank(chartObj._seriesRemainders) &&
                        !$.isBlank(chartObj._seriesRemainders[series.groupId]))
        { chartObj._seriesRemainders[series.groupId][series.yColumn.data.id] -= point.y; }
    };

    var removePoint = function(chartObj, point, series, isOther)
    {
        var ri = (chartObj._rowIndices[point.row.id] || {})[series.index];
        if ($.isBlank(ri)) { return; }

        if (!_.isUndefined(chartObj.chart))
        {
            var p = chartObj.chart.get(point.id);
            if (!$.isBlank(p)) { p.remove(); }
        }
        if (!_.isUndefined(chartObj.secondChart))
        {
            var sp = chartObj.secondChart.get(point.id);
            if (!$.isBlank(sp)) { sp.remove(); }
        }

        if (chartObj._useRemainders && !isOther && !$.isBlank(chartObj._seriesRemainders) &&
                !$.isBlank(chartObj._seriesRemainders[series.groupId]))
        {
            chartObj._seriesRemainders[series.groupId][series.yColumn.data.id] +=
                chartObj._seriesCache[series.index].data[ri].y;
        }
        chartObj._seriesCache[series.index].data.splice(ri, 1);
        delete chartObj._rowIndices[point.row.id][series.index];
        for (var i = ri; i < chartObj._seriesCache[series.index].data.length; i++)
        {
            var p = chartObj._seriesCache[series.index].data[i];
            chartObj._rowIndices[p.row.id][series.index] = i;
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
        if (point.otherPt)
        { point.flyoutDetails.find('.columnId' + chartObj._xColumn.id + ' span')
                             .text('Other'); }

        var position;
        var $container = $(chartObj.currentDom);
        if (point.graphic)
        {
            var $point = $(point.graphic.element);
            var radius = parseInt($point[0].getAttribute('r'));
            position = $point.offset();
            if (radius)
            {
                position.top += radius;
                position.left += radius;
            }
            var offset = $container.offset();
            position.top -= offset.top;
            position.left -= offset.left;

            var boxOffset = 10;
            if (_.include(['line', 'bubble'], chartObj._chartType))
            { boxOffset = 2; }
            position.top += boxOffset;
            position.left += boxOffset;
        }
        else
        {
            position = {
                top: chartObj.chart.plotHeight * 0.4,
                left: point.clientX + chartObj.chart.plotLeft
            };
        }

        $box.empty()
            .append(point.flyoutDetails)
            .css({ top: position.top + 'px', left: position.left + 'px' })
            .show();

        if (point.isNull)
        { $box.text('This point has no data.'); }

        if (!$box.data('events-attached'))
        {
            $box.hover(
                    function(event)
                    { $(this).data('mouseover', true); event.stopPropagation(); },
                    function()
                    {
                        var $tooltip = $(this);
                        chartObj._primaryView.unhighlightRows($tooltip.data('currentRow'));
                        $tooltip.data('mouseover', false).hide();
                    })
                .data('events-attached', true);
        }

        if ($container.width() <= position.left + $box.width())
        { $box.css({ left: ($container.width() - $box.width() - 20) + 'px' }); }

        var too_low = $container.height() - (position.top + $box.height());
        if (too_low < 0)
        { $box.css({ top: (position.top + too_low - 20) + 'px' }); }

        return $box;
    };

    var calculateXAxisStepSize = function(chartObj, numCategories)
    {
        var labelLimit = Dataset.chart.types[chartObj._chartType].displayLimit.labels
            || Dataset.chart.types[chartObj._chartType].displayLimit.points;
        if (labelLimit)
        {
            // Magic Number is the width of chartObj.$dom().width() when the
            // displayLimit configurations were determined.
            var spaceAvailable;
            if (chartObj._chartType == 'bar')
            { spaceAvailable = labelLimit * (chartObj.$dom().height() / 514); }
            else
            { spaceAvailable = labelLimit * (chartObj.$dom().width() / 1440); }
            var numItems = numCategories;
            if (Dataset.chart.types[chartObj._chartType].displayLimit.points)
            {
                numItems = Math.min(numItems,
                    Dataset.chart.types[chartObj._chartType].displayLimit.points);
            }
            return Math.ceil(numItems / spaceAvailable);
        }
        else
        { return null; }
    };

    var setCategories = function(chartObj)
    {
        // Make sure data is cleaned, or sometimes setCategories will throw an error
        _.each(chartObj.chart.series, function(s) { s.cleanData(); });
        // Now that we have data, make sure the axes are updated
        chartObj.chart.redraw();
        chartObj.chart.xAxis[0].setCategories(chartObj._xCategories, true);
        chartObj.chart.xAxis[0].options.labels.step = calculateXAxisStepSize(chartObj,
            (chartObj._xCategories || []).length || chartObj._primaryView.totalRows);
        chartObj.chart.xAxis[0].redraw();
        chartObj._categoriesLoaded = true;
    };

})(jQuery);
