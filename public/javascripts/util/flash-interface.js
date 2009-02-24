var flashIntNS = blist.namespace.fetch('blist.util.flashInterface');

blist.util.flashInterface.allPopups = '*';
blist.util.flashInterface.popupShownHandlers = {};
blist.util.flashInterface.popupClosedHandlers = {};

blist.util.flashInterface.swf = function ()
{
    return $('#swfContent')[0];
}

blist.util.flashInterface.doAction = function (action)
{
    flashIntNS.swf().doAction(action);
}

blist.util.flashInterface.search = function (searchText)
{
    flashIntNS.swf().search(searchText);
}

blist.util.flashInterface.showPopup = function (popup)
{
    flashIntNS.swf().showPopup(popup);
}

blist.util.flashInterface.addColumn = function (datatype)
{
    flashIntNS.swf().addColumn(datatype);
}

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
}

blist.util.flashInterface.popupShown = function (popup)
{
    flashIntNS.callHandlers(flashIntNS.popupShownHandlers, popup);
}

blist.util.flashInterface.popupClosed = function (popup)
{
    flashIntNS.callHandlers(flashIntNS.popupClosedHandlers, popup);
}

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
                callbackList[i]();
            }
        }
    }
}
