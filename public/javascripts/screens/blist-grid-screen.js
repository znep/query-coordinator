var blistGridNS = blist.namespace.fetch('blist.blistGrid');

blist.blistGrid.sizeSwf = function (event)
{
    if (blistGridNS.popupCount > 0)
    {
        return;
    }

    var $swf = $('#swfContent');
    var $target = $('#swfWrapper');
    if ($target.length < 1)
    {
        return;
    }
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
};

blist.blistGrid.setUpTabs = function ()
{
    var cookieStr = $.cookies.get('viewTabs');
    if (!cookieStr || cookieStr === undefined || cookieStr === "" || cookieStr == "undefined")
    {
        blistGridNS.createTabCookie();
        return;
    }

    var cookieObj = $.json.deserialize(cookieStr);
    if (cookieObj.blistId != blistGridNS.blistId)
    {
        blistGridNS.createTabCookie();
        return;
    }

    if (blistGridNS.viewId)
    {
        if ($.grep(cookieObj.views, function (v)
            { return v.id == blistGridNS.viewId }).length < 1)
        {
            cookieObj.views.push({name: blistGridNS.viewName,
                id: blistGridNS.viewId, path: window.location.pathname});
            $.cookies.set('viewTabs', $.json.serialize(cookieObj));
        }
    }

    var $tabList = $('.tabList');
    var $tabTemplate = $tabList.find('li.main').clone()
        .removeClass('main active even').addClass('filter');
    var $refTab = $('.tabList li.filter.active');
    var $endTab = $('.tabList li.nextTabLink');
    if (blistGridNS.viewId === null || $refTab.length < 1)
    {
        $refTab = $endTab;
    }
    $.each(cookieObj.views, function (i, v)
    {
        if (v.id == blistGridNS.viewId)
        {
            $refTab = $endTab;
            return;
        }
        var $newTab = $tabTemplate.clone();
        if (i % 2 == 0)
        {
            $newTab.addClass('even');
        }
        var $newA = $newTab.find('a');
        $newA.attr('href', v.path);
        $newA.attr('title', v.name);
        $newA.text(v.name);
        $refTab.before($newTab);
    });
};

blist.blistGrid.createTabCookie = function()
{
    $.cookies.del('viewTabs');
    if (blistGridNS.viewId)
    {
        $.cookies.set('viewTabs', $.json.serialize({
            blistId: blistGridNS.blistId,
            views: [{name: blistGridNS.viewName, id: blistGridNS.viewId,
                path: window.location.pathname}]
        }));
    }
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

blist.blistGrid.popupCount = 0;
blist.blistGrid.flashPopupShownHandler = function (popup)
{
    if (blistGridNS.popupCount < 1)
    {
        // Resizing the grid causes the file upload dialog to close; it fits within
        //  the window as-is, so don't resize for that
        if (popup != 'MultipleFileUpload')
        {
            $('#swfWrapper').css('top', ($('#header').outerHeight() + 10) + 'px');
            $('#swfWrapper').css('bottom',
                    ($(document).height() - $(window).height()) + 'px');
        }
        $('#overlay').show();
    }
    blistGridNS.popupCount++;
};

blist.blistGrid.flashPopupClosedHandler = function (popup)
{
    blistGridNS.popupCount--;
    if (blistGridNS.popupCount < 1)
    {
        blistGridNS.sizeSwf();
        $('#overlay').hide();
    }
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

blist.blistGrid.flashPopupClickHandler = function (event)
{
    event.preventDefault();
    var href = $(event.currentTarget).attr('href');
    var popup = '';
    if (href[0] == '#')
    {
        popup = href.slice(1);
    }
    else
    {
        var matches = href.match(/popup=(\w+)/);
        if (matches && matches.length > 1)
        {
            popup = matches[1];
        }
    }
    if (popup !== '')
    {
        blist.util.flashInterface.showPopup(popup);
    }
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
    var action = href.slice(1);
    switch (action)
    {
        case 'new_blist':
            blist.blistGrid.referer = '';
            blist.util.flashInterface.showPopup('NewLens');
            break;
        case 'import':
            blist.blistGrid.referer = '';
            blist.util.flashInterface.showPopup('NewLens:Import');
            break;
        case 'discover':
            blist.blistGrid.referer = '';
            blist.util.flashInterface.showPopup('NewLens:Discover');
            break;
        case 'copy_blist':
            blist.blistGrid.referer = '';
            blist.util.flashInterface.showPopup('NewLens:CopyBlist');
            break;
        case 'picklistBrowser':
            blist.util.flashInterface.showPopup('PickListBrowser');
            break;
        case 'print':
            blist.util.flashInterface.showPopup('PrintDialog');
            break;
        case 'email':
            blist.util.flashInterface.showPopup('EmailDialog');
            break;
        case 'permissions':
            blist.util.flashInterface.showPopup('PermissionsDialog');
            break;
        case 'Undo':
        case 'Redo':
        case 'Copy':
        case 'Cut':
        case 'Paste':
        case 'Delete':
            blist.util.flashInterface.doAction(action);
            break;
        case 'addColumn_rowTag':
            blist.util.flashInterface.addColumn('rowTag');
            break;
        case 'addColumn_last':
            blist.util.flashInterface.addColumn('plainText');
            break;
        case 'addColumn_first':
            blist.util.flashInterface.addColumn('plainText', 0);
            break;
        case 'publish_grid':
            blist.util.flashInterface.showPopup('PublishDialog:Grid');
            break;
        case 'publish_form':
            blist.util.flashInterface.showPopup('PublishDialog:Form');
            break;
        case 'infoPane_tabSummary':
        case 'infoPane_tabFiltered':
        case 'infoPane_tabComments':
        case 'infoPane_tabSharing':
        case 'infoPane_tabPublishing':
        case 'infoPane_tabActivity':
            $(".summaryTabs").infoPaneNavigate()
                .activateTab("#" + action.split('_')[1]);
            break;
    }
};

blist.blistGrid.openViewHandler = function(event, viewId, popup)
{
    blist.util.navigation.redirectToView(viewId, popup);
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
    blistGridNS.setUpTabs();
    $('.tabList').scrollable({
        selector: '.filter',
        prevSelector: '.prevTabLink a',
        nextSelector: '.nextTabLink a',
        numVisible: 3
    });

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

    $('.tabList .newViewLink a').click(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.showPopup('SaveLens');
    });

    $('#filterViewMenu .filter').click(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.showPopup('LensBuilder:Filter');
    });
    $('#filterViewMenu .sort').click(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.showPopup('LensBuilder:Sort');
    });
    $('#filterViewMenu .showHide').click(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.showPopup('LensBuilder:ShowHide');
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

    $('a.showFlashPopup').click(blistGridNS.flashPopupClickHandler);

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
    var paneMatches = window.location.search.match(/metadata_pane=(\w+)/);
    blist.util.sizing.cachedInfoPaneHeight = $("#sidebar").height();
    $(".summaryTabs").infoPaneNavigate({
        // After switching tabs, update the menu and size the Swf.
        switchCompleteCallback: function ($tab)
        {
            if ($tab)
            {
                $('#mainMenu li.info li.activePane').removeClass('activePane');
                $('#mainMenu li.info li > a[href*="' + $tab.attr('id') + '"]')
                    .closest('li').addClass('activePane');
            }
            blistGridNS.sizeSwf();
        },
        initialTab: paneMatches && paneMatches.length > 1 ? paneMatches[1] : null
    });
    $(".tabLink.activity").click(function(event){
        $(".summaryTabs").infoPaneNavigate().activateTab("#tabActivity");
    });
    $(".tabLink.filtered").click(function(event){
        $(".summaryTabs").infoPaneNavigate().activateTab("#tabFiltered");
    });
    $(".tabLink.publishing").click(function(event){
        $(".summaryTabs").infoPaneNavigate().activateTab("#tabPublishing");
    });
    $(".tabLink.sharing").click(function(event){
        $(".summaryTabs").infoPaneNavigate().activateTab("#tabSharing");
    });

    // Wire up the hover behavior in the info pane.
    $("#infoPane .selectableList, #infoPane .gridList").blistListHoverItems();
    $(".infoContent dl.actionList").infoPaneItemHighlight();

    $("#infoPane dd.editItem").infoPaneItemEdit();

    $(".copyCode textarea").click(function() { $(this).select(); });

    var commentMatches = window.location.search.match(/comment=(\w+)/);
    $('#infoPane .singleInfoComments').infoPaneComments({
        initialComment: commentMatches && commentMatches.length > 1 ?
            commentMatches[1] : null
    });
});
