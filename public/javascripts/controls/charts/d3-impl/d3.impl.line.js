(function($)
{

var d3ns = blist.namespace.fetch('blist.d3');

$.Control.registerMixin('d3_impl_line', {

    getOrientation: function()
    {
        return 'right';
    },

    // call this if the active set of data has changed
    _renderData: function(data)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            defaults = vizObj.defaults,
            valueColumns = vizObj.getValueColumns(),
            $chartArea = cc.$chartArea,
            view = vizObj._primaryView,
            lineType = vizObj._chartType,
            explicitMin = cc.yAxis.min,
            explicitMax = cc.yAxis.max;

        // figure out how far out our value axis line is
        var yAxisPos = vizObj._yAxisPos();

        // set up our scales. oldYScale is used to init bars so they appear
        // in the old spot and transitions are less jarring.
        var newYScale = vizObj._currentYScale();
        var oldYScale = cc.yScale || newYScale;

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var col = colDef.column,
                notNull = function(row)
                    { return !($.isBlank(row[col.lookup]) || row.invalid[col.lookup])
                            && (_.isNaN(explicitMin) || row[col.lookup] >= explicitMin)
                            && (_.isNaN(explicitMax) || row[col.lookup] <= explicitMax); };

            // figure out what data we can actually render
            var presentData = _.select(data, notNull) || [];

            var oldLine = d3.svg[lineType]().x(vizObj._xDatumPosition(seriesIndex))
                                            .y(vizObj._yDatumPosition(col.lookup, oldYScale))
                                            .defined(notNull);
            var newLine = d3.svg[lineType]().x(vizObj._xDatumPosition(seriesIndex))
                                            .y(vizObj._yDatumPosition(col.lookup, newYScale))
                                            .defined(notNull);
            if (lineType == 'area')
            {
                var zeroPoint = {}; zeroPoint[col.lookup] = 0;
                // Subtract 1 to avoid overlap with the zero line.
                oldLine.y0(vizObj._yDatumPosition(col.lookup, oldYScale)(zeroPoint) - 1);
                newLine.y0(vizObj._yDatumPosition(col.lookup, newYScale)(zeroPoint) - 1);
            }

            // Render the line that connects the dots.
            if (!cc.seriesPath)
            { cc.seriesPath = {}; }
            if (!cc.seriesPath[col.lookup])
            {
                cc.seriesPath[col.lookup] = cc.chartD3.append('path')
                    .classed('dataPath_series' + col.lookup, true);
            }

            // Easter eggs
            var interpolation = $.urlParam(window.location.href, 'interpolate')
                                || $.urlParam(window.location.href, 'i')
                                || (vizObj._displayFormat.smoothLine ? 'cardinal' : 'linear');
            var tension = $.urlParam(window.location.href, 'tension')
                          || $.urlParam(window.location.href, 't')
                          || 0.9;
            oldLine.interpolate(interpolation).tension(tension);
            newLine.interpolate(interpolation).tension(tension);

            cc.seriesPath[col.lookup]
                .classed('hide', vizObj._displayFormat.lineSize === '0')
                .attr('stroke', function() { return colDef.color; })
                .attr('stroke-width', 2)
                .datum(data)
                .attr('d', oldLine);

            if (lineType == 'area')
            {
                cc.seriesPath[col.lookup].attr('fill', colDef.color)
                                         .attr('fill-opacity', 0.8);
            }

            cc.seriesPath[col.lookup]
                .transition()
                    .duration(1000)
                    .attr('d', newLine)

            // render our actual bars
            var seriesClass = 'dataBar_series' + col.lookup;
            var bars = cc.chartD3.selectAll('.' + seriesClass)
                .data(presentData, function(row) { return row.id; });
            bars
                .enter().append('circle')
                    .classed('dataBar', true)
                    .classed(seriesClass, true)
                    .classed('hide', vizObj._displayFormat.pointSize === '0')
                    .attr('stroke', '#fff')
                    .attr('fill', function(d) { return d.color || colDef.color; })

                    .attr('cx', vizObj._xDatumPosition(seriesIndex))
                    .attr('cy', vizObj._yDatumPosition(col.lookup, oldYScale))
                    .attr('r', 5)

                    .each(function() { this.__dataColumn = col; })

                    // don't mousey on dragging because event/renderspam breaks charts
                    // check for d because sometimes there's a race condition between unbind and remove
                    .on('mouseover', function(d)
                    {
                        var configs = vizObj._flyoutConfigurationOptions(d, colDef.column);
                        vizObj.handleDataMouseOver(this, colDef.column, d, configs, !cc._isDragging);
                    })
                    .on('mouseout', function(d)
                    {
                        vizObj.handleDataMouseOut(this);
                    })
                    .on('click', function(d)
                    {
                        if ($.isBlank(d)) { return; }
                        if ($.subKeyDefined(vizObj._primaryView, 'highlightTypes.select.' + d.id))
                        {
                            vizObj._primaryView.unhighlightRows(d, 'select');
                            vizObj.$dom().trigger('display_row', [{row: null}]);
                        }
                        else
                        {
                            vizObj._primaryView.highlightRows(d, 'select',  col);
                            vizObj.$dom().trigger('display_row', [{row: d}]);
                        }
                    });

            bars
                    .attr('fill', vizObj._d3_colorizeRow(colDef))
                    .each(function(d)
                    {
                        // kill tip if not highlighted. need to check here because
                        // unhighlight gets spammed when the grid gets stuck in weird
                        // states (really a grid bug workaround)
                        if (this.tip && (!view.highlights || !view.highlights[d.id]))
                        {
                            this.tip.destroy();
                            delete this.tip;
                        }
                    })
                .transition()
                    .duration(1000)
                    .attr('cy', vizObj._yDatumPosition(col.lookup, newYScale))
            bars
                .exit()
                    .each(function(d)
                    {
                        if (this.tip)
                        {
                            this.tip.destroy();
                            delete this.tip;
                        }
                    })
                // need to call transition() here as it accounts for the animation ticks;
                // otherwise you get npe's
                .transition()
                    .remove();

            if (vizObj._displayFormat.dataLabels === true)
            {
                var dataLabels = cc.chartD3.selectAll('.dataLabel')
                    .data(data, function(row) { return row.id; });
                dataLabels
                    .enter().append('text')
                        .classed('dataLabel', true)
                        .attr({ 'font-size': 13,
                                'text-anchor': 'middle' })
                dataLabels
                        .attr('font-weight', function(d)
                                { return (view.highlights && view.highlights[d.id]) ? 'bold' : 'normal'; })
                        .text(function(d)
                        {
                            return col.renderType.renderer(d[col.lookup], col, true, null, null, true);
                        });
                dataLabels
                    .attr('x', vizObj._xDatumPosition(seriesIndex))
                    .attr('y', function(d, i)
                    {
                        var yPos = vizObj._yDatumPosition(col.lookup, newYScale)(d),
                            before = (data[i-1] || {})[col.lookup],
                            after = (data[i+1] || {})[col.lookup],
                            datum = d[col.lookup];

                        var tangent = 0;
                        if (before) { tangent += before < datum ? 1 : -1; }
                        if (after) { tangent -= after < datum ? 1 : -1; }

                        if (tangent === 0)
                        { return yPos + (before < datum ? -13 : 13); }
                        else
                        { return yPos + (tangent/tangent * 13); }
                    });
                dataLabels
                    .exit()
                    .transition()
                        .remove();
            }

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
                        'text-anchor': cc.orientation == 'right' ? 'start' : 'end',
                        'font-size': 13 })
                // TODO: make a transform-builder rather than doing this concat
                // 10 is to bump the text off from the actual axis
                .attr('transform', vizObj._labelTransform());
        rowLabels
                .attr('font-weight', function(d)
                        { return (view.highlights && view.highlights[d.id]) ? 'bold' : 'normal'; })
                .text(function(d)
                {
                    var fixedColumn = vizObj._fixedColumns[0]; // WHY IS THIS AN ARRAY

                    if ($.isBlank(fixedColumn)) { return d.index; }
                    // render plaintext representation of the data
                    return fixedColumn.renderType.renderer(d[fixedColumn.lookup], fixedColumn, true, null, null, true);
                });
        rowLabels
            .exit()
            .transition()
                .remove();

        // render error markers if applicable
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
                .attr('transform', vizObj._errorBarTransform())
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
            cc = vizObj._chartConfig,
            data = cc.currentData,
            yScale = vizObj._currentYScale(),
            yAxisPos = vizObj._yAxisPos();

        cc.chartD3.selectAll('.dataBar')
            .transition()
                .duration(1000)
                .attr('cy', vizObj._yDatumPosition(function() { return this.__dataColumn.lookup; }, yScale))

        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());

        vizObj._renderTicks(yScale, yScale, false);
        vizObj._renderValueMarkers(yScale, yScale, false);
    },

    // call this if spacings/widths changed
    _rerenderPositions: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            valueColumns = vizObj.getValueColumns(),
            yAxisPos = vizObj._yAxisPos();

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var dataBars = cc.chartD3.selectAll('.dataBar_series' + colDef.column.lookup)
                    .attr('cx', vizObj._xDatumPosition(seriesIndex));
        });
        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());
    },

    // Line charts always have series on the same vertical.
    _getDatumCountPerGroup: function()
    {
        return 1;
    },

    _calculateRowWidth: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            valueColumns = vizObj.getValueColumns();

        return cc.barWidth + cc.barSpacing + cc.rowSpacing;
    },

    // Ignore the bar chart staggering since dots can have the same x position.
    _xDatumPosition: function(seriesIndex)
    {
        var vizObj = this,
            cc = this._chartConfig;

        var staticParts = cc.sidePadding - 0.5 - cc.drawElementPosition - cc.dataOffset
                          + (cc.barWidth / 2);

        return function(d)
        {
            return staticParts + (d.index * cc.rowWidth);
        };
    },

    // Override to calculate negative positions correctly.
    _yDatumPosition: function(colId, yScale)
    {
        var yAxisPos = this._yAxisPos();
        var isFunction = _.isFunction(colId);

        // Orientation is always right.
        return function(d)
            {
                return yAxisPos -
                       yScale(d[isFunction ? colId.call(this) : colId])
                       + 0.5;
            };
    },

    _errorBarTransform: function()
    {
        var cc = this._chartConfig;

        var xPosition = cc.sidePadding - 0.5 -
                        cc.drawElementPosition - cc.dataOffset +
                        (cc.barWidth / 2);

        var transform = cc.dataDim.asScreenCoordinate(xPosition, 0);

        return function(d)
        {
            return 't' + transform.x + ',' + transform.y;
        };
    }

}, null, 'socrataChart', [ 'd3_virt_scrolling', 'd3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);
