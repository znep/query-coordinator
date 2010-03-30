var communityNS = blist.namespace.fetch('blist.community');

blist.community.tabs = ["search", "topMembers", "topUploaders", "allMembers"];

blist.community.historyChangeHandler = function (hash)
{
    // Tab/container names
    var tabs = {
        "search": "#tabSearch",
        "topMembers": "#tabTopMembers",
        "topUploaders": "#tabTopUploaders",
        "allMembers": "#tabAllMembers"
    };
    var tabContainers = {
        "search": "#communityTabSearchResults",
        "topMembers": "#communityTabTopMembers",
        "topUploaders": "#communityTabTopUploaders",
        "allMembers": "#communityTabAllMembers"
    };

    // Special cases to handle default tab actions
    if (hash === "")
    {
        // only case we have no hash at all is default, nothing to do.
        return false;
    }
    var activeTab = $.urlParam("?" + hash, "type");
    // Track what tabs have been opened
    $.analytics.trackEvent('Community Screen', activeTab + ' tab opened');

    // Find active tab
    var tabSelector = tabs[activeTab];
    var tabContainerSelector = tabContainers[activeTab];

    // Abort if we don't know what's going on
    if (!_.include(blist.community.tabs, activeTab))
    {
        return;
    }

    // Select active tab
    $(".simpleTabs").simpleTabNavigate().activateTab(tabSelector);
    $(tabSelector).find('a').attr("href", "#" + hash);

    // Add search tab if necessary
    if (activeTab == "search")
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
                .val($.urlParam("?" + hash, "search"))
                .removeClass("prompt");
        }
    }

    // Display loading message
    $(".tabContentContainer").removeClass("active");
    $(tabContainerSelector).addClass("active").html(
        "<div class=\"tabContentOuter\"><div class=\"tabContentTR\"></div>" +
        "  <div class=\"tabContent noresult\">" +
        "   <h2>Searching...</h2>" +
        "   <p class=\"clearBoth\">" +
        "       <img src=\"/stylesheets/images/common/BrandedSpinner.gif\" width=\"31\" height=\"31\" alt=\"Searching...\" />" +
        "   </p>" +
        " </div>" +
        "<div class=\"tabContentB\"><div class=\"tabContentBL\"></div></div></div>" +
        "<div class=\"tabContentNavOuter\"><div class=\"tabContentNavT\"></div>" +
        "  <div class=\"tabContentNav\"></div>" +
        "<div class=\"tabContentNavB\"></div></div>"
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

            // reinforce new links to JS rather than postback
            communityNS.ajaxifyLinks();
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
        hash = "type=topMembers";
    }
    if (_.include(blist.community.tabs, hash))
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
            $(".tagCloudContainer a")
                .tagcloud({ size: { start: 1.2, end: 2.8, unit: "em" } })
                .each(function()
                {
                    $(this).attr('href', $(this).attr('href').replace(/\?/, '#'));
                });
            $('#tagCloud .closeContainer a').click(function(event)
            {
                event.preventDefault();
                $modal.jqmHide();
                event.stopPropagation();
            });
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

    var hash = "type=search&search=" + query;
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

blist.community.ajaxifyLinks = function()
{
    $('.filterList a, .tagList a.filterLink, .simpleTabs a, .memberPager a').each(function()
    {
        $(this).attr('href', $(this).attr('href').replace(/\?/, '#'));
    });
};

$(function ()
{
    // reinforce new links to JS rather than postback
    communityNS.ajaxifyLinks();

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

    $.live(".memberActions .followAction", "click", communityNS.addFriendClick);

    // Top members tab open by default
    $.analytics.trackEvent('Community Screen', 'topMembers tab opened (default)');
});
