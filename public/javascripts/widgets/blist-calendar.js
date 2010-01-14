(function($)
{
    $.fn.blistCalendar = function(options)
    {
        // Check if object was already created
        var blistCalendar = $(this[0]).data("blistCalendar");
        if (!blistCalendar)
        {
            blistCalendar = new blistCalendarObj(options, this[0]);
        }
        return blistCalendar;
    };

    var blistCalendarObj = function(options, dom)
    {
        this.settings = $.extend({}, blistCalendarObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(blistCalendarObj,
    {
        defaults:
        {
            displayFormat: null,
            editable: false,
            pageSize: 50,
            viewId: null
        },

        prototype:
        {
            init: function ()
            {
                var currentObj = this;
                var $domObj = currentObj.$dom();
                $domObj.data("blistCalendar", currentObj);

                currentObj._rowsToLoad = [];

                var fmt = currentObj.settings.displayFormat;
                $domObj.fullCalendar({aspectRatio: 2,
                        editable: currentObj.settings.editable,
                        disableResizing: fmt.endDateId === undefined,
                        eventRender: function(ce, e, v)
                            { eventRender(currentObj, ce, e, v); },
                        eventDragStart: function(ce, e, ui, v)
                            { eventActionStart.apply(this,
                                [currentObj, ce, e, ui, v]); },
                        eventResizeStart: function(ce, e, ui, v)
                            { eventActionStart.apply(this,
                                [currentObj, ce, e, ui, v]); },
                        eventDragStop: function(ce, e, ui, v)
                            { eventActionStop.apply(this,
                                [currentObj, ce, e, ui, v]); },
                        eventResizeStop: function(ce, e, ui, v)
                            { eventActionStop.apply(this,
                                [currentObj, ce, e, ui, v]); },
                        eventDrop: function(ce, dd, md, rf, e, ui, v)
                            { eventChange(currentObj, ce, dd, md, rf, e, ui, v); },
                        eventResize: function(ce, dd, md, rf, e, ui, v)
                            { eventChange(currentObj, ce, dd, md, rf, e, ui, v); }
                        })
                    .append('<div class="loadingSpinner"></div>');
                ajaxLoad(currentObj,
                    { include_ids_after: currentObj.settings.pageSize });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            }
        }
    });

    // Private methods
    var ajaxLoad = function(currentObj, data)
    {
        currentObj.$dom().find('.loadingSpinner').removeClass('hidden');
        $.ajax({url: '/views/' + currentObj.settings.viewId + '/rows.json',
                dataType: 'json', data: data, cache: false,
                success: function(r)
                {
                    currentObj.$dom().find('.loadingSpinner').addClass('hidden');
                    addLoadedData(currentObj, r);
                },
                error: function()
                { currentObj.$dom().find('.loadingSpinner').addClass('hidden');}
        });
    };

    var addLoadedData = function(currentObj, resp)
    {
        if (resp.meta && !currentObj._startIndex)
        {
            var fmt = currentObj.settings.displayFormat;
            $.each(resp.meta.view.columns, function(i, c)
            {
                if (c.dataTypeName == 'meta_data' && c.name == 'sid')
                { currentObj._idIndex = i; }
                else if (c.id == fmt.startDateId) { currentObj._startIndex = i; }
                else if (c.id == fmt.endDateId) { currentObj._endIndex = i; }
                else if (c.id == fmt.titleId) { currentObj._titleIndex = i; }
                if (c.id == fmt.descriptionId)
                { currentObj._descriptionIndex = i; }
            });
        }

        if (currentObj._idIndex === undefined ||
            currentObj._startIndex === undefined ||
            currentObj._titleIndex === undefined) { return; }

        var events = [];
        $.each(resp.data, function(i, r)
        {
            if (typeof r == 'object')
            {
                var ce = {id: r[currentObj._idIndex],
                    start: r[currentObj._startIndex],
                    title: $.htmlStrip(r[currentObj._titleIndex]),
                    row: r};
                if (currentObj._endIndex !== undefined)
                {
                    ce.end = r[currentObj._endIndex];
                    if (ce.start === null) { ce.start = ce.end; }
                }
                if (currentObj._descriptionIndex !== undefined)
                { ce.description = r[currentObj._descriptionIndex]; }
                events.push(ce);
            }
            else { currentObj._rowsToLoad.push(r); }
        });
        currentObj.$dom().fullCalendar('addEventSource', events);

        loadData(currentObj);
    };

    var loadData = function(currentObj)
    {
        if (!currentObj._rowsToLoad || currentObj._rowsToLoad.length < 1)
        { return; }

        var toLoad = currentObj._rowsToLoad.splice(0, currentObj.settings.pageSize);

        if (toLoad.length > 0) { ajaxLoad(currentObj, { ids: toLoad }); }
    };

    var eventRender = function(currentObj, calEvent, element, view)
    {
        if (calEvent.description)
        {
            $(element).qtip({content: calEvent.description,
                    style: { name: 'blist' },
                    position: { target: 'mouse' } });
        }
    };

    var eventActionStart = function(currentObj, calEvent, event, ui, view)
    {
        if (calEvent.description)
        {
            $(this).qtip('hide');
            $(this).qtip('disable');
        }
    };

    var eventActionStop = function(currentObj, calEvent, event, ui, view)
    {
        if (calEvent.description) { $(this).qtip('enable'); }
    };

    var eventChange = function(currentObj, calEvent, dayDelta, minuteDelta,
        revertFunc, jsEvent, ui, view)
    {
        var fmt = currentObj.settings.displayFormat;
        var data = {};

        // Make sure we have a start date, and make sure it either was originally
        //  set in the row, or is now different than the end date (meaning it
        //  was a resize) -- otherwise the date was originally null, so don't
        //  update it.
        if (calEvent.start !== null &&
            (calEvent.row[currentObj._startIndex] !== null ||
             (calEvent.end !== null &&
                calEvent.start.valueOf() != calEvent.end.valueOf())))
        { data[fmt.startDateId] = calEvent.start.valueOf() / 1000; }

        if (fmt.endDateId !== undefined && calEvent.end !== null)
        { data[fmt.endDateId] = calEvent.end.valueOf() / 1000; }

        var url = '/views/' + currentObj.settings.viewId + '/rows/' +
            calEvent.id + '.json';
        $.ajax({ url: url,
                type: 'PUT',
                contentType: 'application/json', dataType: 'json',
                data: $.json.serialize(data),
                error: function() { revertFunc(); }
        });
    };
})(jQuery);
