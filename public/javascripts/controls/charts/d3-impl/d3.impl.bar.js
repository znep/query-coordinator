// future improvements:
// * make chartArea margins more like named filters rather than depending on css
// * make d3 element rendering more like composing functions; create an object that contains
//   the create/update/remove components of a selection, have a small army of functions that
//   operate on those objects. Makes the different kinds of rerenders less stupid to manage.
// * kill seriesgrouping and remove its weird timing and oo injection hacks
// * possible major perf boost out of moving bar rendering back into an html div-based solution.
//   i tried to do this at one point but ran into z-index issues with error markers. now that
//   there is the canonical chartRenderArea to render html components in, it should be possible
//   to try it again.
// * if ie8 support is ever dropped, i had a working prototype with absolutely no svg at all;
//   just use css rotation for the text labels. you can wrangle divs into being value markers too.

(function($)
{

var d3ns = blist.namespace.fetch('blist.d3');

$.Control.registerMixin('d3_impl_bar', {

    initializeVisualization: function()
    {
        this._super();

        var vizObj = this,
            cc = vizObj._chartConfig,
            barType = vizObj._chartType;

        if (barType.startsWith('stacked'))
        {
            cc.collapseXSeries = true;
            cc.stackYSeries = true;
        }
        else
        {
            cc.collapseXSeries = false;
            cc.stackYSeries = false;
        }

        cc.lockYAxisAtZero = true;
    },

    // Computes separate positive and negative sums for a row given a set of columns.
    // Can optionally provide a column to stop after (relevantColumns is processed
    // left to right), and an evaluator function (takes (row, column, defaultEvaluator), returns value).
    // Default evaluator grabs the match value, or the raw value as fallback.
    // Returns an object of the following structure:
    // {
    //    negativeSum: The sum of all negative values.
    //    positiveSum: The sum of all positive values.
    //    hitLimitColumn: Whether or not we encountered the limit column (false if there is no limit column).
    // }
    _computeYLimitsForRow: function(row, relevantColumns, lastColumn, evaluator)
    {
        var defaultEvaluator = function(row, column)
        {
            return column.renderType.matchValue ?
                    column.renderType.matchValue(row.data[column.lookup]) :
                    row.data[column.lookup];
        };

        evaluator = evaluator || defaultEvaluator;
        return _.reduce(
            relevantColumns,
            function(memo, currentReduceCol, index)
            {
                if (!memo.hitLimitColumn)
                {
                    var value = evaluator(row, currentReduceCol, defaultEvaluator);

                    if (value > 0)
                    {
                        memo.positiveSum += value;
                    }
                    else
                    {
                        memo.negativeSum += value;
                    }

                    memo.hitLimitColumn = (currentReduceCol.lookup == lastColumn);
                }

                return memo;

            }, {negativeSum: 0, positiveSum: 0, hitLimitColumn: false});
    },

    _computeYValuesForRow: function(row, relevantColumns)
    {
        if (this._chartConfig.stackYSeries)
        {
            // Each stacked column is actually two columns in one. One column
            // for the positive values, the other for the negative ones.
            // Exclude the error bars from the sum; rather include them separately.

            var plot, errorLow, errorHigh, errorBarLowVal, errorBarHighVal;
            if ($.subKeyDefined(this, '_displayFormat.plot.errorBarLow'))
            {
                plot = this._displayFormat.plot;
                errorHigh = plot.errorBarHigh;
                errorLow = plot.errorBarLow;
            }

            var limits = this._computeYLimitsForRow(
                row,
                relevantColumns,
                undefined, /* limit column */
                function(row, column, defaultEvaluator)
                {
                    var value = defaultEvaluator(row, column);
                    if (plot && column.fieldName == errorLow)
                    {
                        errorBarLowVal = value;
                        return 0;
                    }
                    else if (plot && column.fieldName == errorHigh)
                    {
                        errorBarHighVal = value;
                        return 0;
                    }
                    else
                    {
                        return value;
                    }
                }
                );

            var ret = [ limits.positiveSum, limits.negativeSum ];
            if (plot) { ret = ret.concat([errorBarLowVal, errorBarHighVal]); }
            return ret;
        }
        else
        {
            return this._super.apply(this, arguments);
        }
    },

    // This tells the sizing algorithm that we won't be placing any columns
    // side-by-side at all.
    _getDatumCountPerGroup: function()
    {
        var cc = this._chartConfig,
            valueColumns = this.getValueColumns();
        return $.isBlank(valueColumns) ?
            0 :
            (cc.collapseXSeries ? 1 : this._super());
    },

    _calculateRowWidth: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var effectiveColumnCount = vizObj._getDatumCountPerGroup();

        return (cc.barWidth * effectiveColumnCount) +
               (cc.barSpacing * (effectiveColumnCount - 1)) +
                cc.rowSpacing;
    },

    _xDatumPosition: function(seriesIndex)
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var staticParts = cc.sidePadding - 0.5 - cc.drawElementPosition - cc.dataOffset;

        if (!cc.collapseXSeries)
        {
            staticParts += seriesIndex * (cc.barWidth + cc.barSpacing);
        }

        return function(d)
        {
            if (!vizObj._chartInitialized) { return 0; }

            return staticParts + (d.index * cc.rowWidth);
        };
    },

    _yDatumPosition: function(colId, yScale, forceUnclipped)
    {
        var vizObj = this;
        var yAxisPos = vizObj._yAxisPos();
        var isFunction = _.isFunction(colId);
        var cc = vizObj._chartConfig;

        // For stacked, our y-axis isn't clipped for us. We'll try to clip
        // ourselves, if forceUnclipped isn't true.

        return function(d)
        {
            if (!vizObj._chartInitialized) { return 0; }

            var columnId = isFunction ? colId.call(this) : colId;
            var columnValue = d.data[columnId];

            var thisDatumPosition = vizObj._chartConfig.dataDim.pluckY(
                function(value)
                {
                    // I'd love some better math for this. Basically we're stuck
                    // with a bar with its left edge at the baseline, and it's up to
                    // us to move the correct edge to the zero baseline, depending
                    // on the bar's polarity.
                    // Why? Because SVG doesn't like negative rect widths :/

                    var val = 0;
                    if (forceUnclipped)
                    {
                        val = yScale(value);
                    }
                    else
                    {
                        var domain = yScale.domain();
                        val = yScale(Math.min(Math.max(value, domain[0]), domain[1]));
                    }

                    return (value < 0) ? val : yScale(0);
                },
                function(value)
                {
                    if (forceUnclipped)
                    {
                        value = Math.max(0, value);
                    }
                    else
                    {
                        var domain = yScale.domain();
                        value = Math.min(Math.max(Math.max(0, value), domain[0]), domain[1]);
                    }

                    return -yScale(value) + 0.5;
                });

            if (cc.stackYSeries)
            {
                // Now this is fun. If our value is positive and we're in
                // orientation=right, fine, sum up all the values up to and
                // including us. However, negative values require summing up
                // all the values up to and NOT including ourselves. Similar
                // deal with orientation=down, except the cases and signs are
                // reversed.
                // Also, don't forget that for stacked, our y-axis isn't clipped
                // for us.
                var limits = vizObj._computeYLimitsForRow(
                    d,
                    _.pluck(vizObj.getValueColumns(), 'column'),
                    columnId);
                var retVal;

                if (vizObj._chartConfig.dataDim.pluckY(columnValue < 0, columnValue >= 0))
                {
                    retVal = thisDatumPosition(
                        vizObj._chartConfig.dataDim.pluckY(limits.negativeSum, limits.positiveSum)) + yAxisPos;
                }
                else
                {
                    // Hard mode active
                    retVal = vizObj._chartConfig.dataDim.pluckY(
                        yAxisPos + yScale(limits.positiveSum - columnValue),
                        yAxisPos - yScale(limits.negativeSum - columnValue));

                    var range = forceUnclipped ? [-Infinity, Infinity ] : yScale.range();
                    var correction = columnValue >= 0 ? yAxisPos : -yAxisPos;
                    retVal = Math.max(Math.min(retVal, range[1] + yAxisPos), range[0] + correction);
                }


                return retVal;
            }
            else
            {
                return yAxisPos + thisDatumPosition(columnValue);
            }
        }
    },

    _yBarHeight: function(colId, yScale)
    {
        var vizObj = this;
        var cc = this._chartConfig;
        var yScaleZero = yScale(0);
        var isFunction = _.isFunction(colId);

        if (!vizObj._chartInitialized) { return 0; }

        // Yeah, so...
        // If we're not stacking, then the yScale is hard clipped to be within
        // the y-axis min and max. However, if we're stacking, yScale is not
        // clipped (to allow us to figure out the height of any stacked column).
        // So, we need to do some extra work in this case.
        if (cc.stackYSeries)
        {
            var cols = vizObj.getValueColumns();
            return function(row)
            {
                var col = isFunction ? colId.call(this) : colId;
                var normalResult = Math.abs(yScale(row.data[col]) - yScaleZero);

                // In this case, we need to make sure our bottom/left edge
                // doesn't go below the x axis or above the top of the chart.
                // This gets tricky.

                //TODO augh performance
                var myPosition = vizObj._yDatumPosition(col, yScale)(row);
                var unclippedPosition = vizObj._yDatumPosition(col, yScale, true /*forceUnclipped*/)(row);

                // Account for _yBarPosition not allowing a bar to go
                // left of/below the origin.
                var returnValue = normalResult;;
                returnValue -= myPosition - unclippedPosition;
                if (cc.orientation == 'right')
                {
                    // Prevent top edge from going past top of chart.
                    returnValue = Math.min(returnValue, Math.max(0, vizObj._yAxisPos() - myPosition));
                }
                else
                {
                    // Prevent RH edge from going past the right edge of the chart.
                    var absoluteMaxWidth = vizObj._yAxisPos() + yScale.range()[1] - myPosition;
                    returnValue =  Math.min(returnValue, absoluteMaxWidth);
                }

                return Math.max(0, returnValue);
            }
        }
        else
        {
            return function(d)
            {
                return Math.abs(yScale(d.data[isFunction ? colId.call(this) : colId]) - yScaleZero);
            };
        }
    },

    // Returns a translation along X for an error bar.
    _errorBarTransform: function()
    {
        var vizObj = this,
            cc = this._chartConfig;

        if (!vizObj._chartInitialized) { return 't0,0'; }

        var xPosition = cc.sidePadding - 0.5 -
                        cc.drawElementPosition - cc.dataOffset +
                        ((cc.rowWidth - cc.rowSpacing) / 2);

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
    },

    _currentYScale: function()
    {
        // For stacked arrangements, we can't clamp, otherwise it will freak out
        // calculations trying to get the canonical height of a bar. So in this case ONLY,
        // we don't clamp. Given the amount of proven math in the non-stacked case,
        // we're leaving non-stacked alone and clamped.

        var normalScale = this._super.apply(this, arguments);

        if (this._chartInitialized && this._chartConfig.stackYSeries)
        {
            return normalScale.clamp(false);
        }
        else
        {
            return normalScale;
        }
    },

    // call this if the active set of data has changed
    _renderData: function(data, ignored, didInsertData)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            defaults = vizObj.defaults,
            valueColumns = vizObj.getValueColumns(),
            $chartArea = cc.$chartArea,
            view = vizObj._primaryView;

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
            var col = colDef.column;

            var xDatumPositionForSeries = vizObj._xDatumPosition(seriesIndex);

            var barInView = function(d)
            {
                var xPos = xDatumPositionForSeries(d);
                return vizObj._isXRangeInViewport(xPos - cc.barWidth, xPos);
            };

            // figure out what data we can actually render
            var dataInView = _.filter(data, barInView);
            var splitData = _.groupBy(dataInView, function(row)
            {
                if (blist.feature_flags.hide_interpolated_nulls
                    && row.interpolated_null[col.lookup])
                {
                    return 'undefined';
                }
                else if ($.isBlank(row.data[col.lookup]) ||
                    row.invalid[col.lookup])
                {
                    return 'null';
                }
                else
                {
                    return 'present';
                }
            });
            var presentData = splitData['present'] || [], nullData = splitData['null'] || [];
            if (vizObj.debugEnabled)
            {
                if (!_.isEmpty(presentData))
                {
                    vizObj.debugOut('presentD idx: ' +
                                  _.first(presentData).index +
                                  '-' +
                                  _.last(presentData).index +
                                  ', count: ' +
                                  presentData.length);
                }
                else
                {
                    vizObj.debugOut('presentD(empty)');
                }
                vizObj.debugOut('nullD: ', nullData.length);
            }


            // render our actual bars
            var seriesClass = 'dataBar_series' + col.lookup;

            presentData = _.filter(presentData, barInView);
            // UPDATE
            var bars = cc.chartD3.selectAll('.' + seriesClass)
                .data(presentData, function(row) { return row.id; });

            // ENTER
            bars
                .enter().append('rect')
                    .classed('dataBar', true)
                    .classed(seriesClass, true)
                    .attr('stroke', '#fff')
                    .attr(cc.dataDim.width, cc.barWidth)
                    .attr(cc.dataDim.height, vizObj._yBarHeight(col.lookup, oldYScale))

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

            // ENTER + UPDATE
            bars
                    .attr('fill', vizObj._d3_colorizeRow(colDef))

                    // D3 won't re-execute these dynamic property values when
                    // our internal state changes, so we must re-set them here
                    // (as opposed to on enter only).
                    .attr(cc.dataDim.xAxis, xDatumPositionForSeries)
                    .attr(cc.dataDim.yAxis, vizObj._yDatumPosition(col.lookup, doAnimation ? oldYScale : newYScale))
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

                if (doAnimation)
                {
                    vizObj._barResizeInProgress(true);
                    bars
                        .transition()
                            .duration(vizObj._animationLengthMillisec)
                            .each('end', function()
                            {
                                commitYScale();
                                vizObj._barResizeInProgress(false);
                            })
                            .attr(cc.dataDim.yAxis, vizObj._yDatumPosition(col.lookup, newYScale))
                            .attr(cc.dataDim.height, vizObj._yBarHeight(col.lookup, newYScale));
                }
                else
                {
                    bars.attr(cc.dataDim.yAxis, vizObj._yDatumPosition(col.lookup, newYScale))
                        .attr(cc.dataDim.height, vizObj._yBarHeight(col.lookup, newYScale));
                }

            // EXIT
            bars
                .exit()
                    .each(function()
                    {
                        vizObj.handleDataLeaveDOM(this);
                    });

            if (allowTransitions)
            {
                bars.exit()
                    // need to call transition() here as it accounts for the animation ticks;
                    // otherwise you get npe's
                    .transition()
                        .remove();
            }
            else
            {
                bars.exit().remove();
            }

            // render null bars
            var nullSeriesClass = 'nullDataBar_series' + col.lookup;
            nullData = _.filter(nullData, barInView);

            var nullBars = cc.chartNullD3.selectAll('.' + nullSeriesClass)
                .data(nullData, function(row) { return row.id; });
            var height = cc.dataDim.pluckY(vizObj._d3_px(cc.chartWidth - yAxisPos),
                                           vizObj._d3_px(yAxisPos));
            var position = cc.dataDim.pluckX(0,
                                             vizObj._d3_px(yAxisPos));

            nullBars
                .enter().append('div')
                    .classed('nullDataBar', true)
                    .classed(nullSeriesClass, true)
                    .style(cc.dataDim.pluckY('left', 'top'), position)
                    .style(cc.dataDim.width, vizObj._d3_px(cc.barWidth));
            nullBars
                    .style(cc.dataDim.position, vizObj._d3_px(xDatumPositionForSeries))
                    .style(cc.dataDim.pluckY('left', 'top'), position)
                    .style(cc.dataDim.height, height);
            nullBars
                .exit()
                    .remove();
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
                .attr('transform', errorTransform);

            if (doAnimation)
            {
                errorMarkers
                    .transition()
                        .duration(vizObj._animationLengthMillisec)
                        .attr('d', vizObj._errorBarPath(newYScale));
            }

            if (allowTransitions)
            {
                errorMarkers
                    .exit()
                        .transition()
                            .remove();
            }
            else
            {
                errorMarkers
                    .exit()
                        .remove();
            }
        }

        vizObj._renderTicks(doAnimation ? oldYScale : newYScale, newYScale, doAnimation);
        vizObj._renderValueMarkers(vizObj._computeValueMarkers(), doAnimation ? oldYScale : newYScale, newYScale, doAnimation);

        if (!doAnimation)
        {
            // In the animation case, we'll commit after the animation ends.
            commitYScale();
        }
    },

    _renderRowLabels: function(data /*optional*/)
    {
        var labelInBar = $.deepGet(this._displayFormat, 'xAxis', 'labelInBar'),
            valueInBar = $.deepGet(this._displayFormat, 'xAxis', 'valueInBar');

        if (!labelInBar && !_.isUndefined(data))
        { this._super.apply(this, arguments); }

        if (!labelInBar && !valueInBar)
        { return; }

        var vizObj = this,
            cc = vizObj._chartConfig,
            valueColumns = vizObj.getValueColumns();

        // We can't just use currentRangeData as it's not the data we're looking
        // for if DSG is active...
        if (_.isUndefined(data))
        {
            data = cc.lastLabelRenderData;
        }
        else
        {
            cc.lastLabelRenderData = data;
        }

        var fontMetrics = vizObj._fontMetricsForRowLabels();

        // Create a virtual row object for each distinct label.
        // Each virtual row has a real row as a prototype, so it is still
        // safe to pass to the standard label positioning functions.
        var cubedData = [];

        var colHeight = {};
        var yScale = vizObj._currentYScale();
        var augmentedRow = function(seriesIndex)
        {
            this.seriesIndex = seriesIndex;
            this.column = valueColumns[seriesIndex];

            var heightFunc = colHeight[this.column.column.lookup];
            if (_.isUndefined(heightFunc))
            {
                heightFunc = colHeight[this.column.column.lookup] = vizObj._yBarHeight(this.column.column.lookup, yScale);
            }

            this.columnHeight = heightFunc(this);

            this.setOverallText = function(text)
            {
                this.overallText = text;

                // Determine the width of the text for layout.
                this.length = fontMetrics.lengthForString(text);
            };


            this.datumPosition = vizObj._yDatumPosition(this.column.column.lookup, yScale, false)(this);
        };

        var distinctLabelCountPerSeries = (!valueInBar && cc.stackYSeries) ? 1 : valueColumns.length;
        _.each(data, function(row)
        {
            augmentedRow.prototype = row;

            if (valueInBar)
            {
                for (var i=0; i<distinctLabelCountPerSeries; i++)
                {
                    cubedData.push(new augmentedRow(i));
                }
            }
            else
            {
                // We're not doing anything with values - don't bother adding
                // the row if there are no valid columns in it at all.
                var okToAdd = true;

                _.each(valueColumns, function(vc, i)
                {
                    if (okToAdd && !$.isBlank(row.data[vc.column.lookup]) && !row.invalid[vc.column.lookup])
                    {
                        cubedData.push(new augmentedRow(i));
                        okToAdd = !cc.stackYSeries;
                    }
                });
            }
        });

        // Now figure out the text to use, and add that to the augmented row.
        _.each(cubedData, function(d, i)
        {
            var fixedColumn = vizObj._fixedColumns[0];

            var valueInvalid = false; // Label-only is always valid, so start with that.
            if (valueInBar)
            {
                var col = d.column.column;
                valueInvalid = $.isBlank(d.data[col.lookup]) ||
                                   d.invalid[col.lookup];

                // Find out if this is the first valid column in this row.
                if (!valueInvalid)
                {
                    if (d.seriesIndex === 0)
                    {
                        d.firstValidColInRow = true;
                    }
                    else
                    {
                        var prevD = cubedData[i-1];
                        var prevCol = prevD.column.column;

                        d.firstValidColInRow = $.isBlank(prevD.data[prevCol.lookup]) ||
                                               prevD.invalid[prevCol.lookup];
                    }
                }
            }
            else
            {
                // We wouldn't have been added above if we weren't valid.
                d.firstValidColInRow = true;
            }

            d.isInvalid = valueInvalid;
            if (valueInvalid)
            {
                // We're done right here- don't render
                // anything (even if we have a label). The other sections in the
                // bar will take care of any label needed (if there are no other
                // sections or we're not stacking, the desired behavior is to show
                // no label anyway).
                d.setOverallText('');
            }
            else
            {
                // We have two distinct pieces of text: labelText, which is
                // the category label, and valueText, which is the stringified
                // value of the particular bar.
                var labelText = '',
                    valueText = '';

                // Label in bar only affects the first/bottom bar on the stack.
                var labelInThisBar = labelInBar && (d.firstValidColInRow || !cc.stackYSeries) ;

                if (labelInThisBar)
                {
                    labelText = fixedColumn.renderType.renderer(
                        d.data[fixedColumn.lookup], fixedColumn, true, null, null, true);
                }

                if (valueInBar)
                {
                    var column = col.renderType ? col : col.realValueColumn.column;
                    valueText = column.renderType.renderer(d.data[col.lookup], column, true, null, null, true);
                }

                if (valueInBar && labelInBar)
                {
                    // If there's a label active for this stack, wrap the value in parens.
                    valueText = '('+valueText+')';
                }

                d.labelText = labelText;
                d.valueText = valueText;

                // Now that we've got the text for the two pieces, make
                // the two pieces look good together (if we even have two
                // pieces).
                d.setOverallText((d.labelText + ' ' + d.valueText).trim());
            }
        });

        vizObj._updateInBarLabelPositions(cubedData);
    },

    _updateInBarLabelPositions: function(newCubedData /* optional */)
    {
        var vizObj = this;
        var cc = vizObj._chartConfig,
            valueColumns = vizObj.getValueColumns();

        var view = vizObj._primaryView;

        var labelInBar = $.deepGet(this._displayFormat, 'xAxis', 'labelInBar'),
            valueInBar = $.deepGet(this._displayFormat, 'xAxis', 'valueInBar');

        if (!labelInBar && !valueInBar) { return; }

        var fontMetrics = vizObj._fontMetricsForRowLabels();

        var extraPaddingForBarInColumn = (cc.orientation == 'right') ? 10 : 5;

        var maxWidthProperty = vizObj._isIE8() ? 'width' : 'max-width';

        var xPos = vizObj._xRowLabelPosition();
        var yPos = vizObj._yRowLabelPosition();

        var doLabelLayout = function(d, forceWidthForFirstStackedSeries)
        {
            var $this = $(this);

            var maxWidth = '';
            // Sometimes, we don't need the max width.
            if (valueInBar || labelInBar)
            {
                // Stacking:
                if ((forceWidthForFirstStackedSeries !== true) && cc.stackYSeries && d.firstValidColInRow && labelInBar)
                {
                    // First valid bar has precedence, as it contains the category label.
                    // So, max width remains empty.
                }
                else if ((d.seriesIndex === valueColumns.length - 1) &&
                         vizObj._rowLabelShouldBeDark(valueColumns[d.seriesIndex], d))
                {
                    // Allow the top label of the stack (or just the label if not stacking)
                    // to overflow.
                    // We should really be doing double rendering to change the text color
                    // when it goes over the chart BG, but for now we just allow overflow
                    // for black text (white text on an off-white BG looks like we're
                    // broken).

                    // Sadly this means that our positioning code must now be made
                    // aware of this so it can place to bottom of the label on the
                    // bottom of the bar. This isn't an issue with the first clause
                    // of the if() since that will by necessity be at the bottom of
                    // the stack.

                    d.isTopBarIgnoringOverflow = (d.columnHeight - extraPaddingForBarInColumn) < d.length ;
                }
                else
                {
                    d.maxWidth = Math.max(0, d.columnHeight - extraPaddingForBarInColumn);
                    maxWidth = d.maxWidth+'px';
                }
            }
            if (cc.stackYSeries || d.colorBrightness)
            { $this.css(maxWidthProperty, maxWidth); }

            doLabelPosition.call(this, d);
        };

        var doLabelPosition = function(d)
        {
            var $this = $(this);

            $this.css(cc.dataDim.pluckX('left', 'top'), xPos.call($this, d));
            $this.css(cc.dataDim.pluckY('left', 'top'), yPos.call($this, d));
        };

        var rowLabels = cc.chartHtmlD3.selectAll('.rowLabel');

        var cubedData = newCubedData;
        if (_.isUndefined(newCubedData))
        {
            cubedData = rowLabels.data();
            if (_.isUndefined(cubedData) || _.isEmpty(cubedData)) { return; }
        }
        else
        {
            // Got new data to display. Make it so.
            rowLabels = rowLabels
                .data(cubedData, function(d) { return d.seriesIndex + '/' + d.id; });

            rowLabels
                .enter().append('div')
                    .classed('rowLabel', true);
        }

        rowLabels
            .style('font-weight', function(d)
                    { return (view.highlights && view.highlights[d.id]) ? 'bold' : 'normal'; })
            //Positioning is handled via this function, as it needs to be re-called in later d3 statements.
            .style('color', vizObj._rowLabelColor())
            .html(function(d)
            {
                return d.overallText;
            })
            .attr('title', function(d) { return d.overallText; })
            .each(doLabelLayout)
            .style('visibility', function(d, i)
            {
                if (!cc.stackYSeries) { return 'visible'; }

                var coll = false;

                if (valueInBar && labelInBar && d.firstValidColInRow && !d.isInvalid && $(this).width() >= d.columnHeight - extraPaddingForBarInColumn)
                {

                    var onlyLabelLength = fontMetrics.lengthForString(d.labelText);
                    if (onlyLabelLength > d.columnHeight)
                    {
                        // Overflow... we have to get rid of the first col's
                        // value, otherwise it looks like the value of the next col.
                        // First col is special because it contains the category label
                        // in this case, which we need to show with highest precedence.
                        // We can't just leave the value in there, as we can't currently
                        // tell the browser to only clip the value text but not the label.
                        d.setOverallText(d.labelText);
                        $(this).text(d.labelText);
                        doLabelLayout.call(this, d);
                    }
                    else
                    {
                        // The label by itself would fit, so just clip the value.
                        doLabelLayout.call(this, d, true /* force width */);
                    }
                }

                // Will collide with previous?
                if (!d.isTopBarIgnoringOverflow && !d.firstValidColInRow && !d.isInvalid)
                {
                    var prevD = cubedData[i-1];

                    var checkCollisionWith = prevD.collidingWith || prevD;

                    var widthOfThisText = Math.min(d.maxWidth||Infinity, d.length);
                    var widthOfPrevText = Math.min(checkCollisionWith.maxWidth||Infinity, checkCollisionWith.length);

                    if (cc.orientation == 'right')
                    {
                        var bottomEdgeOfThisBar = d.datumPosition + d.columnHeight;
                        // always end justified, because only 1st valid col in row has possibility of start justification.
                        var bottomEdgeOfThisText = bottomEdgeOfThisBar - d.columnHeight + widthOfThisText + 5;

                        if (checkCollisionWith.endJustified)
                        {
                            // Easy - just check if we fit in our col.
                            coll = bottomEdgeOfThisBar < bottomEdgeOfThisText;
                        }
                        else
                        {
                            // We must check the length of the text of the collision candidate.
                            var bottomEdgeOfPrev = checkCollisionWith.datumPosition + checkCollisionWith.columnHeight;
                            var topOfPrevText = bottomEdgeOfPrev - widthOfPrevText - 10;

                            coll = topOfPrevText < bottomEdgeOfThisText;
                        }
                    }
                    else
                    {
                        var rightEdgeOfThisBar = d.datumPosition + d.columnHeight;
                        // always end justified, because only 1st valid col in row has possibility of start justification.
                        var leftEdgeOfThisText = rightEdgeOfThisBar - widthOfThisText - 5;

                        if (checkCollisionWith.endJustified)
                        {
                            // Easy - just check if we fit in our col.
                            coll = rightEdgeOfThisBar < leftEdgeOfThisText;
                        }
                        else
                        {
                            // We must check the length of the text of the collision candidate.
                            var leftEdgeOfPrev = checkCollisionWith.datumPosition;
                            var rightOfPrevText = leftEdgeOfPrev + widthOfPrevText + 10;

                            coll = rightOfPrevText > leftEdgeOfThisText;
                        }
                    }

                    d.collidingWith = coll ? checkCollisionWith : undefined;
                }

                return coll ? 'hidden' : 'visible';
            })
            .each(function(d)
            {
                if(d.isTopBarIgnoringOverflow)
                {
                    var $this = $(this);
                    // Shove the bar up by the overflow.
                    if (cc.orientation === 'right' && d.endJustified)
                    {
                        var overflow = d.length - (d.columnHeight - extraPaddingForBarInColumn);
                        $this.css('top', parseFloat(yPos.call($this, d)) - overflow);
                    }
                }
            });

        if (!_.isUndefined(newCubedData))
        {
            rowLabels
                .exit()
                    .remove();
        }
    },

    _yAxisPos: function()
    {
        if (!this._chartInitialized) { return 0; }

        if (!_.isUndefined(this._chartConfig.valueLabelBuffer)
            || $.deepGet(this._displayFormat, 'xAxis', 'labelInBar') !== true)
        { return this._super.apply(this, arguments); }

        // Special case for when we have to provide a default behavior for label
        // in bar.
        var yAxisPos;
        if (this._chartConfig.orientation == 'right')
        {
            var legendPosition = this.legendPosition(),
                yAxisPos = this._chartConfig.chartHeight;

            if (legendPosition == 'bottom')
            {
                // Note that the legend container has the x axis label in this case.
                yAxisPos -= this.$legendContainer().outerHeight(true);
            }
            else
            {
                // Manually account for the x axis label.
                var $xLabel = this._$dom.find('.xLabelHoriz.floatingAxisLabel');
                if ($xLabel.exists())
                {
                    var bottomOfChart = this._chartConfig.$chartOuterContainer.position().top + this._chartConfig.$chartOuterContainer.height();
                    var posOfxAxisLabel = $xLabel.position().top;
                    yAxisPos -= $xLabel.padding().top + (bottomOfChart - posOfxAxisLabel);
                }
                else
                {
                    // Add some manual padding.
                    yAxisPos -= 5;
                }
            }
        }
        else
        {
            var $yLabel = this._$dom.find('.yLabelVert.floatingAxisLabel');

            if ($yLabel.exists())
            {
                yAxisPos = this._isIE8() ? $yLabel.outerWidth(true) : $yLabel.outerHeight(true);
            }
            else
            {
                yAxisPos = 0;
            }
        }
        return yAxisPos;
    },

    _xRowLabelPosition: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            numCols = this.getValueColumns().length;

        var xPositionStaticParts = cc.sidePadding + ((cc.rowWidth - cc.rowSpacing) / 2) -
                                   cc.drawElementPosition - cc.dataOffset;

        return function(d)
        {
            if (!vizObj._chartInitialized) { return 0; }

            var xPosition = xPositionStaticParts + (d.index * cc.rowWidth);
            if (!cc.collapseXSeries)
            { xPosition += (cc.barWidth + cc.barSpacing) * (d.seriesIndex + (-(numCols - 1) / 2)); }

            if (cc.orientation == 'down')
            { return xPosition - ($(this).height() / 2) + 'px'; }
            else (cc.orientation == 'right')
            { return xPosition - ($(this).width() / 2) + 'px'; }
        };
    },

    // Only for label or value in bar.
    _yRowLabelPosition: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            yAxisPos = vizObj._yAxisPos(),
            yScale = vizObj._currentYScale(),
            valueColumns = vizObj.getValueColumns(),
            valueInBar = $.deepGet(this._displayFormat, 'xAxis', 'valueInBar') === true,
            onlyValueInBar = valueInBar
                        && $.deepGet(this._displayFormat, 'xAxis', 'labelInBar') !== true;

        return function(d)
        {
            var localEndJustified = onlyValueInBar || (cc.stackYSeries && valueInBar && !d.firstValidColInRow);

            if (!vizObj._chartInitialized) { return 0; } // Harden against animations ticking after cleanVisualization.

            var position, datumPos = 0;

            // Magic numbers are for padding from the yAxisPos-edge of the bar.
            if (cc.orientation == 'down')
            {
                if (cc.stackYSeries)
                { datumPos = (vizObj._yDatumPosition(
                        valueColumns[d.seriesIndex].column.lookup, yScale)(d) || 0) - yAxisPos; }

                position = yAxisPos + 5;
                if (localEndJustified)
                { position = Math.max(position, yAxisPos
                    + yScale(d.data[valueColumns[d.seriesIndex].column.lookup]) - $(this).width() - 5); }
            }
            else
            {
                if (vizObj._isIE8())
                {
                    position = vizObj._yDatumPosition(valueColumns[d.seriesIndex].column.lookup, yScale, false)(d) + 5;
                    var actualSize = Math.min(d.length, d.columnHeight - 10);
                    if (localEndJustified)
                    {
                        // Gotta calculate this manually; IE gives us bogus sizes.

                        // Turns out this is only valid for stacked column.
                        if (cc.stackYSeries)
                        { position -= d.columnHeight - actualSize - 10; }
                        else if (d.length > d.columnHeight - 10)
                        { position -= d.length - d.columnHeight + 10; }
                    }
                    // If we aren't truncating, shift up by the overflow amount.
                    else if ($(this).attr('style').indexOf('width') < 0)
                    {
                        if (d.length < d.columnHeight - 10)
                        {
                            var padding = d.columnHeight - 10 - d.length;
                            position += padding;
                        }
                        else
                        {
                            var overflow = d.length - actualSize;
                            position -= overflow;
                        }
                    }
                }
                else
                {
                    position = vizObj._yDatumPosition(valueColumns[d.seriesIndex].column.lookup, yScale, false)(d) + ($(this).width() / 2) - 2.5;
                    if (localEndJustified)
                    { position = Math.min(position, yAxisPos - $(this).width() - 5); }
                    else
                    { position += d.columnHeight - $(this).width() - 10; }
                }
            }

            d.endJustified = localEndJustified;

            // If not stacked, expecting datumPos to be 0.
            return position + datumPos + 'px';
        };
    },

    _rowLabelShouldBeDark: function(col, row)
    {
        var rowColor = this._d3_colorizeRow(col)(row);
        return $.rgbToHsl($.hexToRgb(rowColor)).l >= 50;
    },

    _rowLabelColor: function()
    {
        var vizObj = this;
            valueColumns = this.getValueColumns();

        return function(d)
        {
            return vizObj._rowLabelShouldBeDark(valueColumns[d.seriesIndex], d) ? '#333' : '#ccc';
        };
    },

    // call this if the yAxisPos has changed
    // you'll also need to call _renderData to make the dataBars the correct height
    _rerenderAxis: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            yScale = vizObj._currentYScale(),
            yAxisPos = vizObj._yAxisPos();

        vizObj.debugOut('rAxis');

        // Special case for orientation=right:
        // Why can't we just have D3 handle the transition for us? Well, because
        // of the way our coordinate system works, the animation will be in the
        // wrong direction.
        // Think of it this way. Someone shrinks the chart vertically by resizing
        // the browser.
        // Since our bars have their origin at the top-left of the chart,
        // the bars will appear to sit still on the screen. Then the transition
        // kicks in, and they move UP instead of DOWN, which is the opposite of
        // what you'd expect for a shrinking yScale. So we have to do this horrible
        // hack of remembering our old yScale. Of course this introduces problems
        // if many transitions are started (say you're resizing the window over
        // several seconds). So we need to figure out what the current position
        // of the points are and account for that... Instead of doing that,
        // we just completely reset the animation pretending the chart was just
        // sitting at the last size.
        var oldYScale = vizObj._lastYScale() || yScale;
        var yPos = vizObj._yDatumPosition(function() { return this.__dataColumn.lookup; }, yScale);
        var oldYPos = cc.orientation === 'right' ? (vizObj._yDatumPosition(function() { return this.__dataColumn.lookup; }, oldYScale))
                                                 : yPos;

        var bars = cc.chartD3.selectAll('.dataBar');

        // As alluded to above, the issue is really the bar heights being incorrect
        // if we try to continue a past animation. So, fix them if we're currently
        // animating.
        var doResetAnimation = cc.orientation === 'right' && vizObj._barResizeInProgress();

        if (doResetAnimation)
        {
            bars
                .attr(cc.dataDim.height, vizObj._yBarHeight(function() { return this.__dataColumn.lookup; }, oldYScale));
        }

        vizObj._barResizeInProgress(true);
        bars
            .attr(cc.dataDim.yAxis, oldYPos)
            .transition()
                .duration(vizObj._animationLengthMillisec)
                .attr(cc.dataDim.yAxis, yPos)
                .attr(cc.dataDim.height, vizObj._yBarHeight(function() { return this.__dataColumn.lookup; }, yScale))
                .each('end', _.once(function()
                {
                    yScale.commit();
                    vizObj._barResizeInProgress(false);
                }));

        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());

        var nullBarHeight = cc.dataDim.pluckY(vizObj._d3_px(cc.chartWidth - yAxisPos),
                                           vizObj._d3_px(yAxisPos));
        var nullBarPosition = cc.dataDim.pluckX(0,
                                         vizObj._d3_px(yAxisPos));

        cc.chartNullD3.selectAll('.nullDataBar')
            .style(cc.dataDim.pluckY('left', 'top'), nullBarPosition)
            .style(cc.dataDim.height, nullBarHeight);

        if ($.subKeyDefined(vizObj, '_displayFormat.plot.errorBarLow'))
        {
            cc.chartD3.selectAll('.errorMarker')
                .attr('transform', vizObj._errorBarTransform())
                .attr('d', vizObj._errorBarPath(oldYScale))
                .transition()
                    .duration(vizObj._animationLengthMillisec)
                    .attr('d', vizObj._errorBarPath(yScale));
        }

        vizObj._renderTicks(oldYScale, yScale, true);
        vizObj._renderValueMarkers(vizObj._computeValueMarkers(), oldYScale, yScale, true);

        // Have to re-render labels as bar sizes may have changed.
        vizObj._renderRowLabels();
    },

    // call this if spacings/widths changed
    _rerenderPositions: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            valueColumns = vizObj.getValueColumns(),
            yAxisPos = vizObj._yAxisPos();

        vizObj.debugOut('rPos');

        // render our bars per series
        _.each(valueColumns, function(colDef, seriesIndex)
        {
            var xDatumPositionForSeries = vizObj._xDatumPosition(seriesIndex);
            var dataBars = cc.chartD3.selectAll('.dataBar_series' + colDef.column.lookup)
                    .attr(cc.dataDim.width, cc.barWidth)
                    .attr(cc.dataDim.xAxis, xDatumPositionForSeries);

            cc.chartNullD3.selectAll('.nullDataBar_series' + colDef.column.lookup)
                    .style(cc.dataDim.width, vizObj._d3_px(cc.barWidth))
                    .style(cc.dataDim.xAxis, vizObj._d3_px(xDatumPositionForSeries));

            var nullBars = cc.chartNullD3.selectAll('.nullDataBar_series' + colDef.column.lookup);
            var nullBarHeight = cc.dataDim.pluckY(vizObj._d3_px(cc.chartWidth - yAxisPos),
                                           vizObj._d3_px(yAxisPos));
            var nullBarPosition = cc.dataDim.pluckX(0,
                                             vizObj._d3_px(yAxisPos));

            nullBars
                .style(cc.dataDim.width, vizObj._d3_px(cc.barWidth))
                .style(cc.dataDim.position, vizObj._d3_px(xDatumPositionForSeries));
        });

        vizObj._updateInBarLabelPositions();

        if ($.subKeyDefined(vizObj, '_displayFormat.plot.errorBarLow'))
        {
            cc.chartD3.selectAll('.errorMarker')
                .attr('transform', vizObj._errorBarTransform());
        }

        // Standard labels (note the use of the SVG node vs. HTML node).
        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());
    },

    // Gets or sets a whether or not a bar resize is in progress. We use this to
    // tweak further animation if we get a resize during an animation. See the
    // comment in rerenderAxis to know why.
    _barResizeInProgress: function(isInProgress)
    {
        if (!_.isUndefined(isInProgress))
        {
            this._chartConfig.barResizeInProgress = isInProgress;
        }

        return this._chartConfig.barResizeInProgress;
    }

}, null, 'socrataChart', [ 'd3_virt_scrolling', 'd3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);
