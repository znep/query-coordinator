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
        }
    });
}

$(function ()
{
    $("#featuredCarousel").jcarousel({
        visible: 3,
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
});