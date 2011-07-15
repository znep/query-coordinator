(function($)
{
    $.fn.socrataCalendar = function(options)
    {
        // Check if object was already created
        var socrataCalendar = $(this[0]).data("socrataVisualization");
        if (!socrataCalendar)
        {
            socrataCalendar = new socrataCalendarObj(options, this[0]);
        }
        return socrataCalendar;
    };

    var socrataCalendarObj = function(options, dom)
    {
        this.settings = $.extend({}, socrataCalendarObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(socrataCalendarObj, $.socrataVisualization.extend(
    {
        defaults:
        {
        },

        prototype:
        {
            initializeVisualization: function ()
            {
                setUpCalendar(this);
            },

            reloadVisualization: function()
            {
                var calObj = this;

                delete calObj._startCol;
                delete calObj._endCol;
                delete calObj._titleCol;

                calObj.$dom().fullCalendar('destroy');
                setUpCalendar(calObj);
            },

            resizeHandle: function()
            { this.$dom().fullCalendar('render'); },

            renderRow: function(row)
            {
                var calObj = this;

                var ce = {id: row.id,
                    start: row[calObj._startCol.id],
                    title: $.htmlStrip(row[calObj._titleCol.id]),
                    row: row};
                if (!$.isBlank(calObj._endCol))
                {
                    ce.end = row[calObj._endCol.id];
                    if ($.isBlank(ce.start)) { ce.start = ce.end; }
                }

                var $fc = calObj.$dom();
                var exEvent = $fc.fullCalendar('clientEvents', ce.id);
                if (exEvent.length > 0)
                { $fc.fullCalendar('updateEvent', $.extend(_.first(exEvent), ce)); }
                else
                { $fc.fullCalendar('renderEvent', ce, true); }

                return true;
            },

            getColumns: function()
            {
                var calObj = this;
                calObj._startCol = calObj.settings.view.columnForTCID(
                    calObj.settings.view.displayFormat.startDateTableId);
                calObj._endCol = calObj.settings.view.columnForTCID(
                    calObj.settings.view.displayFormat.endDateTableId);
                calObj._titleCol = calObj.settings.view.columnForTCID(
                    calObj.settings.view.displayFormat.titleTableId);
            },

            closeFlyout: function($link)
            {
                $link.parents('.bt-wrapper').data('socrataTip-$element')
                    .socrataTip().hide();
            }
        }
    }));


    // Private methods
    var setUpCalendar = function(calObj)
    {
        calObj.$dom().fullCalendar({aspectRatio: 2,
                editable: calObj.settings.view.hasRight('write'),
                disableResizing: $.isBlank(calObj.settings.view
                    .displayFormat.endDateTableId),
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

        calObj.initializeFlyouts(calObj.settings
                .view.displayFormat.descriptionColumns);

        calObj.ready();
    };

    var eventMouseover = function(calObj, calEvent)
    {
        calObj.highlightRows(calEvent.row);
    };

    var eventMouseout = function(calObj, calEvent)
    {
        calObj.unhighlightRows(calEvent.row);
    };

    var eventRender = function(calObj, calEvent, element)
    {
        if (!$.isBlank(calObj.hasFlyout()))
        {
            $(element).socrataTip({content: calObj.renderFlyout(calEvent.row,
                calObj.settings.view),
                trigger: 'click', isSolo: true});
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
