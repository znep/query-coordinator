// future improvements:
// * make chartArea margins more like named filters rather than depending on css
// * make d3 element rendering more like composing functions; create an object that contains
//   the create/update/remove components of a selection, have a small army of functions that
//   operate on those objects. Makes the different kinds of rerenders less stupid to manage.
// * kill seriesgrouping and remove its weird timing and oo injection hacks
// * possible major perf boost out of moving bar rendering back into an html div-based solution.
//   i tried to do this at one point but ran into z-index issues with error markers. now that
//   there is the canonical chartRenderArea and nullRenderArea to place html components in, it should be possible
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
        minYSizeForLegend: 140, // If the y-axis is less than this (px), we hide the legend to try and display something useful.
                                // We only hide the legend if we're reserving space for it (as opposed to just overlaying it).
        errorBarCapWidth: 8, // Size of cap on top and bottom of error bars.
        fallbackForNullRange: 1 // If we have a zero magnitude range, fall back to a range of this magnitude centered about the actual null range.
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

        cc.yAxis = { min: parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'min')),
                     max: parseFloat($.deepGet(vizObj, '_displayFormat', 'yAxis', 'max')) };

        // The '|| 0' is safe for _currentYScale. Double check before re-use.
        var valueMarkers = _.map(_.map(_.pluck(vizObj._displayFormat.valueMarker, 'atValue'),
            $.numericalSanitize), parseFloat);
        cc.valueMarkerLimits = { min: d3.min(valueMarkers),
                                 max: d3.max(valueMarkers) };

        cc.valueLabelBuffer = vizObj._displayFormat.valueLabelBuffer;

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
            { tagName: 'div', 'class': 'mondrian barChart orientation' + $.capitalize(cc.orientation), contents: [
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
                { tagName: 'div', 'class': 'legendContainer', contents: [
                    { tagName: 'div', 'class': 'legendLines' }
                ]},

                { tagName: 'div', 'class': 'overlayContainer'}
            ] }
        , true));

        cc.$chartArea = $dom.find('.mondrian');
        cc.$chartOuterContainer = $dom.find('.chartOuterContainer');
        cc.$chartContainer = $dom.find('.chartContainer');
        cc.$chartRenderArea = $dom.find('.chartRenderArea');
        cc.$tickContainer = $dom.find('.tickContainer');
        cc.$baselineContainer = $dom.find('.baselineContainer');
        cc.$legendContainer = $dom.find('.legendContainer');

        cc.$overlayContainer = $dom.find('.overlayContainer');

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


        //Append and cache null bar render area after drawElement binding
        cc.$chartContainer.prepend(
            $.tag({ tagName: 'div', 'class': 'nullRenderArea' })
        );
        cc.$nullRenderArea = cc.$chartContainer.find('.nullRenderArea');


        //continue renderer initialization
        cc.chartHtmlD3 = d3.select(cc.$chartRenderArea.get(0));
        cc.chartNullD3 = d3.select(cc.$nullRenderArea.get(0));
        cc.chromeD3 = d3.select(cc.$tickContainer.get(0));

        // find and set up the draw elem
        cc.$drawElement = cc.$chartContainer.children(':not(.chartRenderArea, .nullRenderArea)');
        cc.$drawElement.css({ 'position': 'absolute', 'top': '0' });

        vizObj._setChartOverlay(null); // Initialize the chart overlay.

        // maybe move things around and maybe grab rows every half second when they're scrolling
        var throttledScrollHandler = _.throttle(_.debounce(function()
        {
            if (!vizObj._chartInitialized) { return; }
            // cache scrollPos so that aggressive scrolling doesn't make our calculations stutter.
            cc.scrollPos = cc.$chartContainer[cc.dataDim.scroll]();
            vizObj.debugOut('Scroll: ', cc.scrollPos);

            if (blist.mainSpinner)
            { blist.mainSpinner.setMetric(null); }

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
            if (!vizObj._chartInitialized) { return; }

            vizObj.debugOut('doResizeHandle');
            // maybe recalculate all the sizing
            var needsReposition = vizObj._resizeEverything();
            // maybe reposition the svg/vml elem
            needsReposition = vizObj._repositionDrawElement() || needsReposition;
            // calculate our left offset to account for screen scaling
            vizObj._recalculateDataOffset();
            // reposition the elems vertically
            vizObj._rerenderAxis();
            // reposition the elems horizonally if necessary
            vizObj.debugOut('needsRep: '+needsReposition);
            if (needsReposition) vizObj._rerenderPositions();
            // maybe fetch some more rows if more are exposed
            vizObj.getDataForAllViews();
        };

        // allow the baseline to be draggable
        cc.throttledResize = _.throttle(_.debounce(function() { vizObj.resizeHandle(); }, 500), 500); // TODO: this is more blunt than we need
        cc.$baselineContainer.draggable({
            axis: cc.dataDim.yAxis,
            containment: 'parent', // TODO: bounded containment on viewport change
            drag: function(event, ui)
            {
                if (!vizObj._chartInitialized) { return; }
                vizObj.moveBaseline(cc.dataDim.pluckY(
                    ui.position.left,
                    cc.chartHeight - ui.position.top));
            },
            scroll: false,
            start: function() { cc._isDragging = true; },
            stop: function() {
                if (!vizObj._chartInitialized) { return; }
                cc._isDragging = false;
                vizObj._primaryView.update({ displayFormat: $.extend(true, {},
                    vizObj._primaryView.displayFormat, { valueLabelBuffer: cc.valueLabelBuffer }) });
            }
        });

        vizObj._drawAxisLabels();

        vizObj._super();
    },

    moveBaseline: function(fromLeftBottom)
    {
        var cc = this._chartConfig;

        // Default.
        if (!fromLeftBottom)
        {
            fromLeftBottom = 0;
            cc.chartD3.selectAll('.rowLabel').each(function()
            { fromLeftBottom = Math.max(fromLeftBottom, this.visualLength); });

            if (cc.orientation == 'right' && this.legendPosition() == 'bottom')
            { fromLeftBottom += cc.$legendContainer.height() + 5; }

            fromLeftBottom = Math.max(this.defaults.valueLabelBuffer, fromLeftBottom);
        }

        // Between 5 and chartHeight/2.
        fromLeftBottom = Math.max(5,
            Math.min(fromLeftBottom, cc.dataDim.pluckY(cc.chartWidth, cc.chartHeight) * 0.50)
        );

        cc.$baselineContainer.css(cc.dataDim.pluckY('left', 'top'), fromLeftBottom + 'px');
        this.debugOut('Moving baseline: ' + fromLeftBottom);
        cc.valueLabelBuffer = fromLeftBottom;
        cc.throttledResize();
    },

    // Sets a DOM element to overlay the chart.
    _setChartOverlay: function($overlayDom)
    {
        var hasOverlayContainer = $.subKeyDefined(this, '_chartConfig.$overlayContainer');

        var $targetElement;
        if (hasOverlayContainer)
        {
            $targetElement = this._chartConfig.$overlayContainer;
        }
        else
        {
            // We were called before we got an initializeVisualization (probably
            // due to DSG intercepting that call). Temporarily hack in a skeleton
            // DOM.
            var $targetElementContainer = $("<div class='mondrian'/>");
            $targetElement = $("<div class='overlayContainer'/>");
            $targetElementContainer.append($targetElement);
            this.$dom().append($targetElementContainer);
        }

        if ($overlayDom)
        {
            $targetElement.css('visibility', 'visible');
            $targetElement.empty().append($overlayDom);
        }
        else
        {
            // TODO implement this case if needed later.
            if(!hasOverlayContainer)
            {
                this.debugOut('Clearing overlay not supported in this case.');
                return;
            }
            $targetElement.css('visibility', 'collapse');
        }
    },

    // Hides or shows the chart render area.
    _setChartVisible: function(isVisible)
    {
        var cc = this._chartConfig;
        cc.$chartArea.toggleClass('chartHidden', !isVisible);
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

        if (this._chartInitialized)
        {
            vizObj.renderData([]);

            var oldYScale = vizObj._lastYScale();
            vizObj._renderValueMarkers([], oldYScale, oldYScale, false);

            delete vizObj._chartConfig;
        }

        if (blist.mainSpinner)
        { blist.mainSpinner.setMetric('main'); }

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

        if (!vizObj._chartInitialized) { return; }

        vizObj._computeMinMaxForEntireChart(data);

        vizObj._renderData.apply(vizObj, arguments);

        if (vizObj.requiresSeriesGrouping()
            ||_.size(vizObj._primaryView.loadedRows())
                >= Math.min(vizObj._primaryView.totalRows(), vizObj.getRenderRange().length))
        { vizObj.initialRenderDone(); }
    },

    _computeYValuesForRow: function(row, relevantColumns)
    {
        return _.map(relevantColumns, function(col)
            {
                if (row.invalid[col.lookup]) { return null; }
                // use matchValue to get canonical representation of data
                return col.renderType.matchValue ? col.renderType.matchValue(row.data[col.lookup]) : row.data[col.lookup];
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

    handleDataChange: function()
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

        vizObj.debugOut('resizeHandle');

        if (!vizObj._chartConfig || !vizObj._chartConfig.$chartContainer)
        {
            // we haven't loaded yet but are being told to resize. init load
            // will size correctly anyway then so whatev.
            return;
        }

        d3.timer.flush();

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

        // The ordering of these two is important - legend takes precedence,
        // labels react to that.
        vizObj._updateLegendStyle();
        vizObj._updateLabelPositioning();
    },

    _updateLabelPositioning: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var extraYLabelLeftMargin = 2;
        var extraYLabelTopMargin = -25;
        var chartLeftMarginForYLabelVert = 5;

        var $yLabelVert = cc.$chartArea.find('.yLabelVert');
        var $xLabelHorizFloating = cc.$chartArea.find('.xLabelHoriz.floatingAxisLabel');

        // Okay. Here there be dragons. Basically we want our vertical label to
        // sit against the side of the screen, centered vertically.
        // So, we apply a 90* rotation to it, but this is only a rendering
        // transform, not a layout. We've tried lots of magical CSS incantations
        // to center vertically, but all had problems. So we gave up and are now
        // using JS.
        if ($yLabelVert.exists())
        {
            // Length we want to give the text. In other words, the width
            // pre-rotation.
            var textReflowLength = cc.$chartOuterContainer.height();

            // Sometimes we add extra margins here. We need to account for them
            // (label should be centered about the chart data area, not the
            // whole chart).
            var outerMarginTop = cc.$chartOuterContainer.margin().top;
            var outerLeft = cc.$chartOuterContainer.position().left;
            var outerTop = cc.$chartOuterContainer.position().top;

            // Make the text wrap.
            $yLabelVert.width(textReflowLength);

            // Find out the size of the text across the line breaks. In other
            // words, the height of the text pre-rotation.
            var textHeight = $yLabelVert.height();

            // Move the text down so it's centered vertically.
            // The ie8 clause is there because IE transforms about the top-left
            // of the text, while others go about the center.
            $yLabelVert.css('top', textReflowLength/2 + outerMarginTop - (vizObj._isIE8() ? textReflowLength/2 : 0) + extraYLabelTopMargin + outerTop);

            // Move the text right so all of it is visible.
            $yLabelVert.css('left', -textReflowLength/2 + textHeight/2 + outerLeft + extraYLabelLeftMargin);
        }

        // Yes, height (it's rotated). Well, except for IE. It does it wrong-right.
        var yLabelVertSizeX = $yLabelVert.exists() ? (vizObj._isIE8() ? $yLabelVert.width() + $yLabelVert.position().left : $yLabelVert.height()) : 0;

        // In this case, the legend and the y axis don't share the same container,
        // so we can't do the fancy legend overlay thingy.
        if (vizObj._chartConfig.orientation == 'down' && vizObj.legendPosition() != 'top')
        {
            cc.$chartOuterContainer.css('margin-top', cc.$chartArea.find('.xLabelHoriz').height() + chartLeftMarginForYLabelVert);
        }

        if (vizObj._chartConfig.orientation == 'right')
        {
            cc.$chartOuterContainer.css('margin-left', yLabelVertSizeX > 0 ? (yLabelVertSizeX + chartLeftMarginForYLabelVert) : 0 );
        }

        var labelAreaLeftBound = 0;
        var labelAreaRightBound = 0;
        var outerMarginLeft = cc.$chartOuterContainer.margin().left;
        var outerLeft = cc.$chartOuterContainer.position().left;
        if (cc.orientation == 'down')
        {
            labelAreaLeftBound = (cc.valueLabelBuffer || vizObj.defaults.valueLabelBuffer) + outerMarginLeft + outerLeft;
            labelAreaRightBound = cc.$chartArea.width() - cc.$chartOuterContainer.width() - outerLeft;
        }
        else
        {
            labelAreaLeftBound = outerMarginLeft + outerLeft + yLabelVertSizeX;
            labelAreaRightBound = cc.$chartArea.width() - cc.$chartOuterContainer.width() - outerLeft;
        }

        // Bump the left margin so we're centered.
        var extraSpace = cc.$chartArea.width() - labelAreaRightBound - labelAreaLeftBound - $xLabelHorizFloating.width();
        if (extraSpace > 0)
        {
            labelAreaLeftBound += extraSpace / 2;
            labelAreaRightBound -= extraSpace / 2;
        }

        $xLabelHorizFloating.css('margin-left', labelAreaLeftBound);
        $xLabelHorizFloating.css('margin-right', labelAreaRightBound);
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
                // If you mess with this, also mess with impl.bar#_yAxisPos.
                vizObj.defaults.valueLabelBuffer = (isSmallMode ? 60 : 100) + $legendContainer.height();
            }
            else if (legendPosition == 'top')
            {
                vizObj.defaults.valueLabelBuffer = (isSmallMode ? 60 : 100);
                vizObj.defaults.dataMaxBuffer = 30 + $legendContainer.height();
            }
        }

        // Our top legend margin sadly must be determined in code for this set
        // of configuration options.
        if (((legendPosition == 'left') || (legendPosition == 'right')))
        {
            $legendContainer.css('margin-top', -1 * $legendContainer.height() / 2);
        }
        else
        {
            $legendContainer.css('margin-top', '0');
        }

        // ... and in this case, we must set the margins on the outer container
        // to allow for dynamic legend width.
        if ((legendPosition == 'left') || (legendPosition == 'right'))
        {
            cc.$chartOuterContainer.css(legendPosition, $legendContainer.outerWidth(true));
        }
        else
        {
            cc.$chartOuterContainer.css('right', '');
            cc.$chartOuterContainer.css('left', '');
        }

        // In this case, the legend and the y axis share the same container,
        // so we can't do the fancy legend overlay thingy.
        if (vizObj._chartConfig.orientation == 'down' && legendPosition == 'top')
        {
            cc.$chartOuterContainer.css('margin-top', $legendContainer.height());
        }
        else
        {
            cc.$chartOuterContainer.css('margin-top', '');
        }
    },

    renderLegend: function()
    {
        var vizObj = this;;

        vizObj._super();

        vizObj._updateLegendStyle();
    },

    _drawAxisLabels: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        // render y axis label
        if (!$.isBlank(vizObj._displayFormat.titleY))
        {
            var inLegend = cc.orientation == 'down' && vizObj.hasLegend() && vizObj.legendPosition() == 'top';

            var clsname = cc.orientation == 'right' ? 'yLabelVert' : 'xLabelHoriz';
            cc.$chartArea.addClass('has' + $.capitalize(clsname));
            var $label = $.tag({
                tagName: 'div',
                'class': clsname + (inLegend ? '' : ' floatingAxisLabel'),
                contents: $.htmlEscape(vizObj._displayFormat.titleY)
            });

            if (inLegend)
            {
                cc.$legendContainer.append($label);
            }
            else
            {
                cc.$chartArea.append($label);
            }
        }

        // render x axis label
        if (!$.isBlank(vizObj._displayFormat.titleX))
        {
            var clsname = cc.orientation == 'right' ? 'xLabelHoriz' : 'yLabelVert';
            cc.$chartArea.addClass('has' + $.capitalize(clsname));

            var inLegend = cc.orientation == 'right' && vizObj.hasLegend() && vizObj.legendPosition() == 'bottom';

            var $label = $.tag({
                tagName: 'div',
                'class': clsname + (inLegend ? '' : ' floatingAxisLabel'),
                contents: $.htmlEscape(vizObj._displayFormat.titleX)
            });

            if (inLegend)
            {
                cc.$legendContainer.prepend($label);
            }
            else
            {
                cc.$chartArea.append($label);
            }
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

        if (!this._isIE8())
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
            cc = vizObj._chartConfig;
        if ($.isBlank(cc)) { return; }
        var chartD3 = cc.chartD3,
            totalRows = vizObj.getTotalRows(),
            chartArea = cc.$chartOuterContainer[cc.dataDim.width](),
            domArea = cc.$chartOuterContainer[cc.dataDim.height](),
            maxRenderWidth = vizObj._maxRenderWidth(),
            barWidthBounds = defaults.barWidthBounds,
            barSpacingBounds = defaults.barSpacingBounds,
            rowSpacingBounds = defaults.rowSpacingBounds,
            sidePaddingBounds = defaults.sidePaddingBounds;

        var effectiveSeriesCount = vizObj._getDatumCountPerGroup();

        vizObj._updateSizeBasedStyling();

        // xLabel on bar charts will push it down. Readjust for this.
        if (cc.orientation == 'down')
        { chartArea -= cc.$chartArea.find('.xLabelHoriz.floatingAxisLabel').height(); }

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
            cc.chartRaphael.setSize(Math.max(0, size.x), Math.max(0, size.y));
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

            if (cc.orientation == 'right') // Re Bug 11723
            { cc.$chartContainer.css('overflow-x', 'auto'); }
        }
        else
        {
            // set our sizing to equal vis area
            setRaphaelSize(domArea, Math.min(chartArea, maxRenderWidth));
            cc.$chartRenderArea[cc.dataDim.width](chartArea);

            if (cc.orientation == 'right') // Re Bug 11723.
            { cc.$chartContainer.css('overflow-x', 'hidden'); }

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
        if (!vizObj._chartInitialized) { return 0; }

        return (
            vizObj._chartConfig.dataDim.pluckY(
                vizObj._chartConfig.valueLabelBuffer || vizObj.defaults.valueLabelBuffer,
                vizObj._chartConfig.chartHeight
                    - (vizObj._chartConfig.valueLabelBuffer || vizObj.defaults.valueLabelBuffer))
            ) || 0;
    },

    // calculates a y scale based on the current set of data
    _currentYScale: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            explicitMin = cc.yAxis.min,
            explicitMax = cc.yAxis.max,
            vml = cc.valueMarkerLimits,
            rangeMax = cc.dataDim.pluckY(cc.chartWidth - vizObj._yAxisPos(),
                                         vizObj._yAxisPos());

        if (!vizObj._chartInitialized) { return function() { return 0; }; }

        if (_.isNaN(rangeMax)) { rangeMax = 0; }

        var defaultMins = [cc.minValue, vml.min],
            defaultMaxs = [cc.maxValue, vml.max];

        // For certain charts, our default range needs to start or end at zero
        // (for things like bar or area, so the user can visually compare
        // magnitudes). Otherwise, autofit to the data (leaving a little margin).
        if (cc.lockYAxisAtZero)
        {
            defaultMins.push(0);
            defaultMaxs.push(0);
        }
        else
        {
            var extraMarginFactor = 0.05;
            var min = d3.min(defaultMins);
            var max = d3.max(defaultMaxs);

            var valueRange = max - min;

            // Only add the margin to the min and max if the respective values
            // are not zero (it's OK to put zero at baseline, but putting other
            // values at baseline is misleading to the user).
            if (min !== 0)
            {
                defaultMins.push(min - (valueRange * extraMarginFactor));
            }

            if (max !== 0)
            {
                defaultMaxs.push(max + (valueRange * extraMarginFactor));
            }
        }

        var defaultMin = d3.min(defaultMins);
        var defaultMax = d3.max(defaultMaxs);

        var usedMin = !_.isNaN(explicitMin) ? explicitMin : defaultMin;
        var usedMax = !_.isNaN(explicitMax) ? explicitMax : defaultMax;
        var nullRangePaddingAmount = vizObj.defaults.fallbackForNullRange;
        if (usedMin === usedMax)
        {
            if (_.isNaN(explicitMin)) { usedMin -= nullRangePaddingAmount; }
            if (_.isNaN(explicitMax)) { usedMax += nullRangePaddingAmount; }
        }

        // Freaking out entirely, recognizing that the world is ending.
        if (!_.isNumber(usedMin) || _.isNaN(usedMin)) { usedMin = -nullRangePaddingAmount; }
        if (!_.isNumber(usedMax) || _.isNaN(usedMax)) { usedMax =  nullRangePaddingAmount; }

        var yScale = d3.scale.linear()
            .domain([ Math.min(usedMin, usedMax),
                      Math.max(usedMin, usedMax) ])
            .range([ 0, Math.max(0, rangeMax - vizObj.defaults.dataMaxBuffer) ])
            .clamp(true);

        // Make sure that the last tick is above maxValue;
        var idealTickCount = cc[cc.dataDim.pluckY('chartWidth', 'chartHeight')] / 80,
            ticks = yScale.ticks(idealTickCount),
            tickSize = ticks.length > 1 ? Math.abs(ticks[0] - ticks[1]) : 0,
            domain = yScale.domain();

        yScale.domain([_.first(ticks) > usedMin ? _.first(ticks) - tickSize : domain[0],
                       _.last(ticks)  < usedMax ? _.last(ticks)  + tickSize : domain[1]]);

        // When a scale is used, it should be committed so animations know where
        // to start from.
        yScale.commit = function()
        {
            cc.lastUsedYScale = this;
        };

        return yScale;
    },

    // should be a 1:1 mapping unless the browser's render container has truncated
    _currentXScale: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        if (!vizObj._chartInitialized) { return function(){ return 0; }; }

        var chartViewport = cc.$chartContainer[cc.dataDim.width](),
            rowsPerScreen = chartViewport / cc.rowWidth,
            totalRows = vizObj.getTotalRows() || 0;

        return d3.scale.linear()
              .domain([ 0, (cc.rowWidth * totalRows - chartViewport) || 0 ])
              .range([ 0, (totalRows - rowsPerScreen) || 0])
              .clamp(true);
    },

    _axisOffsetDueToScaleChange: function(oldYScale, newYScale)
    {
        var extraOffset = 0;
        if (this._chartConfig.orientation == 'right')
        {
            var yAxisPos = this._yAxisPos();
            var domainMin = d3.min(oldYScale.domain());

            var oldMinPos = yAxisPos + oldYScale(domainMin);
            var newMinPos = yAxisPos + newYScale(domainMin);
            extraOffset = oldMinPos - newMinPos;
        }

        return extraOffset;
    },

    // renders tick lines in general
    _renderTicks: function(oldYScale, newYScale, isAnim)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            yAxisPos = vizObj._yAxisPos();

        // Note that this is quite separate from isAnim. Even if isAnim is true,
        // we still use transition(). This variable completely disables trantisions.
        // This is important as it's dangerous to mix transitions and non-transitions
        // due to the possibility of someone doing a .remove() while we're transitioning.
        var allowTransitions = !vizObj._transitionExitWorkaroundActive();

        var formatter = $.deepGet(vizObj, '_displayFormat', 'yAxis', 'formatter');
        if ($.subKeyDefined(vizObj, '_displayFormat.yAxis.noDecimals'))
        { $.extend(formatter, { noDecimals: $.deepGet(vizObj, '_displayFormat', 'yAxis', 'noDecimals') }); }

        // determine our ticks
        var idealTickCount = cc[cc.dataDim.pluckY('chartWidth', 'chartHeight')] / 80;
        var ticks = newYScale.ticks(idealTickCount);

        if (blist.feature_flags.hide_decimal_tick_lines === true
            && $.isPresent(formatter) && formatter.abbreviate !== true
            && (formatter.noDecimals || formatter.decimalPlaces === 0))
        { ticks = _.uniq(_.map(ticks, function(tick) { return Math.floor(tick); })); }

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
                .classed('origin', function(d) { return d === 0; });
            tickLinesRootEnter
                .append('div')
                    .classed('tickLabel', true);
            tickLinesRootEnter
                .append('div')
                    .classed('tickLine', true);

        var newLinePos = function(d) { return (yAxisPos + cc.dataDim.dir * newYScale(d)) + 'px'; };

        if (allowTransitions)
        {
            // So, for orientation=right we must keep the bottom of our scale on the
            // y-axis without animating there, because otherwise the scale grows
            // from the middle of the screen and that's strange as heck.
            var extraOffset = vizObj._axisOffsetDueToScaleChange(oldYScale, newYScale);

            tickLines
                .style(position, function(d) { return (extraOffset + yAxisPos + cc.dataDim.dir * oldYScale(d)) + 'px'; })
                .transition()
                    .duration(isAnim ? vizObj._animationLengthMillisec : 0)
                     .style(position, newLinePos);
        }
        else
        {
            tickLines
                .style(position, newLinePos);
        }

        tickLines
                 .selectAll('.tickLabel')
                     .each(vizObj._d3_text(vizObj._formatYAxisTicks(formatter)));

        if (allowTransitions)
        {
            tickLines
                .exit()
                    .transition()
                        .remove();
        }
        else
        {
            tickLines
                .exit()
                    .remove();
        }
    },

    _computeValueMarkers: function()
    {
        // if we ever to nukeless df updates, need to also remove lines
        if (!_.isArray(this._displayFormat.valueMarker))
        {
            return [];
        }

        return _.compact(_.map(this._displayFormat.valueMarker, function(marker) {
            if (_.isNumber(marker.atValue))
            { return marker; }
            else if (_.isString(marker.atValue))
            { return $.extend(marker, { atValue: $.numericalSanitize(marker.atValue) }); }
            else
            { return null; }
        }));
    },

    _renderValueMarkers: function(valueMarkers, oldYScale, newYScale, isAnim)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            yAxisPos = vizObj._yAxisPos();

        var extraOffset = vizObj._axisOffsetDueToScaleChange(oldYScale, newYScale);

        var valueMarkerPosition = cc.dataDim.pluckY(
            function(yScale, extraOffset)
            { return function(d) { return (extraOffset + yAxisPos + yScale(parseFloat(d.atValue))) + 'px'; }; },
            function(yScale, extraOffset)
            { return function(d) { return (extraOffset + yAxisPos - yScale(parseFloat(d.atValue))) + 'px'; } });

        var valueMarkers = cc.chromeD3.selectAll('.valueMarkerContainer')
            .data(valueMarkers);

        valueMarkers
            .enter().append('div')
                .classed('valueMarkerContainer', true)
                .each(function(d)
                {
                    var $this = $(this);

                    // need to jQuery each rather than .html and .on because ie
                    $this.append($.tag([
                        { tagName: 'div', 'class': 'markerBg', style: { 'background-color': d.color } },
                        { tagName: 'div', 'class': 'markerLine', style: { 'border-color': d.color } }
                    ], true));
                    this.tip = $this.socrataTip({
                        message: $.htmlEscape(d.caption),
                        positions: [ 'top', 'bottom' ]
                    });
                });

        valueMarkers
            .style(cc.dataDim.pluckY('left', 'top'), valueMarkerPosition(oldYScale, extraOffset))
            .transition()
                .duration(isAnim ? vizObj._animationLengthMillisec : 0)
                .style(cc.dataDim.pluckY('left', 'top'), valueMarkerPosition(newYScale, 0));
        valueMarkers
            .exit()
                .each(function(d)
                {
                    if (this.tip)
                    {
                        this.tip.destroy();
                        delete this.tip;
                    }
                })
                .transition()
                    .remove();
    },

    _formatYAxisTicks: function(formatter)
    {
        // If the "Y-Axis Formatting" sidebar section isn't open,
        // formatter.abbreviate = true isn't passed through. Default it to true.
        formatter = formatter || { abbreviate: true };

        if (formatter.noDecimals)
        { formatter.decimalPlaces = 0; }

        if (formatter.abbreviate === true)
        {
            // humane number requires a precision. so, our "auto" really just
            // means 2 in this case.
            var decimalPlaces = _.isNumber(formatter.decimalPlaces) ? formatter.decimalPlaces : 2;
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

    _fontMetricsForRowLabels: _.once(
    function()
    {
        var cc = this._chartConfig;

        var $rowLabels = cc.$chartRenderArea.find('div.rowLabel');

        var fontSpec;
        if ($rowLabels.exists())
        {
            fontSpec = d3ns.fontMetrics.getFontSpec($rowLabels);
        }
        else
        {
            var $sacrificialLabel = $('<div />');
            cc.$chartRenderArea.append($sacrificialLabel);
            $sacrificialLabel.addClass('rowLabel');
            fontSpec = d3ns.fontMetrics.getFontSpec($sacrificialLabel);
            $sacrificialLabel.remove();
        }
        return d3ns.fontMetrics.getFontMetrics(fontSpec);
    }),

    _renderRowLabels: function(data)
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            view = vizObj._primaryView;

        var labelTransform = vizObj._labelTransform();
        var fontMetrics = vizObj._fontMetricsForRowLabels();

        // render our labels per row
        // baseline closer to the row's center
        var rowLabels = cc.chartD3.selectAll('.rowLabel')
            .data(_.filter(data, labelTransform.isInView), function(row) { return row.id; });

        rowLabels
            .enter().append('text')
                .classed('rowLabel', true)
                .attr({ x: 0,
                        y: 0,
                        'text-anchor': cc.orientation == 'right' ? 'start' : 'end',
                        'font-size': 13 });
        rowLabels
                // TODO: make a transform-builder rather than doing this concat
                .attr('transform', labelTransform)
                .attr('font-weight', function(d)
                        { return (view.highlights && view.highlights[d.id]) ? 'bold' : 'normal'; })
                .text(function(d)
                {
                    var fixedColumn = vizObj._fixedColumns[0], // WHY IS THIS AN ARRAY
                        text;

                    if ($.isBlank(fixedColumn)) { text = d.index + ''; }
                    // render plaintext representation of the data
                    else { text = fixedColumn.renderType.renderer(d.data[fixedColumn.lookup], fixedColumn, true, null, null, true); }

                    this.visualLength = fontMetrics.lengthForString(text) * 0.766  // cos(40°)
                                      + fontMetrics.heightForString(text) * 0.839; // tan(40°)
                    return text;
                });
        rowLabels
            .exit()
                .remove();

        // We do this *once*.
        if (!cc.valueLabelBuffer && !_.isEmpty(data))
        {
            // Wait a second for as much to be loaded as possible.
            if (!cc.moveBaseline)
            { cc.moveBaseline = _.debounce(function() {
                vizObj.debugOut('Initial baseline move. chartInitialized: ' + vizObj._chartInitialized);
                // Check for the initialization of the chart.
                // If it's not init'd, it means the user changed some part of the
                // view before we could run this (like by checking filters quickly).
                if (vizObj._chartInitialized)
                {
                    vizObj.moveBaseline();
                }
                delete cc.moveBaseline;
                }, 1000); }
            cc.moveBaseline();
        }
    },

    _labelTransform: function(offset)
    {
        var vizObj = this,
            cc = vizObj._chartConfig;
        var rotAngleDegrees = 40;

        var xPositionStaticParts = cc.sidePadding + ((cc.rowWidth - cc.rowSpacing) / 2) -
                                   cc.drawElementPosition - cc.dataOffset;
        var yPositionStaticParts = vizObj._yAxisPos();

        offset = offset || cc.dataDim.pluckY(
            function(d) { return [ yPositionStaticParts - 10, xPositionStaticParts + (d.index * cc.rowWidth)]; },
            function(d) { return [xPositionStaticParts + (d.index * cc.rowWidth) - 3.5, yPositionStaticParts + 10 ]; });
        // So... if the text's anchor is left of the screen, it may still be visible.
        // Measuring all the text to see if it will peek out is untenably slow. So
        // we just calculate the worst-case for an infinitely long label (remember
        // it's slanted, so it will necessarily exit the viewport).

        var maxVisibleWidth = Math.tan(Math.PI * (90 - rotAngleDegrees)/ 180) * (cc.valueLabelBuffer || vizObj.defaults.valueLabelBuffer);

        var isInView = function(d)
        {
            var xPos = cc.dataDim.pluckX.apply(null, offset(d));
            return vizObj._isXRangeInViewport(xPos - maxVisibleWidth, xPos + maxVisibleWidth);
        };

        var transform = function(d)
        {
            var o = offset(d);
            if (cc.orientation == 'down')
            { return 'r-' + rotAngleDegrees + ',0,0,T' + o[0] + ',' + o[1]; }
            else (cc.orientation == 'right')
            { return 'r' + rotAngleDegrees + ',0,0,T' + o[0] + ',' + o[1]; }
        };

        transform.isInView = isInView;

        return transform;
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

        var capWidth = vizObj.defaults.errorBarCapWidth;

        return function(d)
        {
            var x = 0;

            // We talk about high and low error bars, but really the two
            // are interchangeable.
            var errA = d.data[highCol.lookup];
            var errB = d.data[lowCol.lookup];
            var high = Math.max(errA, errB);
            var low = Math.min(errA, errB);

            if (_.isUndefined(errA) || _.isUndefined(errB))
            {
                // We don't have values in this row. No path.
                return '';
            }

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

    _flyoutConfigurationOptions: function(row, col)
    {
        var cc = this._chartConfig;
        var lessThanZeroPositioning =
            cc.dataDim.pluckY(['top-left', 'bottom-left'],
                              ['bottom', 'top']);

        var greaterThanZeroPositioning =
            cc.dataDim.pluckY(['top-right', 'bottom-right'],
                              ['top', 'bottom']);
        return {
            positions: (row.data[col.lookup] > 0) ? greaterThanZeroPositioning : lessThanZeroPositioning
        };
    },

    // Is the area between the two given X offsets at least partially visible?
    _isXRangeInViewport: function(xLeftEdge, xRightEdge)
    {
        var cc = this._chartConfig;

        return (cc.scrollPos - cc.drawElementPosition + cc.chartWidth + this.defaults.sidePaddingBounds[0]/2 >= xLeftEdge) &&
               (cc.scrollPos - cc.drawElementPosition - this.defaults.sidePaddingBounds[0]/2 <= xRightEdge);
    },

    _lastYScale: function()
    {
        return this._chartConfig.lastUsedYScale;
    }

}, null, 'socrataChart', [ 'd3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);
