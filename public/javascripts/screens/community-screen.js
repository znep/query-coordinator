var communityNS = blist.namespace.fetch('blist.community');

blist.community.isTabDirty = {
    "SEARCH": false,
    "TOPMEMBERS": false,
    "TOPUPLOADERS": false,
    "ALLMEMBERS": false
};
blist.community.historyChangeHandler = function (hash)
{
    // Tab/container names
    var tabs = {
        "SEARCH": "#tabSearch",
        "TOPMEMBERS": "#tabTopMembers",
        "TOPUPLOADERS": "#tabTopUploaders",
        "ALLMEMBERS": "#tabAllMembers"
    };
    var tabContainers = {
        "SEARCH": "#communityTabSearchResults",
        "TOPMEMBERS": "#communityTabTopMembers",
        "TOPUPLOADERS": "#communityTabTopUploaders",
        "ALLMEMBERS": "#communityTabAllMembers"
    };

    // Special cases to handle default tab actions
    if (hash == "")
    {
        // default tab is top members
        hash = "TOPMEMBERS";
    }
    if (blist.community.isTabDirty[hash] === false)
    {
        $(".simpleTabs").simpleTabNavigate().activateTab(tabs[hash]);
        return;
    }
    else if (blist.community.isTabDirty[hash] === true)
    {
        hash = "type=" + hash;
    }

    // Find active tab
    var activeTab = $.urlParam("type", "?" + hash);
    var tabSelector = tabs[activeTab];
    var tabContainerSelector = tabContainers[activeTab];

    // Abort if we don't know what's going on
    if (activeTab === 0)
    {
        return;
    }

    // Select active tab
    $(".simpleTabs").simpleTabNavigate().activateTab(tabSelector);
    $(tabSelector).find('a').attr("href", "#" + hash);
    blist.community.isTabDirty[activeTab] = true;

    // Add search tab if necessary
    if (activeTab == "SEARCH")
    {
        $(".simpleTabs li").removeClass("active");
        if ($("#tabSearch").length > 0)
        {
            $("#tabSearch").addClass("active");
        }
        else
        {
            $("#tabTopMembers").before("<li id='tabSearch' class='active'><div class='wrapper'><a href='#results'>Search Results</a></div></li>");
            $("form.search #search")
                .val($.urlParam("search", "?" + hash))
                .removeClass("prompt");
        }
    }

    // Display loading message
    $(".tabContentContainer").removeClass("active");
    $(tabContainerSelector).addClass("active").html(
        "<div class=\"tabContentOuter\"><div class=\"tabContentTL\"><div class=\"tabContentBL\">" +
        "  <div class=\"tabContent noresult\">" +
        "   <h2>Searching...</h2>" +
        "   <p class=\"clearBoth\">" +
        "       <img src=\"/stylesheets/images/common/BrandedSpinner.gif\" width=\"31\" height=\"31\" alt=\"Searching...\" />" +
        "   </p>" +
        " </div>" +
        "</div></div></div>" +
        "<div class=\"tabContentNavTR\"><div class=\"tabContentNavBR\">" +
        "  <div class=\"tabContentNav\"></div>" +
        "</div></div>"
    );

    // Fetch data
    $.Tache.Get({ 
        url: communityNS.filterUrl + "?" + hash,
        success: function(data)
        {
            $(tabContainerSelector).html(data);
            $(".simpleTabsContainer")[0].scrollIntoView();
            $(".contentSort select").bind("change", communityNS.sortSelectChangeHandler);
            $("#tagCloud").jqmHide();
            $("#search").blur();
        }
    });
};

blist.community.sortSelectChangeHandler = function (event)
{
    event.preventDefault();

    var $sortSelect = $(this);
    var sortUrl = $sortSelect.closest("form").attr("action");

    var hash = window.location.href.match(/#/) ? window.location.href.replace(/^.*#/, '') : '';

    if (hash == "")
    {
        // default tab is top members
        hash = "type=TOPMEMBERS";
    }
    if (blist.community.isTabDirty[hash] !== undefined)
    {
        hash = "type=" + hash;
    }

    hash = hash.replace(/sort_by=[A-Z_]*/gi, '');
    hash += "&sort_by=" + $sortSelect.val();
    hash = hash.replace(/&&+/g, '&');
    $.historyLoad(hash);
};

blist.community.tagModalShowHandler = function(hash)
{
    var $modal = hash.w;
    var $trigger = $(hash.t);
    
    $.Tache.Get({ 
        url: $trigger.attr("href"),
        success: function(data)
        {
            $modal.html(data).show();
            $(".tagCloudContainer a").tagcloud({ size: { start: 1.2, end: 2.8, unit: "em" } });
        }
    });
};

blist.community.searchSubmitHandler = function(event)
{
    event.preventDefault();

    var query = $(this).find('#search').val();
    if (query == "")
    {
        return;
    }

    var hash = "type=SEARCH&search=" + query;
    window.location.href = '#' + hash;
    $.historyLoad(hash);
    return false;
};

blist.community.addFriendClick = function(event)
{
    event.preventDefault();
    var $link = $(this);
    var origHref = $link.attr("href");
    $.ajax({
        url: origHref,
        type: "GET",
        success: function(responseText)
        {
            var isCreate = responseText == "created";
            
            // Update the text of the link.
            $link.text(isCreate ? "Remove" : "Add Friend");
            $link.attr("title", isCreate ? "Remove as Friend" : "Add Friend");
            
            // Update the link.
            var newHref = isCreate ?
                origHref.replace("create", "delete") :
                origHref.replace("delete", "create");

            $link.attr("href", newHref);
        }
    });
};


$(function ()
{
    $("#featuredCarousel").jcarousel({
        visible: 3,
        wrap: 'both',
        initCallback: function()
        {
            $(".jcarousel-skin-discover").hide().css("visibility", "visible").fadeIn("slow");
        }
    });
    
    $(".simpleTabs").simpleTabNavigate({
        tabMap: {
            "tabSearch" : "#communityTabSearchResults",
            "tabTopMembers" : "#communityTabTopMembers",
            "tabTopUploaders" : "#communityTabTopUploaders",
            "tabAllMembers" : "#communityTabAllMembers"
        },
        preventDefault: false
    });
    
    $.live(".simpleTabs li#tabSearch a", "click", function(event){
        event.preventDefault();
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabSearch");
    });

    $.historyInit(communityNS.historyChangeHandler);
    $('a:not(.noHistory)').live('click', function(event)
    {
        if ($(this).attr('href').match(/#/))
        {
            var hash = this.href;
            hash = hash.replace(/^.*#/, '');
            $.historyLoad(hash);
        }
    });
    $(".contentSort select").bind("change", communityNS.sortSelectChangeHandler);
    
    $("#tagCloud").jqm({
        trigger: false,
        onShow: communityNS.tagModalShowHandler
    });
    $.live(".moreTagsLink", "click", function(event)
    {
        event.preventDefault();
        $("#tagCloud").jqmShow($(this));
    });
    $.live(".closeContainer a", "click", function(event)
    {
        event.preventDefault();
        $("#tagCloud").jqmHide();
    });
    $.live(".tagCloudContainer a", "click", function(event)
    {
        $("#tagCloud").jqmHide();
    });
    
    $("#community form").submit(communityNS.searchSubmitHandler);
    $(".clearSearch")
        .click(function(event)
        {
            event.preventDefault();
            $("#tabSearch").remove();
            window.location.hash = ''; // only webkit/ie understand this, but only they need to
            $.historyLoad('');
        });
    if ($.urlParam("search", window.location.href) !== 0)
    {
        $(".clearSearch").show();
    }

    $.live(".memberActions .followAction", "click", communityNS.addFriendClick);
});
