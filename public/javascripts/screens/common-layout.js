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
    
    $.ajax({ 
        url: $trigger.attr("href"),
        cache: false,
        type: "GET",
        success: function(data)
        {
            $modal.html(data).show();
            
            if (commonNS.modalReady)
            {
                commonNS.modalReady();
            }
        }
    });
};

$(function ()
{
    // Make all links with rel="external" open in a new window.
    $.live("a[rel$='external']", "mouseover",
        function(){ this.target = "_blank"; });
    
    $("#modal").jqm({ 
        trigger: false,
        onShow: blist.common.showModalHandler
    });
    $.live("a[rel$='modal']", "click", function(event)
    {
        event.preventDefault();
        $("#modal").jqmShow($(this));
    });
    $.live("a.jqmClose", "click", function(event)
    {
        event.preventDefault();
        $("#modal").jqmHide();
    });
    $.live("a[rel$='screenPop']", "click", function(event)
    {
        event.preventDefault();
        var $link = $(this);
        window.open(
            $link.attr('href'), "Screenshot", "location=0,menubar=0,resizable=0,status=0,toolbar=0"
        );
    });
    
    $.validator.addMethod("customUrl", function(value, element)
    {
        if (this.optional(element))
        {
            return true;
        }

        var regEx = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

        if (!/^(https?|ftp):\/\//i.test(value))
        {
            if (regEx.test("http://" + value))
            {
                $(element).val("http://" + value);
                return true;
            }
        }
        else
        {
            return regEx.test(value);
        }
        return false;
    });
});
