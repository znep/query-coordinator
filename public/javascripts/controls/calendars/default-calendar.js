(function($)
{
    $.Control.extend('socrataCalendar', {
        initializeVisualization: function()
        {
            setUpCalendar(this);
            this._queryInterval = 1;
        },

        cleanVisualization: function()
        {
            viewClear(this);

            var calObj = this;
            calObj._super();

            delete calObj._startCol;
            delete calObj._endCol;
            delete calObj._titleCol;

            cleanEvents(calObj);
        },

        reloadVisualization: function()
        {
            this.initializeFlyouts(this._displayFormat.descriptionColumns);
            this._super.apply(this, arguments);
        },

        resizeHandle: function()
        {
            this._ignoreViewChanges = true;
            this.$dom().fullCalendar('render');
            delete this._ignoreViewChanges;
        },

        reset: function()
        {
            this._super.apply(this, arguments);
        },

        renderRow: function(row)
        {
            var calObj = this;

            var ce = {id: row.id,
                start: row.data[calObj._startCol.lookup],
                title: calObj._titleCol.renderType.renderer(row.data[calObj._titleCol.lookup],
                        calObj._titleCol, true, false, null, true),
                color: null,
                className: null,
                row: row};
            if ($.isBlank(ce.start)) { return true; }

            if ((row.sessionMeta || {}).highlight)
            {
                ce.color = blist.styles.getReferenceProperty('itemHighlight', 'background-color');
                ce.className = 'highlight';
            }

            if (!$.isBlank(calObj._endCol))
            {
                ce.end = row.data[calObj._endCol.lookup];
                if ($.isBlank(ce.start)) { ce.start = ce.end; }
            }

            var $fc = calObj.$dom();
            var exEvent = $fc.fullCalendar('clientEvents', ce.id);
            if (exEvent.length > 0)
            { $.extend(_.first(exEvent), ce); }
            else
            { calObj._events.push(ce); }

            return true;
        },

        rowsRendered: function()
        {
            this._super();

            if (!_.isEmpty(this._events))
            {
                this._allEvents = (this._allEvents || []).concat(this._events);

                this.$dom().fullCalendar('addEventSource', this._events);
                this._events = [];
            }
            this.$dom().fullCalendar('refetchEvents');
        },

        getColumns: function()
        {
            var calObj = this;
            calObj._startCol = calObj._primaryView.columnForTCID(
                calObj._displayFormat.startDateTableId);
            calObj._endCol = calObj._primaryView.columnForTCID(
                calObj._displayFormat.endDateTableId);
            calObj._titleCol = calObj._primaryView.columnForTCID(
                calObj._displayFormat.titleTableId);

            return true;
        },

        closeFlyout: function($link)
        {
            $link.parents('.bt-wrapper').data('socrataTip-$element')
                .socrataTip().hide();
        },

        getDataForView: function(view)
        {
            if ($.isBlank(this._startCol))
            {
                this._needsData = true;
                return;
            }

            updateQuery(this, view);
            this._super.apply(this, arguments);
        },

        handleRowsLoaded: function(rows, view)
        {
            if (rows.length < 1)
            {
                // If no rows, re-request with larger timespan
                this._queryInterval++;
                this.getDataForAllViews();
            }
            else { this._super.apply(this, arguments); }
        },

        columnsLoaded: function()
        {
            this._super.apply(this, arguments);
            if (this._needsData)
            {
                delete this._needsData;
                this.getDataForAllViews();
            }
        }
    }, {editEnabled: false}, 'socrataVisualization');


    // Private methods
    var setUpCalendar = function(calObj)
    {
        calObj._events = [];

        calObj._ignoreViewChanges = true;
        calObj.$dom().fullCalendar({aspectRatio: 2,
                editable: calObj.settings.editEnabled && calObj._primaryView.hasRight('write'),
                disableResizing: $.isBlank(calObj._displayFormat.endDateTableId),
                viewDisplay: function()
                    { viewDisplay.apply(this, [calObj].concat($.makeArray(arguments))); },
                viewClear: function()
                    { viewClear.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventClick: function()
                    { eventClick.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventMouseover: function()
                    { eventMouseover.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventMouseout: function()
                    { eventMouseout.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventRender: function()
                    { eventRender.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventDragStart: function()
                    { eventActionStart.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventResizeStart: function()
                    { eventActionStart.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventDragStop: function()
                    { eventActionStop.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventResizeStop: function()
                    { eventActionStop.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventDrop: function()
                    { eventChange.apply(this, [calObj].concat($.makeArray(arguments))); },
                eventResize: function()
                    { eventChange.apply(this, [calObj].concat($.makeArray(arguments))); }
                });

        calObj.initializeFlyouts(calObj._displayFormat.descriptionColumns);

        calObj.ready();
        delete calObj._ignoreViewChanges;
    };

    var cleanEvents = function(calObj)
    {
        calObj.$dom().fullCalendar('removeEvents');
        delete calObj._closestDate;
        calObj._queryInterval = 1;
        calObj._renderedRows = 0;
    };

    var dateToServerValue = function(date, col)
    {
        var d = date.valueOf() / 1000;
        if (!$.isBlank(col.renderType.stringFormat))
        { d = date.toString(col.renderType.stringFormat); }
        return d;
    };

    var updateQuery = function(calObj, view)
    {
        var calView = calObj.$dom().fullCalendar('getView');
        var startDate = calView.start.clone();
        var endDate = calView.end.clone();
        var startCol = calObj._startCol;
        var endCol = calObj._endCol;
        var md = $.extend(true, {}, view.metadata);
        var query = md.jsonQuery;

        switch (calObj._queryInterval)
        {
            case 1:
                // Already good
                break;
            case 2:
                // 6 months
                startDate.setMonth(startDate.getMonth() - 3)
                endDate.setMonth(endDate.getMonth() + 3)
                break;
            case 3:
                // Two years
                startDate.setFullYear(startDate.getFullYear() - 1)
                endDate.setFullYear(endDate.getFullYear() + 1)
                break;
            default:
                // Request everything
                startDate = null;
                endDate = null;
                break;
        }

        var filterCondition;
        if (!$.isBlank(startDate) && !$.isBlank(endDate))
        {
            filterCondition = { temporary: true, displayTypes: ['calendar'],
                operator: 'OR',
                children: _.map(_.compact([startCol, endCol]), function(col)
                    {
                        return { operator: 'BETWEEN', columnFieldName: col.fieldName,
                            value: [dateToServerValue(startDate, col),
                                dateToServerValue(endDate, col)] };
                    })
            };
            if (!$.isBlank(startCol) && !$.isBlank(endCol))
            {
                filterCondition.children.push({ operator: 'AND', children: [
                    { operator: 'LESS_THAN', columnFieldName: startCol.fieldName,
                        value: dateToServerValue(startDate, startCol) },
                    { operator: 'GREATER_THAN', columnFieldName: endCol.fieldName,
                        value: dateToServerValue(endDate, endCol) }
                ] });
            }
        }

        if ((query.namedFilters || {}).calViewport)
        { delete query.namedFilters.calViewport; }
        query.namedFilters = $.extend(true, query.namedFilters || {}, { calViewport: filterCondition });
        calObj._ignoreViewChanges = true;
        view.update({ metadata: md }, false, true);
        delete calObj._ignoreViewChanges;
    };

    var viewDisplay = function(calObj, calView)
    {
        if (calObj._ignoreViewChanges) { return; }
        // Force remove everything when reloading events to avoid annoying flicker
        cleanEvents(calObj);
        calObj.getDataForAllViews();
    };

    var viewClear = function(calObj, calView)
    {
        if (!$.isBlank(calObj._curTip)) { calObj._curTip.hide(); }
        delete calObj._curTip;
    };

    var eventClick = function(calObj, calEvent)
    {
        if (!$(this).isSocrataTip() && calObj.hasFlyout())
        { renderEventFlyout(calObj, calEvent, this); }
        if ($.subKeyDefined(calObj._primaryView, 'highlightTypes.select.' + calEvent.row.id))
        {
            calObj._primaryView.unhighlightRows(calEvent.row, 'select');
            calObj.$dom().trigger('display_row', [{row: null}]);
            $(document).trigger(blist.events.DISPLAY_ROW, [null, true]);
        }
        else
        {
            calObj._primaryView.highlightRows(calEvent.row, 'select');
            calObj.$dom().trigger('display_row', [{row: calEvent.row}]);
            $(document).trigger(blist.events.DISPLAY_ROW, [calEvent.row.id, true]);
        }
    };

    var eventMouseover = function(calObj, calEvent)
    {
        _.defer(function() { calObj._primaryView.highlightRows(calEvent.row); });
    };

    var eventMouseout = function(calObj, calEvent)
    {
        calObj._primaryView.unhighlightRows(calEvent.row);
    };

    var eventRender = function(calObj, calEvent, element)
    {
        if (calObj.hasFlyout())
        {
            var $e = $(element);
            // Wait until next cycle before checking, because we hit a case where the events
            // are re-rendered due to an unhighlight before the select highlight is applied;
            // and we want to make sure everything is ready before we check & display
            _.defer(function()
            {
                if ($.isBlank(calObj._curTip) &&
                    $.subKeyDefined(calObj._primaryView, 'highlightTypes.select.' + calEvent.row.id) &&
                    $e.parents('body').length > 0)
                {
                    if ($e.isSocrataTip())
                    { $e.socrataTip().show(); }
                    else
                    { renderEventFlyout(calObj, calEvent, $e); }
                }
            });
        }
    };

    var eventActionStart = function(calObj)
    {
        if (calObj.hasFlyout())
        {
            $(this).socrataTip().hide();
            $(this).socrataTip().disable();
        }
    };

    var eventActionStop = function(calObj)
    {
        if (calObj.hasFlyout())
        { $(this).socrataTip().enable(); }
    };

    var eventChange = function(calObj, calEvent, dayDelta, minuteDelta, revertFunc)
    {
        var view = calObj._primaryView;

        // Make sure we have a start date, and make sure it either was originally
        //  set in the row, or is now different than the end date (meaning it
        //  was a resize) -- otherwise the date was originally null, so don't
        //  update it.
        if (!$.isBlank(calEvent.start) &&
            (!$.isBlank(calEvent.row.data[calObj._startCol.lookup]) ||
             (!$.isBlank(calEvent.end) &&
                calEvent.start.valueOf() != calEvent.end.valueOf())))
        {
            view.setRowValue(dateToServerValue(calEvent.start, calObj._startCol),
                    calEvent.row.id, calObj._startCol.id);
        }

        if (!$.isBlank(calObj._endCol) && !$.isBlank(calEvent.end))
        {
            view.setRowValue(dateToServerValue(calEvent.end, calObj._endCol),
                    calEvent.row.id, calObj._endCol.id);
        }

        view.saveRow(calEvent.row.id, null, null, null, revertFunc);
    };

    var renderEventFlyout = function(calObj, calEvent, element)
    {
        var $e = $(element);
        $e.socrataTip({content: calObj.renderFlyout(calEvent.row, calObj._primaryView),
            closeOnClick: false, parent: calObj.$dom(),
            shownCallback: function()
            {
                if (!$.isBlank(calObj._curTip)) { calObj._curTip.hide(); }
                calObj._curTip = $e.socrataTip();
            },
            trigger: 'click', isSolo: true}).show();
    };

})(jQuery);
