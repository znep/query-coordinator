// Using the plugin pattern from Mike Alsup. 
// http://www.learningjquery.com/2007/10/a-plugin-development-pattern
// Author: pete.stuart@blist.com

// Protect $.
(function($) {

    // Highlight list items in the expanded info pane on hover.
    $.fn.infoPaneItemHighlight = function(options) {
        var opts = $.extend({}, $.fn.infoPaneItemHighlight.defaults, options);
    
        return this.each(function() {
            var $this = $(this);
        
            // Support for the Metadata Plugin.
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
            
            // Wire up hover on the dt.
            $this.find("dt").hover(
                function()
                {
                    $(this).addClass("hover");
                },
                function()
                {
                    $(this).removeClass("hover");
                }
            );
            
            $this.find("dd").hover(
                function()
                {
                    $(this).parent().find("dt").addClass("hover");
                    $(this).addClass("hover");
                },
                function()
                {
                    $(this).parent().find("dt").removeClass("hover");
                    $(this).removeClass("hover");
                }
            );
        });
    
        // private function for debugging
        function debug($obj) {
            if (window.console && window.console.log) {
                window.console.log($obj);
            }
        }
    };

    // default options
    $.fn.infoPaneItemHighlight.defaults = {
        // no defaults.
    };

})(jQuery);

// The info pane is populated with ajax. Instead of document.ready, wire this up in
// the ajax success callback for the page.