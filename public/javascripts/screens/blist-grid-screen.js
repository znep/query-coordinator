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
            { return v.id == blistGridNS.viewId ; }).length < 1)
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
        if (i % 2 === 0)
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
        case 'column_totals':
            event.preventDefault();
            break;
        case 'aggregate':
            event.preventDefault();
            if (href_parts.length == 3)
            {
                if (blist.util.flashInterface.swf() != undefined)
                {
                    blist.util.flashInterface.columnAggregate(href_parts[1],
                            href_parts[2]);
                }
                else
                {
                    $('#readGrid').datasetGrid().setColumnAggregate(href_parts[1],
                            href_parts[2]);
                }
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
            $('#swfWrapper').css('bottom', 0);
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
    $('#formatMenu').removeClass('shown');
    blist.common.forceWindowResize();
};

blist.blistGrid.toggleFormatMenu = function ()
{
    $('#formatMenu').toggleClass('shown');
    $('#addColumnMenu').removeClass('shown');
    blist.common.forceWindowResize();
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
    // Note -- commented lines are full jQuerified equivalents and are sloooow

    //var $data = $(data);
    var $menus = $(data).children();

    // Swap out the main menu with whatever was loaded
    //$('#mainMenu').replaceWith($data.filter("#mainMenuComponent"));
    var $menu = $("#mainMenu");
    var $container = $menu.parent();
    $container[0].removeChild($menu[0]);
    $container[0].appendChild($menus[0]);

    // Swap out the filter & view menu with whatever was loaded
    //$('#filterViewMenu').replaceWith($data.filter("#filterViewMenuComponent"));
    $menu = $("#filterViewMenu");
    $container = $menu.parent();
    $container[0].removeChild($menu[0]);
    $container[0].appendChild($menus[1]);

    blistGridNS.hookUpMainMenu();
    blistGridNS.hookUpFilterViewMenu();
};

blist.blistGrid.hookUpFilterViewMenu = function()
{
    $('#filterViewMenu').dropdownMenu({triggerButton: $('#filterLink'),
        linkCallback: blistGridNS.menuHandler,
        menuBar: $('#lensContainer .headerBar')});

    $("#filterViewMenu .columnsMenu").scrollable();
};

blist.blistGrid.hookUpMainMenu = function()
{
    $('#mainMenu').dropdownMenu({triggerButton: $('#mainMenuLink'),
            menuBar: $('#lensContainer .headerBar'),
            linkCallback: blistGridNS.menuHandler});
    $('#mainMenu .columnsMenu').scrollable();
    $('#mainMenu .columnsMenu a').click(function (event)
    {
        blistGridNS.columnClickHandler(event);
    });
    blistGridNS.setInfoMenuItem($('#infoPane .summaryTabs li.active'));
};

blist.blistGrid.menuHandler = function(event)
{
    var $target = $(event.currentTarget);
    var href = $target.attr('href');
    if (href.indexOf('#') < 0)
    {
        return;
    }

    var s = href.slice(href.indexOf('#') + 1).split('_');
    var action = s[0];
    var actionId = s[1];

    event.preventDefault();
    switch (action)
    {
        case 'picklistBrowser':
            blist.util.flashInterface.showPopup('PickListBrowser');
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
        case 'addColumn':
            var i = actionId == 'first' ? 0 : -1;
            blist.util.flashInterface.addColumn('plainText', i);
            break;
        case 'publish':
            $("#infoPane .summaryTabs").infoPaneNavigate()
                .activateTab('#tabPublishing');
            break;
        case 'infoPane':
            $("#infoPane .summaryTabs").infoPaneNavigate()
                .activateTab("#" + actionId);
            break;
        case 'filterShow':
            blist.util.flashInterface.showPopup('LensBuilder:Filter');
            break;
        case 'hide-show-col':
            var $li = $target.closest('li');
            $('#readGrid').datasetGrid().showHideColumns(actionId,
                $li.hasClass('checked'));
            break;
        case 'show-rowTags':
            if (blist.util.flashInterface.swf() !== undefined)
            { blist.util.flashInterface.addColumn('rowTag'); }
            else
            {
                $.each($('#readGrid').blistModel().meta().view.columns,
                    function(i, col)
                    {
                        if (col.dataType && col.dataType.type == 'tag')
                        {
                            $('#readGrid').datasetGrid().showHideColumns(col.id,
                                false);
                            return false;
                        }
                    });
            }
            break;
        case 'makePermissionPublic':
          $.ajax({
            url: "/views/" + actionId,
            cache: false,
            data: {
              'method': 'setPermission',
              'value': 'public'
            },
            success: function (responseData) {
              alert("Your dataset is now publicly viewable.");
            },
            error: function (request, textStatus, errorThrown)
            {
              alert("An error occurred while changing your dataset permissions. Please try again later");
            }
          });
          break;
        case 'makePermissionPrivate':
          $.ajax({
            url: "/views/" + actionId,
            cache: false,
            data: {
              'method': 'setPermission',
              'value': 'private'
            },
            success: function (responseData)
            {
              alert("Your dataset is now viewable to only the dataset owner and any sharees.");
            },
            error: function (request, textStatus, errorThrown)
            {
              alert("An error occurred while changing your dataset permissions. Please try again later");
            }
          });
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

blist.blistGrid.newViewCreated = function($iEdit, responseData)
{
    if (!blist.widgets.visualization.isVisualization)
    {
        $('#readGrid').datasetGrid().isTempView = false;
    }
    blist.util.navigation.redirectToView(responseData.id);
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
    if (blistGridNS.viewId)
    {
        if (!blist.widgets.visualization.isVisualization)
        {
            $('#readGrid').datasetGrid({viewId: blistGridNS.viewId,
                columnPropertiesEnabled: blistGridNS.isOwner,
                showAddColumns: blistGridNS.canAddColumns,
                currentUserId: blist.currentUserId,
                accessType: 'WEBSITE', manualResize: true, showRowHandle: true,
                clearTempViewCallback: blistGridNS.clearTempViewTab,
                setTempViewCallback: blistGridNS.setTempViewTab,
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
    $('#infoPane').show();
    commonNS.adjustSize();
    $('#readGrid').trigger('resize');

    $('.tabList .newViewLink a').click(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.showPopup('SaveLens');
    });

    $("#throbber").hide();
    $('a#notifyAll').live("click", function(event)
    {
        event.preventDefault();
        $("#throbber").show();
        $.post($(this).closest("form").attr("action"), null, function(data, textStatus) {
            $("#throbber").hide();
        });
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
    $colorItem
        .ColorPicker({
            color: '#000000',
            onBeforeShow: function()
            {
                $(this).ColorPickerSetColor(
                    $colorItem.children('.inner').css('border-bottom-color'));
            },
            onSubmit: function(hsb, hex, rgb, el)
            {
                if (formatEditor) { formatEditor.action('color', hex); }
                $colorItem.children('.inner').css('border-bottom-color', '#' + hex);
                $(el).ColorPickerHide();
            }
        });
    $('.colorpicker').mousedown(function(e) { e.stopPropagation(); })

    $('#readGrid').bind('action-state-change', function(e)
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
        var size = state.fontSize.value || '12';
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
        $color.css('border-bottom-color', state.color.value || '#000000');

        var $alignment = $fmt.find('a.align').removeClass('alignRight alignCenter');
        if (state.justifyRight.value) { $alignment.addClass('alignRight'); }
        else if (state.justifyCenter.value) { $alignment.addClass('alignCenter'); }
    });

    $('#readGrid').bind('edit-finished', function(e)
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
    blistGridNS.hookUpFilterViewMenu();
    $('#shareTopMenu').dropdownMenu({triggerButton: $('#shareTopLink'),
        menuBar: $('#lensContainer .headerBar')});
    $('#shareInfoMenu').dropdownMenu({triggerButton: $('#shareInfoLink'),
        forcePosition: true, closeOnResize: true});

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
    var inlineEditArgs = {
        requestUrl: '/views.json',
        requestDataCallback: function($form, name)
        {
            // Get the view with columns
            var view = $('#readGrid').datasetGrid().getViewCopy(true);
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

    $("#infoPane .singleInfoPublishing").infoPanePublish();

    $('.switchPermsLink').live("click", function (event)
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
        $('.singleInfoPublishing .infoContent > .hide').removeClass('hide');
        if (newState == 'private')
        {
            $('.singleInfoPublishing .publishContent').addClass('hide');
        }
        else
        {
            $('.singleInfoPublishing .publishWarning').addClass('hide');
        }
    });

    // Share deleting
    $(".shareDelete").live("click", function(event)
    {
        event.preventDefault();

        var $link = $(this);
        var viewId = $link.closest("table").attr("id").split("_")[1];
        $.getJSON($link.attr("href"),
            function(data) {
                // Replace the delete X with a throbber.
                $link.closest(".cellInner").html(
                    $("<img src=\"/images/throbber.gif\" width=\"16\" height=\"16\" alt=\"Deleting...\" />")
                );

                blist.meta.updateMeta("sharing", viewId,
                    function() { $("#throbber").hide(); },
                    function() { $("#infoPane .gridList").blistListHoverItems(); }
                );
                blist.meta.updateMeta("summary", viewId,
                    function() {},
                    function() {
                      $(".infoContent dl.actionList, .infoContentHeader").infoPaneItemHighlight();
                      $("#infoPane .editItem").infoPaneItemEdit({
                            submitSuccessCallback: blistGridNS.infoEditCallback
                        });
                    }
                );
            }
        );
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
        var $grid = $('#readGrid');
        if (!blist.widgets.visualization.isVisualization &&
            $grid.length > 0 && $grid.datasetGrid().isTempView)
        {
            return 'You will lose your temporary filter.';
        }
    };
});
