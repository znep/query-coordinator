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
        if ($this.parents(opts.columnSelector).find(opts.isExpandedSelector).length > 0)
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
    columnSelector: ".scrollContentColumn",
    expandableSelector: "#infoPane:not(:empty)",
    isExpandedSelector: "#infoPane:not(:empty):has(.expanded)",
    cachedExpandableSelectorHeight: 0
};

// Stretch an element to fit inside of a containing element.
$.fn.blistStretchWindow = function(options) {
    var opts = $.extend({}, $.fn.blistStretchWindow.defaults, options);
    
    return this.each(function() {
        // Support for the Metadata Plugin.
        var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
        
        var $this = $(this);
        var $container = $(opts.stretchContainerSelector);
        
        // Size the element back to its natural height, then cache the result.
        $this.height("auto");
        var naturalHeight = $this.height();
        
        // Size the container element back to its natural height, then cache the result.
        $container.height("auto");
        var naturalContainerHeight = $container.height();
        
        // Size the element to the height of the container.
        $this.height($container.height());
        
        // Clip the element by how much bigger the element is than
        // the original (natural) height of the container.
        $this.height(
            Math.max($this.height() - ($container.height() - naturalContainerHeight))
        );
    });
};

$.fn.blistStretchWindow.defaults = {
    stretchContainerSelector: "#outerContainer"
}

})(jQuery);
