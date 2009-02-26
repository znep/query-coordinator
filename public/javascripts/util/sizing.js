blist.namespace.fetch('blist.util.sizing');

blist.util.sizing.cachedInfoPaneHeight = 0;

// Protect $
(function($) {

// Automatically fit the given elements to the height of the document,
// taking into account other items in the flow.
$.fn.blistFitWindow = function(options) {
    var opts = $.extend({}, $.fn.blistFitWindow.defaults, options);
    
    return this.each(function() {
        var $this = $(this);
        
        // Support for the Metadata Plugin.
        var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
        
        // First size content to full document height, to make sure it is the
        //  largest thing on the page and causing the overflow
        $this.height($(document).height());
        
        // Fix for IE7. If this line isn't here, IE7 will not resize properly.
        $this.height();

        var adjustedHeight = $(document).height();
        if ($this.parents(opts.columnSelector).find(opts.expandableSelector).length > 0)
        {
            adjustedHeight -= $(opts.expandableSelector).height();
            adjustedHeight += opts.cachedExpandableSelectorHeight;
        }
        
        // Then clip it by how much the document overflows the window
        $this.height(Math.max(0,
                    $this.height() - (adjustedHeight -
                        Math.max($('body').minSize().height, $(window).height()))));
        
    });
};

// default options
$.fn.blistFitWindow.defaults = {
    columnSelector: ".column",
    expandableSelector: "#infoPane:not(:empty)",
    cachedExpandableSelectorHeight: 0
};

})(jQuery);
