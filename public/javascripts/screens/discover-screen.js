var discoverNS = blist.namespace.fetch('blist.discover');

blist.discover.filterClickHandler = function (event)
{
    event.preventDefault();
    var $filterLink = $(this);
    var filterUrl = $filterLink.attr("href");

    if ($filterLink.hasClass("hilight"))
    {
        filterUrl += $filterLink.closest(".tagList").length > 0 ? "&clearTag=true" : "&clearFilter=true";
    }
    
    var tabContainers = {
        "POPULAR": "#discoverTabPopular",
        "ALL": "#discoverTabAll"
    };
    
    var tabSelector = tabContainers[$.urlParam("type", $filterLink.attr("href"))];
    $.Tache.Get({ 
        url: filterUrl,
        success: function(data)
        {
            $(tabSelector).html(data);
            $(".simpleTabsContainer")[0].scrollIntoView();
            $(".contentSort select").bind("change", discoverNS.sortSelectChangeHandler);
            $("#tagCloud").jqmHide();
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

blist.discover.tagModalShowHandler = function(hash)
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
        visible: 2,
        wrap: 'both',
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
    
    $("#tagCloud").jqm({
        trigger: false,
        onShow: discoverNS.tagModalShowHandler
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
