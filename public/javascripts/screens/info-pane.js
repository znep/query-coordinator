// Using the plugin pattern from Mike Alsup. 
// http://www.learningjquery.com/2007/10/a-plugin-development-pattern
// Author: pete.stuart@blist.com

// Protect $.
(function($) {

    // Switch tabs in the info pane.
    $.fn.infoPaneTabSwitch = function(options) 
    {
        var opts = $.extend({}, $.fn.infoPaneTabSwitch.defaults, options);
        
        $(opts.tabContainerSelector).data("isExpanded", false);
        
        return this.each(function() 
        {
            var $this = $(this);
            
            // Support for the Metadata Plugin.
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
            
            // Determine the corresponding div to show/hide or expand/contract.
            var panelSelector = opts.tabMap[$this.attr("id")];
            
            // Wire up the click events to the a tags.
            $this.find("a").click(function(event)
            {
                event.preventDefault();
                if ($(this).is(opts.expanderSelector))
                {
                    // Toggle all arrows.
                    $(opts.expanderSelector).toggleClass(opts.expandedClass);
                    
                    if ($(opts.tabContainerSelector).data("isExpanded"))
                    {
                        $(opts.expandableSelector).each(function()
                        {
                            if ($(this).is(":visible"))
                            {
                                $(this).slideUp("fast", function() {
                                    opts.switchCompleteCallback();
                                });
                            }
                            else
                            {
                                $(this).hide();
                            }
                        });
                        $(opts.tabContainerSelector).data("isExpanded", false);
                    }
                    else
                    {
                        $(opts.expandableSelector).slideDown("fast", function() {
                            opts.switchCompleteCallback();
                        });
                        $(opts.tabContainerSelector).data("isExpanded", true);
                    }
                    
                    // Toggle all panels.
                    $(opts.allPanelsSelector).toggleClass(opts.expandedClass);
                }
                else
                {
                    $this.siblings().each(function() { $(this).removeClass(opts.activationClass); });
                    $this.addClass(opts.activationClass);
                    
                    $(opts.allPanelsSelector).each(function() { $(this).removeClass(opts.activationClass); });
                    $(panelSelector).addClass(opts.activationClass);
                    
                    opts.switchCompleteCallback();
                }
            });
        });
    };
    
    // default options
    $.fn.infoPaneTabSwitch.defaults = {
        activationClass : "active",
        expanderSelector : ".summaryTabs .expander",
        expandedClass : "expanded",
        tabContainerSelector: ".summaryTabs",
        tabMap: {
            "tabSummary" : ".singleInfoSummary",
            "tabFiltered" : ".singleInfoFiltered",
            "tabSharing" : ".singleInfoSharing",
            "tabPublishing" : ".singleInfoPublishing",
            "tabActivity" : ".singleInfoActivity"
        },
        allPanelsSelector : ".infoContentOuter",
        expandableSelector: ".infoContent",
        switchCompleteCallback: function(){}
    };
    
    
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
                    if (!$(this).parents(".infoContentOuter").is(".multiInfoSummary"))
                    {
                        $(this).parent().find("dd").addClass("hover");
                    }
                    $(this).addClass("hover");
                },
                function()
                {
                    if (!$(this).parents(".infoContentOuter").is(".multiInfoSummary"))
                    {
                        $(this).parent().find("dd").removeClass("hover");
                    }
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
    };

    // default options
    $.fn.infoPaneItemHighlight.defaults = {
        // no defaults.
    };

})(jQuery);

// The info pane is populated with ajax. Instead of document.ready, wire this up in
// the ajax success callback for the page.