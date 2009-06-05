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

blist.blistGrid.jsGridFilter = function (e)
{
    var $readGrid = $('#readGrid');
    if ($readGrid.length > 0)
    {
        setTimeout(function ()
        {
            var searchText = $(e.currentTarget).val();
            blistGridNS.summaryStale = true;
            $readGrid.blistModel().filter(searchText, 250);
            if (!searchText || searchText == '')
            {
                $('#lensContainer .headerBar form .clearSearch').hide();
            }
            else
            {
                $('#lensContainer .headerBar form .clearSearch').show();
            }
        }, 10);
    }
};

blist.blistGrid.jsGridClearFilter = function(e)
{
    e.preventDefault();
    $('#lensContainer .headerBar form input[type=text]').val('').blur();
    blistGridNS.summaryStale = true;
    $('#readGrid').blistModel().filter('');
    $(e.currentTarget).hide();
};


/* Callback when rendering the grid headers.  Set up column on-object menus */
blist.blistGrid.headerMods = function(col)
{
    // We support sort & filter, so if neither is available, don't show a menu
    if (blist.data.types[col.type].sortable ||
        blist.data.types[col.type].filterable)
    {
        var $col = $(col.dom);
        var htmlStr =
            '<a class="menuLink" href="#column-menu_' +
                col.index + '"></a>\
            <ul class="menu columnHeaderMenu">';
        if (blist.data.types[col.type].sortable)
        {
            htmlStr +=
                '<li class="sortAsc">\
                    <a href="#column-sort-asc_' + col.index + '">\
                        <span class="highlight">Sort Ascending</span>\
                    </a>\
                </li>\
                <li class="sortDesc">\
                    <a href="#column-sort-desc_' + col.index + '">\
                        <span class="highlight">Sort Descending</span>\
                    </a>\
                </li>';
        }
        htmlStr +=
            '<li class="footer"><div class="outerWrapper">\
                <div class="innerWrapper"><span class="colorWrapper">\
                </span></div>\
            </div></li>\
        </ul>';
        $col.append(htmlStr);
        blistGridNS.hookUpHeaderMenu($col);
        blistGridNS.addFilterMenu(col);
    }
};

/* Hook up JS behavior for menu.  This is safe to be applied multiple times */
blist.blistGrid.hookUpHeaderMenu = function($colHeader)
{
    $colHeader.children('ul.columnHeaderMenu')
        .dropdownMenu({triggerButton: $colHeader.find('a.menuLink'),
                linkCallback: blistGridNS.columnHeaderMenuHandler,
                forcePosition: true, pullToTop: true})
        .find('.autofilter ul.menu').scrollable();
};

/* Add auto-filter sub-menu for a particular column that we get from the JS grid */
blist.blistGrid.addFilterMenu = function(col)
{
    // Make sure this column is filterable, and we have data for it
    if (blistGridNS.columnSummaries == null ||
        !blist.data.types[col.type].filterable)
    {
        return;
    }
    var colSum = blistGridNS.columnSummaries[col.id];
    if (colSum == null)
    {
        return;
    }

    // Get the current filter for this column (if it exists)
    var colFilters = $('#readGrid').blistModel().meta().columnFilters;
    var cf;
    if (colFilters)
    {
        cf = colFilters[col.dataIndex];
    }

    // Remove the old filter menu if necessary
    var $menu = $('ul.columnHeaderMenu', col.dom);
    $menu.children('.autofilter').prev('.separator').andSelf().remove();
    if (cf == null && (colSum.topFrequencies == null ||
        colSum.topFrequencies.length < 1))
    {
        return;
    }

    var filterStr =
            '<li class="autofilter submenu">\
                <a href="#"><span class="highlight">Filter This Column</span></a>\
                <ul class="menu optionMenu">';
    // If we already have a filter for this column, give them a clear link
    if (cf != null)
    {
        filterStr +=
            '<li class="clearFilter">\
                <a href="#clear-filter-column_' + col.index + '">\
                    <span class="highlight">Clear Column Filter</span>\
                </a>\
            </li>';
    }
    // Previous button for scrolling
    filterStr +=
            '<li class="button prev"><a href="#prev" title="Previous">\
                <div class="outerWrapper"><div class="midWrapper">\
                    <span class="innerWrapper">Previous</span>\
                </div></div>\
            </a></li>';
    // Add an option for each filter item
    $.each(colSum.topFrequencies, function (i, f)
    {
        var isMatching = cf != null && cf.value == f.value;
        var curType = blist.data.types[col.type] || blist.data.types['text'];
        var escapedValue = curType.filterValue != null ?
            curType.filterValue(f.value, col) : $.htmlStrip(f.value);
        var renderedValue = curType.filterRender != null ?
            curType.filterRender(f.value, col) : '';
        filterStr +=
            '<li class="filterItem' + (isMatching ? ' active' : '') +
                ' scrollable">\
                <a href="' +
                    (isMatching ? '#clear-filter-column_' : '#filter-column_') +
                    col.index + '_' + escapedValue + '" title="' +
                    $.htmlStrip(renderedValue) + '" class="clipText">' +
                    renderedValue +
                '</a>\
            </li>';
    });
    // Next button for scrolling & menu footer
    filterStr +=
            '<li class="button next"><a href="#next" title="Next">\
                <div class="outerWrapper"><div class="midWrapper">\
                    <span class="innerWrapper">Next</span>\
                </div></div>\
            </a></li>\
            <li class="footer"><div class="outerWrapper">\
                <div class="innerWrapper"><span class="colorWrapper"></span></div>\
            </div></li>\
        </ul>\
    </li>';
    // Find the correct spot to add it; either after sort descending, or the top
    var $sortItem = $menu.find('li.sortDesc');
    if ($sortItem.length > 0)
    {
        filterStr = '<li class="separator" />' + filterStr;
        $sortItem.after(filterStr);
    }
    else
    {
        $menu.prepend(filterStr);
    }
    blistGridNS.hookUpHeaderMenu($(col.dom));
};

/* Handle clicks in the column header menus */
blist.blistGrid.columnHeaderMenuHandler = function(event)
{
    event.preventDefault();
    // Href that we care about starts with # and parts are separated with _
    // IE sticks the full thing, so slice everything up to #
    var href = $(event.currentTarget).attr('href');
    var s = href.slice(href.indexOf('#') + 1).split('_');
    if (s.length < 2)
    {
        return;
    }

    var action = s[0];
    var colIndex = s[1];
    var model = $('#readGrid').blistModel();
    switch (action)
    {
        case 'column-sort-asc':
            model.sort(colIndex, false);
            break;
        case 'column-sort-desc':
            model.sort(colIndex, true);
            break;
        case 'filter-column':
            blistGridNS.summaryStale = true;
            // Rejoin remainder of parts in case the filter value had _
            model.filterColumn(colIndex, $.htmlUnescape(s.slice(2).join('_')));
            blistGridNS.setTempView(model.meta().view);
            break;
        case 'clear-filter-column':
            blistGridNS.summaryStale = true;
            model.clearColumnFilter(colIndex);
            blistGridNS.clearTempView();
            break;
    }
    // Update the grid header to reflect updated sorting, filtering
    $('#readGrid').trigger('header_change', [model]);
};

blist.blistGrid.filterCount = 0;
blist.blistGrid.isTempView = false;

blist.blistGrid.setTempView = function(tempView)
{
    blistGridNS.filterCount++;
    if (blistGridNS.isTempView)
    {
        return;
    }

    $('.tabList .active').addClass('origView').removeClass('active');
    $('.tabList .filter.tempViewTab').addClass('active').show();
    $('#infoPane').hide();
    $('.headerBar li:has(#mainMenuLink)').hide();
    $('#tempInfoPane').show();
    $('form.tempView input[name="view[viewFilters]"]')
        .val($.json.serialize(tempView.viewFilters));
    blistGridNS.isTempView = true;
};

blist.blistGrid.clearTempView = function()
{
    blistGridNS.filterCount--;
    if (blistGridNS.filterCount > 0)
    {
        return;
    }

    $('.tabList .filter.tempViewTab').removeClass('active').hide();
    $('.tabList .origView').addClass('active').removeClass('origView');
    $('#infoPane').show();
    $('.headerBar li:has(#mainMenuLink)').show();
    $('#tempInfoPane').hide();
    blistGridNS.isTempView = false;
};

blist.blistGrid.newViewCreated = function($iEdit, responseData)
{
    blistGridNS.isTempView = false;
    window.location = responseData.url;
};

/* Update the column summary data as appropriate via Ajax */
blist.blistGrid.reloadSummary = function ()
{
    if (!blistGridNS.summaryStale)
    {
        return;
    }

    var modView = $(this).blistModel().meta().view;
    // Set up the current view to send to the server to get the appropriate
    //  summary data back
    var tempView = $.extend({}, modView,
            {originalViewId: modView.id, columns: null});
    $.ajax({url: '/views/INLINE/rows.json?method=getSummary',
            dataType: 'json',
            cache: false,
            type: 'POST',
            contentType: 'application/json',
            data: $.json.serialize(tempView),
            success: function (data)
            {
                // On success, hash the summaries by column ID (they come
                //  in an array)
                blistGridNS.summaryStale = false;
                blistGridNS.columnSummaries = {};
                $.each(data.columnSummaries, function (i, s)
                {
                    blistGridNS.columnSummaries[s.columnId] = s;
                });
                // Then update the column header menus
                $('#readGrid ul.columnHeaderMenu').each(function ()
                {
                    var col = $(this)
                        .closest('.blist-th').data('column');
                    blistGridNS.addFilterMenu(col);
                });
            }
    });
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


// This keeps track of when the column summary data is stale and needs to be
// refreshed
blist.blistGrid.summaryStale = true;


blist.blistGrid.infoEditCallback = function(fieldType, fieldValue, itemId)
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
        // Hook up the JS grid:
        // * Reload column summaries when loading new rows
        // * The main JS grid: headerMods hooks up the column menus
        // * blistModel: disable minimum characters for full-text search,
        //     enable progressive loading of data, and hook up Ajax info
        $('#readGrid')
            .bind('after_load', blistGridNS.reloadSummary)
            .blistTable({generateHeights: false,
                headerMods: blistGridNS.headerMods,
                manualResize: true, showGhostColumn: true, showTitle: false})
            .blistModel()
            .options({filterMinChars: 0, progressiveLoading: true})
            .ajax({url: '/views/' + blistGridNS.viewId + '/rows.json',
                cache: false, data: {accessType: 'WEBSITE'},
                dataType: 'json'});
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
        blist.util.flashInterface.lensSearch(
            $(event.currentTarget).find('input[type="text"]').val());
    });

    $('#lensContainer .headerBar form input[type=text]')
        .keydown(blistGridNS.jsGridFilter);
    $('#lensContainer .headerBar form .clearSearch')
        .click(function (e)
        {
            blist.util.flashInterface.lensSearch('');
            blistGridNS.jsGridClearFilter(e);
        }).hide();

    blistGridNS.hookUpMainMenu();
    $('#filterViewMenu').dropdownMenu({triggerButton: $('#filterLink'),
        menuBar: $('#lensContainer .headerBar')});
    $('#displayMenu').dropdownMenu({triggerButton: $('#displayLink'),
        menuBar: $('#lensContainer .headerBar')});

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

    $(".copyCode textarea, .copyCode input").click(function() { $(this).select(); });

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

            var capState = newState.charAt(0).toUpperCase() +
                newState.substring(1);

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
        });

    var commentMatches = window.location.search.match(/comment=(\w+)/);
    $('#infoPane .singleInfoComments').infoPaneComments({
        initialComment: commentMatches && commentMatches.length > 1 ?
            commentMatches[1] : null
    });

    $('#editLink').click(function (e)
    {
        e.preventDefault();
        $('#lensBody').addClass('editMode').removeClass('readMode');
        $('#readGrid').remove();
        loadSWF();
        blistGridNS.sizeSwf();
    });
    if ($('#lensBody').hasClass('editMode'))
    {
        $('#readGrid').remove();
        loadSWF();
        blistGridNS.sizeSwf();
    }

    $(".favoriteAction a").click( blistGridNS.favoriteActionClick );

    window.onbeforeunload = function ()
    {
        if (blistGridNS.isTempView)
        {
            return 'You will lose your temporary filter.';
        }
    };
});
