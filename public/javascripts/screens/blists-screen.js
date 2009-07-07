var myBlistsNS = blist.namespace.fetch('blist.myBlists');

blist.myBlists.ownedByGroupFilterGen = function(group)
{
    return function(view) {
        for (var i=0; i < group.users.length; i++)
        {
            var user = group.users[i];
            if (user.id == view.owner.id)
                return true;
        }
        return false;
    }
};

blist.myBlists.sharedByGroupFilterGen = function(group)
{
    return function(view) {
        for (var i=0; i < group.users; i++)
        {
            var user = group.users[i];
            if (user.id == view.owner.id && 
                $.inArray("shared", view.flags) != -1)
                return true;
        }
        return false;
    }
};

blist.myBlists.ownedByFilterGen = function(userId)
{
    return function(view) {
        return view.owner.id == userId;
    };
};

blist.myBlists.sharedToMeFilter = function(view)
{
    return view.owner.id != myBlistsNS.currentUserId &&
        $.inArray("shared", view.flags) != -1;
};

blist.myBlists.sharedToFilterGen = function(userId)
{
    return function(view) {
        for (var i=0; i < view.grants.length; i++)
        {
            var grant = view.grants[i];
            if (grant.userId == userId)
                return true;
        }
        return false;
    };
};

blist.myBlists.sharedWithGroupFilterGen = function(groupId)
{
    return function(view) {
        for (var i=0; i < view.grants.length; i++)
        {
            var grant = view.grants[i];
            if (grant.groupId == groupId) 
                return true;
        }
        return false;
    };
};

blist.myBlists.sharedByFilterGen = function(userId)
{
    return function(view)
    {
        if (!view.grants)
        {
            return false;
        }
        for (var i=0; i < view.grants.length; i++)
        {
            var grant = view.grants[i];
            if (grant.flags != undefined)
            {
                for (var j=0; j < grant.flags.length; j++)
                {
                    var flag = grant.flags[j];
                    if (flag != "public" && view.owner.id == userId)
                    {
                        return true;
                    }
                }
            }
            else
            {
                if (view.owner.id == userId)
                {
                    return true;
                }
            }
        }
        return false;
    };
};

blist.myBlists.defaultFilter = function(view)
{
    if ($.inArray('default', view.flags) != -1)
    {
        return true;
    }
    return false;
};

blist.myBlists.filterFilter = function(view)
{
    if (!view.flags || $.inArray('default', view.flags) == -1)
    {
        return true;
    }
    return false;
};

blist.myBlists.untaggedFilter = function(view)
{
    if (view.tags.length == 0)
    {
        return true;
    }
    return false;
};

blist.myBlists.taggedFilter = function(view)
{
    if (view.tags.length > 0)
    {
        return true;
    }
    return false;
};

blist.myBlists.tagFilterGen = function(tag)
{
    return function(view) {
        for (var i=0; i < view.tags.length; i++)
        {
            var t = view.tags[i];
            if (t == tag) return true;
        }
        return false;
    };
};

blist.myBlists.favoriteFilter = function(view)
{
    if ($.inArray('favorite', view.flags) != -1)
    {
        return true;
    }
    return false;
};

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
};

blist.myBlists.renameClick = function (event)
{
    event.preventDefault();

    var rowId = $(this).closest(".blistItemMenu")
        .attr("id").replace("itemMenu-", "");
    var $currentCell = $("#name-cell-" + rowId).parent();

    // Hide all other forms in td.names.
    myBlistsNS.closeRenameForms();

    $currentCell.closest(".blist-tr").addClass("highlight");

    $currentCell.find("div").hide();

    // Close the form on pressing escape
    var $form = $currentCell.find("form").keyup(function(event)
    {
        if (event.keyCode == 27) myBlistsNS.closeRenameForms();
    });
    $form.show().find(":text").width($form.width() - 20).focus().select();
};

blist.myBlists.closeRenameForms = function()
{
    var $this = $("#blist-list");
    var $allNameCells = $this.find("div.blist-td.blist-list-c3");
    $allNameCells.closest(".blist-tr").removeClass("highlight");
    $allNameCells.find("form").hide();
    $allNameCells.find("div").show();
};

blist.myBlists.renameSubmit = function(event)
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
            var row = myBlistsNS.model.getByID(responseData.id);
            row.name = responseData.name;
            myBlistsNS.model.change([row]);

            // Update the info pane.
            $.Tache.DeleteAll();
            $("#infoPane h2.panelHeader a[href*='" + responseData.id + "']")
                .text(responseData.name);
        }
    });
};


var blistsInfoNS = blist.namespace.fetch('blist.myBlists.infoPane');
blist.myBlists.infoPane.updateSummary = function ()
{
    var selectedItems = [];
    $.each(myBlistsNS.model.selectedRows, function (id, index)
    {
        selectedItems.push(id);
    });

    if (selectedItems.length == 1)
    {
        $.Tache.Get({ url: '/blists/' + selectedItems[0] + '/detail',
            success: blistsInfoNS.updateSummarySuccessHandler
        });
    }
    else
    {
        if (selectedItems.length < 1)
        {
            $('#infoPane .infoContent .selectPrompt').show();
            itemState = 'total';

            $.Tache.Get({ url: '/blists/detail',
                data: 'items=' + myBlistsNS.model.dataLength(),
                success: blistsInfoNS.updateSummarySuccessHandler
            });

        }
        else
        {
            var multi = selectedItems.join(':');
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
    $(".infoContent dl.actionList, .infoContentHeader").infoPaneItemHighlight();

    // Wire up the tab switcher/expander.
    $(".summaryTabs").infoPaneNavigate();
    $("#infoPane .gridList").blistListHoverItems();

    // Wire up a click handler for deselectors.
    $(".action.unselector").click(function (event)
    {
        event.preventDefault();
        var rowId = $(this).attr("href").replace("#", "");
        var row = myBlistsNS.model.getByID(rowId);
        myBlistsNS.model.unselectRow(row);
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

    $("#infoPane .editItem").infoPaneItemEdit({
        submitSuccessCallback: function(fieldType, fieldValue, itemId, responseData)
        {
            if (fieldType == "description" || fieldType == "name")
            {
                var row = myBlistsNS.model.getByID(itemId);
                row[fieldType] = fieldValue;
                myBlistsNS.model.change([row]);
            }
            if (fieldType == 'name')
            {
                // Update in filtered view list
                $('.singleInfoFiltered .gridList #filter-row_' + itemId +
                    ' .name a').text(fieldValue);
            }
            if (fieldType == "licenseId")
            {
                if (responseData['license'])
                {
                    if (responseData['license']['logoUrl'])
                    {
                        $('.infoLicensing span')
                            .empty()
                            .append(
                                $('<a/>')
                                    .attr('href', responseData['license']['termsLink'])
                                    .append(
                                        $('<img/>')
                                            .attr('src', '/' + responseData['license']['logoUrl'])
                                            .attr('alt', responseData['license']['name'])));
                    }
                    else
                    {
                        $('.infoLicensing span')
                            .empty()
                            .text(responseData['license']['name']);
                    }
                }
            }
            if (fieldType == "attributionLink")
            {
                $('.infoAttributionLink span')
                    .empty()
                    .append(
                        $('<a/>')
                            .attr('href', fieldValue)
                            .text(fieldValue));
            }

            // If anything in the info pane is changed, make sure it reloads
            $.Tache.DeleteAll();
        }
    });
	
	$('#shareInfoMenu').dropdownMenu({triggerButton: $('#shareInfoLink'),
		forcePosition: true, closeOnResize: true});

    $('.copyCode textarea, .copyCode input').click(function() { $(this).select(); });
    
    // Creative Commons cascading dropdown
    if ($("#view_licenseId").val() == "CC")
    {
        $('#license_cc_type').show();
        $('#view_licenseId').attr('name', '');
        $('#license_cc_type').attr('name', 'view[licenseId]');
    }
    
    $('#view_licenseId').change(function()
    {
        if ($("#view_licenseId").val() == "CC")
        {
            $('#license_cc_type').show();
            $('#view_licenseId').attr('name', '');
            $('#license_cc_type').attr('name', 'view[licenseId]');
        }
        else
        {
            $('#license_cc_type').hide();
            $('#view_licenseId').attr('name', 'view[licenseId]');
            $('#license_cc_type').attr('name', '');
        }
    });

    // Attribution Link URL validation
    $('.infoAttributionLink form').validate({
        rules: {
            "view[attributionLink]": "url"
        },
        messages: {
            "view[attributionLink]": "That does not appear to be a valid url."
        }
    });

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

    $(".favoriteAction a").click(function(event) {
        event.preventDefault();

        var rowId = $(this).attr("id").replace("info-fav-","");
        var row = myBlistsNS.model.getByID(rowId);
        myBlistsNS.favoriteClick(row);

        var $favLink = $(this);
        var $favContainer = $favLink.closest("li");

        $favContainer.removeClass(row.favorite ? "false" : "true")
                     .addClass(row.favorite ? "true" : "false");

        // Update the text of the link.
        var linkText = row.favorite ? "Remove from favorites" : "Add to favorites";
        $favLink.text(linkText);
        $favLink.attr("title", linkText);

    });

    $('#infoPane .singleInfoComments').infoPaneComments();

    // Force a window resize.
    blist.util.sizing.cachedInfoPaneHeight = $("#infoPane").height();
    blist.common.forceWindowResize();
};

/* Functions for sidebar related to blists */

var blistsBarNS = blist.namespace.fetch('blist.myBlists.sidebar');

blist.myBlists.sidebar.defaultFilter = function() { return true; };
blist.myBlists.sidebar.filterCallback = function(fn)
{
    myBlistsNS.model.filter(fn);
};

blist.myBlists.sidebar.initializeHandlers = function ()
{
    $('#blistFilters').filterList({
            noRequest: true,
            filterClickCallback: function (target)
            {
                var title = target.attr('title');
                if (target.attr('q') != "" && target.attr('q') != "{}")
                {
                    var query = $.json.deserialize(target.attr('q').replace(/'/g, '"'));
                    for (var type in query)
                    {
                        myBlistsNS.filterGen(type, query[type], blistsBarNS.filterCallback);
                    }
                }
                else
                {
                    myBlistsNS.model.filter(blist.myBlists.sidebar.defaultFilter);
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

blist.myBlists.getTypeClassName = function(value)
{
    var cls = "";

    if (myBlistsNS.filterFilter(value))
    {
        cls += "filter";
    }
    else
    {
        cls += "default";
    }

    if (myBlistsNS.sharedToMeFilter(value))
    {
        cls += "SharedTo";
    }
    else if (myBlistsNS.sharedByFilterGen(myBlistsNS.currentUserId)(value))
    {
        // Shared by me.
        cls += "SharedBy";
    }

    return cls
};

blist.myBlists.customType = function(value, column)
{
    return "\"<div class='blist-type blist-type-\" + \
        blist.myBlists.getTypeClassName(row) + \"'></div>\"";
};

blist.myBlists.customDatasetName = function(value)
{
    var form = '\'<form action="/\' + $.urlSafe(row.category || "dataset") + \
        \'/\' + $.urlSafe(' + value + ') + \'/\' + row.id + \'" \
      class="noselect" method="post">\
      <input name="authenticity_token" type="hidden" value="' +
      form_authenticity_token + '"/>' +
      '<input id="view_\'+ row.id + \'_name" name="view_\' + row.id + \
      \'[name]" type="text" value="\' + $.htmlEscape(' + value + ') + \'"/>' +
      '<input src="/images/submit_button_mini.png" title="Rename" type="image" />' +
    '</form>\'';

    var expansion =
        '\'<a href="#expand_\' + row.id + \'" title="\' + \
            (row.expanded ? \'Hide\' : \'Show\') + \' filters" \
            class="blist-opener"></a>\'';

    return '(row.childRows && row.childRows.length > 0 ? (' + expansion +
        ') : \'\') + \'<div id="name-cell-\' + row.id + \'" \
        class="name-cell clipText" \
        title="\' + $.htmlEscape(' + value +
        ' || "") + \'"><a href="/\' + $.urlSafe(row.category || "dataset") + \
        \'/\' + $.urlSafe(' + value + ') + \'/\' + row.id + \'" \
        class="dataset-name">\' + $.htmlEscape(' + value + ') + \'</a></div>\' + ' +
        form;
};

blist.myBlists.customClipText = function(value)
{
    return '\'<div class="clipText" title="\' + $.htmlEscape(' + value +
        ' || "") + \'">\' + $.htmlEscape(' + value + ' || "") + \'</div>\'';
};

blist.myBlists.listDropdown = function()
{
    var $div = $(this);
    if (!$div.data('menu-applied'))
    {
        $div.find('ul.menu').dropdownMenu({
            menuContainerSelector: "#" + $div.attr('id'),
            triggerButtonSelector: "a.menuHandle",
            pullToTop: true
        });
        $div.data('menu-applied', true);
    }
};

blist.myBlists.customHandle = function(value, column) {
    var menu = "<ul class='blistItemMenu menu' id='itemMenu-\"+" + value + "+\"'>\
        <li class='open'>\
          <a href='/\" + $.urlSafe(row.category || 'dataset') + \"/\" + \
            $.urlSafe(row.name) + \"/\"+" + value + "+\"' title='Open'>\
            <span class='highlight'>Open</span>\
          </a>\
        </li>\
        <li class='addFavorite'>\
          <a class='favoriteLink' href='/blists/\"+" + value +
            "+\"/create_favorite' title='Add to favorites'>\
            <span class='highlight'>Add to favorites</span>\
          </a>\
        </li>\
        <li class='edit'>\
          <a href='/\" + $.urlSafe(row.category || 'dataset') + \"/\" + \
            $.urlSafe(row.name) + \"/\"+" + value + "+\"?mode=edit' title='Edit'>\
            <span class='highlight'>Edit</span>\
          </a>\
        </li>\
        \" + ((row.owner.id == '" + myBlistsNS.currentUserId + "') ? \"\
        <li class='rename renameLink'>\
          <a href='/\" + $.urlSafe(row.category || 'dataset') + \"/\" + \
            $.urlSafe(row.name) + \"/\"+" + value + "+\"' title='Rename'>\
            <span class='highlight'>Rename</span>\
          </a>\
        </li>\
        <li class='delete'>\
          <a href='/blists/\"+" + value + "+\"' class='deleteLink' title='Delete'>\
            <span class='highlight'>Delete</span>\
          </a>\
        </li>\
        \" : '') + \"\
        <li class='footer'>\
          <div class='outerWrapper'>\
            <div class='innerWrapper'/>\
          </div>\
        </li>\
      </ul>";
    return "\"<div class='blist-dropdown-container' id='dropdown-\"+" + value +
        "+\"'><a id='a-\"+" + value +
        "+\"' class='menuHandle' title='Open menu' href='#open_menu'>\
            Blist Menu</a>" + menu + "</div>\"";
};


/* Functions for main blists screen */

blist.myBlists.favoriteClick = function(row)
{
    if (!row.favorite)
    {
        $.get("/blists/" + row.id + "/create_favorite");
    }
    else
    {
        $.get("/blists/" + row.id + "/delete_favorite");
    }

    row.favorite = !row.favorite;
    myBlistsNS.model.change([row]);
};

blist.myBlists.deleteClick = function (event)
{
    event.preventDefault();

    if (!confirm('This view will be deleted permanently.'))
    {
        return;
    }

    var origHref = $(this).attr("href");

    $.ajax({
        url: origHref,
        type: "DELETE",
        data: " ",
        contentType: "application/json",
        success: function(responseText, textStatus)
        {
            var row  = myBlistsNS.model.getByID(responseText);
            myBlistsNS.model.remove([row]);
        }
    });
};

blist.myBlists.openerClick = function(event)
{
    event.preventDefault();
    myBlistsNS.model.expand(myBlistsNS.model.getByID(
        $(this).attr('href').split('_')[1]));
};

blist.myBlists.listCellClick = function(event, row, column, origEvent)
{
    if ($(origEvent.target).is('a'))
    {
        event.preventDefault();
    }
    switch (column.dataIndex)
    {
        case 'favorite':
            event.preventDefault();
            myBlistsNS.favoriteClick(row);
            break;
    }
};

blist.myBlists.translateViewJson = function(views)
{
    var unclaimedViews = {};
    var datasetsByTable = {};
    var datasets = [];
    for (var i = 0; i < views.length; i++)
    {
        var view = views[i];
        view.level = 0;
        view.favorite = view.flags && $.inArray("favorite", view.flags) != -1;
        view.isDefault = view.flags && $.inArray("default", view.flags) != -1;
        view.ownerName = view.owner && view.owner.displayName;
        if (!view.updatedAt)
        {
            view.updatedAt = view.createdAt;
        }

        if (view.isDefault)
        {
            datasetsByTable[view.tableId] = view;
            view.childRows = [];
            if (unclaimedViews[view.tableId])
            {
                view.childRows = unclaimedViews[view.tableId];
                delete unclaimedViews[view.tableId];
            }
            datasets.push(view);
        }
        else
        {
            view.level = 1;
            if (datasetsByTable[view.tableId])
            {
                datasetsByTable[view.tableId].childRows.push(view);
            }
            else
            {
                if (!unclaimedViews[view.tableId])
                {
                    unclaimedViews[view.tableId] = [];
                }
                unclaimedViews[view.tableId].push(view);
            }
        }
    }

    $.each(unclaimedViews, function(tId, viewList)
    {
        $.each(viewList, function (i, v)
        {
            v.level = 0;
            datasets.push(v);
        });
    });

    return {rows: datasets}
};

blist.myBlists.initializeGrid = function()
{
    // Configure the table and retrieve the model
    myBlistsNS.model = $('#blist-list')
        .blistTable(myBlistsNS.options)
        .bind('cellclick', myBlistsNS.listCellClick)
        .blistModel().options({filterMinChars: 0});

    $('#blist-list .blist-dropdown-container')
        .live('mouseover', myBlistsNS.listDropdown);
    $('.favoriteLink').live('click', function(event)
    {
        // When clicking on the menu item, do a favorite ajax request
        event.preventDefault();
        var rowId = $(this).closest(".blistItemMenu")
            .attr("id").replace("itemMenu-", "");
        var row = myBlistsNS.model.getByID(rowId);
        myBlistsNS.favoriteClick(row);
    });

    var applyFilter = function() {
        var filterText = $('form.blistsFind :text').val();
        if (!filterText || filterText == "")
        {
            // For some reason clearing out the filter causing grouping to no 
            // longer work, so instead, clear with a function that filters 
            // nothing.
            myBlistsNS.model.filter(blistsBarNS.defaultFilter);
            $('.headerBar form.blistsFind .clearSearch').hide();
        }
        else
        {
            myBlistsNS.model.filter(filterText);
            $('.headerBar form.blistsFind .clearSearch').show();
        }
    };

    $('.blist-td .blist-opener').live('click', myBlistsNS.openerClick);

    $('form.blistsFind')
        .keyup(applyFilter)
        .submit(function(event) { event.preventDefault(); applyFilter() });
    $('form.blistsFind .clearSearch')
        .click(function (e)
        {
            e.preventDefault();
            $('form.blistsFind :text').val('').blur();
            // For some reason clearing out the filter causing grouping to no 
            // longer work, so instead, clear with a function that filters 
            // nothing.
            myBlistsNS.model.filter(blistsBarNS.defaultFilter);
            $(e.currentTarget).hide();
        }).hide();

    $('.blist-td form').live("submit", myBlistsNS.renameSubmit);

    $('.renameLink').live('click', myBlistsNS.renameClick);

    $('.deleteLink').live('click', myBlistsNS.deleteClick);

    // Configure columns for the view list
    myBlistsNS.model.meta({view: {}, columns: myBlistsNS.columns});
    // Set up initial sort
    myBlistsNS.model.sort(6, true);

    $('#blist-list').bind('load', blistsInfoNS.updateSummary)
        .bind('selection_change', blistsInfoNS.updateSummary)
        .bind('row_remove', blistsInfoNS.updateSummary);

    // Install a translator that tweaks the view objects so they're more
    // conducive to grid display
    myBlistsNS.model.translate(myBlistsNS.translateViewJson);

    myBlistsNS.model.ajax({url: myBlistsNS.viewUrl, cache: false });
};

blist.myBlists.columns = [[
  { width: 18, dataIndex: 'id', dataLookupExpr: '.id',
    renderer: blist.myBlists.customHandle, sortable: false },
  { cls: 'favorite', name: 'Favorite?', width: 22,
    dataIndex: 'favorite', dataLookupExpr: '.favorite',
    renderer: blist.myBlists.customFav, sortable: true},
  { cls: 'type', name: 'Type', width: 31,
    dataIndex: 'isDefault', dataLookupExpr: '.isDefault',
    renderer: blist.myBlists.customType, sortable: true },
  { name: 'Name', percentWidth: 20, dataIndex: 'name', dataLookupExpr: '.name',
    renderer: blist.myBlists.customDatasetName, group: true, sortable: true },
  { name: 'Description', percentWidth: 40,
    dataIndex: 'description', dataLookupExpr: '.description',
    renderer: blist.myBlists.customClipText, group: true, sortable: true },
  { name: 'Owner', percentWidth: 20,
    dataIndex: 'ownerName', dataLookupExpr: '.ownerName',
    renderer: blist.myBlists.customClipText, group: true, sortable: true},
  { name: 'Last Updated', percentWidth: 20,
    dataIndex: 'updatedAt', dataLookupExpr: '.updatedAt',
    group: true, type: 'date', renderer: blist.myBlists.customDateMeta }
]];
blist.myBlists.columns.push([
    { fillFor: [myBlistsNS.columns[0][0]],
        dataIndex: 'id', dataLookupExpr: '.id',
        renderer: blist.myBlists.customHandle },
    { cls: 'favorite', name: 'Favorite?', fillFor: [myBlistsNS.columns[0][1]],
        dataIndex: 'favorite', dataLookupExpr: '.favorite',
        renderer: blist.myBlists.customFav },
    { cls: 'type', name: 'Type', fillFor: [myBlistsNS.columns[0][2]],
        dataIndex: 'isDefault', dataLookupExpr: '.isDefault',
        renderer: blist.myBlists.customType },
    { cls: 'name', name: 'Name', fillFor: [myBlistsNS.columns[0][3]],
        dataIndex: 'name', dataLookupExpr: '.name',
        renderer: blist.myBlists.customDatasetName },
    { name: 'Description', fillFor: [myBlistsNS.columns[0][4]],
        dataIndex: 'description', dataLookupExpr: '.description',
        renderer: blist.myBlists.customClipText },
    { type: 'fill', fillFor: [myBlistsNS.columns[0][5],
        myBlistsNS.columns[0][6] ] }
]);

blist.myBlists.options = {
    cellExpandEnabled: false,
    disableLastColumnResize: true,
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

    // Fit everything to the screen properly
    $(window).resize(function (event)
    {
        commonNS.adjustSize();
        $('#blist-list').trigger('resize');
    });

    commonNS.adjustSize();
    $('#blist-list').trigger('resize');
});
