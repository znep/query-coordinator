var communityNS = blist.namespace.fetch('blist.community');

blist.community.filterClickHandler = function (event)
{
    event.preventDefault();
    var $filterLink = $(this);
    var filterUrl = $filterLink.attr("href");

    if ($filterLink.hasClass("hilight"))
    {
        filterUrl += $filterLink.closest(".tagList").length > 0 ? "&clearTag=true" : "&clearFilter=true";
    }
    
    var tabContainers = {
        "SEARCH": "#communityTabSearchResults",
        "TOPMEMBERS": "#communityTabTopMembers",
        "TOPUPLOADERS": "#communityTabTopUploaders",
        "ALLMEMBERS": "#communityTabAllMembers"
    };
    
    var tabSelector = tabContainers[$.urlParam("type", $filterLink.attr("href"))];
    
    $.Tache.Get({ 
        url: filterUrl,
        success: function(data)
        {
            $(tabSelector).html(data);
            $(".simpleTabsContainer")[0].scrollIntoView();
            $(".contentSort select").bind("change", communityNS.sortSelectChangeHandler);
            $("#tagCloud").jqmHide();
        }
    });
};

blist.community.sortSelectChangeHandler = function (event)
{
    event.preventDefault();
    
    var $sortSelect = $(this);
    var sortUrl = $sortSelect.closest("form").attr("action");
    
    $.Tache.Get({ 
        url: sortUrl,
        data: {"sort_by": $sortSelect.val()},
        success: function(data)
        {
            $sortSelect.closest(".tabContentContainer").html(data);
            $(".simpleTabsContainer")[0].scrollIntoView();
            $(".contentSort select").bind("change", communityNS.sortSelectChangeHandler);
        }
    });
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
    var $form = $(this);
    
    $(".simpleTabs li").removeClass("active");
    if ($("#tabSearch").length > 0)
    {
        $("#tabSearch").addClass("active");
    }
    else
    {
        $("#tabTopMembers").before("<li id='tabSearch' class='active'><div class='wrapper'><a href='#results'>Search Results</a></div></li>");
    }
    
    $(".tabContentContainer").removeClass("active");
    $("#communityTabSearchResults").addClass("active").html(
        "<div class=\"tabContentOuter\"><div class=\"tabContentTL\"><div class=\"tabContentBL\"> \
          <div class=\"tabContent noresult\"> \
            <h2>Searching...</h2> \
            <p class=\"clearBoth\"> \
                <img src=\"/stylesheets/images/common/BrandedSpinner.gif\" width=\"31\" height=\"31\" alt=\"Searching...\" /> \
            </p> \
          </div> \
        </div></div></div> \
        <div class=\"tabContentNavTR\"><div class=\"tabContentNavBR\"> \
          <div class=\"tabContentNav\"></div> \
        </div></div>"
    );
    
    $.Tache.Get({ 
        url: $form.attr("action"),
        data: $form.find(":input"),
        success: function(data)
        {
            $("#communityTabSearchResults").html(data);
            
            $(".simpleTabsContainer")[0].scrollIntoView();
            $(".contentSort select").bind("change", communityNS.sortSelectChangeHandler);
            $("#search").blur();
        }
    });
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
        }
    });
    
    $(".simpleTabs li#tabSearch a").live("click", function(event){
        event.preventDefault();
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabSearch");
    });
    
    
    $(".filterLink, .pageLink, .prevLink, .nextLink").live("click", communityNS.filterClickHandler);
    $(".contentSort select").bind("change", communityNS.sortSelectChangeHandler);
    
    $("#tagCloud").jqm({
        trigger: false,
        onShow: communityNS.tagModalShowHandler
    });
    $(".moreTagsLink").live("click", function(event)
    {
        event.preventDefault();
        $("#tagCloud").jqmShow($(this));
    });
    $(".closeContainer a").live("click", function(event)
    {
        event.preventDefault();
        $("#tagCloud").jqmHide();
    });
    
    $("#community .pageBlockSearch form").submit(communityNS.searchSubmitHandler);
    $("#search").focus(function(){ $(this).select(); });
    $(".memberActions .followAction").live("click", communityNS.addFriendClick);
});
