var discoverNS = blist.namespace.fetch('blist.discover');

blist.discover.filterClickHandler = function (event)
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
        visible: 2,
        initCallback: function()
        {
            $(".jcarousel-skin-discover").hide().css("visibility", "visible").fadeIn("slow");
        }
    });
    
    $(".simpleTabs").simpleTabNavigate();
    
    $(".tabLink.popular").click(function(event){
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabPopular");
    });
    
    $(".filterLink, .pageLink, .prevLink, .nextLink").live("click", discoverNS.filterClickHandler);
});
