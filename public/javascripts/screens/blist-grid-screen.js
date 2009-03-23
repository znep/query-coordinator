var blistGridNS = blist.namespace.fetch('blist.blistGrid');

blist.blistGrid.sizeSwf = function (event)
{
    if (blistGridNS.popup)
    {
        return;
    }

    var $swf = $('#swfContent');
    var $target = $('#swfWrapper');
    var $container = $('#outerSwfWrapper');
    var $parent = $target.offsetParent();
    var containerTop = $container.offset().top;
    var containerLeft = $container.offset().left;

    $target.css('top', containerTop + 'px');
    $target.css('bottom',
        ($parent.height() - (containerTop + $container.height())) + 'px');
    $target.css('left', containerLeft + 'px');
    $target.css('right',
        ($parent.width() - (containerLeft + $container.width())) + 'px');
    // Safari doesn't give the swf the right height with height:100%; so force it
    $swf.height($target.height());
};

blist.blistGrid.columnClickHandler = function (event)
{
    var $target = $(event.currentTarget);
    var href_parts = $target.attr('href').slice(1).split(':');
    if (href_parts.length < 2)
    {
        return;
    }

    switch (href_parts[0])
    {
        case 'edit_column':
            event.preventDefault();
            blist.util.flashInterface.columnProperties(href_parts[1]);
            break;
        case 'column_totals':
            event.preventDefault();
            break;
        case 'aggregate':
            event.preventDefault();
            if (href_parts.length == 3)
            {
                blist.util.flashInterface.columnAggregate(href_parts[1],
                        href_parts[2]);
            }
            break;
    }
};

blist.blistGrid.showFlashPopup = function (popup)
{
    blist.util.flashInterface.showPopup(popup);
};

blist.blistGrid.flashPopupShownHandler = function (popup)
{
    blistGridNS.popup = true;
    // Resizing the grid causes the file upload dialog to close; it fits within
    //  the window as-is, so don't resize for that
    if (popup != 'MultipleFileUpload')
    {
        $('#swfWrapper').css('top', ($('#header').outerHeight() + 10) + 'px');
        $('#swfWrapper').css('bottom', ($('#footer').outerHeight() + 10) + 'px');
        // Safari doesn't give the swf the right height with height:100%; so
        // force it
        $('#swfContent').height($('#swfWrapper').height());
    }
    $('#overlay').show();
};

blist.blistGrid.flashPopupClosedHandler = function (popup)
{
    blistGridNS.popup = false;
    blistGridNS.sizeSwf();
    $('#overlay').hide();
};

blist.blistGrid.toggleAddColumns = function ()
{
    $('#addColumnsMenu').toggleClass('shown');
    blist.common.forceWindowResize();
};

blist.blistGrid.dataTypeClickHandler = function (event)
{
    var dt = $(event.currentTarget).attr('href').slice(1);
    blist.util.flashInterface.addColumn(dt);
};

blist.blistGrid.viewChangedHandler = function (event, data)
{
    var $main = $('#lensContainer');
    if (data == 'grid')
    {
        $main.removeClass('pageView');
        $main.addClass('tableView');
    }
    else if (data == 'page')
    {
        $main.removeClass('tableView');
        $main.addClass('pageView');
    }
    blist.common.forceWindowResize();
};

blist.blistGrid.pageLabelHandler = function (event, newLabel)
{
    $('#pageInfo').text(newLabel);
};

blist.blistGrid.columnsChangedHandler = function (event, columnIds)
{
    // This is a heavy-handed approach to updating column totals or other
    //  parts of the menu that will change with the columns; but until we
    //  have real column objects in JS, this is the easiest way

    // This shouldn't be cached, ever
    $.ajax({ url: window.location.pathname,
            data: 'dataComponent=mainMenu',
            success: blistGridNS.mainMenuLoaded});
};

blist.blistGrid.mainMenuLoaded = function (data)
{
    // Swap out the main menu with whatever was loaded
    $('#mainMenu').replaceWith(data);
    blistGridNS.hookUpMainMenu();
};

blist.blistGrid.hookUpMainMenu = function()
{
    $('#mainMenu').dropdownMenu({triggerButton: $('#mainMenuLink'),
            menuBar: $('#lensContainer .headerBar'),
            linkCallback: blistGridNS.mainMenuHandler});
    $('#mainMenu .columnsMenu').scrollable();
    $('#mainMenu .columnsMenu a').click(function (event)
    {
        blistGridNS.columnClickHandler(event);
    });
};

blist.blistGrid.mainMenuHandler = function(event)
{
    var $target = $(event.currentTarget);
    var href = $target.attr('href');
    if (href[0] != '#')
    {
        return;
    }

    event.preventDefault();
    switch (href.slice(1))
    {
        case 'new_blist':
            blist.blistGrid.referer = '';
            blist.util.flashInterface.showPopup('NewLens');
            break;
        case 'import':
            blist.blistGrid.referer = '';
            blist.util.flashInterface.showPopup('NewLens:Import');
            break;
    }
};

blist.blistGrid.openViewHandler = function(event, viewId)
{
    blist.util.navigation.redirectToView(viewId);
};

blist.blistGrid.popupCanceledHandler = function(event, popup)
{
    if (popup == 'NewLens' && blistGridNS.referer && blistGridNS.referer !== '')
    {
        window.location = blistGridNS.referer;
    }
};

/* Initial start-up calls, and setting up bindings */

$(function ()
{
    blist.util.flashInterface.addPopupHandlers(blistGridNS.flashPopupShownHandler,
        blistGridNS.flashPopupClosedHandler);

    $(document).bind(blist.events.VIEW_CHANGED, blistGridNS.viewChangedHandler);
    $(document).bind(blist.events.PAGE_LABEL_UPDATED, blistGridNS.pageLabelHandler);
    $(document).bind(blist.events.COLUMNS_CHANGED,
        blistGridNS.columnsChangedHandler);
    $(document).bind(blist.events.OPEN_VIEW, blistGridNS.openViewHandler);
    $(document).bind(blist.events.POPUP_CANCELED, blistGridNS.popupCanceledHandler);

    $(window).resize(function (event)
    {
        commonNS.adjustSize();
        blistGridNS.sizeSwf(event);
    });
    commonNS.adjustSize();

    $('#filterViewMenu .filter').click(function (event)
    {
        event.preventDefault();
        blistGridNS.showFlashPopup('LensBuilder:Filter');
    });
    $('#filterViewMenu .sort').click(function (event)
    {
        event.preventDefault();
        blistGridNS.showFlashPopup('LensBuilder:Sort');
    });
    $('#filterViewMenu .showHide').click(function (event)
    {
        event.preventDefault();
        blistGridNS.showFlashPopup('LensBuilder:ShowHide');
    });

    $('#displayMenu .table').click(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.doAction('TableView');
    });
    $('#displayMenu .page').click(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.doAction('PageView');
    });

    $('.flashAction').click(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.doAction(
            $(event.currentTarget).attr('href').slice(1));
    });

    $('.addColumnsLink, #addColumnsMenu .close').click(function (event)
    {
        event.preventDefault();
        blistGridNS.toggleAddColumns();
    });

    $('#addColumnsMenu .column a').click(function (event)
    {
        event.preventDefault();
        blistGridNS.dataTypeClickHandler(event);
    });

    $('#lensContainer .headerBar form').submit(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.lensSearch(
            $(event.currentTarget).find('input[type="text"]').val());
    });

    blistGridNS.hookUpMainMenu();
    $('#filterViewMenu').dropdownMenu({triggerButton: $('#filterLink'),
        menuBar: $('#lensContainer .headerBar')});
    $('#displayMenu').dropdownMenu({triggerButton: $('#displayLink'),
        menuBar: $('#lensContainer .headerBar')});

    blistGridNS.sizeSwf();

    // Set up the info pane tab switching.
    blist.util.sizing.cachedInfoPaneHeight = $("#sidebar").height();
    $(".summaryTabs li").infoPaneTabSwitch({
        // After switching tabs, we need to size the Swf.
        switchCompleteCallback: blistGridNS.sizeSwf
    });

    // Wire up the hover behavior in the info pane.
    $("#infoPane .selectableList").blistListHoverItems();
    $(".infoContent dl.summaryList").infoPaneItemHighlight();
});
