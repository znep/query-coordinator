(function($)
{

$.Control.registerMixin('d3_impl_column', {
    defaults: {
        barWidthBounds: [ 20, 200 ], // width of the bar, of course
        barSpacingBounds: [ 0, 20 ], // within series spacing
        seriesSpacingBounds: [ 10, 80 ], // between series (row) spacing
        rowBuffer: 30, // additional rows to fetch on either side of the actual visible area
        valueLabelBuffer: 200, // amount of room to leave for each series' label
        dataMaxBuffer: 30 // amount of room to leave in actual chart area past the max bar
    },

    initializeVisualization: function()
    {
        var vizObj = this;
        var cc = vizObj._columnChart = {}; // own object to save temp stuff on

        // create and cache dom elements
        var $dom = vizObj.$dom();
        $dom.append($.tag(
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

        // init our renderers
        cc.chartRaphael = new Raphael(cc.$chartContainer.get(0), 10, 10);
        cc.chartD3 = d3.raphael(cc.chartRaphael);
        cc.chromeD3 = d3.select(cc.$chartArea.get(0));

        // maybe grab rows every half second when they're scrolling
        var throttledRerender = _.throttle(function() { vizObj.getDataForAllViews(); }, 500);
        cc.$chartContainer.scroll(throttledRerender);

        // save off a throttled version of the actual meat of resizeHandle with a proper
        // reference to this/vizObj (is there a better way to do this?)
        cc.doResizeHandle = _.throttle(function()
        {
            vizObj._resizeEverything();
            vizObj._rerenderAxis();
            vizObj.getDataForAllViews();
        }, 500);

        // allow the baseline to be draggable
        var throttledResize = _.throttle(function() { vizObj.resizeHandle(); }); // TODO: this is more blunt than we need
        cc.$baselineContainer.draggable({
            axis: 'y',
            containment: 'parent', // TODO: bounded containment on viewport change
            drag: function(event, ui)
            {
                vizObj.defaults.valueLabelBuffer = cc.$chartArea.height() - ui.position.top;
                console.log(vizObj.defaults.valueLabelBuffer);
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

        vizObj._renderData();
    },

    handleRowCountChange: function()
    {
        this._resizeEverything();
    },

    getRenderRange: function(view, callback)
    {
        var vizObj = this,
            cc = vizObj._columnChart;

        // TODO: need to handle too-large render elems
        var screenScaling = d3.scale.linear()
              .domain([ 0, cc.chartWidth - cc.$chartArea.width() ])
              .range([ 0, vizObj._primaryView.totalRows() ]);

        var start = Math.max(Math.floor(screenScaling(cc.$chartContainer.scrollLeft())) - vizObj.defaults.rowBuffer, 0);
        var length = Math.ceil(cc.$chartArea.width() / cc.seriesWidth) + vizObj.defaults.rowBuffer;

        return { start: start, length: length };
    },

    resizeHandle: function()
    {
        var vizObj = this;

        // if we don't have totalRows yet then the sizing will be taken care
        // of shortly anyway, so only resize otherwise
        if (!$.isBlank(vizObj._columnChart.maxValue))
        {
            vizObj._columnChart.doResizeHandle();
        }
    },

    _resizeEverything: function()
    {
        var vizObj = this,
            view = vizObj._primaryView,
            defaults = vizObj.defaults,
            cc = vizObj._columnChart,
            chartD3 = cc.chartD3,
            totalRows = view.totalRows();

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
        if (vizObj._valueColumns.length === 1)
        {
            defaults.seriesSpacingBounds[0] = 0;
        }

        // assume no side padding to begin with
        cc.sidePadding = 0;

        // assume minimum possible width
        cc.barWidth = defaults.barWidthBounds[0];
        cc.barSpacing = defaults.barSpacingBounds[0];
        cc.seriesSpacing = defaults.seriesSpacingBounds[0];

        var minTotalWidth = calculateTotalWidth();
        if (minTotalWidth > cc.$chartArea.width())
        {
            // we're bigger than we need to be. set the render area size
            // to be what we calculated.
            cc.chartRaphael.setSize(minTotalWidth, vizObj.$dom().height());
            cc.chartWidth = minTotalWidth;
        }
        else
        {
            // set our sizing to equal vis area
            var domWidth = vizObj.$dom().width();
            cc.chartRaphael.setSize(vizObj.$dom().height(), domWidth);
            cc.chartWidth = domWidth;

            // okay, we're smaller than we need to be.
            // calculate maximum possible width instead.
            cc.barWidth = defaults.barWidthBounds[1];
            cc.barSpacing = defaults.barSpacingBounds[1];
            cc.seriesSpacing = defaults.seriesSpacingBounds[1];

            var maxTotalWidth = calculateTotalWidth();
            if (maxTotalWidth < cc.$chartArea.width())
            {
                // okay, then use those values and add side padding for
                // the difference
                cc.sidepadding = (cc.$chartArea.width() - maxTotalWidth) / 2;
            }
            else
            {
                // so, the ideal width is somewhere between min and max.
                // trim stuff to get us down. scale everything from max
                // to min to get the ideal answer.

                // this... is the result of a bunch of algebra i did. i
                // had to relearn algebra to do it... so it's probably all
                // fucked.
                var numerator = cc.$chartArea.width() -
                                    (totalRows * defaults.barWidthBounds[0]) -
                                    ((totalRows - 1) * defaults.barSpacingBounds[0]) -
                                    defaults.seriesSpacingBounds[0];
                var denominator = (totalRows * (defaults.barWidthBounds[1] - defaults.barWidthBounds[0])) +
                                    ((totalRows - 1) * (defaults.barSpacingBounds[1] - defaults.barSpacingBounds[0])) +
                                    (defaults.seriesSpacingBounds[1] - defaults.seriesSpacingBounds[0]);
                var scalingFactor = numerator / denominator;

                // now do the actual scaling
                var scale = function(bounds) { return ((bounds[1] - bounds[0]) * scalingFactor) + bounds[0]; }
                cc.barWidth = scale(defaults.barWidthBounds);
                cc.barSpacing = scale(defaults.barSpacingBounds);
                cc.seriesSpacing = scale(defaults.seriesSpacingBounds);
            }
        }

        // for convenience later, precalculate the series (row) width
        cc.seriesWidth = calculateRowWidth();

        // set margin
        cc.$chartContainer.css('margin-bottom', vizObj.$dom().height() * -1);

        // move baseline
        cc.$baselineContainer.css('top', vizObj._yAxisPos());
    },

    // calculates value axis position
    _yAxisPos: function()
    {
        var vizObj = this;
        return vizObj._columnChart.$chartArea.height() - vizObj.defaults.valueLabelBuffer;
    },

    // calculates a y scale based on the current set of data
    _currentYScale: function()
    {
        var vizObj = this;
        return d3.scale.linear()
                .domain([ 0, vizObj._columnChart.maxValue ])
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
            $chartArea = cc.$chartArea
            maxValue = cc.maxValue,
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
                            y: yAxisPos - 0.5,
                            width: cc.barWidth,
                            transform: 'S1,-1,0,' + yAxisPos,
                            'data-accessor': col.id })
                    .attr('x', function(d) { return (d.index * cc.seriesWidth) +
                            (seriesIndex * (cc.barWidth + cc.barSpacing)) - 0.5; })
                    .attr('height', function(d) { return oldYScale(d[col.id]); })
                    .on('mouseover', function(d) { if (!cc._isDragging) view.highlightRows(d, null, col); })
                    .on('mouseout', function(d) { if (!cc._isDragging) view.unhighlightRows(d); });
            bars
                    .attr('fill', vizObj.d3.util.colorizeRow(colDef))
                .transition()
                    .duration(1000)
                    .attr('height', function(d) { return newYScale(d[col.id]); });
            bars
                .exit()
                    .remove();
        });

        // render our labels per row
        // 3.5 is a somewhat arbitrary number to bring the label's center rather than
        // baseline closer to the series' center
        var seriesLabelX = function(d) { return d.index * cc.seriesWidth + (cc.seriesWidth / 2) - 3.5 };
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
                .attr('transform', function(d) { return 'r40,0,0T' + seriesLabelX(d) + ',' + (yAxisPos + 10); });
        seriesLabels
            .text(function(d) { return d[vizObj._fixedColumns[0].id]; }); // WHY IS THIS AN ARRAY
        seriesLabels
            .exit()
                .remove();

        vizObj._renderTicks(oldYScale, newYScale, true);

        // save off our yScale
        cc.yScale = newYScale;
    },

    // call this if the yAxisPos has changed
    _rerenderAxis: function()
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            data = cc.currentData,
            yScale = vizObj._currentYScale(),
            yAxisPos = vizObj._yAxisPos();

        cc.chartD3.selectAll('.dataBar')
                .attr({ y: yAxisPos - 0.5,
                        transform: 'S1,-1,0,' + yAxisPos });
        var seriesLabelX = function(d) { return d.index * cc.seriesWidth + (cc.seriesWidth / 2) - 3.5 };
        cc.chartD3.selectAll('.seriesLabel')
                .attr('transform', function(d) { return 'r40,0,0T' + seriesLabelX(d) + ',' + (yAxisPos + 10); });

        vizObj._renderTicks(yScale, yScale, false);
    },

    _renderTicks: function(oldYScale, newYScale, isAnim)
    {
        var vizObj = this,
            cc = vizObj._columnChart,
            yAxisPos = vizObj._yAxisPos();

        // TODO: rendering lines and labels is awful similar. fix?

        // render our tick lines
        // TODO: right now we assume 8 ticks is right. we should probably actually
        // calculate based on the chart height
        var tickLines = cc.chromeD3.selectAll('.tickLine')
            // we use the value rather than the index to make transitions more constant
            .data(oldYScale.ticks(8), function(val) { return val; });
        tickLines
            .enter().append('div')
                .classed('tickLine', true)
                .style('top', function(d) { return (yAxisPos - oldYScale(d)) + 'px'; });
        tickLines
            .transition()
                .duration(isAnim ? 0 : 1000)
                .style('top', function(d) { return (yAxisPos - newYScale(d)) + 'px'; });
        tickLines
            .exit()
                .remove();

        // render our tick labels
        var tickLabels = cc.chromeD3.selectAll('.tickLabel')
            // we use the value rather than the index to make transitions more constant
            .data(oldYScale.ticks(8), function(val) { return val; });
        tickLabels
            .enter().append('div')
                .classed('tickLabel', true)
                .style('top', function(d) { return (yAxisPos - oldYScale(d)) + 'px'; });
        tickLabels
                .each(vizObj.d3.util.text())
            .transition()
                .duration(isAnim ? 0 : 1000)
                .style('top', function(d) { return (yAxisPos - newYScale(d)) + 'px'; });
        tickLabels
            .exit()
                .remove();
    }
}, null, 'socrataChart', [ 'd3_base', 'd3_base_dynamic' ]);

})(jQuery);