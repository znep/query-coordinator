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

                $domObj.fullCalendar({disableDragging: true, aspectRatio: 2,
                        disableResizing: true, editable: false})
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
                dataType: 'json', data: data,
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
                if (c.dataType && c.dataType.type == 'meta_data' && c.name == 'sid')
                { currentObj._idIndex = i; }
                else if (c.id == fmt.startDateId) { currentObj._startIndex = i; }
                else if (c.id == fmt.endDateId) { currentObj._endIndex = i; }
                else if (c.id == fmt.titleId) { currentObj._titleIndex = i; }
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
                    title: r[currentObj._titleIndex]};
                if (currentObj._endIndex !== undefined)
                { ce.end = r[currentObj._endIndex]; }
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

})(jQuery);
