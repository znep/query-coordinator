var myBlistsNS = blist.namespace.fetch('blist.myBlists');

blist.myBlists.ownedByGroupFilterGen = function(group)
{
    return function(view) {
        $.each(group.users, function(i, user) {
            if (user.id == view.owner.id)
                return true;
        });
        return false;
    }
}

blist.myBlists.sharedByGroupFilterGen = function(group)
{
    return function(view) {
        $.each(group.users, function(i, user) {
            if (user.id == view.owner.id && 
                $.inArray("shared", view.flags) != -1)
                return true;
        });
        return false;
    }
}

blist.myBlists.ownedByFilterGen = function(userId)
{
    return function(view) { 
        return view.owner.id == userId;
    };
}

blist.myBlists.sharedToMeFilter = function(view)
{
    return view.owner.id != myBlistsNS.currentUserId &&
        $.inArray("shared", view.flags) != -1;
}

blist.myBlists.sharedToFilterGen = function(userId)
{
    return function(view) {
        $.each(view.grants, function(i, grant) {
            if (grant.userId == userId)
                return true;
        });
        return false;
    };
}

blist.myBlists.sharedWithGroupFilterGen = function(groupId)
{
    return function(view) {
        $.each(view.grants, function(i, grant) {
            if (grant.groupId == groupId) 
                return true;
        });
        return false;
    };
}

blist.myBlists.sharedByFilterGen = function(userId)
{
    return function(view) {
        $.each(view.grants, function(i, grant) {
            if ((grant.flags == undefined || 
                $.inArray("public", grant.flags) == -1) && 
                view.owner.id == userId)
                return true;
        });
        return false;
    };
}

blist.myBlists.defaultFilter = function(view)
{
    if ($.inArray('default', view.flags) != -1)
    {
        return true;
    }
    return false;
}

blist.myBlists.filterFilter = function(view)
{
    if ($.inArray('default', view.flags) == -1)
    {
        return true;
    }
    return false;
}

blist.myBlists.untaggedFilter = function(view)
{
    if (view.tags.length == 0)
    {
        return true;
    }
    return false;
}

blist.myBlists.taggedFilter = function(view)
{
    if (view.tags.length > 0)
    {
        return true;
    }
    return false;
}

blist.myBlists.tagFilterGen = function(tag)
{
    return function(view) {
        $.each(view.tags, function(i, t) {
            if (t.data == tag) return true;
        });
        return false;
    };
}

blist.myBlists.favoriteFilter = function(view)
{
    if ($.inArray('favorite', view.flags) != -1)
    {
        return true;
    }
    return false;
}

blist.myBlists.filterGen = function(type, argument, callback)
{
    switch(type)
    {
        case 'owner': 
            return callback(myBlistsNS.ownedByFilterGen(argument));
        case 'owner_group':
            var filterGenCallback = function(data) {
                var group = $.json.deserialize(data);
                callback(myBlistsNS.ownedByGroupFilterGen(group));
            }
            return $.get("/groups/" + argument + ".json", null, filterGenCallback);
        case 'shared_to':
            var userId = argument;
            if (userId == myBlistsNS.currentUserId)
            {
                return callback(myBlistsNS.sharedToMeFilter);
            }
            else
            {
                return callback(myBlistsNS.sharedToFilterGen(userId));
            }
        case 'shared_by':
            return callback(myBlistsNS.sharedByFilterGen(argument));
        case 'shared_by_group':
            var filterGenCallback = function(data) {
                var group = $.json.deserialize(data);
                callback(myBlistsNS.sharedByGroupFilterGen(group));
            }
            return $.get("/groups/" + argument + ".json", null, filterGenCallback);
        case 'type':
            if (argument == 'filter')
            {
                return callback(myBlistsNS.filterFilter);
            }
            else if (argument == 'favorite')
            {
                return callback(myBlistsNS.favoriteFilter);
            }
            else
            {
                return callback(myBlistsNS.defaultFilter);
            }
        case 'untagged':
            if (argument == 'true')
            {
                return callback(myBlistsNS.untaggedFilter);
            }
            else
            {
                return callback(myBlistsNS.taggedFilter);
            }
        case 'tag':
            return callback(myBlistsNS.tagFilterGen(argument));
    }
}

// The favorite action in the info for single panel - when one blist is selected.
blist.myBlists.favoriteActionClick = function (event)
{
    event.preventDefault();

    var $favLink = $(this);
    var $favContainer = $favLink.closest("li");

    var origHref = $favLink.attr("href");

    $.ajax({
        url: origHref,
        type: "POST",
        success: function(responseText, textStatus)
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


blist.myBlists.renameClick = function (event)
{
    event.preventDefault();
    var $this = $(this);
    
    // Hide all other forms in td.names.
    myBlistsNS.closeRenameForms($this);
    
    $currentCell = $this.closest("tr.item").addClass("highlight").find("td.name");
    $currentCell.find("div").hide();
    var $form = $currentCell.find("form").keyup(function(event)
    {
        if (event.keyCode == 27) myBlistsNS.closeRenameForms($this);
    });
    $form.show().find("input[type='text']").width($form.width() - 30).focus().select();
};

blist.myBlists.closeRenameForms = function($this)
{
    var $allItemRows = $this.closest("table").find("tr.item:not(.selected)").removeClass("highlight");
    var $allNameCells = $this.closest("table").find("td.name");
    $allNameCells.find("form").hide();
    $allNameCells.find("div").show();
};

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
            $form.closest("td.name").find("div").show().find("a").text(responseData.name);
            $form.closest("tr.item").removeClass("highlight");
            
            // Update the info pane.
            $.Tache.DeleteAll();
            $("#infoPane h2.panelHeader a[href*='" + responseData.id + "']").text(responseData.name);
        }
    });
};


var blistsInfoNS = blist.namespace.fetch('blist.myBlists.infoPane');
blist.myBlists.infoPane.updateSummary = function (numSelect)
{
    if (numSelect == 1)
    {
        var $items = $('#blistList').combinationList().selectedItems();
        $.Tache.Get({ url: '/blists/' + $items.attr('blist_id') + '/detail',
            success: blistsInfoNS.updateSummarySuccessHandler
        });
    }
    else
    {
        if (numSelect === undefined || numSelect < 1)
        {
            //numSelect = $('#blistList').combinationList().totalItemCount();
            $('#infoPane .infoContent .selectPrompt').show();
            itemState = 'total';

            $.Tache.Get({ url: '/blists/detail',
                data: 'items=' + myBlistsNS.model.length(),
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

blist.myBlists.itemMenuSetup = function()
{
    $('.blistItemMenu').dropdownMenu({
        menuContainerSelector: "div.blist-list-c0 div",
        triggerButtonSelector: "div.blist-list-c0 a.menuHandle"
    });
};

blist.myBlists.infoPane.updateSummarySuccessHandler = function (data)
{
    // Load the info pane.
    $('#infoPane').html(data);

    // Wire up the hover behavior.
    $(".infoContent dl.actionList").infoPaneItemHighlight();

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

    $(".copyCode textarea").click(function() { $(this).select(); });
    
    $(".favoriteAction a").click( myBlistsNS.favoriteActionClick );

    $('#infoPane .singleInfoComments').infoPaneComments();

    // Force a window resize.
    blist.util.sizing.cachedInfoPaneHeight = $("#infoPane").height();
    blist.common.forceWindowResize();
};

/* Functions for sidebar related to blists */

var blistsBarNS = blist.namespace.fetch('blist.myBlists.sidebar');

blist.myBlists.sidebar.filterCallback = function(fn) 
{
    myBlistsNS.model.filter(fn);
}

blist.myBlists.sidebar.initializeHandlers = function ()
{
    $('#blistFilters').filterList({
            noRequest: true,
            filterClickCallback: function (target)
            {
                var title = target.attr('title');
                if (target.attr('q') != "")
                {
                    var query = $.json.deserialize(target.attr('q').replace(/'/g, '"'));
                    for (var type in query)
                    {
                        myBlistsNS.filterGen(type, query[type], blistsBarNS.filterCallback);
                    }
                }
                else
                {
                    myBlistsNS.model.filter(function() { return true });
                }


                // Set the title to whatever the filter is.
                $('#listTitle').text(title);
                $('#listTitle').attr('title', title);
            }
        });
    $('#blistFilters a:not(.expander, ul.menu a)')
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
};

blist.myBlists.sidebar.filterMenuClickHandler = function (event, $menu,
    $triggerButton)
{
    event.preventDefault();
    var $target = $(event.currentTarget);
    $triggerButton.attr('href', $target.attr('href'))
        .attr('title', $target.attr('title'))
        .attr('q', $target.attr('q'))
        .find('em').text($target.text());
};

/* Custom grid renderers */

blist.myBlists.customDate = function(value, column)
{
    value = new Date(value * 1000);
    var months = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun",
                           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");

    var formatted = months[value.getMonth()] + " " + value.getDate() + ", " +
        value.getFullYear();

    return formatted;
};

blist.myBlists.customFav = function(value, column)
{
    return "\"<div class='blist-favorite blist-favorite-\" + (" +
        value + " ? 'on' : 'off') + \"' title='\" + (" + value +
        " ? 'Remove from favorites' : 'Add to favorites') + \"'></div>\"";
};

blist.myBlists.customDateMeta = function(value, column)
{
    return "blist.myBlists.customDate(" + value + ")";
};

blist.myBlists.customLensOrBlist = function(value, column)
{
    return "\"<div class='blist-type-\" + (" + value +
        " ? 'default': 'filter') + \"'></div>\"";
};

blist.myBlists.customDatasetName = function(value)
{
    return '\'<a href="/\' + $.urlSafe(row.category || "dataset") + \'/\' + \
        $.urlSafe(' + value + ') + \'/\' + row.id + \'" \
        class="clipText dataset-name" title="\' + $.htmlEscape(' + value + ') + \
        \'">\' + $.htmlEscape(' + value + ') + \'</a>\'';
};

blist.myBlists.customClipText = function(value)
{
    return '\'<div class="clipText" title="\' + $.htmlEscape(' + value +
        ' || "") + \
        \'">\' + $.htmlEscape(' + value + ' || "") + \'</div>\'';
};

blist.myBlists.listDropdown = function(div)
{
    $(div.childNodes[0]).dropdownMenu({
        menuContainerSelector: "#" + div.id,
        triggerButtonSelector: "a.menuHandle",
        pullToTop: true
    });
}

blist.myBlists.customHandle = function(value, column) {
    var menu = "<ul class='blistItemMenu menu' id='itemMenu-\"+" + value + "+\"'>" +
        "<li class='open'>" + 
          "<a href='/dataset/foo/\"+" + value + "+\"' title='Open'>" + 
            "<span class='highlight'>Open</span>" + 
          "</a>" +
        "</li>" + 
        "<li class='addFavorite favoriteLink'>" + 
          "<a href='/blists/\"+" + value + "+\"/create_favorite' title='Add to favorites'>" +
            "<span class='highlight'>Add to favorites</span>" +
          "</a>" +
        "</li>" +
        "<li class='rename renameLink'>" +
          "<a href='/dataset/foo/\"+" + value + "+\"' title='Rename'>" +
            "<span class='highlight'>Rename</span>" +
          "</a>" +
        "</li>" +
        "<li class='delete'>" +
          "<a href='#delete' title='Delete'>" +
            "<span class='highlight'>Delete</span>" +
          "</a>" +
        "</li>" +
        "<li class='footer'>" +
          "<div class='outerWrapper'>" +
            "<div class='innerWrapper'/>" +
          "</div>" +
        "</li>" +
      "</ul>";
    return "\"<div onmouseover='blist.myBlists.listDropdown(this)' id='dropdown-\"+" + value + "+\"'><a id='a-\"+" + value + "+\"' class='menuHandle' title='Open menu' href='#open_menu'>Blist Menu</a></div>" + menu + "\"";
};


/* Functions for main blists screen */

blist.myBlists.favoriteClick = function(row)
{
    if (!row.favorite)
    {
        $.post("/blists/" + row.id + "/create_favorite");
    }
    else
    {
        $.post("/blists/" + row.id + "/delete_favorite");
    }
    
    row.favorite = !row.favorite;
    myBlistsNS.model.change([row]);
};

blist.myBlists.listCellClick = function(event, row, column, origEvent) 
{
    switch (column.dataIndex)
    {
        case 'favorite':
            myBlistsNS.favoriteClick(row);
            break;
    }
}

blist.myBlists.translateViewJson = function(views)
{
    for (var i = 0; i < views.length; i++) {
        var view = views[i];
        view.favorite = view.flags && $.inArray("favorite", view.flags) != -1;
        view.isDefault = view.flags && $.inArray("default", view.flags) != -1;
        view.ownerName = view.owner && view.owner.displayName;
        if (!view.updatedAt)
            view.updatedAt = view.createdAt;
    }
    return {rows: views}
}

blist.myBlists.initializeGrid = function()
{
    // Configure the table and retrieve the model
    myBlistsNS.model = $('#blist-list')
        .blistTable(myBlistsNS.options)
        .bind('cellclick', myBlistsNS.listCellClick)
        .blistModel();

    // Configure columns for the view list
    myBlistsNS.model.meta({view: {}, columns: myBlistsNS.columns});

    $('#blist-list').bind('load', function() {
        blistsInfoNS.updateSummary(0);
    });

    // Install a translator that tweaks the view objects so they're more conducive to grid display
    myBlistsNS.model.translate(myBlistsNS.translateViewJson);

    myBlistsNS.model.ajax({url: myBlistsNS.viewUrl, cache: false });
    myBlistsNS.model.sort(6, true);
}

blist.myBlists.columns = [
  { width: 32, dataIndex: 'id', renderer: blist.myBlists.customHandle, sortable: false },
  { cls: 'favorite', name: 'Favorite?', width: 36, dataIndex: 'favorite',
    renderer: blist.myBlists.customFav, sortable: true},
  { cls: 'type', name: 'Type', width: 45, dataIndex: 'isDefault',
    renderer: blist.myBlists.customLensOrBlist, sortable: true },
  { name: 'Name', percentWidth: 20, dataIndex: 'name',
    renderer: blist.myBlists.customDatasetName, group: true, sortable: true },
  { name: 'Description', percentWidth: 40, dataIndex: 'description',
    renderer: blist.myBlists.customClipText, group: true, sortable: true },
  { name: 'Owner', percentWidth: 20, dataIndex: 'ownerName',
    renderer: blist.myBlists.customClipText, group: true, sortable: true},
  { name: 'Last Updated', percentWidth: 20, dataIndex: 'updatedAt',
    group: true, type: 'date', renderer: blist.myBlists.customDateMeta }
];

blist.myBlists.options = {
    cellExpandEnabled: false,
    manualResize: true,
    showRowNumbers: false,
    noExpand: true
};

$(function() {
    blistsBarNS.initializeHandlers();

    // Setup the grid.
    myBlistsNS.initializeGrid();

    // Setup the info pane
    myBlistsNS.itemMenuSetup();
    blistsInfoNS.updateSummary(0);

    /* FIXME Still necessary?
    $("#blistList .renameLink a").click(myBlistsNS.renameClick);
    $("#blistList td.name form").submit(myBlistsNS.renameSubmit);*/

    // Fit everything to the screen properly
    $(window).resize(function (event) 
    {
        commonNS.adjustSize();
        $('#blist-list').trigger('resize');
    });

    commonNS.adjustSize();
    $('#blist-list').trigger('resize');
});
