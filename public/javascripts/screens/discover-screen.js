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
            $(".contentSort select").bind("change", discoverNS.sortSelectChangeHandler);
        }
    });
}

blist.discover.sortSelectChangeHandler = function (event)
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
            $(".contentSort select").bind("change", discoverNS.sortSelectChangeHandler);
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
    
    $(".tabLink.popular").live("click", function(event){
        event.preventDefault();
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabPopular");
    });
    $(".tabLink.all").live("click", function(event){
        event.preventDefault();
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabAll");
    });
    
    $(".filterLink, .pageLink, .prevLink, .nextLink").live("click", discoverNS.filterClickHandler);
    $(".contentSort select").bind("change", discoverNS.sortSelectChangeHandler);
});
