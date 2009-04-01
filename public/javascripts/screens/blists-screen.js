var myBlistsNS = blist.namespace.fetch('blist.myBlists');

/* Functions for main blists screen */

blist.myBlists.listSelectionHandler = function (event, title)
{
    $('#blistList tbody').hide();
    $('#listTitle').text(title);
};

blist.myBlists.setupTable = function ()
{
    $('#blistList').combinationList({
        initialSort: [[[6, 1]]],
        loadedCallback: function ()
        {
            myBlistsNS.itemMenuSetup();
            $("#blistList a.favoriteMarker, #blistList li.favoriteLink a")
                .click(myBlistsNS.favoriteClick);
            $("#blistList .renameLink a").click(myBlistsNS.renameClick);
            $("#blistList td.name form").submit(myBlistsNS.renameSubmit);
            blistsInfoNS.updateSummary(0);
        },
        searchable: true,
        searchCompleteCallback: function () { blistsInfoNS.updateSummary(0); },
        selectionCallback: function($targetRow, $selectedItems)
        {
            blistsInfoNS.updateSummary($selectedItems.length);

            $("tr.item").not($targetRow).each(function()
            {
                var $nameCell = $(this).find("td.name")
                $nameCell.find("form").hide();
                $nameCell.find("a").show();
            });
        },
        sortHeaders: {0: {sorter: false}, 6: {sorter: "usLongDate"}},
        treeTable: true,
        treeColumn: 3
    });
};

blist.myBlists.favoriteClick = function (event)
{
    event.preventDefault();

    $this = $(this);
    var origHref = $this.attr("href");

    $.ajax({
        url: origHref,
        type: "POST",
        success: function(responseText, textStatus)
        {
            var isCreate = responseText == "created";

            $favContainer = $this.closest("tr.item");
            $favCell = $favContainer.find("td.favorite");
            $favMarker = $favContainer.find("a.favoriteMarker");
            $favLink = $favContainer.find(".blistItemMenu li.addFavorite a");

            // Update the class of the cell.
            $favCell.removeClass(isCreate ? "false" : "true")
                    .addClass(isCreate ? "true" : "false");
            // Update the text of the link.
            $favMarker.text(isCreate ? "favorite" : "");
            $favLink.text(isCreate ? "Remove from favorites" : "Add to favorites");

            // Update the link.
            var newHref = isCreate ?
                origHref.replace("create", "delete") :
                origHref.replace("delete", "create");

            $favLink.attr("href", newHref);
            $favMarker.attr("href", newHref);
        }
    });
}

blist.myBlists.renameClick = function (event)
{
    event.preventDefault();
    var $this = $(this);
    
    // Hide all other forms in td.names.
    var $allItemRows = $this.closest("table").find("tr.item:not(.selected)").removeClass("highlight");
    var $allNameCells = $this.closest("table").find("td.name");
    $allNameCells.find("form").hide();
    $allNameCells.find("a").show();
    
    $currentCell = $this.closest("tr.item").addClass("highlight").find("td.name");
    $currentCell.find("a").hide();
    var $form = $currentCell.find("form");
    $form.show().find("input[type='text']").width($form.width() - 30).focus().select();
}

blist.myBlists.renameSubmit = function (event)
{
    event.preventDefault();

    var $form = $(this);
    var $nameInput = $form.find("input[type='text']");
    var $authInput = $form.find("input[type='hidden']");

    $.ajax({
        url: $form.attr("action"),
        type: "PUT",
        data: {
            "authenticity_token": $authInput.val(),
            "view[name]": $nameInput.val()
        },
        dataType: "json",
        success: function(responseData)
        {
            $form.hide();
            $form.closest("td.name").find("a").text(responseData.name).show();
            $form.closest("tr.item").removeClass("highlight");
            
            // Update the info pane.
            $.Tache.DeleteAll();
            $("#infoPane h2.panelHeader a[href*='" + responseData.id + "']").text(responseData.name);
        }
    });
}


blist.myBlists.itemMenuSetup = function()
{
    $('.blistItemMenu').dropdownMenu({
        menuContainerSelector: "td.handle",
        triggerButtonSelector: "a.dropdownLink"
    });
}

/* Functions for info pane related to blists */

var blistsInfoNS = blist.namespace.fetch('blist.myBlists.infoPane');
blist.myBlists.infoPane.updateSummary = function (numSelect)
{
    if (numSelect == 1)
    {
        var $items = $('#blistList').combinationList().selectedItems();
        $.Tache.Get({ url: '/blists/detail/' + $items.attr('blist_id'),
            success: blistsInfoNS.updateSummarySuccessHandler
        });
    }
    else
    {
        if (numSelect === undefined || numSelect < 1)
        {
            numSelect = $('#blistList').combinationList().totalItemCount();
            $('#infoPane .infoContent .selectPrompt').show();
            itemState = 'total';

            $.Tache.Get({ url: '/blists/detail',
                data: 'items=' + numSelect,
                success: blistsInfoNS.updateSummarySuccessHandler
            });

        }
        else
        {
            var $items = $('#blistList').combinationList().selectedItems();
            var arrMulti = $items.map(function (i, n)
            {
               return $(n).attr('blist_id');
            });
            var multi = $.makeArray(arrMulti).join(':');

            $.Tache.Get({ url: '/blists/detail',
                data: 'multi=' + multi,
                success: blistsInfoNS.updateSummarySuccessHandler
            });
        }
    }
};

blist.myBlists.infoPane.updateSummarySuccessHandler = function (data)
{
    // Load the info pane.
    $('#infoPane').html(data);

    // Wire up the hover behavior.
    $(".infoContent dl.summaryList").infoPaneItemHighlight();

    // Wire up the tab switcher/expander.
    $(".summaryTabs").infoPaneNavigate();
    $("#infoPane .gridList").blistListHoverItems();

    // Wire up a click handler for deselectors.
    $(".action.unselector").click(function (event)
    {
        event.preventDefault();
        var blist_id = $(this).attr("href").replace("#", "");
        $("#blistList tr[blist_id=" + blist_id + "] td.type").trigger("click");
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
    
    $("#infoPane dd.editItem").infoPaneItemEdit({
        submitSuccessCallback: function(fieldType, fieldValue, itemId)
        {
            if (fieldType == "description")
            {
                // Find the blist row, update the description cell.
                $("#blistList tr[blist_id='" + itemId + "']").find("td.description div").text(fieldValue);
            }
        }
    });
    
    // Force a window resize.
    blist.util.sizing.cachedInfoPaneHeight = $("#infoPane").height();
    blist.common.forceWindowResize();
};

/* Functions for sidebar related to blists */

var blistsBarNS = blist.namespace.fetch('blist.myBlists.sidebar');

blist.myBlists.sidebar.initializeHandlers = function ()
{
    $('#blistFilters a:not(.expander, ul.menu a)')
        .click(blistsBarNS.filterClickHandler)
        .each(function ()
        {
            $(this).siblings('ul.menu').dropdownMenu({triggerButton: $(this),
                pullToTop: true,
                linkCallback: blistsBarNS.filterMenuClickHandler,
                openTest: function (event, $menu)
                {
                    return $(event.target).is('em');
                }});
        });
    $('#blistFilters a.expander').click(blistsBarNS.toggleSection);
};

blist.myBlists.sidebar.filterClickHandler = function (event)
{
    event.preventDefault();
    var $target = $(event.currentTarget);
    if ($(event.target).is('em'))
    {
        $target.siblings('ul.menu').css('left',
            $(event.target).position().left + 'px');
        return;
    }

    $target.trigger(blist.events.LIST_SELECTION, [$target.attr('title')]);
    $.Tache.Get({ url: $target.attr('href'),
            success: function (retData)
            {
                $('#blistList').combinationList().updateList(retData);
            }});
};

blist.myBlists.sidebar.toggleSection = function (event)
{
    event.preventDefault();
    $(event.target).parent(".expandableContainer").toggleClass('closed');
};

blist.myBlists.sidebar.filterMenuClickHandler = function (event, $menu,
    $triggerButton)
{
    event.preventDefault();
    var $target = $(event.currentTarget);
    $triggerButton.attr('href', $target.attr('href'))
        .attr('title', $target.attr('title'))
        .find('em').text($target.text());
};



/* Initial start-up calls, and setting up bindings */

$(function ()
{
    myBlistsNS.setupTable();
    blistsBarNS.initializeHandlers();

    $(window).resize(function (event) 
    {
        commonNS.adjustSize();
    });
    commonNS.adjustSize();

    $('#outerContainer').bind(blist.events.LIST_SELECTION,
        myBlistsNS.listSelectionHandler);

    $(".expandContainer").blistPanelExpander({
        expandCompleteCallback: blistsInfoNS.updateSummary
    });
});

