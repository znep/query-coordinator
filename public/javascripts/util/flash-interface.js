var flashIntNS = blist.namespace.fetch('blist.util.flashInterface');

blist.util.flashInterface.allPopups = '*';
blist.util.flashInterface.popupShownHandlers = {};
blist.util.flashInterface.popupClosedHandlers = {};

blist.util.flashInterface.swf = function ()
{
    return $('#swfContent')[0];
};

blist.util.flashInterface.doAction = function (action)
{
    flashIntNS.swf().doAction(action);
};

blist.util.flashInterface.lensSearch = function (searchText)
{
    flashIntNS.swf().lensSearch(searchText);
};

blist.util.flashInterface.discoverSearch = function (searchText)
{
    flashIntNS.swf().discoverSearch(searchText);
};

blist.util.flashInterface.showPopup = function (popup)
{
    flashIntNS.swf().showPopup(popup);
    flashIntNS.swf().focus();
};

blist.util.flashInterface.addColumn = function (datatype, index)
{
    if (index === undefined)
    {
        index = -1;
    }
    flashIntNS.swf().addColumn(datatype, index);
    flashIntNS.swf().focus();
};

blist.util.flashInterface.columnProperties = function (columnId)
{
    flashIntNS.swf().columnProperties(columnId);
    flashIntNS.swf().focus();
};

blist.util.flashInterface.columnAggregate = function(columnId, aggregate)
{
    flashIntNS.swf().columnAggregate(columnId, aggregate);
};

blist.util.flashInterface.eventFired = function (event, data)
{
    var jsEvent;
    switch (event)
    {
        case 'VIEW_CHANGED_EVENT':
            jsEvent = blist.events.VIEW_CHANGED;
            break;
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

blist.util.flashInterface.updateDiscoverSearch = function (search)
{
    $(document).trigger(blist.events.DISCOVER_SEARCH_UPDATED, [search]);
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
