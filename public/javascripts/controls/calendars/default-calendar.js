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
            $descTemplate: function()
            {
                if (!this._$descTemplate)
                {
                    this.$dom().after($.tag({tagName: 'div',
                        'class': ['descTemplate', 'row', 'clearfix',
                            'richRendererContainer', 'flyoutRenderer']}));
                    this._$descTemplate = this.$dom().siblings('.descTemplate');
                    this.richRenderer = this._$descTemplate.richRenderer({
                        columnCount: 1, view: this.settings.view});
                }
                return this._$descTemplate;
            },

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
                delete calObj._descriptionLayout;

                delete calObj._events;

                calObj.$dom().fullCalendar('destroy');
                setUpCalendar(calObj);
            },

            renderRow: function(row)
            {
                var calObj = this;
                calObj._events = calObj._events || [];

                var ce = {id: row.id,
                    start: row[calObj._startCol.id],
                    title: $.htmlStrip(row[calObj._titleCol.id]),
                    row: row};
                if (!$.isBlank(calObj._endCol))
                {
                    ce.end = row[calObj._endCol.id];
                    if ($.isBlank(ce.start)) { ce.start = ce.end; }
                }
                calObj._events.push(ce);

                return true;
            },

            rowsRendered: function()
            {
                this.$dom().fullCalendar('addEventSource', this._events);
                delete this._events;
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
                eventRender: function(ce, e, v)
                    { eventRender(calObj, ce, e, v); },
                eventDragStart: function(ce, e, ui, v)
                    { eventActionStart.apply(this,
                        [calObj, ce, e, ui, v]); },
                eventResizeStart: function(ce, e, ui, v)
                    { eventActionStart.apply(this,
                        [calObj, ce, e, ui, v]); },
                eventDragStop: function(ce, e, ui, v)
                    { eventActionStop.apply(this,
                        [calObj, ce, e, ui, v]); },
                eventResizeStop: function(ce, e, ui, v)
                    { eventActionStop.apply(this,
                        [calObj, ce, e, ui, v]); },
                eventDrop: function(ce, dd, md, ad, rf, e, ui, v)
                    { eventChange(calObj, ce, dd, md, rf, e, ui, v); },
                eventResize: function(ce, dd, md, rf, e, ui, v)
                    { eventChange(calObj, ce, dd, md, rf, e, ui, v); }
                });

        calObj._descriptionLayout = generateDescLayout(calObj);
        // Getting the template initializes RR
        if ($.isBlank(calObj.richRenderer)) { calObj.$descTemplate(); }
        calObj.richRenderer.setConfig(calObj._descriptionLayout);
        calObj.richRenderer.renderLayout();

        if (!calObj._eventsHooked)
        {
            // Tooltips are wonky, so we just live this for all of them,
            // and use stored data to figure out how to close the tip on click
            $.live('.flyoutRenderer .viewRow', 'click', function(e)
            {
                e.preventDefault();
                var $a = $(this);
                $a.parents('.bt-wrapper').data('socrataTip-$element')
                    .socrataTip().hide();
                var href = $a.attr('href');
                $(document).trigger(blist.events.DISPLAY_ROW,
                    [href.slice(href.lastIndexOf('/') + 1)]);
            });
            calObj._eventsHooked = true;
        }

        calObj.ready();
    };

    var eventRender = function(calObj, calEvent, element, view)
    {
        if (!$.isBlank(calObj._descriptionLayout))
        {
            var $item = calObj.$descTemplate().clone().removeClass('descTemplate');
            calObj.richRenderer.renderRow($item, calEvent.row);

            $item.append($.tag({tagName: 'a',
                href: calObj.settings.view.url + '/' + calEvent.row.id,
                'class': 'viewRow', contents: 'View details for this row'}));
            $(element).socrataTip({content: $item, trigger: 'click', isSolo: true});
        }
    };

    var eventActionStart = function(calObj, calEvent, event, ui, view)
    {
        if (calObj._descriptionLayout)
        {
            $(this).socrataTip().hide();
            $(this).socrataTip().disable();
        }
    };

    var eventActionStop = function(calObj, calEvent, event, ui, view)
    {
        if (!$.isBlank(calObj._descriptionLayout))
        { $(this).socrataTip().enable(); }
    };

    var eventChange = function(calObj, calEvent, dayDelta, minuteDelta,
        revertFunc, jsEvent, ui, view)
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

    var generateDescLayout = function(calObj)
    {
        if (_.isEmpty(calObj.settings.view.displayFormat.descriptionColumns))
        { return null; }

        var col = {rows: []};
        _.each(calObj.settings.view.displayFormat.descriptionColumns, function(dc)
        {
            var row = {fields: [
                {type: 'columnLabel', tableColumnId: dc.tableColumnId},
                {type: 'columnData', tableColumnId: dc.tableColumnId}
            ]};
            col.rows.push(row);
        });
        return {columns: [col]};
    };
})(jQuery);
