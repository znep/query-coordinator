(function($)
{
    $.Control.extend('socrataCalendar', {
        initializeVisualization: function()
        {
            setUpCalendar(this);
        },

        cleanVisualization: function()
        {
            viewClear(this);

            var calObj = this;
            calObj._super();

            delete calObj._startCol;
            delete calObj._endCol;
            delete calObj._titleCol;
        },

        reloadVisualization: function()
        {
            var calObj = this;
            calObj.$dom().fullCalendar('destroy');
            setUpCalendar(calObj);

            calObj._super();
        },

        resizeHandle: function()
        { this.$dom().fullCalendar('render'); },

        renderRow: function(row)
        {
            var calObj = this;

            var ce = {id: row.id,
                start: row[calObj._startCol.lookup],
                title: calObj._titleCol.renderType.renderer(row[calObj._titleCol.lookup],
                        calObj._titleCol, true, false, true),
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
                ce.end = row[calObj._endCol.lookup];
                if ($.isBlank(ce.start)) { ce.start = ce.end; }
            }

            var $fc = calObj.$dom();
            var exEvent = $fc.fullCalendar('clientEvents', ce.id);
            if (exEvent.length > 0)
            { $fc.fullCalendar('updateEvent', $.extend(_.first(exEvent), ce)); }
            else
            { calObj._events.push(ce); }

            return true;
        },

        rowsRendered: function()
        {
            if (!_.isEmpty(this._events))
            {
                var today = new Date();
                var monthStart = today.clone();
                monthStart.setHours(0);
                monthStart.setMinutes(0);
                monthStart.setSeconds(0);
                monthStart.setMilliseconds(0);
                monthStart.setDate(1);

                var monthEnd = monthStart.clone();
                monthEnd.setMonth(monthEnd.getMonth() + 1);

                var closestDate = _(this._events).chain()
                    .map(function(ev)
                            {
                                return [_.isString(ev.start) && ev.start !== '' ?
                                        Date.parse(ev.start) : new Date((ev.start || 0) * 1000),
                                    _.isString(ev.end) && ev.start !== '' ?
                                        Date.parse(ev.end) : new Date((ev.end || 0) * 1000)];
                            })
                    .flatten().sortBy(function(d)
                            {
                                if (d >= monthStart && d < monthEnd) { return 0; }
                                return Math.abs(d - today);
                            }).first().value();
                this.$dom().fullCalendar('gotoDate', closestDate);

                this.$dom().fullCalendar('addEventSource', this._events);
                this._events = [];
            }
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
        },

        closeFlyout: function($link)
        {
            $link.parents('.bt-wrapper').data('socrataTip-$element')
                .socrataTip().hide();
        }
    }, {editEnabled: false}, 'socrataVisualization');


    // Private methods
    var setUpCalendar = function(calObj)
    {
        calObj._events = [];

        calObj.$dom().fullCalendar({aspectRatio: 2,
                editable: calObj.settings.editEnabled && calObj._primaryView.hasRight('write'),
                disableResizing: $.isBlank(calObj._displayFormat.endDateTableId),
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
    };

    var viewClear = function(calObj, calView)
    {
        if (!$.isBlank(calObj._curTip)) { calObj._curTip.hide(); }
        delete calObj._curTip;
    };

    var eventClick = function(calObj, calEvent)
    {
        if ($.subKeyDefined(calObj._primaryView, 'highlightTypes.select.' + calEvent.row.id))
        { calObj._primaryView.unhighlightRows(calEvent.row, 'select'); }
        else
        { calObj._primaryView.highlightRows(calEvent.row, 'select'); }
    };

    var eventMouseover = function(calObj, calEvent)
    {
        calObj._primaryView.highlightRows(calEvent.row);
    };

    var eventMouseout = function(calObj, calEvent)
    {
        calObj._primaryView.unhighlightRows(calEvent.row);
    };

    var eventRender = function(calObj, calEvent, element)
    {
        if (!$.isBlank(calObj.hasFlyout()))
        {
            var $e = $(element);
            $e.socrataTip({content: calObj.renderFlyout(calEvent.row,
                calObj._primaryView), closeOnClick: false,
                parent: calObj.$dom(),
                shownCallback: function()
                {
                    if (!$.isBlank(calObj._curTip)) { calObj._curTip.hide(); }
                    calObj._curTip = $e.socrataTip();
                },
                trigger: 'click', isSolo: true});

            // Wait until next cycle before checking, because we hit a case where the events
            // are re-rendered due to an unhighlight before the select highlight is applied;
            // and we want to make sure everything is ready before we check & display
            _.defer(function()
            {
                if ($.isBlank(calObj._curTip) &&
                    $.subKeyDefined(calObj._primaryView, 'highlightTypes.select.' + calEvent.row.id))
                { $e.socrataTip().show(); }
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
            (!$.isBlank(calEvent.row[calObj._startCol.id]) ||
             (!$.isBlank(calEvent.end) &&
                calEvent.start.valueOf() != calEvent.end.valueOf())))
        {
            var d = calEvent.start.valueOf() / 1000;
            if (!$.isBlank(calObj._startCol.renderType.stringFormat))
            { d = calEvent.start.toString(
                calObj._startCol.renderType.stringFormat); }
            view.setRowValue(d, calEvent.row.id, calObj._startCol.id);
        }

        if (!$.isBlank(calObj._endCol) && !$.isBlank(calEvent.end))
        {
            var d = calEvent.end.valueOf() / 1000;
            if (!$.isBlank(calObj._endCol.renderType.stringFormat))
            { d = calEvent.end.toString(
                calObj._endCol.renderType.stringFormat); }
            view.setRowValue(d, calEvent.row.id, calObj._endCol.id);
        }

        view.saveRow(calEvent.row.id, null, null, null, revertFunc);
    };
})(jQuery);
