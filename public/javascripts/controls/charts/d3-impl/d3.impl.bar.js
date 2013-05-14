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

// TODO: Cleanup all the ternary parameterizations by stuffing them into dataDim.

(function($)
{

var d3ns = blist.namespace.fetch('blist.d3');

$.Control.registerMixin('d3_impl_bar', {

    defaults: {
        barWidthBounds: [ 20, 200 ], // width of the bar, of course
        barSpacingBounds: [ 0, 20 ], // within row (between series) spacing
        rowSpacingBounds: [ 10, 100 ], // between row spacing
        sidePaddingBounds: [ 20, 200 ], // sides of window
        rowBuffer: 30, // additional rows to fetch on either side of the actual visible area
        valueLabelBuffer: 100, // amount of room to leave for each row' label
        dataMaxBuffer: 30 // amount of room to leave in actual chart area past the max bar
    },

    initializeVisualization: function()
    {
        var vizObj = this;

        // if we need to do series grouping stuff, mix that in before anything else
        if (_.isArray(vizObj._displayFormat.seriesColumns) &&
            $.isBlank(vizObj._seriesGroupingSentinel)) // but don't do this if it's already been done
        {
            vizObj.Class.addProperties(vizObj, d3ns.base.seriesGrouping, $.extend({}, vizObj));
            return vizObj.initializeVisualization(); // reset call chain
        }

        // own object to save temp stuff on
        var cc = vizObj._chartConfig = {};

        // domain orientation - column charts go right; bar charts go down
        // TODO: This stuff is here for debugging purposes.
        //cc.orientation = 'down';
        //cc.orientation = 'right';
        if (foobar = $.urlParam(window.location.href, 'orientation')) { cc.orientation = foobar; }
        else { cc.orientation = vizObj._chartType.indexOf('column') > -1 ? 'right' : 'down'; }

        cc.dataDim = (function(orientation) {
            return {
                'down': {
                    'width': 'height',
                    'scroll': 'scrollTop',
                    'position': 'top',
                    'xAxis': 'y',
                    'yAxis': 'x',
                    'height': 'width',
                    'dir': 1
                },
                'right': {
                    'width': 'width',
                    'scroll': 'scrollLeft',
                    'position': 'left',
                    'xAxis': 'x',
                    'yAxis': 'y',
                    'height': 'height',
                    'dir': -1
                }
            }[orientation];
        })(cc.orientation);

        // create and cache dom elements
        var $dom = vizObj.$dom();
        $dom.empty().append($.tag(
            { tagName: 'div', 'class': 'chartArea barChart orientation' + $.capitalize(cc.orientation), contents: [
                { tagName: 'div', 'class': 'chartContainer', contents: [
                    { tagName: 'div', 'class': 'chartRenderArea',
                      contents: '&nbsp;' } // if no contents, browser doesn't bother to scroll
                ] },
                { tagName: 'div', 'class': 'baselineContainer', contents: [
                    { tagName: 'div', 'class': 'baselineBg' },
                    { tagName: 'div', 'class': 'baselineLine' }
                ] },
                { tagName: 'div', 'class': 'legendContainer' }
            ] }
        , true));
        cc.$chartArea = $dom.find('.chartArea');
        cc.$chartContainer = $dom.find('.chartContainer');
        cc.$chartRenderArea = $dom.find('.chartRenderArea');
        cc.$baselineContainer = $dom.find('.baselineContainer');
        cc.$legendContainer = $dom.find('.legendContainer');

        // for positioning
        $dom.css('position', 'relative');

        // default draw element position and left offset are 0
        cc.drawElementPosition = 0;
        cc.dataOffset = 0;
        cc.scrollPos = cc.$chartContainer[cc.dataDim.scroll]();

        // init our renderers
        cc.chartRaphael = new Raphael(cc.$chartContainer.get(0), 10, 10);
        cc.chartD3 = d3.raphael(cc.chartRaphael);
        cc.chartHtmlD3 = d3.select(cc.$chartRenderArea.get(0));
        cc.chromeD3 = d3.select(cc.$chartArea.get(0));

        // find and set up the draw elem
        cc.$drawElement = cc.$chartContainer.children(':not(.chartRenderArea)');
        cc.$drawElement.css({ 'position': 'absolute', 'top': '0' });

        // maybe move things around and maybe grab rows every half second when they're scrolling
        var throttledScrollHandler = _.throttle(function()
        {
            // cache scrollPos so that aggressive scrolling doesn't make our calculations stutter.
            cc.scrollPos = cc.$chartContainer[cc.dataDim.scroll]();

            vizObj._recalculateDataOffset();
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
            // calculate our left offset to account for screen scaling
            vizObj._recalculateDataOffset();
            // reposition the elems vertically
            vizObj._rerenderAxis();
            // reposition the elems horizonally if necessary
            if (needsReposition) vizObj._rerenderPositions();
            // maybe fetch some more rows if more are exposed
            vizObj.getDataForAllViews();
        }, 500);

        // allow the baseline to be draggable
        var throttledResize = _.throttle(function() { vizObj.resizeHandle(); }, 500); // TODO: this is more blunt than we need
        cc.$baselineContainer.draggable({
            axis: cc.dataDim.yAxis,
            containment: 'parent', // TODO: bounded containment on viewport change
            drag: function(event, ui)
            {
                if (cc.orientation == 'down')
                { cc.valueLabelBuffer = ui.position.left; }
                else
                { cc.valueLabelBuffer = cc.chartHeight - ui.position.top; }
                throttledResize();
                // TODO: save off the valueLabelBuffer as a minor change on displayFormat?
            },
            scroll: false,
            start: function() { cc._isDragging = true; },
            stop: function() { cc._isDragging = false; }
        });

/*
How to resize so that all labels are visible:

foo = []; chartObj._chartConfig.chartD3.selectAll('.rowLabel').each(function(e) { var bbox = this.getBBox(); foo.push(bbox.x2-bbox.x); })
chartObj._chartConfig.valueLabelBuffer = Math.ceil(d3.max(foo))
chartObj.resizeHandle();
*/

        // set up side stuff
        vizObj._decorateChrome();

        // super
        vizObj._super();
    },

    cleanVisualization: function()
    {
        var vizObj = this;

        delete vizObj._chartConfig;

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
                if (row.invalid[col.lookup]) { return null; }
                // use matchValue to get canonical representation of data
                return col.dataType.matchValue ? col.dataType.matchValue(row[col.lookup]) : row[col.lookup];
            }));
        }, []);
        vizObj._chartConfig.maxValue = d3.max(allValues); // cache off maxValue for other renders
        vizObj._chartConfig.minValue = d3.min(allValues); // etc

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
            cc = vizObj._chartConfig,
            xScale = vizObj._currentXScale(),
            rowsPerScreen = Math.ceil(cc.$chartArea[cc.dataDim.width]() / (cc.rowWidth + cc.rowSpacing));

        var start = Math.max(Math.floor(xScale(cc.scrollPos)) - vizObj.defaults.rowBuffer, 0);
        var length = rowsPerScreen + (vizObj.defaults.rowBuffer * 2);

        return { start: start, length: length };
    },

    resizeHandle: function()
    {
        var vizObj = this;

        if (!vizObj._chartConfig)
        {
            // we haven't loaded yet but are being told to resize. init load
            // will size correctly anyway then so whatev.
            return;
        }

        // if we don't have totalRows yet then the sizing will be taken care
        // of shortly anyway, so only resize otherwise
        if (!$.isBlank(vizObj._chartConfig.maxValue))
        {
            vizObj._chartConfig.doResizeHandle();
        }
    },

    $legendContainer: function()
    {
        return this._chartConfig.$legendContainer;
    },

    renderLegend: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            $legendContainer = vizObj.$legendContainer(),
            legendPosition = vizObj.legendPosition();

        vizObj._super();

        // this is messy. what's a better way?
        vizObj.defaults.valueLabelBuffer = 100;
        vizObj.defaults.dataMaxBuffer = 30;
        vizObj._chartConfig.$chartArea
            .removeClass('hasTopLegend hasRightLegend hasBottomLegend hasLeftLegend')
            .addClass('has' + $.htmlEscape(legendPosition || 'No').capitalize() + 'Legend');

        if (vizObj._chartConfig.orientation == 'right')
        {
            if (legendPosition == 'bottom')
            {
                vizObj.defaults.valueLabelBuffer = 100 + $legendContainer.height();
            }
            else if (legendPosition == 'top')
            {
                vizObj.defaults.dataMaxBuffer = 30 + $legendContainer.height();
            }
            else if ((legendPosition == 'left') || (legendPosition == 'right'))
            {
                $legendContainer.css('margin-top', -1 * $legendContainer.height() / 2);
            }
        }
    },

    _decorateChrome: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        // render y axis label
        if (!$.isBlank(vizObj._displayFormat.titleY))
        {
            var clsname = cc.orientation == 'right' ? 'yLabelVert' : 'xLabelHoriz';
            cc.$chartArea.addClass('has' + $.capitalize(clsname));
            cc.$chartArea.append($.tag({
                tagName: 'div',
                'class': clsname,
                contents: $.htmlEscape(vizObj._displayFormat.titleY)
            }));
        }

        // render x axis label
        if (!$.isBlank(vizObj._displayFormat.titleX))
        {
            var clsname = cc.orientation == 'right' ? 'xLabelHoriz' : 'yLabelVert';
            cc.$chartArea.addClass('has' + $.capitalize(clsname));
            var $label = $.tag({
                tagName: 'div',
                'class': clsname,
                contents: $.htmlEscape(vizObj._displayFormat.titleX)
            });
            cc.$chartArea.append($label);
        }

        // need to manually fix the label width due to bg image
        var $label = $('.xLabelHoriz');
        $label.css('margin-left', -0.5 * $label.width());
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
            cc = vizObj._chartConfig,
            chartD3 = cc.chartD3,
            totalRows = vizObj.getTotalRows(),
            chartArea = cc.$chartArea[cc.dataDim.width](),
            domArea = vizObj.$dom()[cc.dataDim.height](),
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
        var oldSidePadding = cc.sidePadding;

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
            rowSpacingBounds = [ 2, rowSpacingBounds[1] ];
        }

        // assume minimum possible width
        cc.barWidth = barWidthBounds[0];
        cc.barSpacing = barSpacingBounds[0];
        cc.rowSpacing = rowSpacingBounds[0];
        cc.sidePadding = sidePaddingBounds[0];

        // for col/bar parameterization: swapping width/height so that the correct value goes in
        var setRaphaelSize = function(width, height)
        {
            if (cc.orientation == 'down')
            { cc.chartRaphael.setSize(width, height); }
            else if (cc.orientation == 'right')
            { cc.chartRaphael.setSize(height, width); }
        };

        var minTotalWidth = calculateTotalWidth();
        if (minTotalWidth > chartArea)
        {
            // we're bigger than we need to be. set the render area size
            // to be what we calculated.
            setRaphaelSize(domArea, Math.min(minTotalWidth, maxRenderWidth));
            cc.$chartRenderArea[cc.dataDim.width](minTotalWidth);
            cc[cc.orientation == 'right' ? 'chartWidth' : 'chartHeight'] = minTotalWidth;

            // scrollbar should have appeared. reresize.
            var renderHeight = cc.$chartContainer[cc.orientation == 'right' ? 'renderHeight'
                                                                            : 'renderWidth']();
            setRaphaelSize(renderHeight, Math.min(minTotalWidth, maxRenderWidth));
            cc[cc.orientation == 'right' ? 'chartHeight' : 'chartWidth'] = renderHeight;
        }
        else
        {
            // set our sizing to equal vis area
            setRaphaelSize(domArea, Math.min(chartArea, maxRenderWidth));
            cc.$chartRenderArea[cc.dataDim.width](chartArea);
            cc[cc.orientation == 'right' ? 'chartWidth' : 'chartHeight'] = chartArea;
            cc[cc.orientation == 'right' ? 'chartHeight' : 'chartWidth'] = domArea;

            // okay, we're smaller than we need to be.
            // calculate maximum possible width instead.
            cc.barWidth = barWidthBounds[1];
            cc.barSpacing = barSpacingBounds[1];
            cc.rowSpacing = rowSpacingBounds[1];
            // don't bother calculating sidepadding here, just use minimum and see what's up

            var maxTotalWidth = calculateTotalWidth();
            if (maxTotalWidth < chartArea)
            {
                // okay, then use those values and add side padding for
                // the difference
                cc.sidePadding = (chartArea - maxTotalWidth) / 2;
            }
            else
            {
                // so, the ideal width is somewhere between min and max.
                // trim stuff to get us down. scale everything from max
                // to min to get the ideal answer.

                // this... is the result of a bunch of algebra i did. i
                // had to relearn algebra to do it... so it's probably all
                // fucked.
                var numerator = chartArea +
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
        if (cc.orientation == 'right')
        { cc.$chartContainer.css('margin-bottom', cc.chartHeight * -1); }
        else
        { cc.$chartContainer.css('margin-right', cc.chartWidth * -1); }

        // move baseline
        cc.$baselineContainer.css(cc.orientation == 'right' ? 'top' : 'left', vizObj._yAxisPos());

        // return whether our row width has changed, so we know
        // if we'll have to move some things around
        return ((oldRowWidth != cc.rowWidth) || (oldSidePadding != cc.sidePadding));
    },

    // accounts for screen scaling
    _recalculateDataOffset: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var xScale = vizObj._currentXScale();

        cc.dataOffset = 0; // need to first set to zero to remove influence.
        cc.dataOffset = vizObj._xBarPosition(0)({ index: xScale(cc.scrollPos) }) -
                        (cc.scrollPos - cc.drawElementPosition) +
                        (cc.sidePadding * cc.scrollPos / d3.max(xScale.domain()));
    },

    // moves the svg/vml element around to account for it's not big enough
    _repositionDrawElement: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            scrollPosition = cc.scrollPos,
            chartAreaWidth = cc.$chartArea[cc.dataDim.width](),
            drawElementPosition = parseFloat(cc.$drawElement.position()[cc.dataDim.position]),
            drawElementWidth = vizObj._maxRenderWidth();

        if ((scrollPosition < drawElementPosition) ||
            (scrollPosition > (drawElementPosition + drawElementWidth - chartAreaWidth)))
        {
            cc.drawElementPosition = $.clamp(scrollPosition - Math.floor(drawElementWidth / 2),
                                             [ 0, Math.ceil(cc.chartWidth - drawElementWidth) ]);

            if (cc.drawElementPosition != drawElementPosition)
            {
                cc.$drawElement.css(cc.dataDim.position, cc.drawElementPosition);
                return true;
            }
        }
        return false;
    },

    // calculates value axis position
    _yAxisPos: function()
    {
        var vizObj = this;
        if (vizObj._chartConfig.orientation == 'down')
        {
            return vizObj._chartConfig.valueLabelBuffer || vizObj.defaults.valueLabelBuffer;
        }
        else if (vizObj._chartConfig.orientation == 'right')
        {
            return vizObj._chartConfig.chartHeight
                - (vizObj._chartConfig.valueLabelBuffer || vizObj.defaults.valueLabelBuffer);
        }
    },

    // calculates a y scale based on the current set of data
    _currentYScale: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            explicitMin = parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'min')),
            explicitMax = parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'max')),
            rangeMax = cc.orientation == 'right' ? vizObj._yAxisPos()
                                                 : cc.chartWidth - vizObj._yAxisPos();

        return d3.scale.linear()
            .domain([ !_.isNaN(explicitMin) ? explicitMin : Math.min(0, cc.minValue),
                      !_.isNaN(explicitMax) ? explicitMax : cc.maxValue ])
            .range([ 0, rangeMax - vizObj.defaults.dataMaxBuffer ])
            .clamp(true);
    },

    // should be a 1:1 mapping unless the browser's render container has truncated
    _currentXScale: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var chartArea = cc.$chartArea[cc.dataDim.width](),
            rowsPerScreen = Math.ceil(chartArea / cc.rowWidth);

        return d3.scale.linear()
              .domain([ cc.sidePadding, cc.$chartRenderArea[cc.dataDim.width]() - chartArea ])
              .range([ 0, vizObj.getTotalRows() - rowsPerScreen ])
              .clamp(true)
    },

    // call this if the active set of data has changed
    _renderData: function(data)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
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
                if ($.isBlank(row[col.lookup]) ||
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

            // render our actual bars
            var seriesClass = 'dataBar_series' + col.lookup;

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
                        if (d && !cc._isDragging)
                        {
                            vizObj.handleMouseOver(this, colDef, d, newYScale);
                        }
                    })
                    .on('mouseout', function(d)
                    {
                        // for perf, only call unhighlight if highlighted.
                        if (d && !cc._isDragging && view.highlights && view.highlights[d.id])
                        {
                            vizObj.handleMouseOut(this, colDef, d, newYScale);
                        }
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

            // ENTER + UPDATE
            bars
                    .attr('fill', vizObj._d3_colorizeRow(colDef))

                    // D3 won't re-execute these dynamic property values when
                    // our internal state changes, so we must re-set them here
                    // (as opposed to on enter only).
                    .attr(cc.dataDim.xAxis, vizObj._xBarPosition(seriesIndex))
                    .attr(cc.dataDim.yAxis, vizObj._yBarPosition(col.lookup, oldYScale))
                    .attr('fill', function(d) { return d.color || colDef.color; })

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
                    .attr(cc.dataDim.yAxis, vizObj._yBarPosition(col.lookup, newYScale))
                    .attr(cc.dataDim.height, vizObj._yBarHeight(col.lookup, newYScale));

            // EXIT
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

            // render null bars
            var nullSeriesClass = 'nullDataBar_series' + col.lookup;
            var nullBars = cc.chartHtmlD3.selectAll('.' + nullSeriesClass)
                .data(nullData, function(row) { return row.id; });
            var height = cc.orientation == 'right' ? vizObj._d3_px(yAxisPos)
                                                   : vizObj._d3_px(cc.chartWidth - yAxisPos);
            var position = cc.orientation == 'right' ? 0
                                                     : vizObj._d3_px(yAxisPos);
            nullBars
                .enter().append('div')
                    .classed('nullDataBar', true)
                    .classed(nullSeriesClass, true)
                    .style(cc.orientation == 'right' ? 'top' : 'left', position)
                    .style(cc.dataDim.width, vizObj._d3_px(cc.barWidth));
            nullBars
                    .style(cc.dataDim.position, vizObj._d3_px(vizObj._xBarPosition(seriesIndex)))
                    .style(cc.dataDim.height, height);
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
                        'text-anchor': cc.orientation == 'right' ? 'start' : 'end',
                        'font-size': 13 });
        rowLabels
                // TODO: make a transform-builder rather than doing this concat
                // 10 is to bump the text off from the actual axis
                .attr('transform', vizObj._labelTransform())
                .attr('font-weight', function(d)
                        { return (view.highlights && view.highlights[d.id]) ? 'bold' : 'normal'; })
                .text(function(d)
                {
                    var fixedColumn = vizObj._fixedColumns[0]; // WHY IS THIS AN ARRAY
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
                .attr(cc.dataDim.yAxis, vizObj._yBarPosition(function() { return this.__dataColumn.lookup; }, yScale))
                .attr(cc.dataDim.height, vizObj._yBarHeight(function() { return this.__dataColumn.lookup; }, yScale));

        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());

        cc.chartHtmlD3.selectAll('.nullDataBar')
            .style(cc.dataDim.height, vizObj._d3_px(yAxisPos));

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
                    .attr(cc.dataDim.width, cc.barWidth)
                    .attr(cc.dataDim.xAxis, vizObj._xBarPosition(seriesIndex));

            cc.chartHtmlD3.selectAll('.nullDataBar_series' + colDef.column.lookup)
                    .style(cc.dataDim.width, vizObj._d3_px(cc.barWidth))
                    .style(cc.dataDim.xAxis, vizObj._d3_px(vizObj._xBarPosition(seriesIndex)));
        });
        cc.chartD3.selectAll('.rowLabel')
                .attr('transform', vizObj._labelTransform());
    },

    // renders tick lines in general
    _renderTicks: function(oldYScale, newYScale, isAnim)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            yAxisPos = vizObj._yAxisPos();

        // determine our ticks
        var idealTickCount = cc[cc.orientation == 'right' ? 'chartHeight' : 'chartWidth'] / 80;
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

        var position = cc.orientation == 'right' ? 'top' : 'left';

        // render our tick lines and labels
        var tickLines = cc.chromeD3.selectAll('.tick')
            // we use the value rather than the index to make transitions more constant
            .data(ticks, function(val) { return val; });
        var tickLinesRootEnter = tickLines
            .enter().append('div')
                .classed('tick', true)
                .classed('origin', function(d) { return d === 0; })
                .style(position, function(d) { return (yAxisPos + cc.dataDim.dir * oldYScale(d)) + 'px'; });
            tickLinesRootEnter
                .append('div')
                    .classed('tickLabel', true);
            tickLinesRootEnter
                .append('div')
                    .classed('tickLine', true);
        tickLines
            .transition()
                .duration(isAnim ? 1000 : 0)
                .style(position, function(d) { return (yAxisPos + cc.dataDim.dir * newYScale(d)) + 'px'; });
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
            cc = vizObj._chartConfig,
            yAxisPos = vizObj._yAxisPos();

        // if we ever to nukeless df updates, need to also remove lines
        if (!_.isArray(vizObj._displayFormat.valueMarker))
        {
            return;
        }

        var valueMarkerPosition = cc.orientation == 'right'
            ?  function(yScale)
            { return function(d) { return (yAxisPos - yScale(parseFloat(d.atValue))) + 'px'; }; }
            : function(yScale)
            { return function(d) { return yScale(parseFloat(d.atValue)) + 'px'; }; };

        var valueMarkers = cc.chromeD3.selectAll('.valueMarkerContainer')
            .data(vizObj._displayFormat.valueMarker);
        valueMarkers
            .enter().append('div')
                .classed('valueMarkerContainer', true)
                .style(cc.orientation == 'right' ? 'top' : 'left', valueMarkerPosition(oldYScale))
                .each(function(d)
                {
                    var $this = $(this);

                    // need to jQuery each rather than .html and .on because ie
                    $this.append($.tag([
                        { tagName: 'div', 'class': 'markerBg', style: { 'background-color': d.color } },
                        { tagName: 'div', 'class': 'markerLine', style: { 'background-color': d.color } }
                    ], true));
                    $this.socrataTip({
                        message: $.htmlEscape(d.caption),
                        positions: [ 'top', 'bottom' ]
                    });
                });
        valueMarkers
            .transition()
                .duration(isAnim ? 1000 : 0)
                .style(cc.orientation == 'right' ? 'top' : 'left', valueMarkerPosition(newYScale));
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
            cc = vizObj._chartConfig;

        var staticParts = cc.sidePadding - 0.5 - cc.drawElementPosition - cc.dataOffset +
                          (seriesIndex * (cc.barWidth + cc.barSpacing));

        return function(d)
        {
            return staticParts + (d.index * cc.rowWidth);
        };
    },

    _yBarPosition: function(colId, yScale)
    {
        if (this._chartConfig.orientation == 'down') { return this._yAxisPos(); }
        var yAxisPos = this._yAxisPos();
        var isFunction = _.isFunction(colId);
        return function(d) { return yAxisPos - yScale(Math.max(0, d[isFunction ? colId.call(this) : colId])) + 0.5; };
    },

    _yBarHeight: function(colId, yScale)
    {
        var yScaleZero = yScale(0);
        var isFunction = _.isFunction(colId);
        var negative = -this._chartConfig.dataDim.dir;
        return function(d) { return Math.abs(yScaleZero + negative * yScale(d[isFunction ? colId.call(this) : colId])); };
    },

    _labelTransform: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var xPositionStaticParts = cc.sidePadding + ((cc.rowWidth - cc.rowSpacing) / 2) -
                                   cc.drawElementPosition - cc.dataOffset;
        var yPositionStaticParts = vizObj._yAxisPos();

        return function(d)
        {
            if (cc.orientation == 'down')
            { return 'r-40,0,0,T' + (yPositionStaticParts - 10) + ',' + (xPositionStaticParts + (d.index * cc.rowWidth)); }
            else (cc.orientation == 'right')
            { return 'r40,0,0,T' + (xPositionStaticParts + (d.index * cc.rowWidth) - 3.5) + ',' + (yPositionStaticParts + 10); }
        };
    },

    // Returns a translation along X for an error bar.
    _errorBarTransform: function()
    {
        var cc = this._chartConfig;

        var xPositionStaticParts = cc.sidePadding - 0.5 - cc.drawElementPosition - cc.dataOffset + ((cc.rowWidth - cc.rowSpacing) / 2);

        return function(d)
        {
            if (cc.orientation == 'down')
            {
                return 't0,'+xPositionStaticParts;
            }
            else (cc.orientation == 'right')
            {
                return 't'+xPositionStaticParts+',0';
            }
        };
    },

    // Returns a path representing an error bar. Y position is built-in to the
    // path, so transitions between scales should work automatically. X position
    // is not built in, as we don't want to animate that (D3 can't choose what
    // attributes of a path to animate).
    _errorBarPath: function(yScale)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            plot = vizObj._displayFormat.plot,
            lowCol = vizObj._primaryView.columnForIdentifier(plot.errorBarLow),
            highCol = vizObj._primaryView.columnForIdentifier(plot.errorBarHigh),
            yAxisPos = vizObj._yAxisPos();


        var capWidth = 8;

        if (cc.orientation == 'right')
        { return function(d)
        {
            var x = Math.floor(d.index * cc.rowWidth) + 0.5;
            var y = yAxisPos - yScale(Math.max(0, d[highCol.lookup]));
            var height = yScale(d[highCol.lookup]) - yScale(d[lowCol.lookup]);

            // TODO: uuurrrreeeeghhhhhhh
            return 'M' + (x - capWidth) + ',' + y + 'H' + (x + capWidth) +
                   'M' + x + ',' + y + 'V' + (y + height) +
                   'M' + (x - capWidth) + ',' + (y + height) + 'H' + (x + capWidth);
        }; }
        else
        { return function(d)
        {
            var x = Math.floor(d.index * cc.rowWidth) + 0.5;
            var y = yAxisPos + yScale(Math.max(0, d[lowCol.lookup])) + 1;
            var height = yScale(d[highCol.lookup]) - yScale(d[lowCol.lookup]);

            // TODO: uuurrrreeeeghhhhhhh
            return 'M' + y + ',' + (x - capWidth)  + 'V' + (x + capWidth) +
                   'M' + y + ',' + x + 'H' + (y + height) +
                   'M' + (y + height) + ',' + (x - capWidth) + 'V' + (x + capWidth);
        }; }
    },

    handleMouseOver: function(rObj, colDef, row, yScale)
    {
        var vizObj = this,
            view = vizObj._primaryView,
            col = colDef.column,
            cc = vizObj._chartConfig;

        rObj.tip = $(rObj.node).socrataTip({
            content: vizObj.renderFlyout(row, col.tableColumnId, view),
            positions: (row[col.lookup] > 0) ? [ 'top', 'bottom' ] : [ 'bottom', 'top' ],
            trigger: 'now'
        });
        if (cc.orientation == 'down')
        { rObj.tip.adjustPosition({
            left: yScale(row[col.lookup])
        }); }
        else if (cc.orientation == 'right')
        { rObj.tip.adjustPosition({
            top: (row[col.lookup] > 0) ? 0 : Math.abs(yScale(0) - yScale(row[col.lookup])),
            left: ($.browser.msie && ($.browser.majorVersion < 9)) ? 0 : (cc.barWidth / 2)
        }); }
if ((blist.debug || {}).flyout) { console.log(yScale(row[col.lookup])); window.footip = rObj.tip; window.fooyscale = yScale; }
        view.highlightRows(row, null, col);
    },

    handleMouseOut: function(rObj, colDef, row, yScale)
    {
        var vizObj = this,
            view = vizObj._primaryView;

        view.unhighlightRows(row);
    }

}, null, 'socrataChart', [ 'd3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);
