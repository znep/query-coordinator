var blistGridNS = blist.namespace.fetch('blist.blistGrid');

blist.blistGrid.sizeSwf = function (event)
{
    if (blistGridNS.popupCount > 0)
    {
        return;
    }

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

    if (blistGridNS.isFilter)
    {
        if ($.grep(cookieObj.views, function (v)
            { return v.id == blistGridNS.viewId }).length < 1)
        {
            cookieObj.views.push({name: blistGridNS.viewName,
                id: blistGridNS.viewId, path: window.location.pathname});
            $.cookies.set('viewTabs', $.json.serialize(cookieObj));
        }
    }

    var $tabTemplate = $('.tabList li.main').clone()
        .removeClass('main active even').addClass('filter');
    var $refTab = $('.tabList li.filter.active');
    var $endTab = $('.tabList li.nextTabLink');
    if (!blistGridNS.isFilter || $refTab.length < 1)
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
    if (blistGridNS.isFilter)
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
    var href = $target.attr('href');
    var href_parts = href.slice(href.indexOf('#') + 1).split(':');
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
    var href = $(event.currentTarget).attr('href');
    var dt = href.slice(href.indexOf('#') + 1);
    blist.util.flashInterface.addColumn(dt);
};

blist.blistGrid.flashPopupClickHandler = function (event)
{
    event.preventDefault();
    var href = $(event.currentTarget).attr('href');
    var popup = '';
    if (href.indexOf('#') >= 0)
    {
        popup = href.slice(href.indexOf('#') + 1);
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
    $.ajax({ url: window.location.pathname, cache: false,
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
    blistGridNS.setInfoMenuItem($('#infoPane .summaryTabs li.active'));
};

blist.blistGrid.mainMenuHandler = function(event)
{
    var $target = $(event.currentTarget);
    var href = $target.attr('href');
    if (href.indexOf('#') < 0)
    {
        return;
    }

    event.preventDefault();
    var action = href.slice(href.indexOf('#') + 1);
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
        case 'email':
            $.ajax({url: '/views/' + blistGridNS.viewId + '/rows.html',
                data: {'method': 'email'},
                cache: false,
                success: function (resp)
                {
                    alert('This dataset has been sent to you.');
                }});
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
            $("#infoPane .summaryTabs").infoPaneNavigate()
                .activateTab('#tabPublishing');
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
            $("#infoPane .summaryTabs").infoPaneNavigate()
                .activateTab("#" + action.split('_')[1]);
            break;
    }
};

blist.blistGrid.openViewHandler = function(event, viewId, popup)
{
    blist.util.navigation.redirectToView(viewId, {popup: popup, mode: 'edit'});
};

blist.blistGrid.popupCanceledHandler = function(event, popup)
{
    if (popup == 'NewLens' && blistGridNS.referer && blistGridNS.referer !== '')
    {
        window.location = blistGridNS.referer;
    }
};

blist.blistGrid.setInfoMenuItem = function ($tab)
{
    if ($tab)
    {
        $('#mainMenu li.info li.activePane').removeClass('activePane');
        $('#mainMenu li.info li > a[href*="' + $tab.attr('id') + '"]')
            .closest('li').addClass('activePane');
    }
};

blist.blistGrid.clearTempViewTab = function ()
{
    $('.tabList .filter.tempViewTab').removeClass('active').hide();
    $('.tabList .origView').addClass('active').removeClass('origView');
    $('#infoPane').show();
    $('.headerBar li:has(#mainMenuLink)').show();
    $('#tempInfoPane').hide();
};

blist.blistGrid.setTempViewTab = function (tempView)
{
    $('.tabList .active').addClass('origView').removeClass('active');
    $('.tabList .filter.tempViewTab').addClass('active').show();
    $('#infoPane').hide();
    $('.headerBar li:has(#mainMenuLink)').hide();
    $('#tempInfoPane').show();
};

blist.blistGrid.updateTempView = function (tempView)
{
    $('form.tempView input[name="view[viewFilters]"]')
        .val($.json.serialize(tempView.viewFilters));
    $('form.tempView input[name="view[searchString]"]')
        .val(tempView.searchString);
};

blist.blistGrid.newViewCreated = function($iEdit, responseData)
{
    if (!blist.widgets.visualization.isVisualization)
    {
        $('#readGrid').datasetGrid().isTempView = false;
    }
    window.location = responseData.url;
};

// The favorite action in the info for single panel - when one blist is selected.
blist.blistGrid.favoriteActionClick = function (event)
{
    event.preventDefault();

    var $favLink = $(this);
    var $favContainer = $favLink.closest("li");

    var origHref = $favLink.attr("href");

    $.ajax({
        url: origHref,
        type: "GET",
        success: function(responseText)
        {
            var isCreate = responseText == "created";

            // Update the class of the list item.
            $favContainer.removeClass(isCreate ? "false" : "true")
                         .addClass(isCreate ? "true" : "false");
            // Update the text of the link.
            var linkText = isCreate ? "Remove from favorites" : "Add to favorites";
            $favLink.text(linkText);
            $favLink.attr("title", linkText);

            // Update the link.
            var newHref = isCreate ?
                origHref.replace("create", "delete") :
                origHref.replace("delete", "create");

            $favLink.attr("href", newHref);
        }
    });
};



blist.blistGrid.infoEditCallback = function(fieldType, fieldValue, itemId, responseData)
{
    if (fieldType == "name")
    {
        var oldName = blistGridNS.viewName;
        blistGridNS.viewName = fieldValue;

        // Update text in tab
        $('#lensContainer .tabList .active a')
            .text(blistGridNS.viewName).attr('title', blistGridNS.viewName);

        // Update stored info in cookie for filter
        var cookieStr = $.cookies.get('viewTabs');
        if (blistGridNS.isFilter &&
            cookieStr && cookieStr != "" && cookieStr != "undefined")
        {
            var cookieObj = $.json.deserialize(cookieStr);
            $.each(cookieObj.views, function (k, v)
                {
                    if (v.id == blistGridNS.viewId)
                    {
                        v.name = blistGridNS.viewName;
                        return false;
                    }
                });
            $.cookies.set('viewTabs', $.json.serialize(cookieObj));
        }

        // Update in filtered view list
        if (blistGridNS.isFilter)
        {
            $('.singleInfoFiltered .gridList #filter-row_' + itemId +
                ' .name a').text(blistGridNS.viewName);
        }
    }
};


/* Initial start-up calls, and setting up bindings */

$(function ()
{
    if (blistGridNS.viewId)
    {
        if (!blist.widgets.visualization.isVisualization)
        {
            $('#readGrid').datasetGrid({viewId: blistGridNS.viewId,
                accessType: 'WEBSITE', manualResize: true, showRowHandle: true,
                clearTempViewCallback: blistGridNS.clearTempViewTab,
                setTempViewCallback: blistGridNS.setTempViewTab,
                updateTempViewCallback: blistGridNS.updateTempView,
                filterItem: '#lensContainer .headerBar form :text',
                clearFilterItem: '#lensContainer .headerBar form .clearSearch'
            });
        }
        else
        {
            $('#readGrid').visualization();
        }
    }
    else if (blistGridNS.newDataset)
    {
        $("#modal").jqmShow($("<a href='/blists/new'></a>"));
    }

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

    blist.util.sizing.cachedInfoPaneHeight =
        $("#infoPane .header").height() +
        $("#infoPane .active .infoContentHeader").height();
    $(window).resize(function (event)
    {
        commonNS.adjustSize();
        blistGridNS.sizeSwf(event);
        $('#readGrid').trigger('resize');
    });
    commonNS.adjustSize();
    $('#readGrid').trigger('resize');

    $('.tabList .newViewLink a').click(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.showPopup('SaveLens');
    });

    $("#throbber").hide();
    $('a#notifyAll').click(function(event)
    {
        event.preventDefault();
        $("#throbber").show();
        $.post($(this).closest("form").attr("action"), null, function(data, textStatus) {
            $("#throbber").hide();
        });
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
		$('#displayLink .linkIcon')
			.removeClass('page')
			.addClass('table');
        blist.util.flashInterface.doAction('TableView');
    });
    $('#displayMenu .page').click(function (event)
    {
        event.preventDefault();
		$('#displayLink .linkIcon')
			.removeClass('table')
			.addClass('page');
        blist.util.flashInterface.doAction('PageView');
    });

    $('.flashAction').click(function (event)
    {
        event.preventDefault();
        var href = $(event.currentTarget).attr('href');
        blist.util.flashInterface.doAction(
            href.slice(href.indexOf('#') + 1));
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
        if (blist.util.flashInterface.swf() != undefined)
        {
            blist.util.flashInterface.lensSearch(
                $(event.currentTarget).find('input[type="text"]').val());
        }
    });

    $('#lensContainer .headerBar form .clearSearch')
        .click(function (e)
        {
            if (blist.util.flashInterface.swf() != undefined)
            {
                blist.util.flashInterface.lensSearch('');
            }
        });

    blistGridNS.hookUpMainMenu();
    $('#filterViewMenu').dropdownMenu({triggerButton: $('#filterLink'),
        menuBar: $('#lensContainer .headerBar')});
    $('#displayMenu').dropdownMenu({triggerButton: $('#displayLink'),
        menuBar: $('#lensContainer .headerBar')});
	$('#shareTopMenu').dropdownMenu({triggerButton: $('#shareTopLink'),
		menuBar: $('#lensContainer .headerBar')});
	$('#shareInfoMenu').dropdownMenu({triggerButton: $('#shareInfoLink'),
		forcePosition: true, closeOnResize: true});

    // Set up the info pane tab switching.
    var paneMatches = window.location.search.match(/metadata_pane=(\w+)/);
    $("#infoPane .summaryTabs").infoPaneNavigate({
        tabMap: {
            "tabSummary" : "#infoPane .singleInfoSummary",
            "tabFiltered" : "#infoPane .singleInfoFiltered",
            "tabComments" : "#infoPane .singleInfoComments",
            "tabSharing" : "#infoPane .singleInfoSharing",
            "tabPublishing" : "#infoPane .singleInfoPublishing",
            "tabActivity" : "#infoPane .singleInfoActivity"
        },
        allPanelsSelector : "#infoPane .infoContentOuter",
        expandableSelector: "#infoPane .infoContent",
        // After switching tabs, update the menu and size the Swf.
        switchCompleteCallback: function ($tab)
        {
            blistGridNS.setInfoMenuItem($tab);
            blistGridNS.sizeSwf();
        },
        initialTab: paneMatches && paneMatches.length > 1 ? paneMatches[1] : null
    });
    $(".tabLink.activity").click(function(event){
        $("#infoPane .summaryTabs").infoPaneNavigate().activateTab("#tabActivity");
    });
    $(".tabLink.filtered").click(function(event){
        $("#infoPane .summaryTabs").infoPaneNavigate().activateTab("#tabFiltered");
    });
    $(".tabLink.publishing").click(function(event){
        $("#infoPane .summaryTabs").infoPaneNavigate().activateTab("#tabPublishing");
    });
    $(".tabLink.sharing").click(function(event){
        $("#infoPane .summaryTabs").infoPaneNavigate().activateTab("#tabSharing");
    });

    // Wire up the hover behavior in the info pane.
    $("#infoPane .selectableList, #infoPane .gridList").blistListHoverItems();
    $(".infoContent dl.actionList, #infoPane .infoContentHeader")
        .infoPaneItemHighlight();
    // We want the item pane highlight, but not the click selector;
    //  so pass it a dummy ID
    $('#tempInfoPane .infoContentHeader').infoPaneItemHighlight(
        {clickSelector: '#n/a'});

    $("#infoPane .editItem").infoPaneItemEdit({
        submitSuccessCallback: blistGridNS.infoEditCallback});
    $("#tempInfoPane .inlineEdit").inlineEdit({
        displaySelector: '.itemContent span',
        editClickSelector: '.itemContent span, .itemActions',
        loginMessage: 'Creating a public filter requires you to have an account. \
            Either sign in or sign up to save your public filter.',
        submitSuccessCallback: blistGridNS.newViewCreated});
    $(".tabList .tempViewTab.inlineEdit").inlineEdit({
        loginMessage: 'Creating a public filter requires you to have an account. \
            Either sign in or sign up to save your public filter.',
        submitSuccessCallback: blistGridNS.newViewCreated});

    $('.copyCode textarea, .copyCode input').click(function() { $(this).select(); });

    // Wire up attribution edit box
    $('.attributionEdit').attributionEdit();

    // Update copyable publish code and live preview from template/params
    var updatePublishCode = function()
    {
        // detemplatize publish code template if it exists
        if ($('.copyCode #publishCode').length > 0)
        {
            var width = $('#publishWidth').val();
            var height = $('#publishHeight').val();
            $('.copyCode #publishCode').val($('.copyCode #publishCodeTemplate').val()
                    .replace('#width#', width)
                    .replace('#height#', height)
                    .replace('#variation#', $('#publishVariation').val()));

            // Restrict size to >= 425x344 px
            if (parseInt(width) < 425 || parseInt(height) < 344 || width == '' || height == '')
            {
                $('#sizeError').removeClass('hide');
                $('.copyCode #publishCode').attr('disabled', true);
                $('#previewWidgetLink').addClass('disabled');
            }
            else
            {
                $('#sizeError').addClass('hide');
                $('.copyCode #publishCode').removeAttr('disabled');
                $('#previewWidgetLink').removeClass('disabled');
            }
        }
    };
    updatePublishCode();
    $('#publishWidth, #publishHeight').keyup(updatePublishCode);
    $('#publishVariation').change(updatePublishCode);
    $('#publishWidth, #publishHeight').keypress(function (event)
        {
            if ((event.which < 48 || event.which > 57) && !(event.which == 8 || event.which == 0))
            {
                // Disallow non-numeric input in width/height fields
                return false;
            }
        });
    $('#previewWidgetLink').click(function (event)
            {
                event.preventDefault();
                var $link = $(this);
                var width = $('#publishWidth').val();
                var height = $('#publishHeight').val();
                if (parseInt(width) < 425 || parseInt(height) < 344 || width == '' || height == '')
                {
                    return;
                }
                window.open(
                    $link.attr('href') + "?width=" + width + "&height=" + height + "&variation=" + $('#publishVariation').val(), 
                    "Preview", "location=no,menubar=no,resizable=no,status=no,toolbar=no");
            });


    $('.switchPermsLink').click(function (event)
        {
            event.preventDefault();
            var $link = $(this);
            var curState = $link.text().toLowerCase();
            var newState = curState == 'private' ?
                'public' : 'private';

            var viewId = $link.attr('href').split('_')[1];
            $.get('/views/' + viewId, {'method': 'setPermission',
                'value': newState});

            var capState = $.capitalize(newState);

            // Update link & icon
            $link.closest('p.' + curState)
                .removeClass(curState).addClass(newState);
            $link.text(capState);
            // Update panel header & icon
            $link.closest('.singleInfoSharing')
                .find('.panelHeader.' + curState).text(capState)
                .removeClass(curState).addClass(newState);
            // Update line in summary pane
            $link.closest('#infoPane')
                .find('.singleInfoSummary .permissions .itemContent > *')
                .text(capState);
            // Update summary panel header icon
            $link.closest('#infoPane')
                .find('.singleInfoSummary .panelHeader.' + curState)
                .removeClass(curState).addClass(newState);
            // Update publishing panel view
            $('.singleInfoPublishing .hide').removeClass('hide');
            if (newState == 'private')
            {
                $('.singleInfoPublishing .publishContent').addClass('hide');
            }
            else
            {
                $('.singleInfoPublishing .publishWarning').addClass('hide');
            }
        });

    var commentMatches = window.location.search.match(/comment=(\w+)/);
    $('#infoPane .singleInfoComments').infoPaneComments({
        initialComment: commentMatches && commentMatches.length > 1 ?
            commentMatches[1] : null
    });

    $(document).bind('swf_load', function ()
    {
        $('#lensBody').addClass('editMode').removeClass('readMode');
        $('#readGrid').remove();
        blistGridNS.sizeSwf();
    });
    $('#editLink').click(function (e)
    {
        e.preventDefault();
        blist.util.flashInterface.callSwf();
    });
    if ($('#lensBody').hasClass('editMode'))
    {
        blist.util.flashInterface.callSwf();
    }

    $(".favoriteAction a").click( blistGridNS.favoriteActionClick );

    window.onbeforeunload = function ()
    {
        if (!blist.widgets.visualization.isVisualization &&
            $('#readGrid').datasetGrid().isTempView)
        {
            return 'You will lose your temporary filter.';
        }
    };
});
