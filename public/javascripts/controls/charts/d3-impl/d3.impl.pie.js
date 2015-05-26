(function($)
{

var d3ns = blist.namespace.fetch('blist.d3');

$.Control.registerMixin('d3_impl_pie', {

    defaults: {
        rowBuffer: 30, // additional rows to fetch on either side of the actual visible area
        smallModeThreshold: 400, // Size below which small mode is triggered (px).
        largeLegendMaxLineThreshold: 15, // If we've got more than this amount of lines in the legend, switch the legend only to small mode.
        legendMaxHeightPercentage: 20, // If legend is top or bottom, allow at most this percentage of overall height to the legend.
        minSizeForLegend: 150, // If the chart is less than this in any direction (px), we hide the legend to try and display something useful.
        labelMargin: 40, // Extra distance between labels and slices (it's a radius).
        endpointLineLength: 5, // Length of that little line segment on either end of the main label line.
        labelTeeLength: 8, // Length of the tee at the end of the label line.
        labelLinesMargin: 5, // Size of various margins for labels:
                             //  - Tee to text
                             //  - Elbow to closest line
        hiddenLabelReflowThreshold: 5,// Sometimes we can't show a label even though the slotted layout says we can,
                                      // simply because we can't find a space for a line connecting the label to the
                                      // slice, or the label turns out to be blank.
                                      //  If we hit more than this number of such issues, remove the unshowable
                                      // labels from the layout and re-run the layout. This avoids having large
                                      // sections of unused space in very dense pies.
        minArcLengthPixels: 3, // Minimum arc length of a slice in order to show it.
        nonSortedRowLoadCount: 360  // If we're not descending, we can't easily be clever about
                                    // which rows we load. So we just load up to this many rows.
                                    // The real solution is to do something like:
                                    // 1) Clone the primary view.
                                    // 2) Apply a sort on the cloned view: descending on our value column.
                                    // 3) Base our chart on the cloned view. Loading algorithm then knows
                                    //    when to stop based on value size, just like now.
                                    // 4) On render, sort the slices according to what the original view
                                    //    wants.
                                    // Of course, (4) is hard because we essentially have to duplicate what
                                    // the core server would do.
                                    // The current approach falls down rather hard if the dataset has tons
                                    // of tiny-valued slices and you sort ascending. This means we'll probably
                                    // show only an 'other' slice.
    },

    Slice: (function()
    {
        var Slice = function(index, valueResolver, nameResolver, colorResolver)
        {
            this.index = index;
            this.valueResolver = valueResolver;
            this.nameResolver = nameResolver;
            this.colorResolver = colorResolver;

            if (!valueResolver || !nameResolver || !colorResolver)
            {
                throw new Error('Slices need all resolvers.');
            }

            this.getValue = function()
            {
                return this.valueResolver(false);
            };

            this.getValueText = function()
            {
                return this.valueResolver(true);
            };

            this.getName = function()
            {
                return this.nameResolver();
            };

            this.getColor = this.colorResolver;

        }

        Slice.prototype.clone = function()
        {
            return new Slice(this.index, this.valueResolver, this.nameResolver, this.colorResolver);
        }

        Slice.prototype.neighbor = function(forward)
        {
            var newIndex = forward ? this.index + 1 : this.index - 1;

            if (newIndex < 0) { return undefined; }
            else { return new Slice(newIndex, this.valueResolver, this.nameResolver, this.colorResolver); }
        }

        Slice.prototype.getAngleRadians = function(seriesInformation)
        {
            $.assert(seriesInformation, "Series information required when calculating angle of slice.");
            return 2 * Math.PI * (this.getValue() / seriesInformation.getDataSum());
        };

        Slice.prototype.same = function(other)
        {
            return other && this.index == other.index;
        };

        // Makes an anchored slice based of this instance.
        // Zero means the anchor element is perfectly
        // centered about the vertical axis, with its arc center at the bottom
        // of the viewport.
        Slice.prototype.asAnchor = function(radiansFromBottom)
        {
            var other = this.clone();
            other.anchorRadians = radiansFromBottom;
            return other;
        };

        // Given an array of slices, finds the slice in that array closest to
        // this slice.
        Slice.prototype.findClosestByIndex = function()
        {
            var this_ = this;

            $.assert(arguments.length > 0, "Must provide slices to target");

            var targetSlice = arguments[0];

            _.each(arguments,
                function (slice)
                {
                    var closestIndexDelta = targetSlice.index - this_.index;
                    var currentIndexDelta = slice.index - this_.index;

                    if (Math.abs(currentIndexDelta) < Math.abs(closestIndexDelta))
                    {
                        targetSlice = slice;
                    }

                });

            return targetSlice;
        };

        return Slice;
    })(),

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

        if (vizObj._chartType == 'donut')
        {
            // Donut is a funny beast... the ordering of the slices is determined
            // by the ordering of the first column. We also can't figure out what
            // the relative angular difference is between the multiple slices
            // corresponding to the enabled columns in each row. In aggregate,
            // this means that we can't do zoom virtualization. Best we can
            // do is 'load more'. Setting this field activates alternate rendering.
            cc.donut = true;
        }

        vizObj.getColumns();

        this._initLoaderStateMachine();
        this._initZoomInformation();

        // create and cache dom elements
        var $dom = vizObj.$dom();
        $dom.empty().append($.tag(
            { tagName: 'div', 'class': 'mondrian pieChart orientation' + $.capitalize(cc.orientation), contents: [
                { tagName: 'div', 'class': 'chartOuterContainer', contents: [
                    { tagName: 'div', 'class': 'chartContainer', contents: [
                        { tagName: 'div', 'class': 'chartRenderArea',
                          contents: '&nbsp;' }, // if no contents, browser doesn't bother to scroll
                        ] }] },
                { tagName: 'div', 'class': 'legendContainer', contents: [
                    { tagName: 'div', 'class': 'legendLines' }
                ]},
                { tagName: 'div', 'class': 'controlContainer' },
                { tagName: 'div', 'class': 'overlayContainer'}
            ] }
        , true));
        cc.$chartArea = $dom.find('.mondrian');
        cc.$chartOuterContainer = $dom.find('.chartOuterContainer');
        cc.$chartContainer = $dom.find('.chartContainer');
        cc.$chartRenderArea = $dom.find('.chartRenderArea');
        cc.$legendContainer = $dom.find('.legendContainer');
        cc.$controlContainer = $dom.find('.controlContainer');
        cc.$overlayContainer = $dom.find('.overlayContainer');

        //hax
        cc.$chartOuterContainer.css('margin-top', '2em');

        // for positioning
        $dom.css('position', 'relative');
        $dom.css('overflow', 'hidden');

        // init our renderers
        cc.chartRaphael = new Raphael(cc.$chartContainer.get(0), 10, 10);
        cc.chartD3 = d3.raphael(cc.chartRaphael);
        cc.chartHtmlD3 = d3.select(cc.$chartRenderArea.get(0));

        // find and set up the draw elem
        cc.$drawElement = cc.$chartContainer.children(':not(.chartRenderArea)');
        cc.$drawElement.css({ 'position': 'absolute', 'top': '0' });

        vizObj._setChartOverlay(null); // Initialize the chart overlay.

        if (vizObj.debugEnabled)
        {
            vizObj._renderDebugControlButtons();
        }

        delete vizObj._chartConfig.chartRenderSnapshot;

        vizObj._super();

        vizObj._loaderIncrement = 50;

        vizObj._startLoading(0);

        vizObj.getDataForAllViews();
    },

    requiresSeriesGrouping: function()
    {
        return false;
    },

    _initZoomInformation: function()
    {
        var vizObj = this;
        this._zoomInfo =
        {
            // TODO implement me.
            getRightmostAngle: function()
            {
                return Math.PI/2;
            },
            getLeftmostAngle: function()
            {
                return vizObj._zoomFactor <= 1.01 ? 0 : -Math.PI/2;
            }
        };
        this._zoomFactor = 1.0;
    },

    _loaderPhases:
    {
        idle: 0,
        growingBoth: 1,
        growingUp: 2,
        growingDown: 3
    },

    _initLoaderStateMachine: function()
    {
        var vizObj = this;

        vizObj._loaderState =
        {
            phase: vizObj._loaderPhases.idle,
            top: 0,
            bottom: 0
        };
    },

    _startLoading: function(startIndex)
    {
        var vizObj = this;

        vizObj._loaderState.phase = vizObj._loaderPhases.growingBoth;
        vizObj._loaderState.top = Math.max(0, startIndex - vizObj._loaderIncrement);

        var totalRows = vizObj.getTotalRows();
        vizObj._loaderState.bottom = Math.min(totalRows ? (totalRows - 1) : 1, startIndex + vizObj._loaderIncrement);
    },

    _normalizeAngle: function(angle)
    {
        var i = Math.floor(angle/(2*Math.PI));
        var a = angle - i*Math.PI*2;
        return a > 0 ? a : a+Math.PI*2;
    },

    _primaryValueColumn: function()
    {
        return this.getValueColumns()[0];
    },

    _valueColumnCount: function()
    {
        return this.getValueColumns().length;
    },

    _loadDataIfNeeded: function()
    {
        var vizObj = this,
            state = vizObj._loaderState,
            zoom = vizObj._zoomInfo,
            cc = vizObj._chartConfig;

        var totalRows = vizObj.getTotalRows() || 0;
        var minIndex = state.top;
        var maxIndex = state.bottom;
        if (vizObj._currentRangeData.length > 0)
        {
            minIndex = Math.max(state.top, vizObj._currentRangeData[0].index);
            maxIndex = Math.min(state.bottom, _.last(vizObj._currentRangeData).index);
        }
        else
        {
            minIndex = 0;
            maxIndex = 0;
        }

        if (vizObj._isSortedBigToSmall())
        {
            // Two stop conditions.
            // 1) Hits edge of viewport.
            // 2) Hits min angle. TODO: Min pixel width.

            var primaryValueColumn = vizObj._primaryValueColumn();
            var anchor = cc.chartRenderSnapshot.anchorSlice;
            var seriesInformation = cc.chartRenderSnapshot.seriesInformation[primaryValueColumn.column.lookup];

            var topSlice = new vizObj.Slice(minIndex, seriesInformation.valueResolver, seriesInformation.nameResolver, seriesInformation.colorResolver);
            var bottomSlice = new vizObj.Slice(maxIndex, seriesInformation.valueResolver, seriesInformation.nameResolver, seriesInformation.colorResolver);

            var slices = this._fillInSliceRange(cc.chartRenderSnapshot.firstDataSlice, cc.chartRenderSnapshot.lastDataSlice);
            var sliceMetrics = this._calculateSliceSetMetrics(slices, seriesInformation);

            var pieSegments = this._buildPieLayout(sliceMetrics, cc.chartRenderSnapshot.firstDataSlice, cc.chartRenderSnapshot.lastDataSlice, anchor, seriesInformation);

            var topAngle = pieSegments.startAngle();
            var bottomAngle = pieSegments.endAngle();

            var topDone = vizObj._normalizeAngle(zoom.getRightmostAngle()) > vizObj._normalizeAngle(topAngle);
            var bottomDone = vizObj._normalizeAngle(zoom.getLeftmostAngle()) < vizObj._normalizeAngle(bottomAngle);

            topDone |= topSlice.index == 0;
            bottomDone |= bottomSlice.index == totalRows - 1;

            var bottomAngleTooSmall = this._tooSmallForDisplay(bottomSlice, seriesInformation);
            bottomDone |= bottomAngleTooSmall;

            vizObj.debugOut('Checking range. BottomDone: '+bottomDone+' TopDone: '+topDone);

            if (topDone && bottomDone)
            {
                state.phase = vizObj._loaderPhases.idle;
                if (blist.mainSpinner)
                { blist.mainSpinner.setMetric(null); }
                vizObj.initialRenderDone();
            }
            else if (topDone)
            {
                state.phase = vizObj._loaderPhases.growingDown;
                state.bottom = Math.min(totalRows - 1, maxIndex + vizObj._loaderIncrement);
            }
            else if (bottomDone)
            {
                state.phase = vizObj._loaderPhases.growingUp;
                state.top = Math.max(0, minIndex - vizObj._loaderIncrement);
            }
            else
            {
                state.phase = vizObj._loaderPhases.growingBoth;
                state.top = Math.max(0, minIndex - vizObj._loaderIncrement);
                state.bottom = Math.min(totalRows - 1, maxIndex + vizObj._loaderIncrement);
            }
        }
        else
        {
            // Best we can do is get a default range...
            state.phase = vizObj._loaderPhases.idle;

            var staticMaxIndex = Math.min(totalRows-1 , vizObj.defaults.nonSortedRowLoadCount);
            var topDone = (state.top == minIndex);
            var bottomDone = (state.bottom == staticMaxIndex);

            if (topDone && bottomDone)
            {
                state.phase = vizObj._loaderPhases.idle;
                if (blist.mainSpinner)
                { blist.mainSpinner.setMetric(null); }
                vizObj.initialRenderDone();
            }
            else if (topDone)
            {
                state.phase = vizObj._loaderPhases.growingDown;
                state.bottom = staticMaxIndex;
            }
            else if (bottomDone)
            {
                state.phase = vizObj._loaderPhases.growingUp;
                state.top = minIndex;
            }
            else
            {
                state.phase = vizObj._loaderPhases.growingBoth;
                state.top = minIndex;
                state.bottom = staticMaxIndex;
            }
        }

        vizObj.debugOut('New phase:' + state.phase);

        if (state.phase != vizObj._loaderPhases.idle)
        {
            vizObj._requestMoreData();
        }
    },

    _requestMoreData: function()
    {
        this.getDataForView(this._primaryView);
    },

    cleanVisualization: function()
    {
        var vizObj = this;

        if (vizObj._chartInitialized)
        {
            vizObj._renderUnusableData([], 'isEmpty');

            delete vizObj._chartConfig;
        }

        if (blist.mainSpinner)
        { blist.mainSpinner.setMetric('main'); }

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

    renderData: function(data, view, addedNewData)
    {
        var vizObj = this,
            valueColumns = vizObj.getValueColumns();

        vizObj._renderData(data, addedNewData);
    },

    handleDataChange: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            chartWidth = cc.$chartContainer.width(),
            chartHeight = cc.$chartContainer.height();

        cc.chartRaphael.setSize(chartWidth, chartHeight);
        vizObj._rerenderPositions(true);
    },

    getRenderRange: function(view, callback)
    {
        var vizObj = this,
            state = vizObj._loaderState;

        var ret = { start: state.top, length: 1+(state.bottom - state.top) };
        vizObj.debugOut("Furnished range: start "+ret.start + " len "+ret.length);

        return ret;
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

        vizObj._updateLegendStyle();

        var cc = vizObj._chartConfig,
            chartWidth = cc.$chartContainer.width(),
            chartHeight = cc.$chartContainer.height();

        cc.chartRaphael.setSize(chartWidth, chartHeight);

        vizObj._updateSizeBasedStyling();

        var snapshot = this._chartConfig.chartRenderSnapshot;
        if (snapshot)
        {
            var fillArea = vizObj._getChartFillArea();
            snapshot.fillArea = fillArea;
            this._renderSnapshot(snapshot, !vizObj._isIE8() /* enableTransitions */);
        }
    },

    _updateSizeBasedStyling: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var smallestDimension = Math.min(vizObj.$dom().height(), vizObj.$dom().width());
        var needsSmallMode = smallestDimension < vizObj.defaults.smallModeThreshold;
        cc.$chartArea.toggleClass('smallMode', needsSmallMode);
    },

    $legendContainer: function()
    {
        return this._chartConfig.$legendContainer;
    },

    _updateLegendStyle: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig,
            $legendContainer = vizObj.$legendContainer(),
            legendPosition = vizObj.legendPosition();

        $legendContainer.toggleClass('smallMode', $legendContainer.find('.legendLine').length > vizObj.defaults.largeLegendMaxLineThreshold);

        var domHeight = vizObj.$dom().height();
        var minHeight = Math.min(vizObj.$dom().width(), domHeight);
        var shouldHideLegend = minHeight < vizObj.defaults.minSizeForLegend;

        vizObj.$legendContainer().toggleClass('hide', shouldHideLegend);

        vizObj._chartConfig.$chartArea
            .removeClass('hasTopLegend hasRightLegend hasBottomLegend hasLeftLegend hasNoLegend');

        // So, if our legend is top or bottom, we want to limit its height to 20% of the overall height of the chart.
        // Sadly our DOM structure won't easily let us specify the legend's height in percent. So, do it here.
        if ( (legendPosition === 'top') || (legendPosition === 'bottom'))
        {
            $legendContainer.find('.legendLines').css('max-height', domHeight * vizObj.defaults.legendMaxHeightPercentage / 100);
        }

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

        // Our top legend margin sadly must be determined in code.
        if (legendPosition == 'left')
        {
            cc.$chartOuterContainer.css('margin-left', $legendContainer.width());
            cc.$chartOuterContainer.css('margin-top', '');
            cc.$chartOuterContainer.css('margin-right', '');
            cc.$chartOuterContainer.css('margin-bottom', '');
        }
        else if (legendPosition == 'top')
        {
            cc.$chartOuterContainer.css('margin-left', '');
            cc.$chartOuterContainer.css('margin-top', $legendContainer.height());
            cc.$chartOuterContainer.css('margin-right', '');
            cc.$chartOuterContainer.css('margin-bottom', '');
        }
        else if (legendPosition == 'right')
        {
            cc.$chartOuterContainer.css('margin-left', '');
            cc.$chartOuterContainer.css('margin-top', '');
            cc.$chartOuterContainer.css('margin-right', $legendContainer.width());
            cc.$chartOuterContainer.css('margin-bottom', '');
        }
        else if (legendPosition == 'bottom')
        {
            cc.$chartOuterContainer.css('margin-left', '');
            cc.$chartOuterContainer.css('margin-top', '');
            cc.$chartOuterContainer.css('margin-right', '');
            cc.$chartOuterContainer.css('margin-bottom', $legendContainer.height());
        }
        else
        {
            cc.$chartOuterContainer.css('margin-left', '');
            cc.$chartOuterContainer.css('margin-top', '');
            cc.$chartOuterContainer.css('margin-right', '');
            cc.$chartOuterContainer.css('margin-bottom', '');
        }

        if (legendPosition == 'left' || legendPosition == 'right')
        {
            $legendContainer.css('margin-top', -1 * $legendContainer.height() / 2);
        }
        else
        {
            $legendContainer.css('margin-top', '0');
        }
    },

    _getDefaultLegendDetails: function()
    {
        // Override the default.
        return { showValues: true };
    },

    renderLegend: function()
    {
        var vizObj = this;

        vizObj._super(function(legendDetails, addLine)
        {
            if (legendDetails.showValues === true && vizObj._chartConfig.chartRenderSnapshot)
            {
                var firstSlice = vizObj._chartConfig.chartRenderSnapshot.firstSlice;
                var lastSlice = vizObj._chartConfig.chartRenderSnapshot.lastSlice;

                if (firstSlice)
                {
                    _.each(vizObj._fillInSliceRange(firstSlice, lastSlice), function(slice)
                    {
                        if (_.any(vizObj._chartConfig.chartRenderSnapshot.seriesInformation, function(series)
                            {
                                return !vizObj._tooSmallForDisplay(slice, series);
                            }))
                        {
                            addLine(slice.getColor(), slice.getName());
                        }
                    });

                    var seriesInformation = vizObj._chartConfig.chartRenderSnapshot.seriesInformation;
                    var cachedPiePieces = seriesInformation[Object.keys(seriesInformation)[0]].cachedPiePieces;

                    // Determine if we need to add 'Other' label
                    var otherPlaceholderExists = _.last(cachedPiePieces).data.getName() === 'Other';
                    if (otherPlaceholderExists)
                    {
                        addLine('gray', 'Other');
                    }
                }
            }
        });

        vizObj._updateLegendStyle();
    },

    // Basically, this function enforces the fact that we only know how to render
    // contiguous chunks of data. If someone else loads rows outside of our
    // main set, we would explode if we didn't do this.
    _getDataToRender: function(data)
    {
        if (data.length <= 1)
        {
            return data.slice(0);
        }
        else if ((_.last(data).index - _.first(data).index) == (data.length - 1))
        {
            return data.slice(0);
        }
        else
        {
            // We have a discontinuity somewhere... split up the data into
            // contiguous chunks.
            var chunks = [];
            for(var i = 0; i<data.length; i++)
            {
                // Has the data's index gone out of alignment?
                if ( (data[i].index - data[0].index) != i)
                {
                    // Split off everything before i.
                    chunks.push(data.slice(0, i));
                    data = data.slice(i);
                    i = -1;
                }

            }

            // Leftovers
            if (data.length)
            {
                chunks.push(data);
            }

            // Grab the one that contains the most of our render range.
            // We may want to change this to be more strict. Note also
            // that if no chunks overlap our render range, we don't render
            // anything.
            var renderRange = this.getRenderRange(this._primaryView);
            var renderStartIndex = renderRange.start;
            var renderLastIndex = renderRange.start + renderRange.length-1;

            var maxChunk = [];
            _.each(chunks, function(chunk, idx)
            {
                var chunkStartIndex = _.first(chunk).index;
                var chunkLastIndex = _.last(chunk).index;

                if (renderStartIndex > chunkLastIndex || renderLastIndex < chunkStartIndex)
                {
                    return 0;
                }
                else
                {
                    var thisChunkOverlap = 1 + Math.min(renderLastIndex, chunkLastIndex) - Math.max(renderStartIndex, chunkStartIndex);
                    if (maxChunk.length < thisChunkOverlap)
                    {
                        maxChunk = chunk;
                    }
                }

            });

            return maxChunk;
        }

    },

    _getChartFillArea: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;
        var chartWidth = cc.$chartContainer.width();
        var chartHeight = cc.$chartContainer.height();

        var fillArea =
        {
            width: chartWidth,
            height: chartHeight,
            left: 0,
            top: 0,
            equal: function(other)
            {
                return this.width === other.width &&
                       this.height === other.height &&
                       this.left === other.left &&
                       this.top === other.top;
           }
        };

        return fillArea;
    },

    // call this if the active set of data has changed
    _renderData: function(data, addedNewData)
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        if (!addedNewData && cc.chartRenderSnapshot)
        {
            // We probably just had a formatting change like a row highlight.
            // Just rerender the last snapshot.
            vizObj.debugOut('snapshot-only render');
            vizObj._renderSnapshot(cc.chartRenderSnapshot, !vizObj._isIE8() /* enableTransitions */);
            return;
        }

        data = vizObj._getDataToRender(data);

        vizObj.debugOut("render");

        vizObj.debugOut("got "+data.length+" data rows");

        if (data.length === 0)
        {
            vizObj._renderUnusableData(data, 'isEmpty');
        }
        else
        {
            vizObj._renderUsableData(data);
        }
    },

    _renderUnusableData: function(data, reason)
    {
        var vizObj = this;

        var userMessageKey = 'controls.charts.';
        if (reason === 'isEmpty')
        {
            userMessageKey += 'no_data';
        }
        else if (reason === 'allZero')
        {
            userMessageKey += 'zero_only_data';
        }
        else if (reason === 'negativesPresent')
        {
            userMessageKey += 'negatives_in_data';
        }

        var cc = vizObj._chartConfig;

        var valueResolver = getDataSum = $.thunk(0);
        var colorResolver = $.thunk('transparent');
        var nameResolver = $.thunk('');
        var rowResolver = $.thunk(null);

        var seriesInformation = {};
        _.each(vizObj.getValueColumns(), function(colDef, columnIndex)
        {
            seriesInformation[colDef.column.lookup] = {
                getDataSum: getDataSum,
                colorResolver: colorResolver,
                valueResolver: valueResolver,
                nameResolver: nameResolver,
                rowResolver: rowResolver,
                colDef: colDef,
                columnIndex: columnIndex
            };
        });

        var placeholderSlice = new vizObj.Slice(0, valueResolver, nameResolver, colorResolver);

        cc.chartRenderSnapshot =
        {
            firstSlice: null,
            lastSlice: null,
            firstDataSlice: placeholderSlice,
            lastDataSlice: placeholderSlice,
            anchorSlice: placeholderSlice.asAnchor(0),
            fillArea: vizObj._getChartFillArea(),
            seriesInformation: seriesInformation
        };

        var overlay = $.tag(
            { tagName: 'div', 'class': 'noDataMessage',
                contents: $.t(userMessageKey)
            }, true);

        this._setChartOverlay(overlay);

        var $msg = this.$dom().find('.noDataMessage');
        $msg.css('margin-left', -$msg.outerWidth(true)/2);
        $msg.css('margin-top', -$msg.outerHeight(true)/2);

        vizObj._renderSnapshot(cc.chartRenderSnapshot, false /* enableTransitions */);
    },

    _renderUsableData: function(data)
    {
        $.assert(data.length > 0, 'Expected data');
        var vizObj = this;

        var cc = vizObj._chartConfig,
            valueColumns = vizObj.getValueColumns(),
            view = vizObj._primaryView;

        vizObj._setChartOverlay(null);

        var fillArea = vizObj._getChartFillArea();

        //TODO this is dumb look at first and last.
        var maxIndex = _.last(data).index;
        var minIndex = data[0].index;

        var state = vizObj._loaderState;
        if (state.top < minIndex || state.bottom > maxIndex)
        {
            vizObj.debugOut("We require more vespe... data.");
            return;
        }

        vizObj.debugOut('Have enough data for render.');

        var aggs = _.reduce(valueColumns, function(memo, colDef)
        {
            memo[colDef.column.id] = ['sum', 'minimum'];
            return memo;
        }, {});

        view.getAggregates(function()
        {
            // Basic strategy here is to build up a chart render snapshot
            // per-series, then render the whole thing.

            vizObj.debugOut('Obtained aggregates for row set of length ' + data.length);
            var primaryColumn = vizObj._primaryValueColumn();

            state.top = Math.min(data[0].index, state.top);
            state.bottom = Math.max(data[data.length - 1].index, state.bottom);

            var rowResolver = function(slice)
            {
                return data[slice.index - data[0].index];
            };

            var valueResolver = function(col)
            {
                return function(asText)
                {
                    // 'this' is the slice.
                    var foundRow = rowResolver(this);
                    var val = foundRow.data[col.lookup];

                    if (asText)
                    {
                        if ($.subKeyDefined(col, 'renderType.renderer'))
                        {
                            return col.renderType.renderer(val, col, true, false, true);
                        }
                        else
                        {
                            return val;
                        }
                    }
                    else
                    {
                        // Undefined or non-number values get treated as zero-value.
                        if (_.isUndefined(val))
                        {
                            return 0;
                        }
                        else
                        {
                            var asFloat = parseFloat(val);
                            return _.isNaN(asFloat) ? 0 : asFloat;
                        }
                    }
                };
            };

            var nameResolver = function(col)
            {
                return function()
                {
                    // 'this' is the slice.
                    var foundRow = rowResolver(this);

                    var fixedColumn = vizObj._fixedColumns[0];
                    // render plaintext representation of the data
                    return fixedColumn.renderType.renderer(foundRow.data[fixedColumn.lookup], fixedColumn, true, null, null, true);
                };
            };

            var colorResolver = function(colDef)
            {
                var colColorizer = vizObj._d3_colorizeRow(colDef);
                return function ()
                {
                    if (vizObj.debugEnabled && anchorSlice.same(this))
                    {
                        // Highlight the anchor if we're debugging.
                        return "red";
                    }
                    else
                    {
                        return colColorizer(data[this.index]);
                    }
                }
            };

            var seriesInformation = {};
            var maxColSum = 0;
            var hasNegatives = false;
            _.each(valueColumns, function(colDef, columnIndex)
            {
                var colMin = colDef.column.aggregates['minimum'];
                if (!_.isNaN(colMin) && colMin < 0)
                {
                    hasNegatives = true;
                    return;
                }
                var colSum = colDef.column.aggregates['sum'];
                $.assert(colSum >= 0 && !_.isNaN(colSum), 'Expected a real value for column sum');
                maxColSum = Math.max(colSum, maxColSum);
                seriesInformation[colDef.column.lookup] = {
                    getDataSum: function () { return colSum; },
                    colorResolver: colorResolver(colDef),
                    valueResolver: valueResolver(colDef.column),
                    nameResolver: nameResolver(colDef.column),
                    rowResolver: rowResolver,
                    colDef: colDef,
                    columnIndex: columnIndex
                };
            });
            if (hasNegatives)
            {
                vizObj._renderUnusableData(data, 'negativesPresent');
                return;
            }

            if (maxColSum === 0)
            {
                // No series has any data... pretend as if there's no data.
                vizObj._renderUnusableData(data, 'allZero');
                return;
            }

            var primarySeriesInfo = seriesInformation[primaryColumn.column.lookup];
            var primaryValueResolver = primarySeriesInfo.valueResolver;
            var primaryNameResolver = primarySeriesInfo.nameResolver;
            var primaryColorResolver = primarySeriesInfo.colorResolver;

            var firstSlice = new vizObj.Slice(data[0].index, primaryValueResolver, primaryNameResolver, primaryColorResolver);
            var lastSlice = new vizObj.Slice(data[data.length - 1].index, primaryValueResolver, primaryNameResolver, primaryColorResolver);

            if (vizObj.debugEnabled)
            {
                vizObj.debugOut("Smallest angle (deg): "+ lastSlice.getAngleRadians(primarySeriesInfo) * 180/Math.PI);
                vizObj.debugOut('Slice angles (deg): ');
                _.each(vizObj._fillInSliceRange(firstSlice, lastSlice), function(slice)
                {
                    vizObj.debugOut('\t' + slice.getName(primarySeriesInfo) + ' -> ' +
                                    slice.getAngleRadians(primarySeriesInfo) * 180/Math.PI);
                });
            }

            //TODO deal with zooming correctly - how do we respect the users' wishes?
            // Should we abandon the idea of min angle when zooming and expose
            // a min-pixel-arg-length instead?
            var lastDisplaySlice;
            if (vizObj._zoomFactor <= 1.01)
            {
                lastDisplaySlice = vizObj._isSortedBigToSmall() ?
                    vizObj._findLastSliceSatisfyingMinAngle(firstSlice, lastSlice, primarySeriesInfo) :
                    lastSlice;
            }
            else
            {
                lastDisplaySlice = lastSlice;
            }

            var anchorSlice;

            if (cc.chartRenderSnapshot)
            {
                var oldAnchor = cc.chartRenderSnapshot.anchorSlice;
                var middleSlice = new vizObj.Slice(oldAnchor.index, primaryValueResolver, primaryNameResolver, primaryColorResolver);
                anchorSlice = middleSlice.asAnchor(oldAnchor.anchorRadians);

                $.assert(oldAnchor.getValue() == anchorSlice.getValue(), 'Expected anchor to preserve value');
            }
            else
            {
                anchorSlice = firstSlice.asAnchor(firstSlice.getAngleRadians(primarySeriesInfo) / 2);
            }

            var nothingToDisplay = _.isUndefined(lastDisplaySlice);

            cc.chartRenderSnapshot =
            {
                firstSlice: nothingToDisplay ? null : firstSlice,
                lastSlice: nothingToDisplay ? null : lastDisplaySlice,
                firstDataSlice: firstSlice,
                lastDataSlice: lastSlice,
                anchorSlice: anchorSlice,
                fillArea: fillArea,
                seriesInformation: seriesInformation
            };

            // Render, but don't use transitions (they don't look good as slices are
            // coming in).
            vizObj._renderSnapshot(cc.chartRenderSnapshot, false /* enableTransitions */);

            vizObj._loadDataIfNeeded();

        }, aggs);
    },

    _findLastSliceSatisfyingMinAngle: function(firstSlice, lastSlice, seriesInformation)
    {
        var minAngleRadians = (this._displayFormat.pieJoinAngle || 0) * (Math.PI/180);
        var current = lastSlice;
        while(!_.isUndefined(current) &&
              (current.getAngleRadians(seriesInformation) <= minAngleRadians ||
              (!_.isUndefined(this._chartConfig.chartRenderSnapshot) && this._tooSmallForDisplay(current, seriesInformation))))
        {
            current = current.neighbor(false);
        }
        return current;
    },

    _tooSmallForDisplay: function(slice, seriesInformation)
    {
        var radius = this._getRadius(this._chartConfig.chartRenderSnapshot.fillArea, this._zoomFactor);
        var angle = slice.getAngleRadians(seriesInformation);
        var arcLength = angle * radius;
        return arcLength < this.defaults.minArcLengthPixels;
    },

    // We work best when our slices sorted big to small. If we aren't, we can't
    // make informed decisions about when to stop loading rows.
    _isSortedBigToSmall: function()
    {
        var retval = false;
        var view = this._primaryView;
        if ($.subKeyDefined(view, 'metadata.jsonQuery.order'))
        {
            // NOTE: Keep this in sync with the one in (new-)chart-create.js!
            var defaultOrderBy = _.map(view.displayFormat.valueColumns, function(col)
            {
                return {
                    ascending: false,
                    columnFieldName: view.columnForIdentifier(col.fieldName || col.tableColumnId).fieldName
                };
            });

            retval = _.isEqual(defaultOrderBy, view.metadata.jsonQuery.order);
        }

        this.debugOut('sortedBigToSmall:' + retval);
        return retval;
    },

    _renderSnapshot: function(snapshot, enableTransitions)
    {
        this._updateSizeBasedStyling();

        // Update the fill area after the legend renders, otherwise we might
        // overlap!.
        snapshot.fillArea = this._getChartFillArea();
        if (this._chartConfig.donut)
        {
            this._renderDonut(
                snapshot.firstSlice,
                snapshot.lastSlice,
                snapshot.anchorSlice,
                snapshot.fillArea,
                snapshot.seriesInformation,
                enableTransitions);
        }
        else
        {
            $.assert(_.keys(snapshot.seriesInformation).length == 1, 'Pie renderer only understands one series.');
            var seriesInformation = snapshot.seriesInformation[this._primaryValueColumn().column.lookup];
            this._renderPie(
                snapshot.firstSlice,
                snapshot.lastSlice,
                snapshot.anchorSlice,
                snapshot.fillArea,
                seriesInformation,
                enableTransitions);
        }

        // Render legend after pie chart so that we can determine
        // whether or not an 'Other' label is needed
        this.renderLegend();
    },

    //TODO just get rid of _renderPie, and start passing around just the layout.
    _buildPieLayout: function(sliceMetrics, firstSlice, lastSlice, anchorSlice, seriesInformation)
    {
        // Now, we need to figure out what the start and end angles are for
        // the visible chart segment.

        var startAngle = 0,
            endAngle = 0,
            leftover = 0;

        if (firstSlice && lastSlice)
        {
            // We need to find out where our anchor slice lives within firstSlice
            // and lastSlice. To do this, we must sum up the angles from the anchor
            // to either end slices. We choose the closest (by index), for speed.
            var closestSliceByIndex = anchorSlice.findClosestByIndex(firstSlice, lastSlice);
            var segmentPartialAngularWidth = _.reduce(
                this._fillInSliceRange(anchorSlice, closestSliceByIndex),
                function (memo, slice)
                {
                    return memo + slice.getAngleRadians(seriesInformation);
                }, 0);

            // Now, we can calculate the start and end angles based on our anchor.
            var anchorAngleRadians = anchorSlice.getAngleRadians(seriesInformation);
            var closestIsAnchor = closestSliceByIndex.same(anchorSlice);
            var closestAngleRadians = closestIsAnchor ? 0 : closestSliceByIndex.getAngleRadians(seriesInformation);
            var closestIsFirstSlice = closestSliceByIndex.same(firstSlice);
            var middleElementsAngularWidth = segmentPartialAngularWidth - closestAngleRadians - anchorAngleRadians;
            $.assert(middleElementsAngularWidth >= -0.001, "Calculation error");

            if (closestIsFirstSlice)
            {
                var angleOfFirstSliceEnd = anchorSlice.anchorRadians - middleElementsAngularWidth - anchorAngleRadians/2;
                startAngle = angleOfFirstSliceEnd - closestAngleRadians;
            }
            else
            {
                var angleOfLastSliceStart = anchorSlice.anchorRadians + middleElementsAngularWidth + anchorAngleRadians/2;
                startAngle = angleOfLastSliceStart + closestAngleRadians;

                leftover = 2*Math.PI - sliceMetrics.angularWidthRadians;
            }
            endAngle = startAngle + sliceMetrics.angularWidthRadians;
        }
        else
        {
            leftover = 2*Math.PI;
        }

        var pieSegments = d3.layout.pie().startAngle(startAngle + leftover).endAngle(endAngle + leftover)
            .sort(null)
            .value(function (slice)
            {
                return slice.getValue();
            });

        return pieSegments;
    },

    // Renders a donut chart in the given D3 area. Slices are rendered starting
    // with firstSlice and end with lastSlice. lastSlice and firstSlice will be
    // positioned so they just fill fillArea. The anchor slice must come between
    // the two end slices. NOTE! firstSlice MUST have index zero - we can't calculate
    // the relative positioning between the series if we start at not-zero!
    _renderDonut: function(firstSlice, lastSlice, anchorSlice, fillArea, seriesInformationAll, enableTransitions)
    {
        $.assert(!lastSlice ||firstSlice.index == 0, "First slice must be at index 1.");
        $.assert(!lastSlice || lastSlice.index >= firstSlice.index, "Last slice must come after first slice.");
        $.assert(!lastSlice ||lastSlice.index >= anchorSlice.index && anchorSlice.index >= firstSlice.index, "Anchor slice must come between first and last slices.");
        $.assert(anchorSlice.anchorRadians != undefined, "Anchor slice should define an angular position.");

        var vizObj = this;

        _.each(seriesInformationAll, function(seriesInformation, colLookup)
        {
            var valueResolver = seriesInformationAll[colLookup].valueResolver;
            var nameResolver = seriesInformationAll[colLookup].nameResolver;
            var colorResolver = seriesInformationAll[colLookup].colorResolver;
            var isPrimaryColumn = (colLookup == vizObj._primaryValueColumn().column.lookup);

            var firstSeriesSlice = null;
            var lastSeriesSlice = null;
            var seriesAnchor = null;

            if (firstSlice)
            {
                firstSeriesSlice = isPrimaryColumn ? firstSlice : new vizObj.Slice(firstSlice.index, valueResolver, nameResolver, colorResolver);
                lastSeriesSlice = isPrimaryColumn ? lastSlice : new vizObj.Slice(lastSlice.index, valueResolver, nameResolver, colorResolver);

                seriesAnchor = isPrimaryColumn ? anchorSlice : firstSeriesSlice.asAnchor(firstSeriesSlice.getAngleRadians(seriesInformation) / 2);
            }
            else
            {
                // No slices to render... we still need an anchor to keep the code simpler.
                var anchorTranslatedToThisSeries = new vizObj.Slice(anchorSlice.index, valueResolver, nameResolver, colorResolver);
                seriesAnchor = anchorTranslatedToThisSeries.asAnchor(anchorSlice.anchorRadians);
            }

            vizObj._renderPie(firstSeriesSlice, lastSeriesSlice, seriesAnchor, fillArea, seriesInformation, enableTransitions);
        });
    },

    // Renders a pie chart in the given D3 area. Slices are rendered starting
    // with firstSlice and end with lastSlice. lastSlice and firstSlice will be
    // positioned so they just fill fillArea. The anchor slice must come between
    // the two end slices. It determines the overall positioning of the resultant
    // arc chart (otherwise known as maybe-partially-visible pie).
    _renderPie: function(firstSlice, lastSlice, anchorSlice, fillArea, seriesInformation, enableTransitions)
    {
        $.assert(!lastSlice || lastSlice.index >= firstSlice.index, "Last slice must come after first slice.");
        $.assert(!lastSlice || lastSlice.index >= anchorSlice.index && anchorSlice.index >= firstSlice.index, "Anchor slice must come between first and last slices.");
        $.assert(anchorSlice.anchorRadians != undefined, "Anchor slice should define an angular position.");

        var vizObj = this;
        var result = null;

        var canReuseCachedPieces = seriesInformation.cachedPiePieces &&
            seriesInformation.cachedPiePieces.fillArea.equal(fillArea) &&
            (firstSlice === seriesInformation.cachedPiePieces.firstSlice || seriesInformation.cachedPiePieces.firstSlice.same(firstSlice)) &&
            (lastSlice === seriesInformation.cachedPiePieces.lastSlice || seriesInformation.cachedPiePieces.lastSlice.same(lastSlice)) &&
            seriesInformation.cachedPiePieces.anchorSlice.same(anchorSlice) &&
            seriesInformation.cachedPiePieces.anchorSlice.anchorRadians == anchorSlice.anchorRadians;

        this.debugOut('Can reuse pieces? '+canReuseCachedPieces);

        if (canReuseCachedPieces)
        {
            result = seriesInformation.cachedPiePieces;
        }
        else
        {
            var slices = firstSlice ? this._fillInSliceRange(firstSlice, lastSlice) : [];
            var sliceMetrics = this._calculateSliceSetMetrics(slices, seriesInformation);

            var pieSegments = this._buildPieLayout(sliceMetrics, firstSlice, lastSlice, anchorSlice, seriesInformation);

            if (sliceMetrics.valueSum > 0)
            {
                result = pieSegments(slices);
            }
            else
            {
                result = [];
            }

            // Now filter out anything that's too small.
            var removedSliceValueSum = 0;
            var removedSliceAngleSum = 0;
            var segmentsToRender = _.filter(result,
                function(d)
                {
                    d.startAngle -= removedSliceAngleSum;
                    d.endAngle -= removedSliceAngleSum;
                    var tooSmall = vizObj._tooSmallForDisplay(d.data, seriesInformation);
                    if (tooSmall)
                    {
                        removedSliceValueSum += d.data.getValue();
                        removedSliceAngleSum += d.data.getAngleRadians(seriesInformation);
                    }
                    return !tooSmall;
                });

            if (segmentsToRender.length == 0)
            {
                var empty = _.isEmpty(result);
                if (empty)
                {
                    segmentsToRender = [];
                    removedSliceValueSum = 0;
                    removedSliceAngleSum = 0;
                }
                else
                {
                    segmentsToRender = [result[0]];
                    removedSliceValueSum = sliceMetrics.valueSum - result[0].data.getValue();
                    removedSliceAngleSum = sliceMetrics.angularWidthRadians - result[0].data.getAngleRadians(seriesInformation);
                }
            }

            var otherPlaceholder =
            {
                endAngle: pieSegments.endAngle() - removedSliceAngleSum,
                startAngle: pieSegments.startAngle() + Math.PI*2
            };

            if (seriesInformation.getDataSum() > 0 && Math.abs(otherPlaceholder.endAngle - otherPlaceholder.startAngle) > 0.001)
            {
                // Graft on a placeholder slice.
                var valueResolver = function(asText)
                {
                    var col = seriesInformation.colDef.column;
                    var val = seriesInformation.getDataSum() - (sliceMetrics.valueSum - removedSliceValueSum);

                    if (asText)
                    {
                        if ($.subKeyDefined(col, 'renderType.renderer'))
                        {
                            return col.renderType.renderer(val, col, true, false, true);
                        }
                        else
                        {
                            return val;
                        }
                    }
                    else
                    {
                        return val;
                    }
                };

                var nameResolver = function()
                {
                    return $.t('controls.charts.other_slice_label');
                };

                var colorResolver = function()
                {
                    return 'gray';
                };

                otherPlaceholder.data = new this.Slice(undefined, valueResolver, nameResolver, colorResolver);
                segmentsToRender.push(otherPlaceholder);
                result = segmentsToRender;
            }

            seriesInformation.cachedPiePieces = result;
            seriesInformation.cachedPiePieces.fillArea = fillArea;
            seriesInformation.cachedPiePieces.firstSlice = firstSlice;
            seriesInformation.cachedPiePieces.lastSlice = lastSlice;
            seriesInformation.cachedPiePieces.anchorSlice = anchorSlice;
        }

        this._renderPiecesOfPie(result, seriesInformation, fillArea, enableTransitions);
    },

    _pivotOnSlice: function(slice, angle)
    {
        var vizObj = this;

        angle = _.isUndefined(angle) ? Math.PI : angle;

        this._chartConfig.chartRenderSnapshot.anchorSlice = slice.asAnchor(angle);
        vizObj._rerenderPositions();
    },

    _getRadius: function(fillArea, zoomFactor)
    {
        var naturalRadius = Math.min(fillArea.width, fillArea.height) * 0.85 / 2;

        return Math.max(0, naturalRadius * zoomFactor - this.defaults.labelMargin);
    },

    _arcPositionAlongBisector: function(arc)
    {
        return function(datum, radius)
        {
            var a = (arc.startAngle()(datum)
                + arc.endAngle()(datum)) / 2  - Math.PI / 2;
            return [Math.cos(a) * radius, Math.sin(a) * radius];
        };
    },

    _renderPiecesOfPie: function (pieces, seriesInformation, fillArea, enableTransitions)
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        var radius = vizObj._getRadius(fillArea, vizObj._zoomFactor);

        vizObj.debugOut('Rendering ' +pieces.length + ' pie pieces, radius ' + radius);
        vizObj.debugOut('Transitions: '+enableTransitions);

        var translateX, translateY, radius;
        var isZoomed = vizObj._zoomFactor > 1.0001;
        if (isZoomed)
        {
            // Zoomed in. Want to place in middle horizontally, and get lower
            // arc just in view.
            var leftOverX = fillArea.width - radius*2;
            translateX = radius + leftOverX/2;
            translateY = Math.min(0, fillArea.height -radius);
        }
        else
        {
            // Not zoomed. Want to place in middle.
            var leftOverX = fillArea.width - radius*2;
            var leftOverY = fillArea.height - radius*2;
            translateX = radius + leftOverX/2;
            translateY = radius + leftOverY/2;
        }

        var colCount = vizObj._valueColumnCount();
        var colIndex = seriesInformation.columnIndex;
        var seriesRadius = radius / (colCount + 1);
        var innerRadius = cc.donut ? (colIndex + 1) * seriesRadius : 0;
        var outerRadius = cc.donut ? (colIndex + 2) * seriesRadius : radius;

        var flyoutPositionRadiusPadding = 10;
        if ((outerRadius - innerRadius) < flyoutPositionRadiusPadding)
        {
            flyoutPositionRadiusPadding = (outerRadius - innerRadius)/2;
        }

        var flyoutPositionRadius = outerRadius - flyoutPositionRadiusPadding;

        var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius);

        var arcPositionAlongBisector = vizObj._arcPositionAlongBisector(arc);

        var idFunction = function(datum)
            {
                if (!_.isUndefined(datum.data.index))
                {
                    return datum.data.index;
                }
                else
                {
                    // Placeholder for unfetched pieces.
                    return -1;
                }
            };

        var sliceClass = 'sliceSeries'+colIndex;
        var slices = cc.chartD3.selectAll('.'+sliceClass)
            .data(pieces, idFunction);

        slices
            .enter()
                .append('path')
                    .classed(sliceClass, true)
                    .attr('stroke', 'white')
                    .on('click', function(datum)
                    {
                        if (vizObj.debugEnabled)
                        {
                            if (!$.isBlank(datum.data))
                            {
                                vizObj._pivotOnSlice(datum.data);
                            }
                        }
                    });

        var updateSlices = slices
            // check for datum because sometimes there's a race condition between unbind and remove
            .on('mouseover', function(datum)
            {
                if (!vizObj._chartInitialized) { return; }
                var configs = {};
                var row = null;
                if (datum && !cc._isDragging)
                {
                    var this_ = this;
                    row = seriesInformation.rowResolver(datum.data);
                    //he position we must give the flyout is relative to the top-left.
                    var flyoutPosRelToSlice = arcPositionAlongBisector(datum, flyoutPositionRadius);
                    var width = $(this.node).btOuterWidth();
                    var height = $(this.node).btOuterHeight();

                    // BUG WORKAROUND: Firefox will not report offset parents for
                    // SVG elements (the offsetParent property is undefined). This
                    // causes position() to return a value relative to the document
                    // root. So if this is the case, hack in the correct offsetParent
                    // here...
                    if (_.isUndefined(this.node.offsetParent))
                    {
                        this.node.offsetParent = cc.$chartContainer[0];
                    }

                    var position = $(this.node).position();
                    flyoutPosRelToSlice[0] += -position.left + translateX;
                    flyoutPosRelToSlice[1] += -position.top + translateY;

                    configs =
                    {
                        positions: ['explicit'],
                        explicitPosition: flyoutPosRelToSlice
                    };
                }

                vizObj.handleDataMouseOver(this, seriesInformation.colDef, row, configs, datum && !cc._isDragging && !_.isUndefined(row));
            })
            .on('mouseout', function(datum)
            {
                if (!vizObj._chartInitialized) { return; }
                vizObj.handleDataMouseOut(this, 150);
            })
            .on('click', function(datum)
            {
                if (!vizObj._chartInitialized) { return; }
                if (datum)
                {
                    var row = seriesInformation.rowResolver(datum.data);
                    if (!row) { return; } // We might not have a row if this is 'other'.

                    vizObj.handleDataClick(this, row, seriesInformation.colDef);
                }
            })
            .attr('fill', function(datum)
            {
                return datum.data.getColor();
            })
            .attr('transform', 't'+translateX+','+translateY);

            if (enableTransitions)
            {
                updateSlices.transition()
                    .duration(500)
                    .attr('d', arc);
            }
            else
            {
                updateSlices.attr('d', arc);
            }

        slices
            .exit()
                .each(function()
                {
                    vizObj.handleDataLeaveDOM(this);
                })
                .remove();


        // Now render labels, but only for the outermost column.

        if (colIndex == colCount - 1)
        {
            vizObj._renderLabels(pieces, seriesInformation, arc, radius, fillArea, translateX, translateY, idFunction);
        }
    },

    // Get some cached font metrics. In particular, lengthForString will cache
    // all text lengths across the lifetime of the chart, as getting this info
    // is quite expensive.
    _fontMetrics: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;
        if (!cc.fontMetrics)
        {
            var cc = this._chartConfig;

            var fontSpec = d3ns.fontMetrics.getFontSpec(cc.$chartContainer);
            var globalFm = d3ns.fontMetrics.getFontMetrics(fontSpec);

            var fm =
            {
                fontSpec: fontSpec,
                labelHeight: globalFm.sizeForString('Xg').height,
                lengthForString: function(str)
                {
                    return globalFm.sizeForString(str).width;
                }
            };
            cc.fontMetrics = fm;
        }

        return cc.fontMetrics;
    },

    _renderLabels: function(pieces, seriesInformation, arc, sliceRadius, fillArea, translateX, translateY, idFunction)
    {
        var vizObj = this,
            cc = vizObj._chartConfig;
        var showPercentages = vizObj._displayFormat.showPercentages;
        var showActualValues = vizObj._displayFormat.showActualValues;
        var fontMetrics = vizObj._fontMetrics();
        var radiusForLabels = sliceRadius + vizObj.defaults.labelMargin;

        var arcPositionAlongBisector = vizObj._arcPositionAlongBisector(arc);

        // Given a datum, returns the text we'd use to display it. Supports
        // two extra parameters used for text clipping:
        // baseNameOnly:  Return only the base name, without any additions
        //                such as percents or values.
        // baseNameCharLimit:  Only use this many characters from the base name.
        //                     If the base name exceeds this length, the extra
        //                     characters are replaced by an ellipsis.
        //                     Note that this can result in a longer string
        //                     if the char limit is within 3 chars of the base
        //                     name length.
        var textFromDatum = function(datum, baseNameOnly, baseNameCharLimit)
        {
            var label = datum.data.getName() || ''; // We should have a default name (Bug 11334).
            if (baseNameCharLimit !== undefined)
            {
                if (label.length > baseNameCharLimit)
                {
                    label = label.substr(0, baseNameCharLimit) + '...';
                }
            }

            if (!baseNameOnly)
            {
                if (showPercentages)
                {
                    var percentage = (datum.data.getValue()/seriesInformation.getDataSum())*100;
                    if (percentage < 1)
                    { percentage = '<1'; }
                    else
                    { percentage = Math.floor(percentage); }
                    label += ' ('+ percentage +'%)';
                }

                if (showActualValues)
                {
                    label += ' ('+ datum.data.getValueText() +')';
                }
            }

            return label;
        };

        var labelSizer = _.memoize(function(datum)
        {
            //TODO integrate this into d3.layout-utils' font metrics code.
            return fontMetrics.lengthForString(textFromDatum(datum));
        }, function(datum) { return datum.data.index; });

        var labelDesiredPosition = function(datum)
        {
            return arcPositionAlongBisector(datum, sliceRadius);
        };

        var labelLayout;
        if (!_.isEmpty(pieces) && _.isUndefined(pieces[0].slottedCircleLayout))
        {
            vizObj.debugOut('Computing slot layout');
            labelLayout = new d3ns.slottedCircleLayout(
                fontMetrics.labelHeight,
                radiusForLabels,
                {x: translateX, y: translateY}, //Center of circle.
                fillArea,
                labelSizer,
                labelDesiredPosition,
                vizObj.defaults.labelLinesMargin + vizObj.defaults.endpointLineLength // top pyramid margin.
                );

            labelLayout.data(pieces);

            if (vizObj.debugEnabled)
            {
                labelLayout.debugVerifyLayout();
            }
        }

        var effectiveSliceRadius = sliceRadius + vizObj.defaults.endpointLineLength; // Slice radius plus the little extra line sticking out.
        var lineHitsChart = function(d)
        {
            var sliceRadiusGraceArea = 1; // Allow overlap by these many pixels.
                                          // Necessary as we always have one
                                          // line endpoint right on the circle.
            var desired = arcPositionAlongBisector(d, effectiveSliceRadius);
            var x1 = d.slottedCircleLayout.x;
            var y1 = d.slottedCircleLayout.y;
            return d3ns.math.lineSegIntersectsCircle(0, 0, effectiveSliceRadius-sliceRadiusGraceArea, x1 - translateX, y1 - translateY, desired[0], desired[1]);
        };

        var filterToShowable = function(toFilter)
        {
            var unshowableLabelsWithSpace = 0;
            var filtered = _.reject(toFilter, function(d)
            {
               if (d.slottedCircleLayout.overflow)
               {
                   return true;
               }
               if (lineHitsChart(d) || $.isBlank(d.data.getName()))
               {
                   unshowableLabelsWithSpace ++;
                   return true;
               }
               return false;
            });

            return { unshowableLabelsWithSpace: unshowableLabelsWithSpace,
                     showable: filtered};
        };

        var filterResult = filterToShowable(pieces);

        vizObj.debugOut('Unshowable labels:' + filterResult.unshowableLabelsWithSpace);
        // If we can't show a bunch of labels due to line placement issues, remove the labels
        // and re-run layout so it looks better (and maybe makes better use of the available
        // space. It's not perfect as we really need this to run until things converge,
        // but that would be too slow.
        if (filterResult.unshowableLabelsWithSpace > vizObj.defaults.hiddenLabelReflowThreshold && labelLayout)
        {
            vizObj.debugOut('Re-running label layout');
            labelLayout.data(_.reject(pieces, function(d)
                {
                   // Keep ones with overflow.
                   return (lineHitsChart(d) || $.isBlank(d.data.getName()));
                }));

            if (vizObj.debugEnabled)
            {
                labelLayout.debugVerifyLayout();
            }

            filterResult = filterToShowable(pieces);
            vizObj.debugOut('We still have ' + filterResult.unshowableLabelsWithSpace + ' unshowable labels.');
        }

        // Do auto-ellipsis. Given a datum, analyze its assigned size and chop
        // chars off the end of its base name until it fits. Will not chop
        // the value or percentage indicator, it only chops off the base name,
        // so you get things like "Label Nam... (45%)"
        var fitText = function(d)
        {
            if (d.slottedCircleLayout.naturalWidth !== d.slottedCircleLayout.width)
            {
                // We need to clip. Binsearch to find the maximal length string
                // we can use (keep in mind this will add an ellipsis).
                var targetSize = d.slottedCircleLayout.width;

                // Start one less than full length; we know we'll need to truncate.
                // Also starting one from the end guarantees that textFromDatum will add the ellipsis for us, which allows us to avoid all
                // sorts of metastable nastiness arising from that ellipsis popping in.
                var curLimRight = textFromDatum(d, true  /*baseNameOnly*/).length - 1;
                var curLimLeft = 0;

                var len, mid, found;
                do
                {
                    if (curLimRight - curLimLeft <= 1) { found = curLimLeft; break; }
                    mid = Math.floor((curLimLeft + curLimRight) / 2);
                    len = fontMetrics.lengthForString(textFromDatum(d, false /*baseNameOnly*/, mid));
                    if (len == targetSize)
                    {
                        found = mid;
                        break;
                    }
                    else if (len > targetSize)
                    {
                        curLimRight = mid;
                    }
                    else
                    {
                        curLimLeft = mid;
                    }

                } while (true);

                d.fittedText = textFromDatum(d, false /*baseNameOnly*/, found);
                d.textOverflow = d.slottedCircleLayout.naturalWidth - fontMetrics.lengthForString(d.fittedText);
            }
            else
            {
                d.textOverflow = 0;
                d.fittedText = textFromDatum(d);
            }
        };

        var labels = cc.chartD3.selectAll('.label')
            .data(filterResult.showable, idFunction);

        labels
            .enter()
                .append('text')
                .classed('label', true)
                .attr('text-anchor', 'start')
                .each(function(elem)
                {
                    // Note: We must apply the font spec here because otherwise
                    // Raphael will fall back to its internal default, which can
                    // be different from the actual inherited CSS font style.
                    // Additionally, raphael will set its font (default or not)
                    // as a direct attr on the text elements, defeating any
                    // font-related CSS rules targeting the labels. So if one
                    // wants to change the label font, they must change the font
                    // no lower than the root of the chart DOM.
                    fontMetrics.fontSpec.applyTo(this);
                });

        labels
            .each(fitText)
            .attr("x", function(d)
            {
                return d.slottedCircleLayout.x + ((d.slottedCircleLayout.x < translateX) ? d.textOverflow : 0);
            })
            .attr("y", function(d) { return d.slottedCircleLayout.y; })
            .text(function(d) { return d.fittedText; });


        labels
            .exit()
                .remove();

        // Now label lines.

        var lines = cc.chartD3.selectAll('.line')
            .data(filterResult.showable, idFunction);

        lines
            .enter()
                .append('path')
                .attr({ stroke: 'black',
                        strokeWidth: '3' })
                .classed('line', true);


        lines
            .attr('d', function(d, i)
                {
                    var nextLabel;
                    if (i < filterResult.showable.length - 1)
                    {
                        nextLabel = filterResult.showable[i+1];
                    }

                    var pointOnSlice = arcPositionAlongBisector(d, sliceRadius); // rel to center
                    pointOnSlice[0] += translateX;
                    pointOnSlice[1] += translateY;

                    var pointJustOutsideSlice = arcPositionAlongBisector(d, effectiveSliceRadius); // rel to center
                    pointJustOutsideSlice[0] += translateX;
                    pointJustOutsideSlice[1] += translateY;

                    // Okay, this seems complicated, but it's just because good looks
                    // are never simple ;) We're just trying to connect the line to
                    // the label text in a way that looks natural and isn't obscuring
                    // text.
                    // In the comments below, 'target' refers to the point on the
                    // slice, and 'source' refers to the point on the label text.

                    var pointOnLabel = []; // rel to chart
                    var leftOfCenter = pointOnSlice[0] < translateX;
                    var margin = vizObj.defaults.labelLinesMargin;
                    var extraElbow = [];
                    var teeVertical = true;

                    pointOnLabel[1] = d.slottedCircleLayout.y;
                    if (leftOfCenter)
                    {
                        // We're on the LHS.
                        pointOnLabel[0] = d.slottedCircleLayout.x + labelSizer(d) + margin;
                        // Pretty much just get a straight line with simple elbows.
                        {
                            extraElbow[0] = pointOnLabel[0] + vizObj.defaults.endpointLineLength;
                            extraElbow[1] = pointOnLabel[1];
                        }
                    }
                    else
                    {
                        // We're on the RHS.
                        pointOnLabel[0] = d.slottedCircleLayout.x;
                        if (pointJustOutsideSlice[1] > pointOnLabel[1] && // Target point is below us and
                            pointJustOutsideSlice[0] > pointOnLabel[0])   // to the right (quadrant IV).
                        {
                            // Place source point on the bottom of the text,
                            // centered horizontally.
                            // Check the next label for collision.


                            pointOnLabel[1] += fontMetrics.labelHeight/2;
                            pointOnLabel[0] = d.slottedCircleLayout.x + d.slottedCircleLayout.size/2;

                            var careAboutNext = nextLabel && nextLabel.slottedCircleLayout.x > translateX; // Only care if next label is on same side.
                            if (careAboutNext)
                            {
                                var rightmostAllowed = nextLabel.slottedCircleLayout.x - margin;
                                // Worst-case scenario is that this label uses a line coming out of
                                // its left side. We don't know if it will (because that would require this
                                // algorithm to be recursive, and frankly the label layout code in general
                                // is already slow enough), so just account for this worst-case possibility.

                                // Vertical line added to make sure we don't intersect the next label.
                                // Well, at least the y-coordinate (x is computed in a bit).
                                extraElbow[1] = pointOnLabel[1] + fontMetrics.labelHeight;

                                // How far to the right must I be for the vertical line I'll draw (below)
                                // intersect the line drawn from the next label's target to its slotted layout position?
                                var nextLabelLineStart = labelDesiredPosition(nextLabel);
                                nextLabelLineStart[0] += translateX;
                                nextLabelLineStart[1] += translateY;
                                var nextLabelLineWorstCaseEnd = [nextLabel.slottedCircleLayout.x, nextLabel.slottedCircleLayout.y];
                                nextLabelLineWorstCaseEnd[0] -= margin + vizObj.defaults.endpointLineLength; //TODO this implementation needs to be common with the other cases.
                                var slope = (nextLabelLineWorstCaseEnd[1] - nextLabelLineStart[1]) / (nextLabelLineWorstCaseEnd[0] - nextLabelLineStart[0]);
                                // Point-slope form: y-y1 = m(x-x1)
                                // y     : extraElbow[1]
                                // x1, y1: nextLabelLineEnd
                                // x     : what we're after
                                var xOfIntercept = ((extraElbow[1] - nextLabelLineStart[1]) + slope*nextLabelLineStart[0]) / slope;
                                rightmostAllowed = Math.min(xOfIntercept - margin, rightmostAllowed);

                                pointOnLabel[0] = Math.min(rightmostAllowed, pointOnLabel[0]);
                                extraElbow[0] = pointOnLabel[0];
                            }

                            teeVertical = false;
                        }
                        else // Other quadrants pretty much get a straight line with simple elbows.
                        {
                            pointOnLabel[0] -= margin;
                            extraElbow[0] = pointOnLabel[0] - vizObj.defaults.endpointLineLength;
                            extraElbow[1] = pointOnLabel[1];
                        }
                    }

                    extraElbow = extraElbow || pointOnLabel;
                    var path = vizObj._d3_line_path(pointOnSlice, pointJustOutsideSlice, extraElbow, pointOnLabel);
                    var teeLengthSide = vizObj.defaults.labelTeeLength / 2;
                    if (teeVertical)
                    {
                        path += vizObj._d3_line_path(
                            [pointOnLabel[0], pointOnLabel[1] - teeLengthSide],
                            [pointOnLabel[0], pointOnLabel[1] + teeLengthSide]);
                    }
                    else
                    {
                        path += vizObj._d3_line_path(
                            [pointOnLabel[0] - teeLengthSide, pointOnLabel[1]],
                            [pointOnLabel[0] + teeLengthSide, pointOnLabel[1]]);
                    }

                    return path;
                });

        lines.exit().remove();
    },

    _calculateSliceSetMetrics: function (slices, seriesInformation)
    {
        var sliceSum = _.reduce(slices, function (memo, slice) { return memo + slice.getValue(); }, 0);

        var angularWidthRadians = 2 * Math.PI * (sliceSum / seriesInformation.getDataSum());

        return {
            valueSum: sliceSum,
            angularWidthRadians: angularWidthRadians
        };
    },

    _fillInSliceRange: function(firstSlice, lastSlice)
    {
        var output = [];

        var inOrder = firstSlice.index <= lastSlice.index;
        var lastIndex = inOrder ? lastSlice.index : firstSlice.index;

        for(var currentSlice = inOrder ? firstSlice : lastSlice; currentSlice.index<=lastIndex;)
        {
            output.push(currentSlice);
            currentSlice = currentSlice.neighbor(true);
        }

        return output;
    },

    _rotateChart: function(amount)
    {
        //TODO extend for right rot.
        if (amount < 0)
        {
            if (this._tooSmallForDisplay(this._chartConfig.chartRenderSnapshot.lastSlice, this._chartConfig.chartRenderSnapshot.seriesInformation[this._primaryValueColumn().column.lookup]))
            {
                // don't let turn if already at small end.
                //this.debugOut("probably should not rotate"); //return;
                return;
            }
        }

        this._chartConfig.chartRenderSnapshot.anchorSlice.anchorRadians += amount;
        this._rerenderPositions();
    },

    // call this if spacings/widths changed
    _rerenderPositions: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        if (cc.chartRenderSnapshot)
        {
            vizObj._loadDataIfNeeded();
            vizObj._renderSnapshot(cc.chartRenderSnapshot, !vizObj._isIE8() /* enableTransitions */);
        }
    },

    _zoom: function(zoomIn)
    {
        var factor = 1.5;
        this._lastZoomFactor = this._zoomFactor;
        this._zoomFactor *= zoomIn ? factor : 1/factor;
        this._zoomFactor = Math.max(this._zoomFactor, 1);

        this._pivotOnSlice(this._chartConfig.chartRenderSnapshot.lastSlice);
        this._rerenderPositions();
    },

    _renderDebugControlButtons: function()
    {
        var vizObj = this,
            cc = vizObj._chartConfig;

        cc.$controlContainer.append($.tag({
                tagName: 'a',
                href: '#',
                'class': 'rotateCWButton',
                contents: "(CW)"
            }));

        cc.$controlContainer.append($.tag({
                tagName: 'a',
                href: '#',
                'class': 'rotateCCWButton',
                contents: "(CCW)"
            }));

        cc.$controlContainer.append($.tag({
                tagName: 'a',
                href: '#',
                'class': 'zoomInButton',
                contents: "(+)"
            }));

        cc.$controlContainer.append($.tag({
                tagName: 'a',
                href: '#',
                'class': 'zoomOutButton',
                contents: "(-)"
            }));

        cc.$controlContainer.find(".rotateCWButton").click(function()
        {
            vizObj._rotateChart(Math.PI/20);
        });

        cc.$controlContainer.find(".rotateCCWButton").click(function()
        {
            vizObj._rotateChart(-Math.PI/20);
        });

        cc.$controlContainer.find(".zoomInButton").click(function()
        {
            vizObj._zoom(true);
        });

        cc.$controlContainer.find(".zoomOutButton").click(function()
        {
            vizObj._zoom(false);
        });
    },

    _d3_getColor: function(colDef, d)
    {
        var vizObj = this;

        var color = d ? d.color : undefined;

        if (!color)
        {
            var colors = vizObj._getDisplayFormatColors();

            if (d && !_.isEmpty(colors))
            {
                if (!_.isUndefined(colors) && colors.length > 0)
                {
                    var repGroup = Math.floor(d.index / colors.length);
                    var baseIndex = d.index - (repGroup * colors.length);

                    color = $.rotateHex(colors[baseIndex], -repGroup*24);
                }
                else
                {
                    color = colDef.color;
                }
            }
            else
            {
                color = colDef.color;
            }
        }

        // Fallback - no column color, no row color, and no colors array.
        if (!color)
        {
            var fallbackColors = vizObj._getFallbackColors();
            if (d)
            {
                var baseColorIndex = d.index % fallbackColors.length;
                color = $.rotateHex(fallbackColors[baseColorIndex], 8*(d.index - baseColorIndex));
            }
            else
            {
                return fallbackColors[0];
            }
        }

        return color;
    },

    // Sets a DOM element to overlay the chart.
    _setChartOverlay: function($overlayDom)
    {
        var $targetElement = this._chartConfig.$overlayContainer;
        $targetElement.empty().append($overlayDom);
        $targetElement.css('visibility', $overlayDom ? 'visible' : 'collapse');
    }

}, null, 'socrataChart', ['d3_base', 'd3_base_dynamic', 'd3_base_legend' ]);

})(jQuery);
