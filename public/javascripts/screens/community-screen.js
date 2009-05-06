var communityNS = blist.namespace.fetch('blist.community');

blist.community.filterClickHandler = function (event)
{
    event.preventDefault();
    var $filterLink = $(this);
    
    $.Tache.Get({ 
        url: $filterLink.attr("href"),
        success: function(data)
        {
            $filterLink.closest(".tabContentContainer").html(data);
            $(".simpleTabsContainer")[0].scrollIntoView();
            $(".contentSort select").bind("change", communityNS.sortSelectChangeHandler);
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
});