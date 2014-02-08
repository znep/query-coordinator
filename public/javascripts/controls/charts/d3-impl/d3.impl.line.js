(function($)
{

var d3ns = blist.namespace.fetch('blist.d3');

$.Control.registerMixin('d3_impl_line', {

    initializeVisualization: function()
    {
        this._super();

        if (this._chartType == 'area')
        {
            this._chartConfig.lockYAxisAtZero = true;
        }
    },

    getOrientation: function()
    {
        return 'right';
    },

    _computeClippingRectForColumnAndScale: function(col, scale, xDatumPositionForSeries, lastIndex)
    {
        var rangeY = scale.range();
        var rangeYMagnitude = rangeY[1] - rangeY[0];

        var cc = this._chartConfig;
        var chartContainerWidth = cc.$chartOuterContainer.width();
        var leftEdge = Math.max(0, cc.scrollPos - cc.drawElementPosition - this.defaults.sidePaddingBounds[0]/2 - chartContainerWidth);

        // Account for the extra space we render above the top of the range.
        // Remember _yDatumPosition returns values in screen space, so
        // 0 is the top of the chart, and higher values go down.
        var dummy = { data: {} };
        dummy.data[col.lookup] = scale.domain()[1];
        rangeYMagnitude += this._yDatumPosition(col.lookup, scale)(dummy);

        rangeYMagnitude = Math.max(0, rangeYMagnitude);

        return [ leftEdge, 0, leftEdge + chartContainerWidth * 2, rangeYMagnitude];
    },

    // FIXME: This trifecta of rendereres (renderAxis, rerenderPositions, and renderData)
    // have grown into a terrible beast of duplicated code. It needs refactoring, as we have
    // probably many extant bugs where we forget to update certain attributes in some subset
    // of renderers, or accidentally use slightly different logic. The first place to start
    // would be to factor out how we animate between old and new scalings. Then we can worry
    // about extracting some subset of common rendering without sacrificing performance too
    // much.
    // Same goes for the analogs in d3.impl.bar.


    // Couple animation errata. If we get a new renderData with real data present
    // in the middle of an animation, our points will have an irregularity at
    // the seam between data batches for the duration of the animation. This is
    // because we don't know what the instantaneous y scale is in the middle
    // of an animation. I'm not sure how to fix this other than mad crazy hacks
    // involving doing manual interpolation of yScales. Maybe we can do this later;
    // for now it's not terrible looking because of the length of the animations.

    // call this if the active set of data has changed
    _renderData: function(data, ignored, didInsertData)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            defaults = vizObj.defaults,
            valueColumns = vizObj.getValueColumns(),
            $chartArea = cc.$chartArea,
            view = vizObj._primaryView,
            lineType = vizObj._lineType();

        var allowTransitions = !vizObj._transitionExitWorkaroundActive();
        var doAnimation = (didInsertData === true) && allowTransitions;

        // figure out how far out our value axis line is
        var yAxisPos = vizObj._yAxisPos();

        // set up our scales. oldYScale is used to init bars so they appear
        // in the old spot and transitions are less jarring.
        var newYScale = vizObj._currentYScale();
        var oldYScale = vizObj._lastYScale() || newYScale;

        var commitYScale = _.once(function(){ newYScale.commit() });

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var col = colDef.column,
                notNull = function(row)
                    { return !($.isBlank(row.data[col.lookup]) || row.invalid[col.lookup]); };

            var xDatumPositionForSeries = vizObj._xDatumPosition(seriesIndex);

            var pointInView = function(d)
            {
                var xPos = xDatumPositionForSeries(d);

                return vizObj._isXRangeInViewport(xPos, xPos);
            };

            // Critical invariant: This should be true for _one_ contiguous chunk
            // of data, oterwise the _sortBy on data below will not yield expected
            // values and you'll get modern art instead of a chart.
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

            var oldLine;
            if (doAnimation)
            {
                oldLine = vizObj._constructSeriesPath(colDef, seriesIndex, oldYScale);
            }

            var newLine = vizObj._constructSeriesPath(colDef, seriesIndex, newYScale);

            // Compute a clipping rect for the series.
            var clipRect = vizObj._computeClippingRectForColumnAndScale(col, newYScale, xDatumPositionForSeries, data.length - 1);

            // Render the line that connects the dots.
            if (!cc.seriesPath)
            { cc.seriesPath = {}; }
            if (!cc.seriesPath[col.lookup])
            {
                cc.seriesPath[col.lookup] = cc.chartD3.append('path')
                    .classed('dataPath_series' + col.lookup, true);
            }

            var lineData;

            // For legacy DSG lines, connect all the dots.
            if (vizObj._seriesGrouping)
            { lineData = _.sortBy(notNullData, 'index'); }
            else
            { lineData = _.sortBy(visibleData, 'index'); }

            var hideLine = function(type)
            {
                if (lineType == 'none') { return true; }
                var doHide = vizObj._displayFormat.lineSize === '0';
                if (type == 'class')
                { return lineType == 'line' && doHide; }
                else if (type == 'stroke-width')
                { return (lineType == 'area' && doHide) ? 0 : 2; }
            }

            cc.seriesPath[col.lookup]
                .classed('hide', hideLine('class'))
                .attr('stroke', vizObj._d3_getColor(colDef))
                .attr('stroke-width', hideLine('stroke-width'))
                .attr('clip-rect', clipRect.join(' '))
                .datum(lineData)
                .attr('d', doAnimation ? oldLine : newLine);

            if (lineType == 'area')
            {
                cc.seriesPath[col.lookup].attr('fill', vizObj._d3_getColor(colDef))
                                         .attr('fill-opacity', 0.8);
            }

            if (doAnimation)
            {
                cc.seriesPath[col.lookup]
                    .transition()
                        .duration(vizObj._animationLengthMillisec)
                        .attr('d', newLine)
                        .each('end', commitYScale);
            }

            // render our dots
            var seriesClass = 'dataBar_series' + col.lookup;

            var newYPosition = vizObj._yDatumPosition(col.lookup, newYScale);

            var points = cc.chartD3.selectAll('.' + seriesClass)
                .data(notNullData, function(row) { return row.id; });

            points
                .enter().append('circle')
                    .classed('dataBar', true)
                    .classed(seriesClass, true)
                    .attr('stroke', '#fff')

                    .attr('cx', xDatumPositionForSeries)
                    .attr('cy', vizObj._yDatumPosition(col.lookup, doAnimation ? oldYScale : newYScale))

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
                        vizObj.handleDataMouseOut(this, 10);
                    })
                    .on('click', function(d)
                    {
                        if (!vizObj._chartInitialized) { return; }
                        if ($.isBlank(d)) { return; }

                        vizObj.handleDataClick(this, d, colDef);
                    });

            points
                    .attr('fill', vizObj._d3_colorizeRow(colDef))
                    .attr('r', vizObj._sizifyRow(colDef))
                    .classed('hide', function(d)
                    {
                        var pos = newYPosition(d);
                        return pos > clipRect[3] || pos < 0 ||
                               vizObj._displayFormat.pointSize === '0';
                    })
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
                    });

            (doAnimation ? points.transition().duration(vizObj._animationLengthMillisec) : points)
                .attr('cx', xDatumPositionForSeries)
                .attr('cy', newYPosition);

            points
                .exit()
                    .each(function()
                    {
                        vizObj.handleDataLeaveDOM(this);
                    });
            if (allowTransitions)
            {
                points.exit()
                    .transition()
                        .remove();
            }
            else
            {
                points.exit().remove();
            }

            if (vizObj._displayFormat.dataLabels === true)
            {
                var labelSeriesClass = 'dataLabel_series' + col.lookup;
                var dataLabels = cc.chartD3.selectAll('.'+labelSeriesClass)
                    .data(notNullData, function(row) { return row.id; });
                dataLabels
                    .enter().append('text')
                        .classed('dataLabel', true)
                        .classed(labelSeriesClass, true)
                        .attr({ 'font-size': 13,
                                'text-anchor': 'middle' })
                dataLabels
                    .attr('fill', vizObj._d3_colorizeRow(colDef))
                    .attr('font-weight', function(d)
                            { return (view.highlights && view.highlights[d.id]) ? 'bold' : 'normal'; })
                    .text(function(d)
                    {
                        var column = col.renderType ? col : col.realValueColumn.column;
                        return column.renderType.renderer(d.data[col.lookup], column, true, null, null, true);
                    })
                    .attr('x', xDatumPositionForSeries)
                    .attr('y', function(d, i)
                    {
                        var yPos = vizObj._yDatumPosition(col.lookup, newYScale)(d),
                            axisDelta = yAxisPos - yPos,
                            before = (data[i-1] || {data:{}}).data[col.lookup],
                            after = (data[i+1] || {data:{}}).data[col.lookup],
                            datum = d.data[col.lookup];

                        var tangent = 0;
                        if (before) { tangent += before < datum ? 1 : -1; }
                        if (after) { tangent -= after < datum ? 1 : -1; }
                        if (axisDelta >= -0.5 && axisDelta < 15) { tangent = -1; }
                        else if (axisDelta < -0.5 && axisDelta > -15) { tangent = 1; }

                        if (tangent === 0)
                        { return yPos + (before < datum ? -13 : 13); }
                        else
                        { return yPos + (Math.abs(tangent)/tangent * 13); }
                    });
                dataLabels
                    .exit()
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
                    .attr('d', vizObj._errorBarPath(doAnimation ? oldYScale : newYScale));
            errorMarkers
                .attr('transform', errorTransform)
                .transition()
                    .duration(vizObj._animationLengthMillisec)
                    .attr('d', vizObj._errorBarPath(newYScale));
            errorMarkers
                .exit()
                    .remove();
        }

        vizObj._renderTicks(doAnimation ? oldYScale : newYScale, newYScale, doAnimation);
        vizObj._renderValueMarkers(vizObj._computeValueMarkers(), doAnimation ? oldYScale : newYScale, newYScale, doAnimation);

        if (!doAnimation)
        {
            // In the animation case, we'll commit after the animation ends.
            commitYScale();
        }
    },

    _sizifyRow: function(colDef)
    {
        return 5;
    },

    _constructSeriesPath: function(colDef, seriesIndex, yScale)
    {
        var vizObj = this,
            lineType = vizObj._lineType(),
            col = colDef.column,
            notNull = function(row)
                { return !($.isBlank(row.data[col.lookup]) || row.invalid[col.lookup]); };

        if (lineType == 'none') { return; }

        var yPosition = vizObj._yDatumPosition(col.lookup, yScale);

        var line = d3.svg[lineType]().x(vizObj._xDatumPosition(seriesIndex))
                                     .y(yPosition)
                                     .defined(notNull);

        if (lineType == 'area')
        {
            var zeroPoint = { data: {} }; zeroPoint.data[col.lookup] = 0;
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

        // Why can't we just have D3 handle the transition for us? Well, because
        // of the way our coordinate system works, the animation will be in the
        // wrong direction.
        // Think of it this way. Someone shrinks the chart vertically by resizing
        // the browser.
        // Since our data points have their origin at the top-left of the chart,
        // the points will appear to sit still on the screen. Then the transition
        // kicks in, and they move UP instead of DOWN, which is the opposite of
        // what you'd expect for a shrinking yScale. So we have to do this horrible
        // hack of remembering our old yScale. Of course this introduces problems
        // if many transitions are started (say you're resizing the window over
        // several seconds). So we need to figure out what the current position
        // of the points are and account for that...
        // The same deal of unhappiness happens for the series path.
        var oldYScale = vizObj._lastYScale() || yScale;
        var oldYPos = vizObj._yDatumPosition(function() { return this.__dataColumn.lookup; }, oldYScale);
        var yPos = vizObj._yDatumPosition(function() { return this.__dataColumn.lookup; }, yScale);

        cc.chartD3.selectAll('.dataBar')
            .attr('cy', oldYPos)
            .transition()
                .duration(vizObj._animationLengthMillisec)
                .attr('cy', yPos)
                .each('end', _.once(function(){ yScale.commit() }));

        _.each(vizObj.getValueColumns(), function(colDef, seriesIndex)
        {
            var oldClipRect = vizObj._computeClippingRectForColumnAndScale(colDef.column, oldYScale, vizObj._xDatumPosition(seriesIndex), vizObj._currentRangeData.length - 1);
            var clipRect = vizObj._computeClippingRectForColumnAndScale(colDef.column, yScale, vizObj._xDatumPosition(seriesIndex), vizObj._currentRangeData.length - 1);

            cc.seriesPath[colDef.column.lookup]
                .attr('d', vizObj._constructSeriesPath(colDef, seriesIndex, oldYScale))
                .attr('clip-rect', oldClipRect.join(' '))
                .transition()
                    .duration(vizObj._animationLengthMillisec)
                        .attr('clip-rect', clipRect.join(' '))
                        .attr('d', vizObj._constructSeriesPath(colDef, seriesIndex, yScale));

        });

        if ($.subKeyDefined(vizObj, '_displayFormat.plot.errorBarLow'))
        {
            cc.chartD3.selectAll('.errorMarker')
                .attr('transform', vizObj._errorBarTransform())
                .transition()
                    .duration(vizObj._animationLengthMillisec)
                    .attr('d', vizObj._errorBarPath(yScale));
        }

        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());

        vizObj._renderTicks(oldYScale, yScale, true);
        vizObj._renderValueMarkers(vizObj._computeValueMarkers(), oldYScale, yScale, true);
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
            // Annoyingly, since the series line is pretty much an opaque blob
            // we can't easily separate out X and y components and animate them
            // separately. So we choose to animate the Y over the X (notice that
            // _constructSeriesPath takes a yScale and not an xScale). This means
            // that we must not transition the data points' x coordinate here.
            // Bummer. At least not animating X makes the site feel more
            // responsive when the sidebar pops out.

            var dataBars = cc.chartD3.selectAll('.dataBar_series' + colDef.column.lookup)
                //.transition() See comment above for why this is disabled.
                //    .duration(vizObj._animationLengthMillisec)
                        .attr('cx', vizObj._xDatumPosition(seriesIndex));

            if (!_.isUndefined(yScale))
            {
                dataBars
                    .transition()
                    .duration(vizObj._animationLengthMillisec)
                        .attr('cy', vizObj._yDatumPosition(function() { return this.__dataColumn.lookup; }, yScale))
                        .each('end', _.once(function(){ yScale.commit() }));

                if ($.subKeyDefined(cc.seriesPath, colDef.column.lookup+''))
                {
                    var clipRect = vizObj._computeClippingRectForColumnAndScale(colDef.column, yScale, vizObj._xDatumPosition(seriesIndex), vizObj._currentRangeData.length - 1);

                    cc.seriesPath[colDef.column.lookup]
                        .transition()
                            .duration(vizObj._animationLengthMillisec)
                                .attr('clip-rect', clipRect.join(' '))
                                .attr('d', vizObj._constructSeriesPath(colDef, seriesIndex, yScale));
                }
            }
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
            if (!vizObj._chartInitialized) { return 0; }
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
                       yScale(d.data[isFunction ? colId.call(this) : colId])
                       + 0.5;
            };
    },

    _errorBarTransform: function()
    {
        var vizObj = this,
            cc = this._chartConfig;

        if (!vizObj._chartInitialized) { return 't0,0'; }

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
