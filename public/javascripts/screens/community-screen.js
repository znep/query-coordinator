var communityNS = blist.namespace.fetch('blist.community');

blist.community.filterClickHandler = function (event)
{
    event.preventDefault();
    var $filterLink = $(this);
    
    var tabContainers = {
        "TOPMEMBERS": "#communityTabTopMembers",
        "TOPUPLOADERS": "#communityTabTopUploaders",
        "ALLMEMBERS": "#communityTabAllMembers"
    };
    
    var tabSelector = tabContainers[$.urlParam("type", $filterLink.attr("href"))];
    
    $.Tache.Get({ 
        url: $filterLink.attr("href"),
        success: function(data)
        {
            $(tabSelector).html(data);
            $(".simpleTabsContainer")[0].scrollIntoView();
            $(".contentSort select").bind("change", communityNS.sortSelectChangeHandler);
            $("#tagCloud").jqmHide();
        }
    });
}

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
}

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
}

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
            "tabTopMembers" : "#communityTabTopMembers",
            "tabTopUploaders" : "#communityTabTopUploaders",
            "tabAllMembers" : "#communityTabAllMembers"
        }
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
});