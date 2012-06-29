(function($)
{

var d3ns = blist.namespace.fetch('blist.d3');

$.Control.registerMixin('d3_impl_column', {

    defaults: {
        barWidthBounds: [ 20, 200 ], // width of the bar, of course
        barSpacingBounds: [ 0, 20 ], // within row (between series) spacing
        rowSpacingBounds: [ 10, 100 ], // between row spacing
        sidePaddingBounds: [ 40, 200 ], // sides of window
        rowBuffer: 30, // additional rows to fetch on either side of the actual visible area
        valueLabelBuffer: 100, // amount of room to leave for each row' label
        dataMaxBuffer: 30 // amount of room to leave in actual chart area past the max bar
    },

    initializeVisualization: function()
    {
        var vizObj = this;

        // if we need to do series grouping stuff, mix that in before anything else
        if (_.isArray(vizObj._displayFormat.seriesColumns) &&
            $.isBlank(vizObj._seriesGrouping)) // but don't do this if we're higher on the chain
        {
            vizObj.Class.addProperties(vizObj, d3ns.base.seriesGrouping, $.extend({}, vizObj));
            return vizObj.initializeVisualization(); // reset call chain
        }

        // own object to save temp stuff on
        var cc = vizObj._columnChart = {};

        // create and cache dom elements
        var $dom = vizObj.$dom();
        $dom.empty().append($.tag(
            { tagName: 'div', 'class': 'chartArea columnChart', contents: [
                { tagName: 'div', 'class': 'chartContainer' },
                { tagName: 'div', 'class': 'baselineContainer', contents: [
                    { tagName: 'div', 'class': 'baselineBg' },
                    { tagName: 'div', 'class': 'baselineLine' }
                ] }
            ] }
        , true));
        cc.$chartArea = $dom.find('.chartArea');
        cc.$chartContainer = $dom.find('.chartContainer');
        cc.$baselineContainer = $dom.find('.baselineContainer');

        // for positioning
        $dom.css('position', 'relative');

        // default draw element position is 0
        cc.drawElementPosition = 0;

        // init our renderers
        cc.chartRaphael = new Raphael(cc.$chartContainer.get(0), 10, 10);
        cc.chartD3 = d3.raphael(cc.chartRaphael);
        cc.chartHtmlD3 = d3.select(cc.$chartContainer.get(0));
        cc.chromeD3 = d3.select(cc.$chartArea.get(0));

        cc.$drawElement = cc.$chartContainer.children('svg, vml');

        // maybe move things around and maybe grab rows every half second when they're scrolling
        var throttledScrollHandler = _.throttle(function()
        {
            if (vizObj._repositionDrawElement())
            {
                vizObj._rerenderPositions();
            }
            vizObj.getDataForAllViews();
        }, 500);
        cc.$chartContainer.scroll(throttledScrollHandler);

        // save off a throttled version of the actual meat of resizeHandle with a proper
        // reference to this/vizObj (is there a better way to do this?)
        cc.doResizeHandle = _.throttle(function()
        {
            // maybe recalculate all the sizing
            var needsReposition = vizObj._resizeEverything();
            // maybe reposition the svg/vml elem
            needsReposition = vizObj._repositionDrawElement() || needsReposition;
            // reposition the elems vertically
            vizObj._rerenderAxis();
            // reposition the elmes horizonally if necessary
            if (needsReposition) vizObj._rerenderPositions();
            // maybe fetch some more rows if more are exposed
            vizObj.getDataForAllViews();
        }, 500);

        // allow the baseline to be draggable
        var throttledResize = _.throttle(function() { vizObj.resizeHandle(); }, 500); // TODO: this is more blunt than we need
        cc.$baselineContainer.draggable({
            axis: 'y',
            containment: 'parent', // TODO: bounded containment on viewport change
            drag: function(event, ui)
            {
                cc.valueLabelBuffer = cc.chartHeight - ui.position.top;
                throttledResize();
                // TODO: save off the valueLabelBuffer as a minor change on displayFormat?
            },
            scroll: false,
            start: function() { cc._isDragging = true; },
            stop: function() { cc._isDragging = false; }
        });

        // set up side stuff
        vizObj._decorateChrome();

        // super
        vizObj._super();
    },

    cleanVisualization: function()
    {
        var vizObj = this;

        delete vizObj._columnChart;

        vizObj._super();
    },

    getValueColumns: function()
    {
        return this._valueColumns;
    },

    getTotalRows: function()
    {
        return this._primaryView.totalRows();
    },

    renderData: function(data)
    {
        var vizObj = this,
            valueColumns = vizObj.getValueColumns();

        // precalculate some stuff

        // figure out the max value for this slice
        var relevantColumns = _.pluck(valueColumns, 'column');
        if ($.subKeyDefined(vizObj, '_displayFormat.plot.errorBarLow'))
        {
            var plot = vizObj._displayFormat.plot;
            relevantColumns.push(vizObj._primaryView.columnForIdentifier(plot.errorBarLow));
            relevantColumns.push(vizObj._primaryView.columnForIdentifier(plot.errorBarHigh));
        }
        relevantColumns = _.uniq(relevantColumns);
        var allValues = _.reduce(data, function(values, row)
        {
            return values.concat(_.map(relevantColumns, function(col)
            {
                return col.dataType.matchValue ? col.dataType.matchValue(row[col.id]) : row[col.id];
            }));
        }, []);
        vizObj._columnChart.maxValue = d3.max(allValues); // cache off maxValue for other renders
        vizObj._columnChart.minValue = d3.min(allValues); // etc

        vizObj._renderData(data);
    },

    handleRowCountChange: function()
    {
        if (this._resizeEverything())
        {
            this._rerenderPositions(true);
        }
    },

    getRenderRange: function(view, callback)
    {
        var vizObj = this,
            cc = vizObj._columnChart;

        // TODO: need to handle too-large render elems
        var chartAreaWidth = cc.$chartArea.width(),
            rowsPerScreen = Math.ceil(chartAreaWidth / cc.rowWidth);

        var screenScaling = d3.scale.linear()
              .domain([ cc.sidePadding, cc.chartWidth - chartAreaWidth ])
              .range([ 0, vizObj.getTotalRows() - rowsPerScreen ]);

        var start = Math.max(Math.floor(screenScaling(cc.$chartContainer.scrollLeft())) - vizObj.defaults.rowBuffer, 0);
        var length = rowsPerScreen + (vizObj.defaults.rowBuffer * 2);

        return { start: start, length: length };
    },

    resizeHandle: function()
    {
        var vizObj = this;

        if (!vizObj._columnChart)
        {
            // we haven't loaded yet but are being told to resize. init load
            // will size correctly anyway then so whatev.
            return;
        }

        // if we don't have totalRows yet then the sizing will be taken care
        // of shortly anyway, so only resize otherwise
        if (!$.isBlank(vizObj._columnChart.maxValue))
        {
            vizObj._columnChart.doResizeHandle();
        }
    },

    _decorateChrome: function()
    {
        var vizObj = this,
            cc = vizObj._columnChart;

        // render y axis label
        if (!$.isBlank(vizObj._displayFormat.titleY))
        {
            cc.$chartArea.addClass('hasYLabelVert');
            cc.$chartArea.after($.tag({
                tagName: 'div',
                'class': 'yLabelVert',
                contents: $.htmlStrip(vizObj._displayFormat.titleY)
            }));
        }

        // render x axis label
        if (!$.isBlank(vizObj._displayFormat.titleX))
        {
            cc.$chartArea.addClass('hasXLabelHoriz');
            var $label = $.tag({
                tagName: 'div',
                'class': 'xLabelHoriz',
                contents: $.htmlStrip(vizObj._displayFormat.titleX)
            });
            cc.$chartArea.append($label);

            // need to manually fix the label width due to bg image
            $label.css('margin-left', -0.5 * $label.width());
        }
    },

    _maxRenderWidth: function()
    {
        if ($.browser.webkit || $.browser.mozilla)
        {
            // firefox straight up stops rendering at 8388600 (eg 0x800000), even if
            // it's happy making the dom element much wider than that.

            // webkit seems to render out to infinity just fine, but starts losing
            // precision past the same cutoff.

            // so, render out that far.
            return 8300000;
        }

        if ($.browser.msie && $.browser.majorVersion > 8)
        {
            // ie9 seems to have the same cutoff as firefox.
            return 8300000;
        }

        // ie8 cuts off at 10000 hahaha D:
        return 10000;
    },

    _resizeEverything: function()
    {
        var vizObj = this,
            defaults = vizObj.defaults,
            cc = vizObj._columnChart,
            chartD3 = cc.chartD3,
            totalRows = vizObj.getTotalRows(),
            chartAreaWidth = cc.$chartArea.width(),
            domHeight = vizObj.$dom().height(),
            maxRenderWidth = vizObj._maxRenderWidth(),
            valueColumns = vizObj.getValueColumns(),
            barWidthBounds = defaults.barWidthBounds,
            barSpacingBounds = defaults.barSpacingBounds,
            rowSpacingBounds = defaults.rowSpacingBounds,
            sidePaddingBounds = defaults.sidePaddingBounds;

        // if we don't have value columns or total rows, bail
        // for now. we'll be called again later.
        if ($.isBlank(valueColumns) || $.isBlank(totalRows)) { return; }
        var numSeries = valueColumns.length;

        // save off old row width for comparison later (see below)
        var oldRowWidth = cc.rowWidth;

        var calculateRowWidth = function()
        {
            return (cc.barWidth * valueColumns.length) +
                   (cc.barSpacing * (valueColumns.length - 1)) +
                    cc.rowSpacing;
        };
        var calculateTotalWidth = function()
        {
            return (calculateRowWidth() * totalRows) + (2 * cc.sidePadding);
        };

        // if we only have one series, allow all the bars
        // to collapse together
        if (numSeries === 1)
        {
            rowSpacingBounds = [ 0, rowSpacingBounds[1] ];
        }

        // assume minimum possible width
        cc.barWidth = barWidthBounds[0];
        cc.barSpacing = barSpacingBounds[0];
        cc.rowSpacing = rowSpacingBounds[0];
        cc.sidePadding = sidePaddingBounds[0];

        var minTotalWidth = calculateTotalWidth();
        if (minTotalWidth > chartAreaWidth)
        {
            // we're bigger than we need to be. set the render area size
            // to be what we calculated.
            cc.chartRaphael.setSize(Math.min(minTotalWidth, maxRenderWidth), domHeight);
            cc.chartWidth = minTotalWidth;

            // scrollbar should have appeared. reresize.
            var renderHeight = cc.$chartContainer.renderHeight();
            cc.chartRaphael.setSize(Math.min(minTotalWidth, maxRenderWidth), renderHeight);
            cc.chartHeight = renderHeight;
        }
        else
        {
            // set our sizing to equal vis area
            cc.chartRaphael.setSize(Math.min(chartAreaWidth, maxRenderWidth), domHeight);
            cc.chartWidth = chartAreaWidth;
            cc.chartHeight = domHeight;

            // okay, we're smaller than we need to be.
            // calculate maximum possible width instead.
            cc.barWidth = barWidthBounds[1];
            cc.barSpacing = barSpacingBounds[1];
            cc.rowSpacing = rowSpacingBounds[1];
            // don't bother calculating sidepadding here, just use minimum and see what's up

            var maxTotalWidth = calculateTotalWidth();
            if (maxTotalWidth < chartAreaWidth)
            {
                // okay, then use those values and add side padding for
                // the difference
                cc.sidePadding = (chartAreaWidth - maxTotalWidth) / 2;
            }
            else
            {
                // so, the ideal width is somewhere between min and max.
                // trim stuff to get us down. scale everything from max
                // to min to get the ideal answer.

                // this... is the result of a bunch of algebra i did. i
                // had to relearn algebra to do it... so it's probably all
                // fucked.
                var numerator = chartAreaWidth +
                                totalRows * (numSeries * (-barWidthBounds[0] -
                                                           barSpacingBounds[0]) +
                                             barSpacingBounds[0] -
                                             rowSpacingBounds[0]) -
                                2 * sidePaddingBounds[0];
                var denominator = totalRows * (numSeries * (barWidthBounds[1] -
                                                            barWidthBounds[0] +
                                                            barSpacingBounds[1] -
                                                            barSpacingBounds[0]) -
                                               barSpacingBounds[1] +
                                               barSpacingBounds[0] +
                                               rowSpacingBounds[1] -
                                               rowSpacingBounds[0]) +
                                  2 * (sidePaddingBounds[1] -
                                       sidePaddingBounds[0]);
                var scalingFactor = 1.0 * numerator / denominator;

                // now do the actual scaling
                var scale = function(bounds) { return ((bounds[1] - bounds[0]) * scalingFactor) + bounds[0]; }
                cc.barWidth = scale(barWidthBounds);
                cc.barSpacing = scale(barSpacingBounds);
                cc.rowSpacing = scale(rowSpacingBounds);
                cc.sidePadding = scale(sidePaddingBounds);
            }
        }

        // for convenience later, precalculate the row width
        cc.rowWidth = calculateRowWidth();

        // set margin
        cc.$chartContainer.css('margin-bottom', cc.chartHeight * -1);

        // move baseline
        cc.$baselineContainer.css('top', vizObj._yAxisPos());

        // return whether our row width has changed, so we know
        // if we'll have to move some things around
        return (oldRowWidth != cc.rowWidth)
    },

    // moves the svg/vml element around to account for it's not big enough
    _repositionDrawElement: function()
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            scrollPosition = cc.$chartContainer.scrollLeft(),
            chartAreaWidth = cc.$chartArea.width(),
            drawElementPosition = parseFloat(cc.$drawElement.css('left')),
            drawElementWidth = vizObj._maxRenderWidth();

        if ((scrollPosition < drawElementPosition) ||
            (scrollPosition > (drawElementPosition + drawElementWidth - chartAreaWidth)))
        {
            cc.drawElementPosition = $.clamp(scrollPosition - Math.floor(drawElementWidth / 2),
                                             [ 0, Math.ceil(cc.chartWidth - drawElementWidth) ]);

            if (cc.drawElementPosition != drawElementPosition)
            {
                cc.$drawElement.css('left', cc.drawElementPosition);
                return true;
            }
        }
        return false;
    },

    // calculates value axis position
    _yAxisPos: function()
    {
        var vizObj = this;
        return vizObj._columnChart.chartHeight -
               (vizObj._columnChart.valueLabelBuffer || vizObj.defaults.valueLabelBuffer);
    },

    // calculates a y scale based on the current set of data
    _currentYScale: function()
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            explicitMin = parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'min')),
            explicitMax = parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'max'));

        return d3.scale.linear()
            .domain([ !_.isNaN(explicitMin) ? explicitMin : Math.min(0, cc.minValue),
                      !_.isNaN(explicitMax) ? explicitMax : cc.maxValue ])
            .range([ 0, vizObj._yAxisPos() - vizObj.defaults.dataMaxBuffer ])
            .clamp(true);
    },

    // call this if the active set of data has changed
    _renderData: function(data)
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            defaults = vizObj.defaults,
            valueColumns = vizObj.getValueColumns(),
            $chartArea = cc.$chartArea,
            view = vizObj._primaryView;

        // figure out how far out our value axis line is
        var yAxisPos = vizObj._yAxisPos();

        // set up our scales. oldYScale is used to init bars so they appear
        // in the old spot and transitions are less jarring.
        var newYScale = vizObj._currentYScale();
        var oldYScale = cc.yScale || newYScale;

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var col = colDef.column;

            // figure out what data we can actually render
            var splitData = _.groupBy(data, function(row)
            {
                return $.isBlank(row[col.id]) ? 'null' : 'present';
            });
            var presentData = splitData['present'] || [], nullData = splitData['null'] || [];

            // render our actual bars
            var seriesClass = 'dataBar_series' + col.id;
            var bars = cc.chartD3.selectAll('.' + seriesClass)
                .data(presentData, function(row) { return row.id; });
            bars
                .enter().append('rect')
                    .classed('dataBar', true)
                    .classed(seriesClass, true)
                    .attr({ stroke: '#fff',
                            width: cc.barWidth })

                    .attr('fill', function(d) { return d.color || colDef.color; })

                    .attr('x', vizObj._xBarPosition(seriesIndex))
                    .attr('y', vizObj._yBarPosition(col.id, oldYScale))
                    .attr('height', vizObj._yBarHeight(col.id, oldYScale))

                    .each(function() { this.__dataColumn = col; })

                    // don't mousey on dragging because event/renderspam breaks charts
                    // check for d because sometimes there's a race condition between unbind and remove
                    .on('mouseover', function(d)
                    {
                        if (d && !cc._isDragging)
                        {
                            vizObj.handleMouseOver(this, colDef, d, newYScale);
                        }
                    })
                    .on('mouseout', function(d)
                    {
                        // for perf, only call unhighlight if highlighted.
                        if (d && !cc._isDragging && d.sessionMeta && d.sessionMeta.highlight)
                        {
                            vizObj.handleMouseOut(this, colDef, d, newYScale);
                        }
                    });
            bars
                    .attr('fill', vizObj._d3_colorizeRow(colDef))
                    .each(function(d)
                    {
                        // kill tip if not highlighted. need to check here because
                        // unhighlight gets spammed when the grid gets stuck in weird
                        // states (really a grid bug workaround)
                        if (this.tip && (!d.sessionMeta || !d.sessionMeta.highlight))
                        {
                            this.tip.destroy();
                        }
                    })
                .transition()
                    .duration(1000)
                    .attr('y', vizObj._yBarPosition(col.id, newYScale))
                    .attr('height', vizObj._yBarHeight(col.id, newYScale));
            bars
                .exit()
                // need to call transition() here as it accounts for the animation ticks;
                // otherwise you get npe's
                .transition()
                    .remove();

            // render null bars
            var nullSeriesClass = 'nullDataBar_series' + col.id;
            var nullBars = cc.chartHtmlD3.selectAll('.' + nullSeriesClass)
                .data(nullData, function(row) { return row.id; });
            nullBars
                .enter().append('div')
                    .classed('nullDataBar', true)
                    .classed(nullSeriesClass, true)
                    .style('left', vizObj._d3_px(vizObj._xBarPosition(seriesIndex)))
                    .style('top', 0)
                    .style('width', vizObj._d3_px(cc.barWidth));
            nullBars
                    .style('height', vizObj._d3_px(yAxisPos));
            nullBars
                .exit()
                    .remove();
        });

        // render our labels per row
        // 3.5 is a somewhat arbitrary number to bring the label's center rather than
        // baseline closer to the row's center
        var rowLabels = cc.chartD3.selectAll('.rowLabel')
            .data(data, function(row) { return row.id; });
        rowLabels
            .enter().append('text')
                .classed('rowLabel', true)
                .attr({ x: 0,
                        y: 0,
                        'text-anchor': 'start',
                        'font-size': 13 })
                // TODO: make a transform-builder rather than doing this concat
                // 10 is to bump the text off from the actual axis
                .attr('transform', vizObj._labelTransform());
        rowLabels
                .attr('font-weight', function(d) { return (d.sessionMeta && d.sessionMeta.highlight) ? 'bold' : 'normal'; })
                .text(function(d) { return d[vizObj._fixedColumns[0].id]; }); // WHY IS THIS AN ARRAY
        rowLabels
            .exit()
            .transition()
                .remove();

        // render error markers if applicable
        // sadly they can't animate unless i write transition support for transforms in d34r
        if ($.subKeyDefined(vizObj, '_displayFormat.plot.errorBarLow'))
        {
            var errorMarkers = cc.chartD3.selectAll('.errorMarker')
                .data(data, function(row) { return row.id; });
            errorMarkers
                .enter().append('path')
                    .classed('errorMarker', true)
                    .attr({ stroke: vizObj._displayFormat.errorBarColor,
                            'stroke-width': '3' })
                    .attr('d', vizObj._errorBarPath(oldYScale));
            errorMarkers
                .transition()
                    .duration(1000)
                    .attr('d', vizObj._errorBarPath(newYScale));
            errorMarkers
                .exit()
                    .remove();
        }

        vizObj._renderTicks(oldYScale, newYScale, true);
        vizObj._renderValueMarkers(oldYScale, newYScale, true);

        // save off our yScale
        cc.yScale = newYScale;
    },

    // call this if the yAxisPos has changed
    // you'll also need to call _renderData to make the dataBars the correct height
    _rerenderAxis: function()
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            data = cc.currentData,
            yScale = vizObj._currentYScale(),
            yAxisPos = vizObj._yAxisPos();

        cc.chartD3.selectAll('.dataBar')
            .transition()
                .duration(1000)
                .attr('y', vizObj._yBarPosition(function() { return this.__dataColumn.id; }, yScale))
                .attr('height', vizObj._yBarHeight(function() { return this.__dataColumn.id; }, yScale));

        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());

        vizObj._renderTicks(yScale, yScale, false);
        vizObj._renderValueMarkers(yScale, yScale, false);
    },

    // call this if spacings/widths changed
    _rerenderPositions: function()
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            valueColumns = vizObj.getValueColumns(),
            yAxisPos = vizObj._yAxisPos();

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var dataBars = cc.chartD3.selectAll('.dataBar_series' + colDef.column.id)
                    .attr('width', cc.barWidth)
                    .attr('x', vizObj._xBarPosition(seriesIndex));

            cc.chartHtmlD3.selectAll('.nullDataBar_series' + colDef.column.id)
                    .style('width', vizObj._d3_px(cc.barWidth))
                    .style('left', vizObj._d3_px(vizObj._xBarPosition(seriesIndex)));
        });
        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());
    },

    // renders tick lines in general
    _renderTicks: function(oldYScale, newYScale, isAnim)
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            yAxisPos = vizObj._yAxisPos();

        // determine our ticks
        var idealTickCount = cc.chartHeight / 80;
        var ticks = newYScale.ticks(idealTickCount);

        var minValue = d3.min(newYScale.domain());
        if ((minValue < 0) &&
            !_.any(ticks, function(tick) { return tick < 0; }) &&
            (Math.abs(newYScale(minValue) - newYScale(0)) > 20))
        {
            ticks.push(minValue);
        }

        // if only we had lisp macros
        var maxValue = d3.max(newYScale.domain());
        if ((maxValue > 0) &&
            !_.any(ticks, function(tick) { return tick > 0; }) &&
            (Math.abs(newYScale(maxValue) - newYScale(0)) > 20))
        {
            ticks.push(maxValue);
        }

        // render our tick lines and labels
        var tickLines = cc.chromeD3.selectAll('.tick')
            // we use the value rather than the index to make transitions more constant
            .data(ticks, function(val) { return val; });
        var tickLinesRootEnter = tickLines
            .enter().append('div')
                .classed('tick', true)
                .classed('origin', function(d) { return d === 0; })
                .style('top', function(d) { return (yAxisPos - oldYScale(d)) + 'px'; });
            tickLinesRootEnter
                .append('div')
                    .classed('tickLabel', true);
            tickLinesRootEnter
                .append('div')
                    .classed('tickLine', true);
        tickLines
            .transition()
                .duration(isAnim ? 1000 : 0)
                .style('top', function(d) { return (yAxisPos - newYScale(d)) + 'px'; });
        tickLines
                .selectAll('.tickLabel')
                    .each(vizObj._d3_text(vizObj._formatYAxisTicks(
                        $.deepGet(vizObj, '_displayFormat', 'yAxis', 'formatter'))));
        tickLines
            .exit()
            .transition()
                .remove();
    },

    _renderValueMarkers: function(oldYScale, newYScale, isAnim)
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            yAxisPos = vizObj._yAxisPos();

        // if we ever to nukeless df updates, need to also remove lines
        if (!_.isArray(vizObj._displayFormat.valueMarker))
        {
            return;
        }

        var valueMarkers = cc.chromeD3.selectAll('.valueMarkerContainer')
            .data(vizObj._displayFormat.valueMarker);
        valueMarkers
            .enter().append('div')
                .classed('valueMarkerContainer', true)
                .style('top', function(d) { return (yAxisPos - oldYScale(parseFloat(d.atValue))) + 'px'; })
                .each(function(d)
                {
                    var $this = $(this);

                    // need to jQuery each rather than .html and .on because ie
                    $this.append($.tag([
                        { tagName: 'div', 'class': 'markerBg', style: { 'background-color': d.color } },
                        { tagName: 'div', 'class': 'markerLine', style: { 'background-color': d.color } }
                    ], true));
                    $this.socrataTip({
                        message: $.htmlStrip(d.caption),
                        positions: [ 'top', 'bottom' ]
                    });
                });
        valueMarkers
            .transition()
                .duration(isAnim ? 1000 : 0)
                .style('top', function(d) { return (yAxisPos - newYScale(parseFloat(d.atValue))) + 'px'; });
        valueMarkers
            .exit()
            .transition()
                .remove();
    },

    _formatYAxisTicks: function(formatter)
    {
        if ($.isBlank(formatter))
        {
            return $.commaify;
        }

        if (formatter.abbreviate === true)
        {
            // humane number requires a precision. so, our "auto" really just
            // means 2 in this case.
            return function(num) { return blist.util.toHumaneNumber(num, formatter.decimalPlaces || 2); };
        }
        else if (_.isNumber(formatter.decimalPlaces))
        {
            return function(num) { return $.commaify(num.toFixed(formatter.decimalPlaces)); };
        }
        else
        {
            return $.commaify;
        }
    },

    _xBarPosition: function(seriesIndex)
    {
        var vizObj = this,
            cc = vizObj._columnChart;

        var staticParts = cc.sidePadding - 0.5 - cc.drawElementPosition +
                          (seriesIndex * (cc.barWidth + cc.barSpacing));

        return function(d)
        {
            return staticParts + (d.index * cc.rowWidth);
        };
    },

    _yBarPosition: function(colId, yScale)
    {
        var yAxisPos = this._yAxisPos();
        var isFunction = _.isFunction(colId);
        return function(d) { return yAxisPos - yScale(Math.max(0, d[isFunction ? colId.call(this) : colId])) + 0.5; };
    },

    _yBarHeight: function(colId, yScale)
    {
        var yScaleZero = yScale(0);
        var isFunction = _.isFunction(colId);
        return function(d) { return Math.abs(yScaleZero - yScale(d[isFunction ? colId.call(this) : colId])); };
    },

    _labelTransform: function()
    {
        var vizObj = this,
            cc = vizObj._columnChart;

        var xPositionStaticParts = cc.sidePadding + ((cc.rowWidth - cc.rowSpacing) / 2) -
                                   3.5 - cc.drawElementPosition;
        var yPositionStaticParts = ',' + (vizObj._yAxisPos() + 10);

        return function(d)
        {
            return 'r40,0,0,T' + (xPositionStaticParts + (d.index * cc.rowWidth)) + yPositionStaticParts;
        };
    },

    _errorBarPath: function(yScale)
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            plot = vizObj._displayFormat.plot,
            lowCol = vizObj._primaryView.columnForIdentifier(plot.errorBarLow),
            highCol = vizObj._primaryView.columnForIdentifier(plot.errorBarHigh),
            yAxisPos = vizObj._yAxisPos();

        var xPositionStaticParts = cc.sidePadding + ((cc.rowWidth - cc.rowSpacing) / 2);
        var capWidth = 8;

        return function(d)
        {
            var x = Math.floor(xPositionStaticParts + (d.index * cc.rowWidth)) + 0.5;
            var y = yAxisPos - yScale(Math.max(0, d[highCol.id]));
            var height = Math.abs(yScale(d[lowCol.id]) - yScale(d[highCol.id]));

            // TODO: uuurrrreeeeghhhhhhh
            return 'M' + (x - capWidth) + ',' + y + 'H' + (x + capWidth) +
                   'M' + x + ',' + y + 'V' + (y + height) +
                   'M' + (x - capWidth) + ',' + (y + height) + 'H' + (x + capWidth);
        };
    },

    handleMouseOver: function(rObj, colDef, row, yScale)
    {
        var vizObj = this,
            view = vizObj._primaryView,
            col = colDef.column,
            cc = vizObj._columnChart;

        rObj.tip = $(rObj.node).socrataTip({
            content: vizObj.renderFlyout(row, col.tableColumnId, view),
            positions: (row[col.id] > 0) ? [ 'top', 'bottom' ] : [ 'bottom', 'top' ],
            trigger: 'now'
        });
        rObj.tip.adjustPosition({
            top: (row[col.id] > 0) ? 0 : Math.abs(yScale(0) - yScale(row[col.id])),
            left: ($.browser.msie && ($.browser.majorVersion < 9)) ? 0 : (cc.barWidth / 2)
        });
        view.highlightRows(row, null, col);
    },

    handleMouseOut: function(rObj, colDef, row, yScale)
    {
        var vizObj = this,
            view = vizObj._primaryView;

        view.unhighlightRows(row);
    }

}, null, 'socrataChart', [ 'd3_base', 'd3_base_dynamic' ]);

})(jQuery);