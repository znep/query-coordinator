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

$.Control.registerMixin('d3_virt_scrolling', {

    defaults: {
        barWidthBounds: [ 20, 200 ], // width of the bar, of course
        barSpacingBounds: [ 0, 20 ], // within row (between series) spacing
        rowSpacingBounds: [ 30, 100 ], // between row spacing
        sidePaddingBounds: [ 20, 200 ], // sides of window
        rowBuffer: 30, // additional rows to fetch on either side of the actual visible area
        valueLabelBuffer: 100, // amount of room to leave for each row' label
        dataMaxBuffer: 30, // amount of room to leave in actual chart area past the max bar
        smallModeThreshold: 400, // Height below which small mode is triggered (px).
        largeLegendMaxLineThreshold: 15, // If we've got more than this amount of lines in the legend, switch the legend only to small mode.
        minYSizeForLegend: 140 // If the y-axis is less than this (px), we hide the legend to try and display something useful.
                               // We only hide the legend if we're reserving space for it (as opposed to just overlaying it).
    },

    // These functions are abstract. You must override them.
    _calculateRowWidth: this.Model.pureVirtual,
    _xDatumPosition: this.Model.pureVirtual,
    _yDatumPosition: this.Model.pureVirtual,
    // Returns a translation along X for an error bar.
    _errorBarTransform: this.Model.pureVirtual,

    initializeVisualization: function()
    {
        var vizObj = this;

        // Clone the defaults, as we modify them to account for various situations.
        // We don't want to propagate the defaults to every instance. Ideally,
        // we'll replace these defaults with smart getters and setters to avoid
        // having to do this.
        vizObj.defaults = $.extend(true, {}, vizObj.defaults);

        // own object to save temp stuff on
        var cc = vizObj._chartConfig = {};

        // if we need to do series grouping stuff, mix that in before anything else
        // It should be safe to mix this in even without grouping, but this saves
        // some work (note that we never un-mix if grouping gets disabled on this
        // chart).
        vizObj.getColumns();
        if (vizObj.requiresSeriesGrouping() &&
            $.isBlank(vizObj._seriesGroupingSentinel)) // but don't do this if it's already been done
        {
            vizObj.Class.addProperties(vizObj, d3ns.base.seriesGrouping, $.extend({}, vizObj));
            return vizObj.initializeVisualization(); // reset call chain
        }

        cc.orientation = vizObj.getOrientation();

        cc.dataDim = (function(orientation) {
            return {
                'down': {
                    'width': 'height',
                    'scroll': 'scrollTop',
                    'position': 'top',
                    'xAxis': 'y',
                    'yAxis': 'x',
                    'height': 'width',
                    'dir': 1,
                    pluckX: function (x, y) { return y; },
                    pluckY: function (x, y) { return x; },
                    asScreenCoordinate: function(chartX, chartY)
                    {
                        return { x: chartY, y: chartX };
                    }
                },
                'right': {
                    'width': 'width',
                    'scroll': 'scrollLeft',
                    'position': 'left',
                    'xAxis': 'x',
                    'yAxis': 'y',
                    'height': 'height',
                    'dir': -1,
                    pluckX: function (x, y) { return x; },
                    pluckY: function (x, y) { return y; },
                    asScreenCoordinate: function(chartX, chartY)
                    {
                        return { x: chartX, y: chartY };
                    }
                }
            }[orientation];
        })(cc.orientation);

        // create and cache dom elements
        var $dom = vizObj.$dom();
        $dom.empty().append($.tag(
            { tagName: 'div', 'class': 'chartArea barChart orientation' + $.capitalize(cc.orientation), contents: [
                { tagName: 'div', 'class': 'chartOuterContainer', contents: [
                    { tagName: 'div', 'class': 'chartContainer', contents: [
                        { tagName: 'div', 'class': 'chartRenderArea',
                          contents: '&nbsp;' }, // if no contents, browser doesn't bother to scroll
                        ] },
                        { tagName: 'div', 'class': 'tickContainer' },
                        { tagName: 'div', 'class': 'baselineContainer', contents: [
                            { tagName: 'div', 'class': 'baselineBg' },
                            { tagName: 'div', 'class': 'baselineLine' }
                    ] }] },
                { tagName: 'div', 'class': 'legendContainer' }
            ] }
        , true));
        cc.$chartArea = $dom.find('.chartArea');
        cc.$chartOuterContainer = $dom.find('chartOuterContainer');
        cc.$chartContainer = $dom.find('.chartContainer');
        cc.$chartRenderArea = $dom.find('.chartRenderArea');
        cc.$tickContainer = $dom.find('.tickContainer');
        cc.$baselineContainer = $dom.find('.baselineContainer');
        cc.$legendContainer = $dom.find('.legendContainer');

        // for positioning
        $dom.css('position', 'relative');
        $dom.css('overflow', 'hidden');

        // default draw element position and left offset are 0
        cc.drawElementPosition = 0;
        cc.dataOffset = 0;
        cc.scrollPos = cc.$chartContainer[cc.dataDim.scroll]();

        // init our renderers
        cc.chartRaphael = new Raphael(cc.$chartContainer.get(0), 10, 10);
        cc.chartD3 = d3.raphael(cc.chartRaphael);
        cc.chartHtmlD3 = d3.select(cc.$chartRenderArea.get(0));
        cc.chromeD3 = d3.select(cc.$tickContainer.get(0));

        // find and set up the draw elem
        cc.$drawElement = cc.$chartContainer.children(':not(.chartRenderArea)');
        cc.$drawElement.css({ 'position': 'absolute', 'top': '0' });

        // maybe move things around and maybe grab rows every half second when they're scrolling
        var throttledScrollHandler = _.throttle(_.debounce(function()
        {

            // cache scrollPos so that aggressive scrolling doesn't make our calculations stutter.
            cc.scrollPos = cc.$chartContainer[cc.dataDim.scroll]();

            vizObj._recalculateDataOffset();
            if (vizObj._repositionDrawElement())
            {
                vizObj._rerenderPositions();
            }
            vizObj.getDataForAllViews();
        }, 500), 500);
        cc.$chartContainer.scroll(throttledScrollHandler);

        cc.doResizeHandle = function()
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
        };

        // allow the baseline to be draggable
        var throttledResize = _.throttle(_.debounce(function() { vizObj.resizeHandle(); }, 500), 500); // TODO: this is more blunt than we need
        cc.$baselineContainer.draggable({
            axis: cc.dataDim.yAxis,
            containment: 'parent', // TODO: bounded containment on viewport change
            drag: function(event, ui)
            {
                cc.valueLabelBuffer = cc.dataDim.pluckY(
                    ui.position.left,
                    cc.chartHeight - ui.position.top);
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

    // Goes through the _displayFormat and enforces some invariants we need.
    // The purpose of this method is to make us tolerant to mild _displayFormat
    // abuse, and still render where possible.
    cleanDisplayFormat: function()
    {
        var vizObj = this,
            df = vizObj._displayFormat,
            plot = df.plot;

        // Error bars must come in valid pairs.
        if (plot && (plot.errorBarLow || plot.errorBarHigh))
        {
            var lowErrorBarColumn = vizObj._primaryView.columnForIdentifier(plot.errorBarLow);
            var highErrorBarColumn = vizObj._primaryView.columnForIdentifier(plot.errorBarHigh);
            if (!(lowErrorBarColumn && highErrorBarColumn))
            {
                delete plot.errorBarLow;
                delete plot.errorBarHigh;
            }
        }

        // Min <= Max
        var explicitMin = parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'min'));
        var explicitMax = parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'max'));
        if (explicitMax < explicitMin)
        {
            delete vizObj._displayFormat.yAxis.min;
            delete vizObj._displayFormat.yAxis.max;
        }

        vizObj._super();
    },

    getOrientation: function()
    {
        var vizObj = this;

        // domain orientation - column charts go right; bar charts go down
        // TODO: This stuff is here for debugging purposes.
        //cc.orientation = 'down';
        //cc.orientation = 'right';
        if (foobar = $.urlParam(window.location.href, 'orientation')) { return foobar; }
        else { return vizObj._chartType.indexOf('column') > -1 ? 'right' : 'down'; }
    },

    cleanVisualization: function()
    {
        var vizObj = this;

        delete vizObj._chartConfig;

        vizObj._super();
    },

    requiresSeriesGrouping: function()
    {
        return _.isArray(this._displayFormat.seriesColumns) &&
            (this._seriesColumns && this._seriesColumns.length > 0); // Can be zero length if series columns are invalid (bad string subst, etc).
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
        var vizObj = this;

        vizObj._computeMinMaxForEntireChart(data);

        vizObj._renderData(data);
    },

    _computeYValuesForRow: function(row, relevantColumns)
    {
        return _.map(relevantColumns, function(col)
            {
                if (row.invalid[col.lookup]) { return null; }
                // use matchValue to get canonical representation of data
                return col.dataType.matchValue ? col.dataType.matchValue(row[col.lookup]) : row[col.lookup];
            });
    },

    _computeMinMaxForEntireChart: function(data)
    {
        var vizObj = this,
            valueColumns = vizObj.getValueColumns();

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
            return values.concat(vizObj._computeYValuesForRow(row, relevantColumns));
        }, []);

        vizObj._chartConfig.maxValue = d3.max(allValues) || 0; // cache off maxValue for other renders
        vizObj._chartConfig.minValue = d3.min(allValues) || 0; // etc
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
            rowsPerScreen = Math.ceil(cc.$chartContainer[cc.dataDim.width]() / cc.rowWidth);

        var start = Math.max(Math.floor(xScale(cc.scrollPos)) - vizObj.defaults.rowBuffer, 0);
        var length = rowsPerScreen + (vizObj.defaults.rowBuffer * 2);

        return { start: start, length: length };
    },

    resizeHandle: function()
    {
        var vizObj = this;

        if (!vizObj._chartConfig || !vizObj._chartConfig.$chartContainer)
        {
            // we haven't loaded yet but are being told to resize. init load
            // will size correctly anyway then so whatev.
            return;
        }

        if (vizObj._chartConfig.$chartContainer.filter(':visible').length === 0)
        {
            // We've been resized to invisibility. Do nothing.
            return;
        }
        else if (!$.isBlank(vizObj._chartConfig.maxValue))
        {
            // if we don't have totalRows yet then the sizing will be taken care
            // of shortly anyway, so only resize otherwise
            vizObj._chartConfig.doResizeHandle();
        }
        else
        {
            // However, we still want to calculate our sizing just in case
            // we don't get called back.
            vizObj._resizeEverything();
        }
    },

    $legendContainer: function()
    {
        return this._chartConfig.$legendContainer;
    },

    _updateSizeBasedStyling: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var smallestDimension = Math.min(vizObj.$dom().height(), vizObj.$dom().width());
        var needsSmallMode = smallestDimension < vizObj.defaults.smallModeThreshold;
        cc.$chartArea.toggleClass('smallMode', needsSmallMode);

        vizObj._updateLegendStyle();
    },

    _updateLegendStyle: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;
            $legendContainer = vizObj.$legendContainer(),
            legendPosition = vizObj.legendPosition();

        $legendContainer.toggleClass('smallMode', $legendContainer.find('.legendLine').length > vizObj.defaults.largeLegendMaxLineThreshold);

        var shouldHideLegend = false;
        var enableLegendHidingLogic = false;

        // We'll hide the legend if it would shrink the graph drawing area.
        // For cases like orientation=down and legendPosition=top, it's fine to
        // leave the legend as we just overlay it on the bars instead of
        // reserving space for it.
        if (vizObj._chartConfig.orientation == 'right')
        {
            enableLegendHidingLogic = (legendPosition == 'bottom') || (legendPosition == 'top');
        }
        else
        {
            enableLegendHidingLogic = (legendPosition == 'left') || (legendPosition == 'right');
        }


        if (enableLegendHidingLogic)
        {
            var yHeight = cc.dataDim.pluckY(vizObj.$dom().width(), vizObj.$dom().height());
            shouldHideLegend = yHeight < vizObj.defaults.minYSizeForLegend;
        }

        vizObj.$legendContainer().toggleClass('hide', shouldHideLegend);

        vizObj._chartConfig.$chartArea
            .removeClass('hasTopLegend hasRightLegend hasBottomLegend hasLeftLegend hasNoLegend');

        if (shouldHideLegend)
        {
            // If we've explicitly hidden the legend, style as if we didn't
            // have a legend at all.
            vizObj._chartConfig.$chartArea.addClass('hasNoLegend');
        }
        else
        {
            vizObj._chartConfig.$chartArea.addClass('has' + $.htmlEscape(legendPosition || 'No').capitalize() + 'Legend');
        }

        // Calculate the new valueLabelBuffer and dataMaxBuffer.
        // this is messy. what's a better way? Possibly make a getter method
        // for valueLabelBuffer and dataMaxBuffer. These methods would preferentially
        // return an explicitly-set value, otherwise fall back to the math we use
        // below.
        var isSmallMode = vizObj._chartConfig.$chartArea.hasClass('smallMode');
        vizObj.defaults.valueLabelBuffer = isSmallMode ? 60 : 100;
        vizObj.defaults.dataMaxBuffer = 30;
        if (vizObj._chartConfig.orientation == 'right')
        {
            if (legendPosition == 'bottom')
            {
                vizObj.defaults.valueLabelBuffer = (isSmallMode ? 60 : 100) + $legendContainer.height();
            }
            else if (legendPosition == 'top')
            {
                vizObj.defaults.valueLabelBuffer = (isSmallMode ? 60 : 100) + $legendContainer.height();
                vizObj.defaults.dataMaxBuffer = 30 + $legendContainer.height();
            }
        }

        // Our top legend margin sadly must be determined in code for this set
        // of configuration options.
        if (vizObj._chartConfig.orientation == 'right' &&
            ((legendPosition == 'left') || (legendPosition == 'right')))
        {
            $legendContainer.css('margin-top', -1 * $legendContainer.height() / 2);
        }
        else
        {
            $legendContainer.css('margin-top', '');
        }
    },

    renderLegend: function()
    {
        var vizObj = this;;

        vizObj._super();

        vizObj._updateLegendStyle();
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
        var $label = cc.$chartArea.find('.xLabelHoriz');
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
            chartArea = cc.$chartContainer[cc.dataDim.width](),
            domArea = cc.$chartContainer[cc.dataDim.height](),
            maxRenderWidth = vizObj._maxRenderWidth(),
            barWidthBounds = defaults.barWidthBounds,
            barSpacingBounds = defaults.barSpacingBounds,
            rowSpacingBounds = defaults.rowSpacingBounds,
            sidePaddingBounds = defaults.sidePaddingBounds;

        var effectiveSeriesCount = vizObj._getDatumCountPerGroup();

        // if we don't have value columns or total rows, bail
        // for now. we'll be called again later.
        if (effectiveSeriesCount == 0 || $.isBlank(totalRows)) { return; }

        vizObj._updateSizeBasedStyling();

        // save off old row width for comparison later (see below)
        var oldRowWidth = cc.rowWidth;
        var oldSidePadding = cc.sidePadding;

        var calculateTotalWidth = function()
        {
            return (vizObj._calculateRowWidth() * totalRows) + (2 * cc.sidePadding)
                    - cc.rowSpacing + defaults.dataMaxBuffer;
        };

        // if we only have one series, allow all the bars
        // to collapse together
        if (effectiveSeriesCount === 1)
        {
            rowSpacingBounds = [ 2, rowSpacingBounds[1] ];
        }

        // assume minimum possible width
        cc.barWidth = barWidthBounds[0];
        cc.barSpacing = barSpacingBounds[0];
        cc.rowSpacing = rowSpacingBounds[0];
        cc.sidePadding = sidePaddingBounds[0];

        // for col/bar parameterization: swapping width/height so that the correct value goes in
        var setRaphaelSize = function(height, width)
        {
            var size = cc.dataDim.asScreenCoordinate(width, height);
            cc.chartRaphael.setSize(size.x, size.y);
        };

        var minTotalWidth = calculateTotalWidth();
        var areas = cc.dataDim.asScreenCoordinate('chartWidth', 'chartHeight');
        if (minTotalWidth > chartArea)
        {
            // we're bigger than we need to be. set the render area size
            // to be what we calculated.
            setRaphaelSize(domArea, Math.min(minTotalWidth, maxRenderWidth));
            cc.$chartRenderArea[cc.dataDim.width](minTotalWidth);
            cc[areas.x] = minTotalWidth;

            // scrollbar should have appeared. reresize.
            var renderHeight = cc.$chartContainer[cc.dataDim.pluckY('renderWidth', 'renderHeight')]();
            setRaphaelSize(renderHeight, Math.min(minTotalWidth, maxRenderWidth));
            cc[areas.y] = renderHeight;
        }
        else
        {
            // set our sizing to equal vis area
            setRaphaelSize(domArea, Math.min(chartArea, maxRenderWidth));
            cc.$chartRenderArea[cc.dataDim.width](chartArea);

            cc[areas.x] = chartArea;
            cc[areas.y] = domArea;

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
                                totalRows * (effectiveSeriesCount * (-barWidthBounds[0] -
                                                           barSpacingBounds[0]) +
                                             barSpacingBounds[0] -
                                             rowSpacingBounds[0]) -
                                2 * sidePaddingBounds[0];
                var denominator = totalRows * (effectiveSeriesCount * (barWidthBounds[1] -
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
        cc.rowWidth = vizObj._calculateRowWidth();

        // set margin
        if (cc.orientation == 'right')
        { cc.$chartContainer.css('margin-bottom', cc.chartHeight * -1); }
        else
        { cc.$chartContainer.css('margin-right', cc.chartWidth * -1); }

        // move baseline
        cc.$baselineContainer.css(cc.dataDim.pluckY('left', 'top'), vizObj._yAxisPos());

        // return whether our row width has changed, so we know
        // if we'll have to move some things around
        return ((oldRowWidth != cc.rowWidth) || (oldSidePadding != cc.sidePadding));
    },

    // Lets the sizing algorithm know how many side-by-side data columns we
    // intend upon having per group.
    // Sounds confusing, but this is effectively the number of series that
    // need to be lined up along X. This is usually the number of value columns.
    // For things like stacked bars, this is 1.
    _getDatumCountPerGroup: function()
    {
        return (this.getValueColumns() || []).length;
    },

    // accounts for screen scaling
    _recalculateDataOffset: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var xScale = vizObj._currentXScale();

        cc.dataOffset = 0; // need to first set to zero to remove influence.

        var index = xScale(cc.scrollPos);
        // FIXME: This works for counts of at least 100k. I'm calling that Good Enough.
        if (index >= 0 && cc.drawElementPosition > 0)
        {
            cc.dataOffset = vizObj._xDatumPosition(0)({ index: index }) -
                            (cc.scrollPos - cc.drawElementPosition) +
                            (cc.sidePadding * cc.scrollPos / d3.max(xScale.domain()));
        }
    },

    // moves the svg/vml element around to account for it's not big enough
    _repositionDrawElement: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            scrollPosition = cc.scrollPos,
            chartAreaWidth = cc.$chartContainer[cc.dataDim.width](),
            drawElementPosition = parseFloat(cc.$drawElement.position()[cc.dataDim.position]),
            drawElementWidth = vizObj._maxRenderWidth();

        if ((scrollPosition < drawElementPosition) ||
            (scrollPosition > (drawElementPosition + drawElementWidth - chartAreaWidth)))
        {
            cc.drawElementPosition = $.clamp(scrollPosition - Math.floor(drawElementWidth / 2),
                                             [ 0, Math.ceil(cc.dataDim.pluckX(cc.chartWidth, cc.chartHeight) - drawElementWidth) ]);

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
        return vizObj._chartConfig.dataDim.pluckY(
            vizObj._chartConfig.valueLabelBuffer || vizObj.defaults.valueLabelBuffer,
            vizObj._chartConfig.chartHeight
                - (vizObj._chartConfig.valueLabelBuffer || vizObj.defaults.valueLabelBuffer));
    },

    // calculates a y scale based on the current set of data
    _currentYScale: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            explicitMin = parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'min')),
            explicitMax = parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'max')),
            rangeMax = cc.dataDim.pluckY(cc.chartWidth - vizObj._yAxisPos(),
                                         vizObj._yAxisPos());

        return d3.scale.linear()
            .domain([ !_.isNaN(explicitMin) ? explicitMin : Math.min(0, cc.minValue),
                      !_.isNaN(explicitMax) ? explicitMax : Math.max(0, cc.maxValue) ])
            .range([ 0, Math.max(0, rangeMax - vizObj.defaults.dataMaxBuffer) ])
            .clamp(true);
    },

    // should be a 1:1 mapping unless the browser's render container has truncated
    _currentXScale: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var chartArea = cc.$chartContainer[cc.dataDim.width](),
            rowsPerScreen = Math.ceil(chartArea / cc.rowWidth);

        return d3.scale.linear()
              .domain([ 0, cc.$chartRenderArea[cc.dataDim.width]() - chartArea ])
              .range([ 0, vizObj.getTotalRows() - rowsPerScreen ])
              .clamp(true)
    },

    // renders tick lines in general
    _renderTicks: function(oldYScale, newYScale, isAnim)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            yAxisPos = vizObj._yAxisPos();

        // determine our ticks
        var idealTickCount = cc[cc.dataDim.pluckY('chartWidth', 'chartHeight')] / 80;
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

        var valueMarkerPosition = cc.dataDim.pluckY(
            function(yScale)
            { return function(d) { return (yAxisPos + yScale(parseFloat(d.atValue))) + 'px'; }; },
            function(yScale)
            { return function(d) { return (yAxisPos - yScale(parseFloat(d.atValue))) + 'px'; } });

        var valueMarkers = cc.chromeD3.selectAll('.valueMarkerContainer')
            .data(vizObj._displayFormat.valueMarker);

        valueMarkers
            .enter().append('div')
                .classed('valueMarkerContainer', true)
                .style(cc.dataDim.pluckY('left', 'top'), valueMarkerPosition(oldYScale))
                .each(function(d)
                {
                    var $this = $(this);

                    // need to jQuery each rather than .html and .on because ie
                    $this.append($.tag([
                        { tagName: 'div', 'class': 'markerBg', style: { 'background-color': d.color } },
                        { tagName: 'div', 'class': 'markerLine', style: { 'border-color': d.color } }
                    ], true));
                    $this.socrataTip({
                        message: $.htmlEscape(d.caption),
                        positions: [ 'top', 'bottom' ]
                    });
                });
        valueMarkers
            .transition()
                .duration(isAnim ? 1000 : 0)
                .style(cc.dataDim.pluckY('left', 'top'), valueMarkerPosition(newYScale));
        valueMarkers
            .exit()
            .transition()
                .remove();
    },

    _formatYAxisTicks: function(formatter)
    {
        // If the "Y-Axis Formatting" sidebar section isn't open,
        // formatter.abbreviate = true isn't passed through. Default it to true.
        formatter = formatter || { abbreviate: true };

        if (formatter.abbreviate === true)
        {
            // humane number requires a precision. so, our "auto" really just
            // means 2 in this case.
            var decimalPlaces = formatter.decimalPlaces || 2;
            return function(num) {
                return Math.abs(num) >= 1000 ? blist.util.toHumaneNumber(num, decimalPlaces)
                                             : num.toFixed(decimalPlaces);
            };
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

        return function(d)
        {
            var x = 0;

            // We talk about high and low error bars, but really the two
            // are interchangeable.
            var errA = d[highCol.lookup];
            var errB = d[lowCol.lookup];
            var high = Math.max(errA, errB);
            var low = Math.min(errA, errB);

            if (cc.orientation == 'right')
            {
                var x = 0;
                var y = yAxisPos - yScale(high);
                var height = yScale(high) - yScale(low);

                // TODO: uuurrrreeeeghhhhhhh
                return 'M' + (x - capWidth) + ',' + y + 'H' + (x + capWidth) +
                       'M' + x + ',' + y + 'V' + (y + height) +
                       'M' + (x - capWidth) + ',' + (y + height) + 'H' + (x + capWidth);
            }
            else
            {
                var x = 0;
                var y = yAxisPos + yScale(low) + 1;
                var height = yScale(high) - yScale(low);

                // TODO: uuurrrreeeeghhhhhhh
                return 'M' + y + ',' + (x - capWidth)  + 'V' + (x + capWidth) +
                       'M' + y + ',' + x + 'H' + (y + height) +
                       'M' + (y + height) + ',' + (x - capWidth) + 'V' + (x + capWidth);
            }
        };
    },

    handleMouseOver: function(rObj, colDef, row, yScale)
    {
        var vizObj = this,
            view = vizObj._primaryView,
            col = colDef.column,
            cc = vizObj._chartConfig;

        var lessThanZeroPositioning =
            cc.dataDim.pluckY(['top-left', 'bottom-left'],
                              ['bottom', 'top']);

        var greaterThanZeroPositioning =
            cc.dataDim.pluckY(['top-right', 'bottom-right'],
                              ['top', 'bottom']);

        rObj.tip = $(rObj.node).socrataTip(
        {
            content: vizObj.renderFlyout(row, col.tableColumnId, view),
            positions: (row[col.lookup] > 0) ? greaterThanZeroPositioning : lessThanZeroPositioning,
            trigger: 'now'
        });

        if ((blist.debug || {}).flyout)
        {
            console.log(yScale(row[col.lookup]));
            window.footip = rObj.tip;
            window.fooyscale = yScale;
        }

        view.highlightRows(row, null, col);
    },

    handleMouseOut: function(rObj, colDef, row, yScale)
    {
        var vizObj = this,
            view = vizObj._primaryView;

        view.unhighlightRows(row);
        if (rObj.tip)
        {
            rObj.tip.destroy();
            delete rObj.tip;
        }
    }

}, null, 'socrataChart', [ 'd3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);
