$(function ()
{
    $("#featuredCarousel").jcarousel({
        visible: 3
    });
    
    $(".simpleTabs").simpleTabNavigate({
        tabMap: {
            "tabTopMembers" : "#communityTabTopMembers",
            "tabTopUploaders" : "#communityTabTopUploaders",
            "tabAllMembers" : "#communityTabAllMembers"
        }
    });
});