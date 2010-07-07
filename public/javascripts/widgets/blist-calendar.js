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

                currentObj._rowsLeft = 0;
                currentObj._rowsLoaded = 0;

                setUpCalendar(currentObj);

                $domObj.append('<div class="loadingSpinner"></div>');

                ajaxLoad(currentObj,
                    { method: 'getByIds', meta: true, start: 0,
                        length: currentObj.settings.pageSize });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            reload: function(newFormat)
            {
                var currentObj = this;
                currentObj._rowsLeft = 0;
                currentObj._rowsLoaded = 0;

                // Adjust resizing enabled

                delete currentObj._idIndex;
                delete currentObj._startCol;
                delete currentObj._endCol;
                delete currentObj._titleIndex;
                delete currentObj._descriptionIndex;

                currentObj.settings.displayFormat = newFormat;

                currentObj.$dom().fullCalendar('destroy');
                setUpCalendar(currentObj);

                ajaxLoad(currentObj,
                    { method: 'getByIds', meta: true, start: 0,
                        length: currentObj.settings.pageSize });
            }
        }
    });


    // Private methods
    var setUpCalendar = function(currentObj)
    {
        var fmt = currentObj.settings.displayFormat;
        currentObj.$dom().fullCalendar({aspectRatio: 2,
                editable: currentObj.settings.editable,
                disableResizing: _.isUndefined(fmt.endDateId) &&
                    _.isUndefined(fmt.endDateTableId),
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
                });
    };

    var ajaxLoad = function(currentObj, data)
    {
        currentObj.$dom().find('.loadingSpinner').removeClass('hide');
        $.ajax({url: '/views/' + currentObj.settings.viewId + '/rows.json',
                dataType: 'json', data: data, cache: false,
                success: function(r)
                {
                    currentObj.$dom().find('.loadingSpinner').addClass('hide');
                    addLoadedData(currentObj, r);
                },
                error: function()
                { currentObj.$dom().find('.loadingSpinner').addClass('hide'); }
        });
    };

    var addLoadedData = function(currentObj, resp)
    {
        if (resp.meta && !currentObj._startCol)
        {
            var fmt = currentObj.settings.displayFormat;
            $.each(resp.meta.view.columns, function(i, c)
            {
                c.dataIndex = i;
                if (c.dataTypeName == 'meta_data' && c.name == 'sid')
                { currentObj._idIndex = i; }
                else if (c.id == fmt.startDateId ||
                    c.tableColumnId == fmt.startDateTableId)
                { currentObj._startCol = c; }
                else if (c.id == fmt.endDateId ||
                    c.tableColumnId == fmt.endDateTableId)
                { currentObj._endCol = c; }
                else if (c.id == fmt.titleId ||
                    c.tableColumnId == fmt.titleTableId)
                { currentObj._titleIndex = i; }
                if (c.id == fmt.descriptionId ||
                    c.tableColumnId == fmt.descriptionTableId)
                { currentObj._descriptionIndex = i; }
            });
            currentObj._rowsLeft = resp.meta.totalRows - currentObj._rowsLoaded;
        }

        if (currentObj._idIndex === undefined ||
            currentObj._startCol === undefined ||
            currentObj._titleIndex === undefined) { return; }

        var events = [];
        $.each((resp.data.data || resp.data), function(i, r)
        {
            if (typeof r == 'object')
            {
                var ce = {id: r[currentObj._idIndex],
                    start: r[currentObj._startCol.dataIndex],
                    title: $.htmlStrip(r[currentObj._titleIndex]),
                    row: r};
                if (currentObj._endCol !== undefined)
                {
                    ce.end = r[currentObj._endCol.dataIndex];
                    if (ce.start === null) { ce.start = ce.end; }
                }
                if (currentObj._descriptionIndex !== undefined)
                { ce.description = r[currentObj._descriptionIndex]; }
                events.push(ce);
                currentObj._rowsLoaded++;
                currentObj._rowsLeft--;
            }
        });
        currentObj.$dom().fullCalendar('addEventSource', events);

        loadData(currentObj);
    };

    var loadData = function(currentObj)
    {
        if (currentObj._rowsLeft < 1) { return; }

        var toLoad = Math.min(currentObj._rowsLeft, currentObj.settings.pageSize);

        ajaxLoad(currentObj, { method: 'getByIds', start: currentObj._rowsLoaded,
            length: toLoad });
    };

    var colType = function(col)
    {
        return blist.data.types[col.renderTypeName];
    };

    var eventRender = function(currentObj, calEvent, element, view)
    {
        if (calEvent.description)
        {
            $(element).socrataTip(calEvent.description);
        }
    };

    var eventActionStart = function(currentObj, calEvent, event, ui, view)
    {
        if (calEvent.description)
        {
            $(this).socrataTip().hide();
            $(this).socrataTip().disable();
        }
    };

    var eventActionStop = function(currentObj, calEvent, event, ui, view)
    {
        if (calEvent.description) { $(this).socrataTip().enable(); }
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
            (calEvent.row[currentObj._startCol.dataIndex] !== null ||
             (calEvent.end !== null &&
                calEvent.start.valueOf() != calEvent.end.valueOf())))
        {
            var d = calEvent.start.valueOf() / 1000;
            if (!$.isBlank(colType(currentObj._startCol).stringFormat))
            { d = calEvent.start.toString(
                colType(currentObj._startCol).stringFormat); }
            data[currentObj._startCol.id] = d;
        }

        if (currentObj._endCol !== undefined && calEvent.end !== null)
        {
            var d = calEvent.end.valueOf() / 1000;
            if (!$.isBlank(colType(currentObj._endCol).stringFormat))
            { d = calEvent.end.toString(
                colType(currentObj._endCol).stringFormat); }
            data[currentObj._endCol] = d;
        }

        var url = '/views/' + currentObj.settings.viewId + '/rows/' +
            calEvent.id + '.json';
        $.ajax({ url: url,
                type: 'PUT',
                contentType: 'application/json', dataType: 'json',
                data: JSON.stringify(data),
                error: function() { revertFunc(); }
        });
    };
})(jQuery);
