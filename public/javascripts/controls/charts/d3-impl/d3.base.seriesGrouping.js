// future improvements:
// * make obsolete w/ core server cubing
// * currently assumes well-formed data: fully-specified combinatorics (filled cube).
//   can make robust to not well-formed many-rowed data by intercepting and overriding
//   getDataForView() and using an inline filter to filter down to the rows specified in
//   the actual render ipml's getRenderRange(), then doing a straight getAllRows().

(function($)
{

var d3base = blist.namespace.fetch('blist.d3.base');

var globalColorIndex = {};
var globalColorBasis = [];

// honestly i really think this is a soql thing, not a presentation thing.
// but we're using it in enough places that i'll implement a stopgap for now.

// remix the data we're getting back in a way that's transparent to the
// impl layers to account for series grouping. meant to be mixed in
// *after* the impl itself, since we need to intercept stuff
d3base.seriesGrouping = {
    // Time we'll spend processing before displaying an estimated time.
    // We don't want to display right away as browsers like Chrome will do their
    // JIT magic for a few seconds, making our early estimations garbage.
    _remainingTimeDisplayDelayMillisec: 3000,

    _seriesGroupingSentinel: true,

    initializeVisualization: function()
    {
        var vizObj = this;

        vizObj.getColumns();

        if (!vizObj.requiresSeriesGrouping())
        {
            delete this._seriesGrouping;
            return vizObj._super.apply(vizObj, arguments);
        }

        // Sort types: natural, alphabetical, arbitrary.
        // natural: the dataset as uploaded.
        // alphabetical: the relevant column is in metadata.jsonQuery.order.
        // arbitrary: use metadata.displayOrder.
        var sg = vizObj._seriesGrouping = {
            categoryIndexLookup: {},
            categorySort: 'natural', // arbitrary sort not supported yet.
            fixedColumn: null,
            groupedView: null,
            groupSort: 'natural',
            hasGroupBys: vizObj._primaryView.isGrouped(),
            physicalRowsRetreived: 0,
            ready: false,
            sortColumns: null,
            sortedView: null,
            totalVirtualRows: null,
            valueColumnColors: {},
            virtualColumns: {},
            virtualRows: {},
            queuedRenderRows: [],
            savedRenderRowQueue: [],
            processingPaused: false,
            virtualRowReadyCount: 0
        };

        var sortColumns = [];

        // first sort by the category
        sortColumns.push(vizObj._fixedColumns[0]);

        // then sort by the series groups in order. Note! Do not update the sortColumns which get
        // fed to the backend otherwise the lobotomizer will cry at you.
        sg.sortColumns = _.compact(sortColumns.concat(_.pluck(vizObj._seriesColumns, 'column')));

        // If there isn't a fixedColumn, use the id to sort
        sg.fixedColumn = vizObj._fixedColumns[0] || vizObj._primaryView.metaColumnForName('id');

        // Set up cache
        vizObj._seriesCache = vizObj._seriesCache || {};
        var cacheKey = vizObj._getCacheKey(sg, vizObj._valueColumns);
        var cacheItem = vizObj._seriesCache[cacheKey] = vizObj._seriesCache[cacheKey] || {};

        // make a copy of the view that we'll use for querying so that we're
        // fetching everything in the appropriate sort
        cacheItem.sortedView = sg.sortedView = cacheItem.sortedView || vizObj._primaryView.clone();
        var sortedView = sg.sortedView;

        // Do we have cached values to load?
        if (!$.isBlank(cacheItem.virtualRows))
        {
            sg.virtualRows = cacheItem.virtualRows;
            sg.virtualRowReadyCount = cacheItem.virtualRowReadyCount;
        }

        // set up the sort, if we have something to sort by.
        if (vizObj._fixedColumns[0])
        {
            var orderBys = $.deepGet(vizObj._primaryView, 'metadata', 'jsonQuery', 'order');
            if (_.any(orderBys,
                function(ob) { return ob.columnFieldName == vizObj._fixedColumns[0].fieldName; }))
            { sg.categorySort = 'alphabetical'; }

            var md = $.extend(true, {}, sortedView.metadata);
            md.jsonQuery.order = _.map(sortColumns, function(col)
            {
                var ascending = true;
                if (orderBys)
                {
                    ascending = (_.detect(orderBys, function(ob)
                        { return ob.columnFieldName == col.fieldName; })
                        || { ascending: true }).ascending;
                }

                return {
                    ascending: ascending,
                    columnFieldName: col.fieldName
                };
            });
            sortedView.update({ metadata: md });
        }

        // we're explicitly not calling _super here. we'll save it off, and
        // initialize the rest of the chain once we're ready here. saves a
        // lot of bad hackery.
        sg.superInit = vizObj._super;

        var finishedPreprocessing = false;
        var maybeDone = _.after(2, function()
        {
            // If there isn't a fixedColumn, use the id to sort, which will be
            // available now that rows have been loaded
            if ($.isBlank(sg.fixedColumn))
            { sg.fixedColumn = categoryGroupedView.metaColumnForName('id'); }

            // If we get re-initialized before the two views below finish their
            // getAllRows, we'll be paving over fields in vizObj with some stale
            // data if we call _preprocessSeriesColumns. If this happens,
            // stop processing here.
            if (sg !== vizObj._seriesGrouping)
            {
                return;
            }

            // this is saved down below. Now that we have everything we need
            // to get ready, process some things and allow everything to init.
            vizObj._preprocessSeriesColumns(function()
            {
                // Manually trigger this event on the primary view for things like the sidebar
                vizObj.finishLoading();
                finishedPreprocessing = true;
                vizObj._primaryView.trigger('row_count_change');
                sg.superInit.call(vizObj);

                if (_.isEmpty(sg.virtualRows))
                {
                    vizObj._setChartVisible(false);
                    vizObj._setLoadingOverlay();
                    vizObj._updateLoadingOverlay('start');
                    vizObj._updateLoadingOverlay('preprocess');
                }
                else
                {
                    vizObj._setLoadingOverlay();
                    vizObj._updateLoadingOverlay('loading');
                }
            });
        });

        // make another copy of the view that we'll use to get the category-relevant rows
        // piggyback off sortedView so that the categories come back sorted
        var categoryGroupedView = sortedView.clone();


        if (vizObj._fixedColumns[0])
        {
            var categoryGroupBys = (sortedView.metadata.jsonQuery.group || []).concat([
                { columnFieldName: vizObj._fixedColumns[0].fieldName } ]);

            var md = $.extend(true, {}, sortedView.metadata);
            md.jsonQuery.group = categoryGroupBys;
            categoryGroupedView.update({ metadata: md });
        }

        var getCategoryGrouped = function()
        {
            if (!$.isBlank(cacheItem.categoryGroupedRows))
            {
                sg.categoryGroupedRows = cacheItem.categoryGroupedRows;
                _.defer(maybeDone);
            }
            else
            {
                categoryGroupedView.getAllRows(function(rows)
                {
                    cacheItem.categoryGroupedRows = sg.categoryGroupedRows = rows;
                    maybeDone();
                },
                function(e)
                { if (e.cancelled) { getCategoryGrouped(); } });
            }
        };
        getCategoryGrouped();

        // make yet another copy of the view grouped by the series columns, so we can
        // just evaluate all the possible combinations of creating series columns up
        // front, rather than trying to piece things together as we go.
        var seriesGroupedView = sg.seriesGroupedView = sortedView.clone();
        var seriesGroupedColumns = _.reject(_.without(sortColumns, vizObj._fixedColumns[0]), function(col)
                {
                    return _.any(sortedView.metadata.jsonQuery.group, function(g)
                        { return col.fieldName == g.columnFieldName; });
                });

        var seriesGroupBys = (seriesGroupedView.metadata.jsonQuery.group || []).concat(
            _.map(seriesGroupedColumns, function(col)
            {
                return { columnFieldName: col.fieldName };
            }));

        var md = $.extend(true, {}, sortedView.metadata);
        md.jsonQuery.group = seriesGroupBys;
        seriesGroupedView.update({ metadata: md });
        var getSeriesGrouped = function()
        {
            if (!$.isBlank(cacheItem.seriesGroupedRows))
            {
                sg.seriesGroupedRows = cacheItem.seriesGroupedRows;
                _.defer(maybeDone);
            }
            else
            {
                seriesGroupedView.getAllRows(function(rows)
                {
                    cacheItem.seriesGroupedRows = sg.seriesGroupedRows = rows;
                    maybeDone();
                },
                function(e)
                { if (e.cancelled) { getSeriesGrouped(); } });
            }
        };
        getSeriesGrouped();

        // clear the global color cache if the user changes the color settings
        var colorBasis = _.map(vizObj._valueColumns, function(col) { return col.color; });
        if (!_.isEqual(globalColorBasis, colorBasis))
        {
            globalColorIndex = {};
            globalColorBasis = colorBasis;
        }

        // We're interested in some events coming from the primary view.
        vizObj._primaryView.bind('conditionalformatting_change', _.bind(vizObj._handleConditionalFormattingChanged, vizObj), vizObj);

        vizObj._primaryView.bind('query_change', _.bind(vizObj._invalidateCache, vizObj), vizObj);

        _.defer(function()
        {
            if (!finishedPreprocessing)
            {
                vizObj.startLoading();
            }
        });

        vizObj._setLoadingOverlay();
        vizObj._updateLoadingOverlay('preprocess');
    },

    _invalidateCache: function()
    {
        this._seriesCache = {};
    },

    cleanVisualization: function()
    {
        if (this._seriesGrouping && this._seriesGrouping.queuedRenderRows)
        {
            // Clear out any existing queue.
            this._seriesGrouping.queuedRenderRows.length = 0;
        }
        this._super();
        delete this._seriesGrouping;
    },

    _preprocessSeriesColumns: function(continuation)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            fixedColumn = sg.fixedColumn;

        // figure out our categories and make virtual row index lookups for them.
        var sortedCategories = sg.categorySort == 'alphabetical'
            ? sg.categoryGroupedRows : _.sortBy(sg.categoryGroupedRows, 'id');
        _.each(sortedCategories, function(row, index)
        {
            sg.categoryIndexLookup[row.data[fixedColumn.lookup]] = index;
        });
        sg.totalVirtualRows = _.size(sg.categoryIndexLookup);

        if (sg.hasGroupBys)
        {
            _.each(_.keys(sg.categoryIndexLookup), function(category, index)
            { sg.categoryIndexLookup[category] = index; });
        }

        // figure out our series columns.
        var sortedRows;
        if (vizObj._displayFormat.sortSeries)
        {
            sg.groupSort = 'arbitrary';
            var sortFunctions = _.map(vizObj._seriesColumns, function(sc)
            {
                var order = {};
                _.each((sc.column.metadata || {}).displayOrder, function(item, i)
                {
                    order[item.orderItem] = i;
                });

                return function(r)
                {
                    var v = r.data[sc.column.lookup];
                    return $.isBlank(order[v]) ? v : order[v];
                };
            });
            sortedRows = sg.seriesGroupedRows;

            // Sort by all columns.
            sortedRows.sort(function(a, b)
            {
                var result = 0;
                _.find(sortFunctions, function(sortFunc)
                    {
                        var vA = sortFunc(a);
                        var vB = sortFunc(b);
                        if (vA == vB)
                        {
                            return false;
                        }
                        else
                        {
                            result = vA < vB ? -1 : 1;
                            return true;
                        }

                    });
                return result;
            });
        }
        // Sort by position iff there isn't another sort in place. (i.e. natural sort)
        else if (!_.any($.deepGet(vizObj._primaryView, 'metadata', 'jsonQuery', 'order'), function(orderBy)
                { return _.include(sg.sortColumns,
                    vizObj._primaryView.columnForIdentifier(orderBy.columnFieldName)); }))
        {
            sg.groupSort = 'natural';
            sortedRows = _.sortBy(sg.seriesGroupedRows, 'id');
        }
        else
        { sg.groupSort = 'alphabetical'; }


        var rowIndex = 0; // Can't use index provided to eachItem as that index
                          // is relative to the current batch.
        var virtualColumnCount = 0;
        var eachItem = function(row)
        {
            var groupName = vizObj._groupName(row);

            // need to create a virtual column for each value column/seriesgroup
            // product
            _.each(vizObj._valueColumns, function(valueCol)
            {
                var virtualColumnName = (vizObj._valueColumns.length === 1) ?
                        groupName : valueCol.column.name + ', ' + groupName;

                if (!_.isUndefined(sg.virtualColumns[virtualColumnName]))
                {
                    // FIXME: This error starts spamming on groupBys.
                    // Need to figure out why and when it's proper to squelch it.
                    // Also the amount of console spam causes IE8 to report
                    // a script error, hence the commented log line.

                    // something has gone wrong
                    //console.log('Error: got a dupe virt col somehow?');
                    return;
                }
                else
                {
                    // save as obj for quick reference below
                    var virtualId = -100 - virtualColumnCount; // use negative id space to avoid confusion
                    sg.virtualColumns[virtualColumnName] = {
                        color: vizObj._getColorForColumn(valueCol, virtualColumnName),
                        groupName: groupName,
                        colIndex: rowIndex,
                        column: {
                            id: virtualId,
                            lookup: virtualId,
                            name: virtualColumnName,
                            realValueColumn: valueCol,
                            dataType: valueCol.column.dataType,
                            renderType: valueCol.column.renderType,
                            format: valueCol.column.format
                        }
                    };

                    virtualColumnCount++;
                }
            });

            rowIndex++
        };

        var batchProcessComplete = function()
        {
            // mark that we're ready for business, and if we've already had a customer
            // fire it off for them now that we're thundercats ho
            sg.ready = true;
            if (sg.wantsData === true)
            {
                vizObj.getDataForView(vizObj._primaryView);
                // vizObj.handleDataChange(); <-- probably not needed
            }

            continuation();
        };

        $.batchProcess(sortedRows || sg.seriesGroupedRows,
            250 /* batchSize*/,
            eachItem,
            null, /* eachBatch */
            batchProcessComplete);
    },

    getDataForView: function(view)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping;

        if (!vizObj.requiresSeriesGrouping())
        {
            return vizObj._super.apply(vizObj, arguments);
        }

        if (sg.ready !== true)
        {
            sg.wantsData = true;
            return;
        }

        vizObj._super(sg.sortedView);
    },

    getRenderRange: function(view)
    {
        var vizObj = this;

        if (!vizObj.requiresSeriesGrouping())
        {
            return vizObj._super.apply(vizObj, arguments);
        }

        // NOTE: There may be some optimization that can be done here to avoid
        // fetching _all_ the rows, but we haven't been able to come up with
        // such a beast.
        var numRows = vizObj._seriesGrouping.sortedView.totalRows();

        return { start: 0,
                 length: numRows };
    },

    getDataForAllViews: function()
    {
        if (!this.requiresSeriesGrouping() || !this._seriesGrouping.ready)
        {
            return this._super.apply(this, arguments);
        }

        // With DSG, we already have the data we care about. So just rerender.
        this.renderData(this._seriesGrouping.virtualRows);
    },

    renderData: function(data, view, didInsertData)
    {
        var vizObj = this;

        if (!vizObj.requiresSeriesGrouping())
        {
            return vizObj._super.apply(vizObj, arguments);
        }

        if (vizObj._seriesGrouping && vizObj._seriesGrouping.virtualRows === data)
        {
            // We just want to rerender the current data - no need to recalculate.
            // Force resize calculation in case we already have everything cached
            vizObj.handleDataChange();
            return vizObj._super(_.values(vizObj._seriesGrouping.virtualRows));
        }

        // Prevent reentrancy. This is an issue because highlighting (done below)
        // can cause another renderData.
        if (vizObj._inRenderSeriesGrouping) { return; }

        // If there were no insertions, don't bother re-rendering.
        if (didInsertData === false && vizObj._primaryView.totalRows() !== 0) { return; }
        vizObj._inRenderSeriesGrouping = true;

        vizObj._enqueueRows(data);

        // did we not get enough rows to flesh out our viewport? if so
        // go get more
        if (false)
        {
            // TODO: how do we even what
        }

        vizObj._inRenderSeriesGrouping = false;
    },

    _setLoadingOverlay: function()
    {
        if(!this._displayFormat.hideDsgMsg)
        {
            var vizObj = this;
            var sg = this._seriesGrouping;

            var overlay = $.tag(
                { tagName: 'div', 'class': 'dsgProgress flash notice invisible', contents: [
                    { tagName: 'div', contents: [
                        { tagName: 'span', 'class': 'dsgOperationText' }
                    ]},
                    { tagName: 'p', contents: [
                        { tagName: 'span', 'class': 'dsgProgressText' }
                    ]},
                    { tagName: 'p', 'class': 'dsgLoadingMsg', contents: [
                        { tagName: 'span', 'class': 'dsgPauseExplanationText', contents: $.t('controls.charts.series_grouping.pause_button_explanation1')},
                        { tagName: 'span', 'class': 'filter dsgFilterIcon', contents:[
                            { tagName: 'span', 'class': 'icon'}
                        ]},
                        { tagName: 'span', 'class': 'dsgPauseExplanationText', contents: $.t('controls.charts.series_grouping.pause_button_explanation2')}
                    ]},
                    { tagName: 'p', contents: [
                        { tagName: 'a', 'class': 'button dsgProgressPauseButton invisible', contents: $.t('controls.charts.series_grouping.pause_rendering') }
                    ]},
                    { tagName: 'div', 'class': 'loadingSpinner minimal dsgSpinner'}
                ] }
            , true);

            this._setChartOverlay(overlay);
            sg.$loadingOverlay = this.$dom().find('.dsgProgress');
            sg.$loadingOverlayOperationText = this.$dom().find('.dsgOperationText');
            sg.$loadingOverlayProgressText = this.$dom().find('.dsgProgressText');
            sg.$dsgProgressPauseButton = this.$dom().find('.dsgProgressPauseButton');
            sg.$dsgLoadingMsg = this.$dom().find('.dsgLoadingMsg');
            sg.$dsgSpinner = this.$dom().find('.dsgSpinner');

            // Using mousedown instead of click as browsers tend to miss click events
            // when they're under a heavy processing load. Especially chrome.
            sg.$dsgProgressPauseButton.mouseup(function()
            {
                if (sg.virtualRowReadyCount != sg.totalVirtualRows && _.isEmpty(sg.savedRenderRowQueue))
                {
                    vizObj._pauseSeriesProcessing();
                }
                else
                {
                    vizObj._resumeSeriesProcessing();
                }
            });
        }
    },

    _updateLoadingOverlay: function(state)
    {
        if(!this._displayFormat.hideDsgMsg)
        {
            var vizObj = this;
            var sg = vizObj._seriesGrouping;
            var cc = vizObj._chartConfig;

            if (sg && sg.$loadingOverlay)
            {
                var remaining = sg.totalVirtualRows - sg.virtualRowReadyCount;

                var operationPhaseMessage = '';
                var progressMessage = '';

                switch (state)
                {
                    case 'start':
                        sg.startLoadingTimeMillisec = Date.now();
                        delete sg.pauseLoadingTimeMillisec;
                        break;
                    case 'done':
                    //Done is when
                    //the caluculations are done and pausing no longer works, but before the charts shows

                        operationPhaseMessage = $.t('controls.charts.series_grouping.drawing_running');
                        sg.$dsgProgressPauseButton.addClass('invisible');
                        sg.$dsgLoadingMsg.addClass('invisible');
                        sg.$loadingOverlayProgressText.removeClass('invisible');
                        sg.$dsgSpinner.removeClass('invisible');
                        progressMessage = $.t('controls.charts.series_grouping.drawing_progress');

                        break;

                    case 'preprocess':
                    case 'loading':
                        sg.$dsgSpinner.removeClass('invisible');
                        sg.$loadingOverlay.removeClass('invisible');
                        sg.$loadingOverlayProgressText.removeClass('invisible');
                        operationPhaseMessage = $.t('controls.charts.series_grouping.calculation_running');
                        // If the user resumes, backfill a start time that preserves the amount of elapsed time at pause.
                        if (!_.isUndefined(sg.pauseLoadingTimeMillisec))
                        {
                            sg.startLoadingTimeMillisec = Date.now() - (sg.pauseLoadingTimeMillisec - sg.startLoadingTimeMillisec);
                            delete sg.pauseLoadingTimeMillisec;
                        }
                        sg.$dsgProgressPauseButton.text($.t('controls.charts.series_grouping.pause_rendering'));

                        // Only display progress/pause if we're not preprocessing.
                        var inPreprocess = state === 'preprocess';

                        if (!inPreprocess)
                        {
                            var elapsedTimeMillisec = Date.now() - (sg.startLoadingTimeMillisec || Date.now());
                            if (elapsedTimeMillisec > vizObj._remainingTimeDisplayDelayMillisec && sg.virtualRowReadyCount > 0)
                            {
                                var perRowMillisec = elapsedTimeMillisec / sg.virtualRowReadyCount;
                                var remainingMillisec = remaining * perRowMillisec;
                                var seconds = Math.floor(remainingMillisec/1000);
                                if (seconds >= 60)
                                {
                                    var minutes = Math.round(seconds/60);
                                    progressMessage = $.t(minutes == 1 ? 'controls.charts.series_grouping.rendering_progress_minute' : 'controls.charts.series_grouping.rendering_progress_minutes',
                                        {rows_remaining: remaining, time_remaining: minutes});
                                }
                                else if (seconds > 2)
                                {
                                    progressMessage = $.t('controls.charts.series_grouping.rendering_progress_seconds', {rows_remaining: remaining, time_remaining: seconds});
                                }
                                else
                                {
                                    // TODO converting to strings as $.t() thinks 0 is the same as undefined. Remove when appropriate (1 more instance below).
                                    progressMessage = $.t('controls.charts.series_grouping.rendering_progress_almost_done', {rows_remaining: remaining+''});
                                }

                            }
                            else
                            {
                                progressMessage = $.t('controls.charts.series_grouping.rendering_progress', {rows_remaining: remaining+''});
                            }
                        }
                        else
                        {
                            progressMessage = $.t('controls.charts.series_grouping.calculating_time');
                        }

                        sg.$dsgProgressPauseButton.removeClass('invisible');
                        sg.$dsgProgressPauseButton.toggleClass('disabled', inPreprocess);

                        sg.$dsgLoadingMsg.removeClass('invisible');
                        break;
                    case 'stopped':
                        sg.$dsgSpinner.addClass('invisible');
                        sg.$loadingOverlayProgressText.addClass('invisible');
                        operationPhaseMessage = $.t('controls.charts.series_grouping.rendering_paused');
                        if (_.isUndefined(sg.pauseLoadingTimeMillisec))
                        {
                            sg.pauseLoadingTimeMillisec = Date.now();
                        }
                        sg.$dsgProgressPauseButton.text($.t('controls.charts.series_grouping.resume_rendering'));
                        sg.$dsgProgressPauseButton.removeClass('invisible');
                        sg.$dsgProgressPauseButton.removeClass('disabled');
                        sg.$dsgLoadingMsg.removeClass('invisible');
                        break;
                }

                sg.$loadingOverlayOperationText.text(operationPhaseMessage);
                sg.$loadingOverlayProgressText.text(progressMessage);
            }
        }
    },

    _processRows: function(rows)
    {
        var vizObj = this;

        this._updateLoadingOverlay('loading');
        vizObj._processRealRows(rows);
    },

    _onRowQueueEmpty: function()
    {
        var vizObj = this;
        var sg = this._seriesGrouping;

        if (!vizObj.requiresSeriesGrouping()) { return; }

        var completed = sg.virtualRowReadyCount == sg.totalVirtualRows;

        if (completed)
        {
            // Note that our renderData interprets this argument as meaning
            // 'call super with the virtual rows'.
            this._setChartVisible(true);
            this._updateLoadingOverlay('done');
            var cacheKey = vizObj._getCacheKey(sg, vizObj._valueColumns);
            vizObj._seriesCache[cacheKey].virtualRows = sg.virtualRows;
            vizObj._seriesCache[cacheKey].virtualRowReadyCount = sg.virtualRowReadyCount;
            _.defer(function()
            {
                vizObj.renderData(sg.virtualRows);
                _.delay(function()
                {
                    vizObj._setChartOverlay(null);
                }, 1200);
            });
        }
        else
        {
            this._updateLoadingOverlay(_.isEmpty(sg.savedRenderRowQueue) ? 'loading' : 'stopped');
        }

        sg.rowQueueTimerActive = false;
    },

    _enqueueRows: function(rows)
    {
        var vizObj = this;
        var sg = vizObj._seriesGrouping;
        var queue = this._seriesGrouping.queuedRenderRows;

        // Due to IE8's raw speed, we can afford to wait longer between batches.
        // Oh wait, no, we have to wait longer otherwise IE still chokes.
        var dataProcessDelayMillisec = vizObj._isIE8() ? 250 : 10;

        if (!vizObj.requiresSeriesGrouping()) { return; }

        queue.push(rows.slice()); // REVISIT: Maybe can store indexes if ordering
                                  // works out. I don't think it does though.

        if (!sg.rowQueueTimerActive && !vizObj._seriesGrouping.processingPaused)
        {
            sg.rowQueueTimerActive = true;

            var rowQueueTimer = function()
            {
                if (sg !== vizObj._seriesGrouping)
                {
                    // This condition holds if we've gotten a new initializeVisualization
                    // on this chart. We want to stop processing the data in this sg
                    // object here (this works because initializeVisualization creates
                    // a completely new sg object; this function is likely the only
                    // thing keeping a reference to the old sg object).

                    // Not strictly required, here for debugging.
                    sg.defunct = true;
                    sg.rowQueueTimerActive = false;
                    return;
                }

                var batchData = vizObj._dequeueRows();

                if (batchData)
                {
                    // Call delay() before processing. This makes us more resistant
                    // to exceptions in the processing code.
                    _.delay(rowQueueTimer, dataProcessDelayMillisec);
                    vizObj._processRows(batchData);
                }
                else
                {
                    vizObj._onRowQueueEmpty();
                }
            };

            _.delay(rowQueueTimer, dataProcessDelayMillisec);
        }
    },

    _dequeueRows: function()
    {
        return this._seriesGrouping ? this._seriesGrouping.queuedRenderRows.shift() : undefined;
    },

    _pauseSeriesProcessing: function()
    {
        this._seriesGrouping.processingPaused = true;
        this._seriesGrouping.savedRenderRowQueue = this._seriesGrouping.savedRenderRowQueue.concat(this._seriesGrouping.queuedRenderRows);
        this._seriesGrouping.queuedRenderRows.length = 0;
        this._updateLoadingOverlay('stopped');
    },

    _resumeSeriesProcessing: function()
    {
        var vizObj = this;
        var sg = vizObj._seriesGrouping;

        vizObj._seriesGrouping.processingPaused = false;
        if (!_.isEmpty(sg.savedRenderRowQueue))
        {
            _.each(sg.savedRenderRowQueue, _.bind(vizObj._enqueueRows, vizObj));
            sg.savedRenderRowQueue.length = 0;
            this._updateLoadingOverlay('loading');
        }
    },

    _processRealRows: function(data)
    {
        var vizObj = this;

        var sg = vizObj._seriesGrouping,
            fixedColumn = sg.fixedColumn,
            view = vizObj._primaryView;

        // drop values where they belong
        _.each(data, function(row)
        {
            // first get our virtual row, which will simply be the row for whatever
            // category we happen to have. create if it doesn't exist.
            var category = row.data[fixedColumn.lookup];
            var virtualRow;
            if ($.isBlank(sg.virtualRows[category]))
            {
                virtualRow = {
                    id: -100 - sg.categoryIndexLookup[category],
                    index: sg.categoryIndexLookup[category],
                    data: {},
                    invalid: {},
                    interpolated_null: {},
                    realRows: {}
                };
                virtualRow.data[sg.fixedColumn.lookup] = category;

                if (blist.feature_flags.hide_interpolated_nulls)
                {
                    _.each(sg.virtualColumns, function(virtualCol)
                    { virtualRow.interpolated_null[virtualCol.column.lookup] = true; });
                }

                sg.virtualRows[category] = virtualRow;
                sg.virtualRowReadyCount ++;
            }
            else
            {
                virtualRow = sg.virtualRows[category];
            }

            // now we need to plop in our virtual column value(s) to the virtual row
            var groupName = vizObj._groupName(row);
            _.each(vizObj._valueColumns, function(valueCol)
            {
                var virtualColumnName = (vizObj._valueColumns.length > 1) ?
                    valueCol.column.name + ', ' + groupName : groupName;
                var virtualColumn = sg.virtualColumns[virtualColumnName];

                if (_.isUndefined(virtualColumn))
                {
                    // Value was invalid, so wan't reported to preprocessSeriesColumns.
                    // So, skip it.
                    vizObj.debugOut('Invalid virtual column name: ' + virtualColumnName);
                    return;
                }

                virtualRow.data[virtualColumn.column.id] = row.data[valueCol.column.lookup];
                if (blist.feature_flags.hide_interpolated_nulls)
                { delete virtualRow.interpolated_null[virtualColumn.column.id]; }
                virtualRow.realRows[virtualColumn.column.id] = row;

                if (view.highlights && view.highlights[virtualRow.id] &&
                    view.highlightsColumn[virtualRow.id] == virtualColumn.column.id)
                {
                    // this virtual row is currently marked as highlighted for this virtual column
                    // of data. should it be unmarked?
                    if (!view.highlights || !view.highlights[row.id])
                    {
                        view.unhighlightRows(virtualRow);
                    }
                }
                if (view.highlights && view.highlights[row.id])
                {
                    view.highlightRows(virtualRow, null, virtualColumn.column, true);
                }
            });
        });
    },

    removeRow: function(row, view)
    {
        var vizObj = this;

        if (!vizObj.requiresSeriesGrouping())
        {
            return vizObj._super.apply(vizObj, arguments);
        }

        var sg = vizObj._seriesGrouping,
            fixedColumn = sg.fixedColumn,
            category = row.data[fixedColumn.lookup],
            vRow = sg.virtualRows[category];

        // A removed row might in reality be present in the sortedView, and should exist
        if (sg.sortedView && sg.sortedView.rowForID(row.id))
        { return; }

        // Sometimes we get virtual rows here and we shouldn't try to remove those.
        if (row.id > 0)
        { vizObj._super.apply(vizObj, arguments); }

        if (!$.isBlank(vRow))
        {
            var rejectedKeys = [];
            _.each(vRow.realRows, function(rr, k)
                    { if (rr.id == row.id) { rejectedKeys.push(k); } });
            _.each(rejectedKeys, function(rk)
                    {
                        delete vRow.data[rk];
                        delete vRow.realRows[rk];
                    });
        }
    },

    _groupName: function(row)
    {
        var vizObj = this;

        return _.compact(_.map(vizObj._seriesColumns, function(col)
        {
            var t = vizObj._renderCellText(row, col.column);
            if (vizObj._displayFormat && vizObj._displayFormat.seriesNames)
            {
                return vizObj._displayFormat.seriesNames[t] || t;
            }
            else
            {
                return t;
            }
        })).join(', ');
    },

    _getColorForColumn: function(valueColumn, virtualColumnName)
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            lookup = valueColumn.column.id;

        // if we've already seen this lookup return the color for it (for hstp)
        if (globalColorIndex[virtualColumnName]) return globalColorIndex[virtualColumnName];

        var currentColor = sg.valueColumnColors[lookup];
        var colorRotateAmount = -190;

        if (!currentColor)
        {
            var seedColor;
            if (valueColumn.color)
            {
                seedColor = valueColumn.color;
            }
            else
            {
                var displayFormatColors = vizObj._displayFormat.colors || blist.defaultColors;
                var colIndex = valueColumn.column.position;

                _.find(vizObj._displayFormat.valueColumns, function(c, i)
                {
                    if ((!_.isUndefined(c.fieldName) && c.fieldName === valueColumn.fieldName) ||
                        (!_.isUndefined(c.lookup) && c.lookup === valueColumn.lookup))
                    {
                        colIndex = i;
                        return true;
                    }
                    return false;
                });

                var repGroup = Math.floor(colIndex / displayFormatColors.length);
                var baseIndex = colIndex - (repGroup * displayFormatColors.length);

                seedColor = $.rotateHex(displayFormatColors[baseIndex], repGroup*colorRotateAmount);
            }

            sg.valueColumnColors[lookup] = { seed: seedColor, current: seedColor };
        }
        else
        {
            var newColor = '#' + $.rgbToHex($.brighten(currentColor.current, 20));
            if (newColor == currentColor.current)
            {
                // rotate seed around hsv wheel by a bit and start over
                var newSeedHsb = $.rgbToHsv($.hexToRgb(currentColor.seed));
                newSeedHsb.h = (newSeedHsb.h + 20 + 360) % 360;
                var newSeed = $.rgbToHex($.hsvToRgb(newSeedHsb));
                sg.valueColumnColors[lookup] = { seed: '#' + newSeed, current: '#' + newSeed };
            }
            else
            {
                sg.valueColumnColors[lookup].current = newColor;
            }
        }

        // save off this lookup globally
        globalColorIndex[virtualColumnName] = sg.valueColumnColors[lookup].current;

        return sg.valueColumnColors[lookup].current;
    },

    getValueColumns: function()
    {
        var vizObj = this;

        if (!vizObj.requiresSeriesGrouping())
        {
            return vizObj._super.apply(vizObj, arguments);
        }

        var sg = vizObj._seriesGrouping;

        // could return null; callers need to handle.
        if (!sg || !sg.ready)
        {
            return null;
        }

        if (!sg.cachedValueColumns)
        {
            sg.cachedValueColumns = _.values(sg.virtualColumns);
        }

        return sg.cachedValueColumns;
    },

    getTotalRows: function()
    {
        var vizObj = this;

        if (!vizObj.requiresSeriesGrouping())
        {
            return vizObj._super.apply(vizObj, arguments);
        }

        var sg = vizObj._seriesGrouping;

        // could return null; callers need to handle.
        if (!sg || !sg.ready)
        {
            return null
        }
        return sg.totalVirtualRows;
    },

    _d3_getColor: function(colDef, d)
    {
        var vizObj = this;

        var virtColColor = (d && vizObj.requiresSeriesGrouping()) ? $.deepGet(d, 'realRows', colDef.column.lookup, 'color') : undefined;
        if (virtColColor)
        {
            return virtColColor;
        }
        else
        {
            return vizObj._super.apply(vizObj, arguments);
        }
    },

    _handleConditionalFormattingChanged: function()
    {
        // Plumb through the conditional formatting to our sorted view, then
        // refresh the data.
        var sortedView = this._seriesGrouping.sortedView;
        var primaryView = this._primaryView;

        var newMd = $.extend(true, {}, sortedView.metadata);
        newMd.conditionalFormatting = (primaryView.metadata || {}).conditionalFormatting;

        this._seriesGrouping.sortedView.update({metadata: newMd});
        this.getDataForView(this._seriesGrouping.sortedView);
    },

    handleDataMouseOver: function(visual, colDef, row, flyoutConfigs, enableProcessing)
    {
        // swap out virtual col/row references for hard references
        var vizObj = this;

        if (vizObj.requiresSeriesGrouping())
        {
            return vizObj._super(visual, colDef.column.realValueColumn, row.realRows[colDef.column.lookup], flyoutConfigs, enableProcessing);
        }
        else
        {
            return vizObj._super.apply(vizObj, arguments);
        }
    },

    handleDataMouseOut: function(visual)
    {
        return this._super.apply(this, arguments);
    },

    _getCacheKey: function(sg, valCols)
    {
        return '/' + (sg.fixedColumn || { fieldName: ':id' }).fieldName +
            '/' + _.map(valCols, function(c) { return c.fieldName; }).join(':') +
            '/' + _.map(sg.sortColumns, function(c) { return c.fieldName; }).join(':');
    }
};

})(jQuery);
