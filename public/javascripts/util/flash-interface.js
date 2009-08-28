var flashIntNS = blist.namespace.fetch('blist.util.flashInterface');

blist.util.flashInterface.allPopups = '*';
blist.util.flashInterface.popupShownHandlers = {};
blist.util.flashInterface.popupClosedHandlers = {};
blist.util.flashInterface.isReady = false;

blist.util.flashInterface.displayColumnProperties = function (columnId)
{
    blist.namespace.fetch('blist.columns.properties');

    $("#modal").jqmShow($('<a href="/blists/' + blist.blistGrid.viewId + '/columns/' + columnId + '"/>'));
};

blist.util.flashInterface.callSwf = function (callback)
{
    if (!flashIntNS.isReady)
    {
        loadSWF();
        $(document).trigger('swf_load');
        if (callback != null)
        {
            $(document).bind('swf_loaded', callback);
        }
    }
    else if (callback != null)
    {
        callback();
    }
};

blist.util.flashInterface.swf = function ()
{
    return flashIntNS.isReady ? $('object#swfContent')[0] : undefined;
};

blist.util.flashInterface.columnPropertiesUpdated = function (columnId)
{
    flashIntNS.callSwf(function ()
            { flashIntNS.swf().columnPropertiesChanged(columnId) });
};

blist.util.flashInterface.swfReady = function ()
{
    if (!flashIntNS.isReady)
    {
        flashIntNS.isReady = true;
        $(document).trigger('swf_loaded');
    }
};

blist.util.flashInterface.doAction = function (action)
{
    flashIntNS.callSwf(function ()
            { flashIntNS.swf().doAction(action); });
};

blist.util.flashInterface.lensSearch = function (searchText)
{
    flashIntNS.callSwf(function ()
            { flashIntNS.swf().lensSearch(searchText); });
};

blist.util.flashInterface.showPopup = function (popup)
{
    flashIntNS.callSwf(function ()
    {
        flashIntNS.swf().showPopup(popup);
        flashIntNS.swf().focus();
    });
};

blist.util.flashInterface.addColumn = function (datatype, index)
{
    flashIntNS.callSwf(function ()
    {
        if (index === undefined)
        {
            index = -1;
        }
        flashIntNS.swf().addColumn(datatype, index);
        flashIntNS.swf().focus();
    });
};

blist.util.flashInterface.columnProperties = function (columnId)
{
    flashIntNS.callSwf(function ()
    {
        flashIntNS.swf().columnProperties(columnId);
        flashIntNS.swf().focus();
    });
};

blist.util.flashInterface.columnAggregate = function(columnId, aggregate)
{
    flashIntNS.callSwf(function ()
    { flashIntNS.swf().columnAggregate(columnId, aggregate); });
};

blist.util.flashInterface.eventFired = function (event, data)
{
    var jsEvent;
    if (event == 'VIEW_CHANGED_EVENT')
    {
        jsEvent = blist.events.VIEW_CHANGED;
    }
    if (jsEvent !== null)
    {
        $(document).trigger(jsEvent, [data]);
    }
};

blist.util.flashInterface.updatePageNavigation = function (pageNav)
{
    $(document).trigger(blist.events.PAGE_LABEL_UPDATED, [pageNav]);
};

blist.util.flashInterface.openLens = function (viewId, popup)
{
    $(document).trigger(blist.events.OPEN_VIEW, [viewId, popup]);
};

blist.util.flashInterface.columnsChanged = function (columnIds)
{
    $(document).trigger(blist.events.COLUMNS_CHANGED, [columnIds]);
};

blist.util.flashInterface.popupCanceled = function (popup)
{
    $(document).trigger(blist.events.POPUP_CANCELED, [popup]);
};

blist.util.flashInterface.addPopupHandlers = function (shownHandler,
    closedHandler, popup)
{
    if (popup === undefined)
    {
        popup = flashIntNS.allPopups;
    }

    if (shownHandler !== undefined)
    {
        if (!flashIntNS.popupShownHandlers[popup])
        {
            flashIntNS.popupShownHandlers[popup] = [];
        }
        flashIntNS.popupShownHandlers[popup].push(shownHandler);
    }

    if (closedHandler !== undefined)
    {
        if (!flashIntNS.popupClosedHandlers[popup])
        {
            flashIntNS.popupClosedHandlers[popup] = [];
        }
        flashIntNS.popupClosedHandlers[popup].push(closedHandler);
    }
};

blist.util.flashInterface.popupShown = function (popup)
{
    flashIntNS.callHandlers(flashIntNS.popupShownHandlers, popup);
};

blist.util.flashInterface.popupClosed = function (popup)
{
    flashIntNS.callHandlers(flashIntNS.popupClosedHandlers, popup);
};

blist.util.flashInterface.callHandlers = function (handlerObj, popup)
{
    var popupList = [flashIntNS.allPopups, popup];
    for (var j = 0; j < popupList.length; j++)
    {
        var curPopup = popupList[j];
        if (handlerObj[curPopup] !== undefined)
        {
            var callbackList = handlerObj[curPopup];
            for (var i = 0; i < callbackList.length; i++)
            {
                callbackList[i](popup);
            }
        }
    }
};
