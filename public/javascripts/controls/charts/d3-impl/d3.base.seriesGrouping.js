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

        var sg = vizObj._seriesGrouping = {
            categoryIndexLookup: {},
            fixedColumn: null,
            groupedView: null,
            hasGroupBys: _.isArray((vizObj._primaryView.query || {}).groupBys),
            physicalRowsRetreived: 0,
            ready: false,
            sortColumns: null,
            sortedView: null,
            totalVirtualRows: null,
            valueColumnColors: {},
            virtualColumns: {},
            virtualRows: {},
            queuedRenderRows: [],
            virtualRowReadyCount: 0
        };

        // make a copy of the view that we'll use for querying so that we're
        // fetching everything in the appropriate sort
        var sortedView = sg.sortedView = vizObj._primaryView.clone(),
            sortColumns = [];

        // first sort by the category
        sortColumns.push(vizObj._fixedColumns[0]);

        // then sort by the series groups in order
        sortColumns = sg.sortColumns
            = _.compact(sortColumns.concat(_.pluck(vizObj._seriesColumns, 'column')));

        // If there isn't a fixedColumn, pretend the index is a column, and use
        // that instead.
        sg.fixedColumn = vizObj._fixedColumns[0] || {
            lookup: 'index'
        };

        // set up the sort, if we have something to sort by.
        if (vizObj._fixedColumns[0])
        {
            sortedView.update({ query: $.extend({}, sortedView.query, {
                orderBys: _.map(sortColumns, function(col)
                {
                    return {
                        ascending: true,
                        expression: {
                            columnId: col.id,
                            type: 'column'
                        }
                    };
                })
            }) });
        }

        var maybeDone = _.after(2, function()
        {
            // this is saved down below. Now that we have everything we need
            // to get ready, process some things and allow everything to init.
            vizObj._preprocessSeriesColumns();
            // Manually trigger this event on the primary view for things like the sidebar
            vizObj._primaryView.trigger('row_count_change');
            sg.superInit.call(vizObj);

            vizObj._setChartVisible(false);
            vizObj._setLoadingOverlay();
            vizObj._updateLoadingOverlay('start');
        });

        // make another copy of the view that we'll use to get the category-relevant rows
        // piggyback off sortedView so that the categories come back sorted
        var categoryGroupedView = sortedView.clone();


        if (vizObj._fixedColumns[0])
        {
            var categoryGroupBys = (sortedView.query.groupBys || []).concat([
                {
                    columnId: vizObj._fixedColumns[0].id,
                    type: 'column'
                } ]);

            categoryGroupedView.update({ query: $.extend({}, sortedView.query, {
                groupBys: categoryGroupBys
            }) });
        }

        categoryGroupedView.getAllRows(function(rows)
        {
            sg.categoryGroupedRows = rows;
            maybeDone();
        });

        // make yet another copy of the view grouped by the series columns, so we can
        // just evaluate all the possible combinations of creating series columns up
        // front, rather than trying to piece things together as we go.
        var seriesGroupedView = sg.seriesGroupedView = sortedView.clone();
        var seriesGroupedColumns = _.without(sortColumns, vizObj._fixedColumns[0]);

        var seriesGroupBys = (seriesGroupedView.query.groupBys || []).concat(
            _.map(seriesGroupedColumns, function(col)
            {
                return {
                    columnId: col.id,
                    type: 'column'
                };
            }));

        seriesGroupedView.update({ query: $.extend({}, sortedView.query, {
            groupBys: seriesGroupBys
        }) });
        seriesGroupedView.getAllRows(function(rows)
        {
            sg.seriesGroupedRows = rows;
            maybeDone();
        });

        // clear the global color cache if the user changes the color settings
        var colorBasis = _.map(vizObj._valueColumns, function(col) { return col.color; });
        if (!_.isEqual(globalColorBasis, colorBasis))
        {
            globalColorIndex = {};
            globalColorBasis = colorBasis;
        }

        // we're explicitly not calling _super here. we'll save it off, and
        // initialize the rest of the chain once we're ready here. saves a
        // lot of bad hackery.
        sg.superInit = vizObj._super;

        // We're interested in some events coming from the primary view.
        vizObj._primaryView.bind('conditionalformatting_change', _.bind(vizObj._handleConditionalFormattingChanged, vizObj), vizObj);
    },

    cleanVisualization: function()
    {
        delete this._seriesGrouping;
        this._super();
    },

    _preprocessSeriesColumns: function()
    {
        var vizObj = this,
            sg = vizObj._seriesGrouping,
            fixedColumn = sg.fixedColumn;

        vizObj.startLoading();

        // figure out our categories and make virtual row index lookups for them.
        _.each(_.sortBy(sg.categoryGroupedRows, 'position'), function(row, index)
        {
            sg.categoryIndexLookup[row[fixedColumn.lookup]] = index;
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
            var sortFunctions = _.map(vizObj._seriesColumns, function(sc)
            {
                var order = {};
                _.each((sc.column.metadata || {}).displayOrder, function(item, i)
                {
                    order[item.orderItem] = i;
                });

                return function(r)
                {
                    var v = r[sc.column.lookup];
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
        // Sort by position iff there isn't another sort in place.
        else if (!_.any($.deepGet(vizObj._primaryView, 'query', 'orderBys'), function(orderBy)
                { return _.include(sg.sortColumns,
                    vizObj._primaryView.columnForIdentifier(orderBy.expression.columnFieldName
                                                         || orderBy.expression.columnId)); }))
        {
            sortedRows = _.sortBy(sg.seriesGroupedRows, 'position');
        }

        _.each(sortedRows || sg.seriesGroupedRows, function(row, index)
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

                // save as obj for quick reference below
                var virtualId = -100 - _.keys(sg.virtualColumns).length; // use negative id space to avoid confusion
                sg.virtualColumns[virtualColumnName] = {
                    color: vizObj._getColorForColumn(valueCol, virtualColumnName),
                    groupName: groupName,
                    column: {
                        id: virtualId,
                        lookup: virtualId,
                        name: virtualColumnName,
                        realValueColumn: valueCol,
                        dataType: valueCol.column.dataType
                    }
                };
            });
        });

        // mark that we're ready for business, and if we've already had a customer
        // fire it off for them now that we're thundercats ho
        sg.ready = true;
        if (sg.wantsData === true)
        {
            vizObj.getDataForView(vizObj._primaryView);
//            vizObj.handleRowCountChange(); <-- probably not needed
        }
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

        if (this._seriesGrouping.virtualRows === data)
        {
            // We just want to rerender the current data - no need to recalculate.
            return vizObj._super(_.values(vizObj._seriesGrouping.virtualRows));
        }

        // Prevent reentrancy. This is an issue because highlighting (done below)
        // can cause another renderData.
        if (vizObj._inRenderSeriesGrouping) { return; }

        // If there were no insertions, don't bother re-rendering.
        if (didInsertData === false) { return; }
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
        var vizObj = this;
        var sg = this._seriesGrouping;

        var overlay = $.tag(
            { tagName: 'div', 'class': 'dsgProgress', contents: [
                { tagName: 'p', contents: [
                    { tagName: 'span', 'class': 'dsgOperationText' },
                    { tagName: 'span', 'class': 'dsgProgressText' }
                ]},
                { tagName: 'p', contents: [
                    { tagName: 'span', 'class': 'dsgPauseExplanationText hide', contents: $.t('controls.charts.series_grouping.pause_button_explanation')},
                    { tagName: 'a', 'class': 'button dsgProgressPauseButton hide', contents: $.t('controls.charts.series_grouping.pause_rendering') }
                ]}
            ] }
        , true);

        this._setChartOverlay(overlay);
        sg.$loadingOverlay = this.$dom().find('.dsgProgress');
        sg.$loadingOverlayOperationText = this.$dom().find('.dsgOperationText');
        sg.$loadingOverlayProgressText = this.$dom().find('.dsgProgressText');
        sg.$dsgProgressPauseButton = this.$dom().find('.dsgProgressPauseButton');
        sg.$dsgPauseExplanationText = this.$dom().find('.dsgPauseExplanationText');

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
    },

    _updateLoadingOverlay: function(state)
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
                    // We just go straight into the chart, there's no 'completed'
                    // message.
                    sg.$dsgProgressPauseButton.addClass('hide');
                    sg.$dsgPauseExplanationText.addClass('hide');
                    break;
                case 'loading':
                case 'stopped':
                    if (state === 'stopped')
                    {
                        operationPhaseMessage = $.t('controls.charts.series_grouping.rendering_paused');
                        if (_.isUndefined(sg.pauseLoadingTimeMillisec))
                        {
                            sg.pauseLoadingTimeMillisec = Date.now();
                        }
                        sg.$dsgProgressPauseButton.text($.t('controls.charts.series_grouping.resume_rendering'));
                    }
                    else
                    {
                        operationPhaseMessage = $.t('controls.charts.series_grouping.rendering_running');
                        // If the user resumes, backfill a start time that preserves the amount of elapsed time at pause.
                        if (!_.isUndefined(sg.pauseLoadingTimeMillisec))
                        {
                            sg.startLoadingTimeMillisec = Date.now() - (sg.pauseLoadingTimeMillisec - sg.startLoadingTimeMillisec);
                            delete sg.pauseLoadingTimeMillisec;
                        }
                        sg.$dsgProgressPauseButton.text($.t('controls.charts.series_grouping.pause_rendering'));
                    }

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

                    sg.$dsgProgressPauseButton.removeClass('hide');
                    sg.$dsgPauseExplanationText.removeClass('hide');
                    break;
            }

            sg.$loadingOverlayOperationText.text(operationPhaseMessage);
            sg.$loadingOverlayProgressText.text(progressMessage);
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
            this.renderData(sg.virtualRows);
            vizObj._setChartOverlay(null);
            vizObj.finishLoading();

            this._updateLoadingOverlay('done');
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
        var dataProcessDelayMillisec = ($.browser.msie && parseFloat($.browser.version)) < 9 ? 250 : 10;

        if (!vizObj.requiresSeriesGrouping()) { return; }

        queue.push(rows.slice()); // REVISIT: Maybe can store indexes if ordering
                                  // works out. I don't think it does though.

        if (!sg.rowQueueTimerActive)
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
                    vizObj._processRows(batchData);
                    _.delay(rowQueueTimer, dataProcessDelayMillisec);
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
        this._seriesGrouping.savedRenderRowQueue = this._seriesGrouping.queuedRenderRows;
        this._seriesGrouping.queuedRenderRows = []
        if (!_.isEmpty(this._seriesGrouping.savedRenderRowQueue))
        {
            this._updateLoadingOverlay('stopped');
            this.finishLoading();
        }
    },

    _resumeSeriesProcessing: function()
    {
        var vizObj = this;
        var sg = vizObj._seriesGrouping;

        if (!_.isEmpty(sg.savedRenderRowQueue))
        {
            vizObj.startLoading();
            _.each(sg.savedRenderRowQueue, _.bind(vizObj._enqueueRows, vizObj));

            delete sg.savedRenderRowQueue;
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
            var category = row[fixedColumn.lookup];
            var virtualRow;
            if ($.isBlank(sg.virtualRows[category]))
            {
                virtualRow = {
                    id: -100 - sg.categoryIndexLookup[category],
                    index: sg.categoryIndexLookup[category],
                    invalid: {},
                    realRows: {}
                };
                virtualRow[sg.fixedColumn.lookup] = category;

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

                virtualRow[virtualColumn.column.id] = row[valueCol.column.id];
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
            category = row[fixedColumn.lookup],
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
                        delete vRow[rk];
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
            if ($.subKeyDefined(vizObj._displayFormat, 'seriesNames.' + t))
            { t = vizObj._displayFormat.seriesNames[t]; }
            return t;
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

        if (!currentColor)
        {
            var seedColor = valueColumn.color || vizObj._displayFormat.colors[valueColumn.column.position];
            sg.valueColumnColors[lookup] = { seed: seedColor, current: seedColor };
        }
        else
        {
            var newColor = '#' + $.rgbToHex($.brighten(currentColor.current, 20));
            if (newColor == currentColor.current)
            {
                // rotate seed around hsv wheel by a bit and start over
                var newSeedHsb = $.rgbToHsv($.hexToRgb(currentColor.seed));
                newSeedHsb.h = (newSeedHsb.h + 20) % 360;
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

        return _.values(sg.virtualColumns);
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

        var virtColColor = (d && vizObj.requiresSeriesGrouping()) ? $.deepGet(d, 'realRows', colDef.column.id, 'color') : undefined;
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
            return vizObj._super(visual, colDef.column.realValueColumn, row.realRows[colDef.column.id], flyoutConfigs, enableProcessing);
        }
        else
        {
            return vizObj._super.apply(vizObj, arguments);
        }
    },

    handleDataMouseOut: function(visual)
    {
        return this._super.apply(this, arguments);
    }
};

})(jQuery);
