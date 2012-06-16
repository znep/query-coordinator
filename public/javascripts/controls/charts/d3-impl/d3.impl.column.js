(function($)
{

$.Control.registerMixin('d3_impl_column', {

    defaults: {
        barWidthBounds: [ 20, 200 ], // width of the bar, of course
        barSpacingBounds: [ 0, 20 ], // within series spacing
        seriesSpacingBounds: [ 10, 100 ], // between series (row) spacing
        sidePaddingBounds: [ 40, 200 ], // sides of window
        rowBuffer: 30, // additional rows to fetch on either side of the actual visible area
        valueLabelBuffer: 100, // amount of room to leave for each series' label
        dataMaxBuffer: 30 // amount of room to leave in actual chart area past the max bar
    },

    initializeVisualization: function()
    {
        var vizObj = this;
        var cc = vizObj._columnChart = {}; // own object to save temp stuff on

        // create and cache dom elements
        var $dom = vizObj.$dom();
        $dom.empty().append($.tag(
            { tagName: 'div', 'class': 'chartArea columnChart', contents: [
                { tagName: 'div', 'class': 'chartContainer' },
                { tagName: 'div', 'class': 'baselineContainer', contents: [
                    { tagName: 'div', 'class': 'baselineLine' }
                ] }
            ] }
        , true));
        cc.$chartArea = $dom.find('.chartArea');
        cc.$chartContainer = $dom.find('.chartContainer');
        cc.$baselineContainer = $dom.find('.baselineContainer');

        // default draw element position is 0
        cc.drawElementPosition = 0;

        // init our renderers
        cc.chartRaphael = new Raphael(cc.$chartContainer.get(0), 10, 10);
        cc.chartD3 = d3.raphael(cc.chartRaphael);
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

        // super
        vizObj._super();
    },

    cleanVisualization: function()
    {
        var vizObj = this;

        delete vizObj._columnChart;

        vizObj._super();
    },

    renderData: function(data)
    {
        var vizObj = this;

        // save off data
        vizObj._columnChart.currentData = data;

        // precalculate some stuff
        // figure out the max value for this slice
        var allValues = _.reduce(data, function(values, row)
        {
            return values.concat(_.map(vizObj._valueColumns, function(colDef)
            {
                var col = colDef.column,
                    rawValue = row[col.id];
                return col.dataType.matchValue ? col.dataType.matchValue(rawValue) : rawValue;
            }));
        }, []);
        vizObj._columnChart.maxValue = d3.max(allValues); // cache off maxValue for other renders
        vizObj._columnChart.minValue = d3.min(allValues); // etc

        vizObj._renderData();
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
            rowsPerScreen = Math.ceil(chartAreaWidth / cc.seriesWidth);

        var screenScaling = d3.scale.linear()
              .domain([ cc.sidePadding, cc.chartWidth - chartAreaWidth ])
              .range([ 0, vizObj._primaryView.totalRows() - rowsPerScreen ]);

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
            view = vizObj._primaryView,
            defaults = vizObj.defaults,
            cc = vizObj._columnChart,
            chartD3 = cc.chartD3,
            totalRows = view.totalRows(),
            chartAreaWidth = cc.$chartArea.width(),
            domHeight = vizObj.$dom().height(),
            maxRenderWidth = vizObj._maxRenderWidth(),
            numSeries = vizObj._valueColumns.length,
            barWidthBounds = defaults.barWidthBounds,
            barSpacingBounds = defaults.barSpacingBounds,
            seriesSpacingBounds = defaults.seriesSpacingBounds,
            sidePaddingBounds = defaults.sidePaddingBounds;

        // save off old series width for comparison later (see below)
        var oldSeriesWidth = cc.seriesWidth;

        var calculateRowWidth = function()
        {
            return (cc.barWidth * vizObj._valueColumns.length) +
                   (cc.barSpacing * (vizObj._valueColumns.length - 1)) +
                    cc.seriesSpacing;
        };
        var calculateTotalWidth = function()
        {
            return (calculateRowWidth() * totalRows) + (2 * cc.sidePadding);
        };

        // if we only have one series, allow all the bars
        // to collapse together
        if (numSeries === 1)
        {
            seriesSpacingBounds = [ 0, seriesSpacingBounds[1] ];
        }

        // assume minimum possible width
        cc.barWidth = barWidthBounds[0];
        cc.barSpacing = barSpacingBounds[0];
        cc.seriesSpacing = seriesSpacingBounds[0];
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
            cc.seriesSpacing = seriesSpacingBounds[1];
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
                                             seriesSpacingBounds[0]) -
                                2 * sidePaddingBounds[0];
                var denominator = totalRows * (numSeries * (barWidthBounds[1] -
                                                            barWidthBounds[0] +
                                                            barSpacingBounds[1] -
                                                            barSpacingBounds[0]) -
                                               barSpacingBounds[1] +
                                               barSpacingBounds[0] +
                                               seriesSpacingBounds[1] -
                                               seriesSpacingBounds[0]) +
                                  2 * (sidePaddingBounds[1] -
                                       sidePaddingBounds[0]);
                var scalingFactor = 1.0 * numerator / denominator;

                // now do the actual scaling
                var scale = function(bounds) { return ((bounds[1] - bounds[0]) * scalingFactor) + bounds[0]; }
                cc.barWidth = scale(barWidthBounds);
                cc.barSpacing = scale(barSpacingBounds);
                cc.seriesSpacing = scale(seriesSpacingBounds);
                cc.sidePadding = scale(sidePaddingBounds);
            }
        }

        // for convenience later, precalculate the series (row) width
        cc.seriesWidth = calculateRowWidth();

        // set margin
        cc.$chartContainer.css('margin-bottom', cc.chartHeight * -1);

        // move baseline
        cc.$baselineContainer.css('top', vizObj._yAxisPos());

        // return whether our series width has changed, so we know
        // if we'll have to move some things around
        return (oldSeriesWidth != cc.seriesWidth)
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
            cc = vizObj._columnChart;
        return d3.scale.linear()
                .domain([ Math.min(0, cc.minValue), cc.maxValue ])
                .range([ 0, vizObj._yAxisPos() - vizObj.defaults.dataMaxBuffer ]);
    },

    // call this if the active set of data has changed
    _renderData: function()
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            defaults = vizObj.defaults,
            data = cc.currentData,
            valueColumns = vizObj._valueColumns,
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

            // uniquely identify this series for selection
            var seriesClass = 'dataBar_series' + col.id;

            var bars = cc.chartD3.selectAll('.' + seriesClass)
                .data(data, function(row) { return row.id; });
            bars
                .enter().append('rect')
                    .classed('dataBar', true)
                    .classed(seriesClass, true)
                    .attr({ stroke: '#fff',
                            fill: colDef.color,
                            width: cc.barWidth })


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
                            var rObj = this;
                            rObj.tip = $(rObj.node).socrataTip({
                                content: vizObj.renderFlyout(d, col.tableColumnId, view),
                                positions: (d[col.id] > 0) ? [ 'top', 'bottom' ] : [ 'bottom', 'top' ],
                                trigger: 'now'
                            });
                            rObj.tip.adjustPosition({
                                top: (d[col.id] > 0) ? 0 : Math.abs(newYScale(0) - newYScale(d[col.id])),
                                left: cc.barWidth / 2
                            });
                            view.highlightRows(d, null, col);
                        }
                    })
                    .on('mouseout', function(d)
                    {
                        // for perf, only call unhighlight if highlighted.
                        if (d && !cc._isDragging && d.sessionMeta && d.sessionMeta.highlight)
                        {
                            this.tip.destroy();
                            view.unhighlightRows(d);
                        }
                    });
            bars
                    .attr('fill', vizObj.d3.util.colorizeRow(colDef))
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
        });

        // render our labels per row
        // 3.5 is a somewhat arbitrary number to bring the label's center rather than
        // baseline closer to the series' center
        var seriesLabels = cc.chartD3.selectAll('.seriesLabel')
            .data(data, function(row) { return row.id; });
        seriesLabels
            .enter().append('text')
                .classed('seriesLabel', true)
                .attr({ x: 0,
                        y: 0,
                        'text-anchor': 'start',
                        'font-size': 13 })
                // TODO: make a transform-builder rather than doing this concat
                // 10 is to bump the text off from the actual axis
                .attr('transform', vizObj._labelTransform());
        seriesLabels
            .attr('font-weight', function(d) { return (d.sessionMeta && d.sessionMeta.highlight) ? 'bold' : 'normal'; })
            .text(function(d) { return d[vizObj._fixedColumns[0].id]; }); // WHY IS THIS AN ARRAY
        seriesLabels
            .exit()
                .remove();

        vizObj._renderTicks(oldYScale, newYScale, true);

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

        cc.chartD3.selectAll('.seriesLabel')
                .attr('transform', vizObj._labelTransform());

        vizObj._renderTicks(yScale, yScale, false);
    },

    // call this if spacings/widths changed
    _rerenderPositions: function()
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            valueColumns = vizObj._valueColumns,
            yAxisPos = vizObj._yAxisPos();

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var dataBars = cc.chartD3.selectAll('.dataBar_series' + colDef.column.id)
                    .attr('width', cc.barWidth)
                    .attr('x', vizObj._xBarPosition(seriesIndex));
        });
        cc.chartD3.selectAll('.seriesLabel')
                .attr('transform', vizObj._labelTransform());
    },

    // renders tick lines in general
    _renderTicks: function(oldYScale, newYScale, isAnim)
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            yAxisPos = vizObj._yAxisPos();

        var idealTickCount = cc.chartHeight / 80;

        // TODO: rendering lines and labels is awful similar. fix?

        // render our tick lines
        // TODO: right now we assume 8 ticks is right. we should probably actually
        // calculate based on the chart height
        var tickLines = cc.chromeD3.selectAll('.tickLine')
            // we use the value rather than the index to make transitions more constant
            .data(oldYScale.ticks(idealTickCount), function(val) { return val; });
        tickLines
            .enter().append('div')
                .classed('tickLine', true)
                .classed('origin', function(d) { return d === 0; })
                .style('top', function(d) { return (yAxisPos - oldYScale(d)) + 'px'; });
        tickLines
            .transition()
                .duration(isAnim ? 1000 : 0)
                .style('top', function(d) { return (yAxisPos - newYScale(d)) + 'px'; });
        tickLines
            .exit()
            .transition()
                .remove();

        // render our tick labels
        var tickLabels = cc.chromeD3.selectAll('.tickLabel')
            // we use the value rather than the index to make transitions more constant
            .data(oldYScale.ticks(idealTickCount), function(val) { return val; });
        tickLabels
            .enter().append('div')
                .classed('tickLabel', true)
                .style('top', function(d) { return (yAxisPos - oldYScale(d)) + 'px'; });
        tickLabels
                .each(vizObj.d3.util.text())
            .transition()
                .duration(isAnim ? 1000 : 0)
                .style('top', function(d) { return (yAxisPos - newYScale(d)) + 'px'; });
        tickLabels
            .exit()
            .transition()
                .remove();
    },

    _xBarPosition: function(seriesIndex)
    {
        var vizObj = this,
            cc = vizObj._columnChart;

        var staticParts = cc.sidePadding - 0.5 - cc.drawElementPosition +
                          (seriesIndex * (cc.barWidth + cc.barSpacing));

        return function(d)
        {
            return staticParts + (d.index * cc.seriesWidth);
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

        var xPositionStaticParts = cc.sidePadding + ((cc.seriesWidth - cc.seriesSpacing) / 2) -
                                   3.5 - cc.drawElementPosition;
        var yPositionStaticParts = ',' + (vizObj._yAxisPos() + 10);

        return function(d)
        {
            return 'r40,0,0,T' + (xPositionStaticParts + (d.index * cc.seriesWidth)) + yPositionStaticParts;
        };
    }
}, null, 'socrataChart', [ 'd3_base', 'd3_base_dynamic' ]);

})(jQuery);