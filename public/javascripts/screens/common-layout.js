var commonNS = blist.namespace.fetch('blist.common');

// Default function to do generic resizing to fill the screen
//  If you need more detailed behavior, remove .scrollContent and
//  implement a separate resize for your screen
commonNS.cachedWinHeight = 0;
blist.common.adjustSize = function ()
{
    // Test to see if the cached window height matches the current window height.
    // We need to cache this because IE8 will throw itself into an infinite loop if we don't.
    if ($(window).height() != blist.common.cachedWinHeight) 
    {
        $(".scrollContent").blistFitWindow(
            {
                cachedExpandableSelectorHeight: blist.util.sizing.cachedInfoPaneHeight
            }
        );
        blist.common.cachedWinHeight = $(window).height();
    }
};

blist.common.forceWindowResize = function ()
{
    commonNS.cachedWinHeight = 0;
    $(window).resize();
};

blist.common.showModalHandler = function(hash)
{
    var $modal = hash.w;
    var $trigger = $(hash.t);
    
    $(document).keyup(function (event)
    {
        if (event.keyCode == 27)
        {
            $modal.jqmHide();
        }
    });
    
    $.Tache.Get({ 
        url: $trigger.attr("href"),
        success: function(data)
        {
            $modal.html(data).show();
        }
    });
};

$(function ()
{
    // Make all links with rel="external" open in a new window.
    $("a[rel$='external']").live("mouseover",
        function(){ this.target = "_blank"; });
    
    $("#modal").jqm({ 
        trigger: false,
        onShow: blist.common.showModalHandler
    });
    $("a[rel$='modal']").live("click", function(event)
    {
        event.preventDefault();
        $("#modal").jqmShow($(this));
    });
    $("a.jqmClose").live("click", function(event)
    {
        event.preventDefault();
        $("#modal").jqmHide();
    });
    
});
