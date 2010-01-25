var blistGridNS = blist.namespace.fetch('blist.blistGrid');

blist.blistGrid.getCookieHash = function()
{
    var dispType = blist.display.type;
    if (dispType != 'calendar' && dispType != 'visualization') {
        dispType = 'filter';
    }
    return {name: $.htmlUnescape(blistGridNS.viewName), id: blistGridNS.viewId,
        path: window.location.pathname, displayType: dispType};
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
            { return v.id == blistGridNS.viewId ; }).length < 1)
        {
            cookieObj.views.push(blistGridNS.getCookieHash());
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
        if (i % 2 === 0)
        {
            $newTab.addClass('even');
        }
        $newTab.attr('id', 'viewId_' + v.id);
        var $newA = $newTab.find('a');
        $newA.attr('href', v.path);
        $newA.attr('title', v.name);
        $newA.text(v.name);
        $newA.addClass(v.displayType);
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
            views: [blistGridNS.getCookieHash()]
        }));
    }
};

blist.blistGrid.removeTabCookie = function(viewId)
{
    var cookieStr = $.cookies.get('viewTabs');
    if (!cookieStr || cookieStr === undefined || cookieStr === "" ||
        cookieStr == "undefined")
    { return; }

    var cookieObj = $.json.deserialize(cookieStr);
    if (cookieObj.blistId != blistGridNS.blistId) { return; }

    $.each(cookieObj.views, function(i, v)
    {
      if (v.id == viewId)
      {
          cookieObj.views.splice(i, 1);
          return false;
      }
    });
    $.cookies.set('viewTabs', $.json.serialize(cookieObj));
};

blist.blistGrid.toggleAddColumns = function ()
{
    $('#addColumnsMenu').toggleClass('shown');
    $('#formatMenu').removeClass('shown');
    blist.common.forceWindowResize();
};

blist.blistGrid.toggleFormatMenu = function ()
{
    $('#formatMenu').toggleClass('shown');
    $('#addColumnMenu').removeClass('shown');
    blist.common.forceWindowResize();
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
    var $menus = $(data).children();

    // Swap out the main menu with whatever was loaded
    var $menu = $("#mainMenu");
    var $container = $menu.parent();
    $container[0].removeChild($menu[0]);
    $container[0].appendChild($menus[0]);

    // Update the Create menu in More Views tab
    $menu = $('#createViewMenu');
    if ($menu.length > 0)
    {
        $container = $menu.parent();
        $container[0].removeChild($menu[0]);
        $container[0].appendChild($menus.filter('#createViewMenu')[0]);
        blistGridNS.hookUpCreateViewMenu();
    }

    // Swap out the filter & view menu with whatever was loaded
    $menu = $("#filterViewMenu");
    $container = $menu.parent();
    $container[0].removeChild($menu[0]);
    $container[0].appendChild($menus[1]);

    blistGridNS.hookUpMainMenu();
    blistGridNS.hookUpFilterViewMenu();
};

blist.blistGrid.hookUpCreateViewMenu = function()
{
    $('#createViewMenu').dropdownMenu(
        {triggerButton: $('.singleInfoFiltered .createViewLink'),
            forcePosition: true});
};

blist.blistGrid.hookUpFilterViewMenu = function()
{
    $('#filterViewMenu').dropdownMenu({triggerButton: $('#filterLink'),
        linkCallback: blist.datasetMenu.menuHandler,
        menuBar: $('#lensContainer .headerBar')});

    $("#filterViewMenu .columnsMenu, #filterViewMenu .scrollableMenu").scrollable();
};

blist.blistGrid.hookUpMainMenu = function()
{
    $('#mainMenu').dropdownMenu({triggerButton: $('#mainMenuLink'),
            menuBar: $('#lensContainer .headerBar'),
            linkCallback: blist.datasetMenu.menuHandler});
    $('#mainMenu .columnsMenu, #mainMenu .scrollableMenu').scrollable();
    blistGridNS.setInfoMenuItem($('#infoPane .summaryTabs li.active'));
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
    $('.tabList .filter.tempViewTab').removeClass('active');
    $('.tabList .origView').addClass('active').removeClass('origView');
    $('body').removeClass('unsavedView groupedView');
    $('#infoPane').show();
    $(document).trigger(blist.events.COLUMNS_CHANGED);
};

blist.blistGrid.setTempViewTab = function ()
{
    $('.tabList .active').addClass('origView').removeClass('active');
    $('.tabList .filter.tempViewTab').addClass('active');
    $('body').addClass('unsavedView');
    if ($('#dataGrid').blistModel().isGrouped())
    { $('body').addClass('groupedView'); }
    $('#infoPane').hide();
};

blist.blistGrid.updateTempViewTab = function()
{
    $('body').toggleClass('groupedView', $('#dataGrid').blistModel().isGrouped());
};

blist.blistGrid.newViewCreated = function($iEdit, responseData)
{
    if (!blistGridNS.isAltView)
    {
        $('#dataGrid').datasetGrid().isTempView = false;
    }
    blist.util.navigation.redirectToView(responseData.id);
};

blist.blistGrid.updateValidView = function(view)
{
    $('.viewErrorContainer').hide();
    $('.invalidView').removeClass('invalidView');
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

blist.infoEditSubmitSuccess = blistGridNS.infoEditCallback;

/* Initial start-up calls, and setting up bindings */

$(function ()
{
    if (!blist.blistGrid.isAltView)
    {
        $('#dataGrid').datasetGrid({viewId: blistGridNS.viewId,
            columnDeleteEnabled: blistGridNS.isOwner,
            columnPropertiesEnabled: blistGridNS.isOwner,
            columnNameEdit: blistGridNS.isOwner,
            showAddColumns: blistGridNS.canAddColumns,
            currentUserId: blist.currentUserId,
            accessType: 'WEBSITE', manualResize: true, showRowHandle: true,
            clearTempViewCallback: blistGridNS.clearTempViewTab,
            setTempViewCallback: blistGridNS.setTempViewTab,
            updateTempViewCallback: blistGridNS.updateTempViewTab,
            filterForm: '#lensContainer .headerBar form',
            clearFilterItem: '#lensContainer .headerBar form .clearSearch',
            isInvalid: blist.blistGrid.isInvalidView,
            validViewCallback: blistGridNS.updateValidView
        });
    }
    else if (blist.display.type == 'visualization')
    { $('#dataGrid').visualization(); }

    $('.viewErrorContainer .removeViewLink').click(function(event)
    {
        event.preventDefault();
        if (!confirm('Are you sure you want to remove this view?'))
        { return; }
        var $target = $(event.currentTarget);
        var href = $target.attr('href');
        var s = href.slice(href.indexOf('#') + 1).split('_');
        $.ajax({url: '/datasets/' + s[1],
            type: 'DELETE',
            // we need to pass in empty data or Chrome screws up the request
            data: " ",
            contentType: "application/json",
            success: function()
            {
                if (s.length > 2)
                { window.location = blist.util.navigation.getViewUrl(s[2]); }
                else
                { window.location = '/datasets'; }
        }});
    });

    blistGridNS.setUpTabs();
    $('.tabList').scrollable({
        selector: '.filter',
        prevSelector: '.prevTabLink a',
        nextSelector: '.nextTabLink a',
        numVisible: 3
    });

    $(document).bind(blist.events.COLUMNS_CHANGED,
        blistGridNS.columnsChangedHandler);

    blist.util.sizing.cachedInfoPaneHeight =
        $("#infoPane .header").height() +
        $("#infoPane .active .infoContentHeader").height();
    $(window).resize(function (event)
    {
        commonNS.adjustSize();
        $('#dataGrid').trigger('resize');
    });
    $('#infoPane').show();
    commonNS.adjustSize();
    $('#dataGrid').trigger('resize');

    $.live('.tabList .newViewLink a, a[href=#createFilter]', 'click',
        function (event)
        {
            event.preventDefault();
            $('#dataGrid').datasetGrid().setTempView();
        });

    $.live('#createViewMenu li.calendar a, .filterView .calendar > a, ' +
        '#createViewMenu li.viz a, .filterView .visualization > a, ' +
        '#createViewMenu li.form a, .filterView .newView .form > a', 'click',
        function (event)
        {
            event.preventDefault();
            if ($(this).closest('li').is('.disabled')) { return; }
            $("#modal").jqmShow($(this));
        });

    $('.tempViewTab a.close').click(function (event)
    {
        event.preventDefault();
        $('#dataGrid').datasetGrid().clearTempView(null, true);
    });

    $.live('.filter a.close', 'click', function(event)
    {
        event.preventDefault();
        var $tab = $(event.target).closest('li.filter');
        if ($tab.is('.tempViewTab')) { return; }

        blistGridNS.removeTabCookie($tab.attr('id').split('_')[1]);
        $tab.remove();
        if ($tab.is('.active'))
        { window.location = $('.tabList .main a:first').attr('href'); }
    });

    $('.addColumnsLink, #addColumnsMenu .close').click(function (event)
    {
        event.preventDefault();
        blistGridNS.toggleAddColumns();
    });

    $('#formatLink, #formatMenu .close').click(function (event)
    {
        event.preventDefault();
        blistGridNS.toggleFormatMenu();
    });

    var formatEditor;
    $('#formatLink, #formatMenu a, #formatMenu select').mousedown(function(e)
        { e.stopPropagation(); });
    $('#formatMenu a.toggleButton').click(function(e)
    {
        e.preventDefault();
        var $button = $(this);
        var action = $button.attr('href').split('_')[1];
        if (formatEditor)
        {
            var newVal = !$button.is('.active');
            if (action == 'link')
            {
                if (!newVal) { formatEditor.action('unlink'); }
                else
                {
                    var url = prompt('Enter a URL:');
                    if (url !== null)
                    {
                        if (!url.match(/^(f|ht)tps?:\/\//))
                        { url = "http://" + url; }
                        formatEditor.action('link', url);
                    }
                }
            }
            else { formatEditor.action(action, newVal); }
        }
    });
    $('#formatMenu select').change(function(e)
    {
        var $select = $(this);
        var action = $select.attr('name').split('_')[1];
        var val = $select.val();
        if ($select.is('#format_fontSize'))
        { val = (val / 10.0) + 'em'; }
        if (formatEditor) { formatEditor.action(action, val); }
    });

    $('#formatAlignMenu').dropdownMenu({
        triggerButton: $('#formatMenu a.align'),
        linkCallback: function(event)
        {
            event.preventDefault();

            var $target = $(event.currentTarget);
            var href = $target.attr('href');
            var s = href.slice(href.indexOf('#') + 1).split('_');
            var action = s[1];
            if (formatEditor) { formatEditor.action(action, true); }
        }});

    var $colorItem = $('#formatMenu a.color');
    $colorItem.colorPicker().bind('color_change', function(e, newColor)
    {
        if (formatEditor) { formatEditor.action('color', newColor); }
        $colorItem.children('.inner').css('border-bottom-color', newColor);
    }).mousedown(function(e)
    { $colorItem.data('colorpicker-color',
        $colorItem.find('.inner').css('border-bottom-color')); });
    $('#color_selector').mousedown(function(e) { e.stopPropagation(); })

    $('#dataGrid').bind('action-state-change', function(e)
    {
        formatEditor = $(e.target).blistEditor();
        var $fmt = $('#formatMenu');
        if (!formatEditor.supportsFormatting())
        {
            $fmt.addClass('disabled');
            return;
        }

        $fmt.removeClass('disabled');
        var state = formatEditor.getActionStates();

        var $bold = $fmt.find('a.bold');
        state.bold.value ? $bold.addClass('active') : $bold.removeClass('active');
        var $italic = $fmt.find('a.italic');
        state.italic.value ? $italic.addClass('active') :
            $italic.removeClass('active');
        var $underline = $fmt.find('a.underline');
        state.underline.value ? $underline.addClass('active') :
            $underline.removeClass('active');
        var $strike = $fmt.find('a.strike');
        state.strikethrough.value ? $strike.addClass('active') :
            $strike.removeClass('active');

        var $bulletList = $fmt.find('a.bulletedList');
        state.unorderedList.value ? $bulletList.addClass('active') :
            $bulletList.removeClass('active');
        var $numList = $fmt.find('a.numberedList');
        state.orderedList.value ? $numList.addClass('active') :
            $numList.removeClass('active');

        var $link = $fmt.find('a.link');
        state.unlink.enabled ? $link.addClass('active') :
            $link.removeClass('active');

        var $fontFamily = $fmt.find('#format_fontFamily');
        var family = (state.fontFamily.value || 'arial').toLowerCase();
        // First look for exact match
        var $famOpt = $fontFamily.find('[value="' + family + '"]');
        // If that is not found, look for something that starts with it
        if ($famOpt.length < 1)
        { $famOpt = $fontFamily.find('[value^="' + family + '"]'); }
        // If that is not found, look for something that contains it
        if ($famOpt.length < 1)
        { $famOpt = $fontFamily.find('[value*="' + family + '"]'); }
        if ($famOpt.length > 0) { $fontFamily.val($famOpt.eq(0).val()); }

        var $fontSize = $fmt.find('#format_fontSize');
        var size = state.fontSize.value || '10';
        // Our size may be in ems or pxs; convert as appropriate
        if (size.endsWith('em')) { size = parseFloat(size) * 10; }
        else { size = parseFloat(size); }
        var $sizeOpts = $fontSize.find('option');
        var foundSize = false;
        // Look through all the dropdown options and find which matches best
        for (var i = 0; i < $sizeOpts.length - 1; i++)
        {
            var curVal = parseFloat($sizeOpts.eq(i).val());
            if (curVal >= size)
            {
                $fontSize.val(curVal);
                foundSize = true;
                break;
            }
            var nextVal = parseFloat($sizeOpts.eq(i + 1).val());
            if (nextVal > size)
            {
                if ((nextVal + curVal) / 2.0 > size) { $fontSize.val(curVal); }
                else { $fontSize.val(nextVal); }
                foundSize = true;
                break;
            }
        }
        // If none match, it is large; so choose the last one
        if (!foundSize) { $fontSize.val($sizeOpts.eq($sizeOpts.length - 1).val()); }

        var $color = $fmt.find('a.color .inner');
        // IE7 is very strict in what it accepts for colors, so do a bunch
        // of munging to make it a 6-digit hex string
        var hexColor = state.color.value + '';
        if (!hexColor.startsWith('#') && !hexColor.startsWith('rgb('))
        {
            var hexColor = (parseInt(state.color.value) || 0).toString(16);
            var hexPad = 6 - hexColor.length;
            for (var i = 0; i < hexPad; i ++) { hexColor = '0' + hexColor; }
            hexColor = '#' + hexColor.slice(0, 6);
        }
        $color.css('border-bottom-color', hexColor);

        var $alignment = $fmt.find('a.align').removeClass('alignRight alignCenter');
        if (state.justifyRight.value) { $alignment.addClass('alignRight'); }
        else if (state.justifyCenter.value) { $alignment.addClass('alignCenter'); }
    });

    $('#dataGrid').bind('edit-finished', function(e)
    {
        $('#formatMenu').addClass('disabled')
            .find('.active').removeClass('active')
            .end()
            .find('select').each(function(i, s)
                { $(s).val($(s).find('.default').val()); })
            .end()
            .find('a.align').removeClass('alignRight alignCenter')
            .end()
            .find('a.color .inner').css('border-bottom-color', '#000000');
        formatEditor = null;
    });


    blistGridNS.hookUpMainMenu();

    $('#undoLink').click(function (event)
    {
        event.preventDefault();
        if ($(event.target).closest('li.disabled').length < 1)
        { $('#dataGrid').blistModel().undo(); }
    });
    $('#redoLink').click(function (event)
    {
        event.preventDefault();
        if ($(event.target).closest('li.disabled').length < 1)
        { $('#dataGrid').blistModel().redo(); }
    });
    $('#dataGrid').bind('undo_redo_change', function(e)
    {
        var model = $('#dataGrid').blistModel();
        $('.headerBar li.undoItem').toggleClass('disabled', !model.canUndo());
        $('.headerBar li.redoItem').toggleClass('disabled', !model.canRedo());
    });

    blistGridNS.hookUpFilterViewMenu();
    $('#shareTopMenu').dropdownMenu({triggerButton: $('#shareTopLink'),
        linkCallback: blist.datasetMenu.menuHandler,
        menuBar: $('#lensContainer .headerBar')});

    // Set up the info pane tab switching.
    var paneMatches = window.location.search.match(/metadata_pane=(\w+)/);
    $("#infoPane .summaryTabs").infoPaneNavigate({
        tabMap: {
            "tabSummary" : ".singleInfoSummary",
            "tabFiltered" : ".singleInfoFiltered",
            "tabComments" : ".singleInfoComments",
            "tabSharing" : ".singleInfoSharing",
            "tabPublishing" : ".singleInfoPublishing",
            "tabActivity" : ".singleInfoActivity"
        },
        containerSelector: "#infoPane",
        allPanelsSelector : ".infoContentOuter",
        expandableSelector: ".infoContent",
        // After switching tabs, update the menu and size the Swf.
        switchCompleteCallback: function ($tab)
        {
            blistGridNS.setInfoMenuItem($tab);
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
    var inlineEditArgs = {
        requestUrl: '/views.json',
        requestDataCallback: function($form, name)
        {
            // Get the view with columns
            var view = $('#dataGrid').blistModel().getViewCopy(true);
            view.name = name;
            return $.json.serialize(view);
        },
        requestContentType: 'application/json',
        loginMessage: 'Creating a public filter requires you to have an account. ' +
            'Either sign in or sign up to save your public filter.',
        submitSuccessCallback: blistGridNS.newViewCreated};
    $("#tempInfoPane .inlineEdit").inlineEdit($.extend({
        displaySelector: '.itemContent span',
        editClickSelector: '.itemContent span, .itemActions'}, inlineEditArgs));
    $(".tabList .tempViewTab.inlineEdit").inlineEdit(inlineEditArgs);

    $('.copyCode textarea, .copyCode input').click(function() { $(this).select(); });

    // Wire up attribution edit box
    $('.attributionEdit').attributionEdit();

    blistGridNS.hookUpCreateViewMenu();

    $("#infoPane .singleInfoPublishing").infoPanePublish();

    var commentMatches = window.location.search.match(/comment=(\w+)/);
    $('#infoPane .singleInfoComments').infoPaneComments({
        initialComment: commentMatches && commentMatches.length > 1 ?
            commentMatches[1] : null
    });

    $('#infoPane .singleInfoFiltered').infoPaneFiltered();

    $('#infoPane .singleInfoSharing').infoPaneSharing({
        $publishingPane: $('#infoPane .singleInfoPublishing'),
        $summaryPane: $('#infoPane .singleInfoSummary'),
        summaryUpdateCallback: function()
        {
            $(".infoContent dl.actionList, .infoContentHeader")
                .infoPaneItemHighlight();
            $("#infoPane .editItem").infoPaneItemEdit(
                { submitSuccessCallback: blistGridNS.infoEditCallback });
        }
    });

    $(".favoriteAction a").click( blistGridNS.favoriteActionClick );

    window.onbeforeunload = function ()
    {
        var $grid = $('#dataGrid');
        if (!blistGridNS.isAltView &&
            $grid.length > 0 && $grid.datasetGrid().isTempView)
        {
            return 'You will lose your temporary filter.';
        }
    };
});
