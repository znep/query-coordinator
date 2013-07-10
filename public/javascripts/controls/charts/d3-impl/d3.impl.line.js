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
            lineType = vizObj._chartType;

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
                    { return !($.isBlank(row[col.lookup]) || row.invalid[col.lookup]); };

            var xDatumPositionForSeries = vizObj._xDatumPosition(seriesIndex);

            var pointInView = function(d)
            {
                var xPos = xDatumPositionForSeries(d);

                return vizObj._isXRangeInViewport(xPos, xPos);
            };

            var lineSegmentInView = function(d, i, list)
            {
                var prev = (i > 0) ? list[i-1] : undefined;
                var next = (i < list.length - 1) ? list[i+1] : undefined;

                var result = pointInView(d);

                // Consider the prev and next points as well. If either are visible, we're visible too.
                result |= prev && pointInView(prev);
                result |= next && pointInView(next);

                return result;
            };

            // figure out what data we can actually render
            var visibleData = _.select(data, lineSegmentInView);
            var notNullData = _.select(visibleData, notNull);

            var oldLine = vizObj._constructSeriesPath(colDef, seriesIndex, oldYScale);
            var newLine = vizObj._constructSeriesPath(colDef, seriesIndex, newYScale);

            // Render the line that connects the dots.
            if (!cc.seriesPath)
            { cc.seriesPath = {}; }
            if (!cc.seriesPath[col.lookup])
            {
                cc.seriesPath[col.lookup] = cc.chartD3.append('path')
                    .classed('dataPath_series' + col.lookup, true);
            }

            cc.seriesPath[col.lookup]
                .classed('hide', vizObj._displayFormat.lineSize === '0')
                .attr('stroke', function() { return colDef.color; })
                .attr('stroke-width', 2)
                .datum(_.sortBy(visibleData, 'index'))
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

            // render our actual lines
            var seriesClass = 'dataBar_series' + col.lookup;
            var lines = cc.chartD3.selectAll('.' + seriesClass)
                .data(notNullData, function(row) { return row.id; });
            lines
                .enter().append('circle')
                    .classed('dataBar', true)
                    .classed(seriesClass, true)
                    .classed('hide', vizObj._displayFormat.pointSize === '0')
                    .attr('stroke', '#fff')
                    .attr('fill', function(d) { return d.color || colDef.color; })

                    .attr('cx', xDatumPositionForSeries)
                    .attr('cy', vizObj._yDatumPosition(col.lookup, oldYScale))
                    .attr('r', 5)

                    .each(function() { this.__dataColumn = col; })

                    // don't mousey on dragging because event/renderspam breaks charts
                    // check for d because sometimes there's a race condition between unbind and remove
                    .on('mouseover', function(d)
                    {
                        if (!vizObj._chartInitialized) { return; }
                        var configs = vizObj._flyoutConfigurationOptions(d, colDef.column);
                        vizObj.handleDataMouseOver(this, colDef, d, configs, !cc._isDragging);
                    })
                    .on('mouseout', function(d)
                    {
                        if (!vizObj._chartInitialized) { return; }
                        vizObj.handleDataMouseOut(this);
                    })
                    .on('click', function(d)
                    {
                        if (!vizObj._chartInitialized) { return; }
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

            lines
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
            lines
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
                    .data(notNullData, function(row) { return row.id; });
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
                    .attr('x', xDatumPositionForSeries)
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

        vizObj._renderRowLabels(data);

        // render error markers if applicable
        if ($.subKeyDefined(vizObj, '_displayFormat.plot.errorBarLow'))
        {
            var errorTransform = vizObj._errorBarTransform();
            var errorMarkers = cc.chartD3.selectAll('.errorMarker')
                .data(_.filter(data, errorTransform.isInView), function(row) { return row.id; });
            errorMarkers
                .enter().append('path')
                    .classed('errorMarker', true)
                    .attr({ stroke: vizObj._displayFormat.errorBarColor || '#ff0000',
                            'stroke-width': '3' })
                    .attr('d', vizObj._errorBarPath(oldYScale));
            errorMarkers
                .attr('transform', errorTransform)
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

    _constructSeriesPath: function(colDef, seriesIndex, yScale)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            lineType = vizObj._chartType,
            col = colDef.column,
            notNull = function(row)
                { return !($.isBlank(row[col.lookup]) || row.invalid[col.lookup]); };

        var line = d3.svg[lineType]().x(vizObj._xDatumPosition(seriesIndex))
                                     .y(vizObj._yDatumPosition(col.lookup, yScale))
                                     .defined(notNull);

        if (lineType == 'area')
        {
            var zeroPoint = {}; zeroPoint[col.lookup] = 0;
            // Subtract 1 to avoid overlap with the zero line.
            line.y0(vizObj._yDatumPosition(col.lookup, yScale)(zeroPoint) - 1);
        }

        // Easter eggs
        var interpolation = $.urlParam(window.location.href, 'interpolate')
                            || $.urlParam(window.location.href, 'i')
                            || (vizObj._displayFormat.smoothLine ? 'cardinal' : 'linear');
        var tension = $.urlParam(window.location.href, 'tension')
                      || $.urlParam(window.location.href, 't')
                      || 0.9;
        line.interpolate(interpolation).tension(tension);

        return line;
    },

    _currentYScale: function()
    {
        return this._super().clamp(false);
    },

    // call this if the yAxisPos has changed
    // you'll also need to call _renderData to make the dataBars the correct height
    _rerenderAxis: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            yScale = vizObj._currentYScale(),
            yAxisPos = vizObj._yAxisPos();

        cc.chartD3.selectAll('.dataBar')
            .transition()
                .duration(1000)
                .attr('cy', vizObj._yDatumPosition(function() { return this.__dataColumn.lookup; }, yScale))

        _.each(vizObj.getValueColumns(), function(colDef, seriesIndex)
        {
            cc.seriesPath[colDef.column.lookup]
                .transition()
                    .duration(1000)
                    .attr('d', vizObj._constructSeriesPath(colDef, seriesIndex, yScale));
        });

        if ($.subKeyDefined(vizObj, '_displayFormat.plot.errorBarLow'))
        {
            cc.chartD3.selectAll('.errorMarker')
                .attr('transform', vizObj._errorBarTransform())
                .transition()
                    .duration(1000)
                    .attr('d', vizObj._errorBarPath(yScale));
        }

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
            yAxisPos = vizObj._yAxisPos(),
            yScale;

        try {
            yScale = vizObj._currentYScale();
        } catch(e) {}

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var dataBars = cc.chartD3.selectAll('.dataBar_series' + colDef.column.lookup)
                    .attr('cx', vizObj._xDatumPosition(seriesIndex));

            if (!_.isUndefined(yScale) && $.subKeyDefined(cc.seriesPath, colDef.column.lookup+''))
            { cc.seriesPath[colDef.column.lookup]
                    .attr('d', vizObj._constructSeriesPath(colDef, seriesIndex, yScale)); }
        });

        if ($.subKeyDefined(vizObj, '_displayFormat.plot.errorBarLow'))
        {
            cc.chartD3.selectAll('.errorMarker')
                .attr('transform', vizObj._errorBarTransform());
        }

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
            cc = vizObj._chartConfig;

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
        var vizObj = this,
            cc = this._chartConfig;

        var xPosition = cc.sidePadding - 0.5 -
                        cc.drawElementPosition - cc.dataOffset +
                        (cc.barWidth / 2);

        var offset = function(d)
        {
            return xPosition +  Math.floor(d.index * cc.rowWidth) + 0.5;
        };

        var isInView = function(d)
        {
            var xPos = offset(d);
            return vizObj._isXRangeInViewport(xPos - vizObj.defaults.errorBarCapWidth, xPos);
        };

        var transform = function(d)
        {
            var transform = cc.dataDim.asScreenCoordinate(offset(d), 0);
            return 't' + transform.x + ',' + transform.y;
        };

        transform.isInView = isInView;

        return transform;
    }

}, null, 'socrataChart', [ 'd3_virt_scrolling', 'd3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);
