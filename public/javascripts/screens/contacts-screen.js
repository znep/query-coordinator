var contactsNS = blist.namespace.fetch('blist.contacts');

blist.contacts.setupTable = function ()
{
    $('#contactList').combinationList({
        initialSort: [[[4, 1]]],
        loadedCallback: function ()
        {
            contactsInfoNS.updateSummary(0, contactsNS.getItemsType());
        },
        searchable: true,
        searchCompleteCallback: function () {
            contactsInfoNS.updateSummary(0, contactsNS.getItemsType());
        },
        searchFormSelector: "form.contactsFind",
        selectionCallback: function($targetRow, $selectedItems)
        {
            contactsInfoNS.updateSummary($selectedItems.length, contactsNS.getItemsType());
        },
        sortHeaders: {0: {sorter: false}, 1: {sorter: false},
            2: {sorter: "text"}, 3: {sorter: "text"},
            4: {sorter: "usLongDate"}},
    });
};

blist.contacts.getItemsType = function()
{
    var $contacts = $("#contactList tr[id*='contact']");
    var $groups = $("#contactList tr[id*='group']");
    
    var type = $groups.length > 0 ? ($contacts.length > 0 ? "contacts and groups" : "groups") : "contacts";
    
    return type;
}

var contactsInfoNS = blist.namespace.fetch('blist.contacts.infoPane');
blist.contacts.infoPane.updateSummary = function(numSelect, itemType)
{
    // itemType must be either "contact" or "group".
    if (numSelect == 1)
    {
        var $items = $('#contactList').combinationList().selectedItems();
        
        var itemTypeIdArray = $items.attr('id').split(":");
        $.Tache.Get({ 
            url: '/contacts/' + itemTypeIdArray[1] + '/' + itemTypeIdArray[0] + '_detail',
            success: contactsInfoNS.itemDetailSuccessHandler
        });
    }
    else
    {
        if (numSelect === undefined || numSelect < 1)
        {
            numSelect = $('#contactList').combinationList().totalItemCount();

            $.Tache.Get({ url: '/contacts/detail',
                data: {
                    "items" : numSelect,
                    "type" : itemType
                },
                success: function(data)
                {
                    $('#infoPane').html(data);
                }
            });

        }
        else
        {
            var $items = $('#contactList').combinationList().selectedItems();
            var arrMulti = $items.map(function (i, n)
            {
               return $(n).attr('id');
            });
            var multi = $.makeArray(arrMulti).join('|');

            $.Tache.Get({ url: '/contacts/multi_detail',
                data: 'multi=' + multi,
                success: contactsInfoNS.multiSuccessHandler
            });
        }
    }
};

blist.contacts.infoPane.itemDetailSuccessHandler = function(data)
{
    // Load the info pane.
    $('#infoPane').html(data);
    
    // Wire up the hover behavior.
    $(".infoContent dl.summaryList").infoPaneItemHighlight();
    $("#infoPane .gridList").blistListHoverItems();
    
    $(".summaryTabs").infoPaneNavigate(
    {
        tabMap: {
            "tabSummary" : ".singleInfoSummary",
            "tabGroups" : ".singleInfoGroups",
            "tabMembers" : ".singleInfoMembers",
            "tabShares" : ".singleInfoShares",
            "tabBlists" : ".singleInfoBlists",
            "tabActivity" : ".singleInfoActivity"
        }
    });

    $(".tabLink.groups").click(function(event){
        $(".summaryTabs").infoPaneNavigate().activateTab("#tabGroups");
    });
    $(".tabLink.members").click(function(event){
        $(".summaryTabs").infoPaneNavigate().activateTab("#tabMembers");
    });
    $(".tabLink.shares").click(function(event){
        $(".summaryTabs").infoPaneNavigate().activateTab("#tabShares");
    });
    
    // Force a window resize.
    blist.util.sizing.cachedInfoPaneHeight = $("#infoPane").height();
    blist.common.forceWindowResize();
}

blist.contacts.infoPane.multiSuccessHandler = function (data)
{
    // Load the info pane.
    $('#infoPane').html(data);
    
    $(".infoContent dl.summaryList").infoPaneItemHighlight();
    
    // Wire up a click handler for deselectors.
    $(".action.unselector").click(function (event)
    {
        event.preventDefault();
        var item_id = $(this).attr("href").replace("#", "");
        $("#contactList tr[id=" + item_id + "] td.name").trigger("click");
    });

    // Force a window resize.
    blist.util.sizing.cachedInfoPaneHeight = $("#infoPane").height();
    blist.common.forceWindowResize();
};


/* Initial start-up calls, and setting up bindings */

$(function ()
{
    $(window).resize(function (event)
    {
        commonNS.adjustSize();
    });
    commonNS.adjustSize();

    contactsNS.setupTable();

    $('#contactFilters').filterList({
        filterClickCallback: function (title)
        {
            $('#contactList tbody').hide();
            $('#listTitle').text(title);
            $('#listTitle').attr('title', title);
        },
        filterSuccessHandler: function (retData)
        {
            $('#contactList').combinationList().updateList(retData);
            $('#contactList tbody').show();
        }});
});
