(function($)
{
    $.Control.extend('socrataCalendar', {
        initializeVisualization: function()
        {
            setUpCalendar(this);
        },

        cleanVisualization: function()
        {
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
                title: $.htmlStrip(row[calObj._titleCol.lookup]),
                color: null,
                row: row};
            if ((row.sessionMeta || {}).highlight)
            { ce.color = blist.styles.getReferenceProperty('itemHighlight', 'background-color'); }

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
                this.$dom().fullCalendar('addEventSource', this._events);
                this._events = [];
            }
        },

        getColumns: function()
        {
            var calObj = this;
            calObj._startCol = calObj.settings.view.columnForTCID(
                calObj._displayFormat.startDateTableId);
            calObj._endCol = calObj.settings.view.columnForTCID(
                calObj._displayFormat.endDateTableId);
            calObj._titleCol = calObj.settings.view.columnForTCID(
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
                editable: calObj.settings.editEnabled && calObj.settings.view.hasRight('write'),
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
        if ($.subKeyDefined(calObj.settings.view, 'highlightTypes.select.' + calEvent.row.id))
        { calObj.settings.view.unhighlightRows(calEvent.row, 'select'); }
        else
        { calObj.settings.view.highlightRows(calEvent.row, 'select'); }
    };

    var eventMouseover = function(calObj, calEvent)
    {
        calObj.settings.view.highlightRows(calEvent.row);
    };

    var eventMouseout = function(calObj, calEvent)
    {
        calObj.settings.view.unhighlightRows(calEvent.row);
    };

    var eventRender = function(calObj, calEvent, element)
    {
        if (!$.isBlank(calObj.hasFlyout()))
        {
            var $e = $(element);
            $e.socrataTip({content: calObj.renderFlyout(calEvent.row,
                calObj.settings.view), closeOnClick: false,
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
                    $.subKeyDefined(calObj.settings.view, 'highlightTypes.select.' + calEvent.row.id))
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
        var view = calObj.settings.view;

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
