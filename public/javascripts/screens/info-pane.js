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
            
            $this.find(opts.clickSelector).click(function(event)
            {
                $this = $(this);
                event.preventDefault();
                
                // Walk up to the container, down to the actions.
                $this.closest(opts.itemContainerSelector)
                        .find(opts.actionSelector)
                        .trigger("click");
            });
        });
    };

    // default options
    $.fn.infoPaneItemHighlight.defaults = {
        itemContainerSelector: "dd",
        clickSelector: "dd .itemContent > *:not(form)",
        actionSelector: ".itemActions > a"
    };
    
    
    
    $.fn.infoPaneItemEdit = function(options) {
        var opts = $.extend({}, $.fn.infoPaneItemEdit.defaults, options);
        
        return this.each(function() {
            var $dd = $(this);
            
            // Support for the Metadata Plugin.
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
            
            // Wire up the events.
            $dd.find(opts.editClickSelector).click(editClick);
            $dd.find(opts.editSubmitSelector).submit(editSubmit);
            $dd.find(opts.editCancelSelector).click(editCancel);
        });
        
        // Private methods
        function editClick(event)
        {
            event.preventDefault();
            var $this = $(this);
        
            // Hide all forms, show all spans.
            var $allItemContainers = $(opts.allItemSelector);
            $allItemContainers.find("form").hide();
            $allItemContainers.find("span").show();
        
            var $currentItemContainer = $this.closest("dd").find(opts.itemContentSelector);
            $currentItemContainer.find("span").hide();
            var $form = $currentItemContainer.find("form");
            $form.show().find("input[type='text']").focus().select();
        };
        
        function editSubmit(event)
        {
            event.preventDefault();
            var $form = $(this);
            
            var fieldType = $form.find("input[name='fieldType']").val();
            var fieldValue = $form.find(":input[name*='" + fieldType + "']").val();
            
            $.ajax({
                url: $form.attr("action"),
                type: "PUT",
                data: $form.find(":input"),
                dataType: "json",
                success: function(responseData)
                {
                    $form.hide();
                    $form.closest(opts.itemContentSelector).find("span").text(fieldValue).show();
                    opts.submitSuccessCallback(fieldType, fieldValue, responseData.id);
                }
            });
        }
        
        function editCancel(event)
        {
            event.preventDefault();
            var $this = $(this);
            $(this).closest("form").hide().closest(opts.itemContentSelector).find("span").show();
        }
     };   
        
     // default options
     $.fn.infoPaneItemEdit.defaults = {
       editClickSelector: ".itemActions .editLink",
       editSubmitSelector: ".itemContent form",
       editCancelSelector: ".itemContent form .formCancelLink",
       allItemSelector: "#infoPane .summaryList dd .itemContent",
       itemContentSelector: ".itemContent",
       submitSuccessCallback: function(){}
     };
    
    
    
    $.fn.infoPaneNavigate = function(options) {
        // check if a navigator for this list was already created
		var tabNavigator = $(this[0]).data("tabNavigator");
		if (tabNavigator) {
			return tabNavigator;
		}
		
		tabNavigator = new $.infoPaneTabNavigator( options, this[0] );
		$(this[0]).data("tabNavigator", tabNavigator);
		
		return tabNavigator;
    };
    
    $.infoPaneTabNavigator = function(options, list) {
        this.settings = $.extend({}, $.infoPaneTabNavigator.defaults, options);
        this.currentList = list;
        this.init();
    };
    $.extend($.infoPaneTabNavigator, {
        defaults: {
            activationClass : "active",
            expanderSelector : ".expander",
            expandedClass : "expanded",
            tabSelector: "li",
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
        },
        prototype: {
            init: function() {
                var tabNavigator = this;
                // Enumerate the tabs..
                $(tabNavigator.currentList).find(tabNavigator.settings.tabSelector).each(function() {
                    $li = $(this);
                    // Wire up the click event for the expander arrow.
                    $li.find(tabNavigator.settings.expanderSelector).click(function(event) {
                        event.preventDefault();
                        tabNavigator.expandTabPanels();
                    });
                    // Wire up the click event for the tab itself for activation
                    $li.find("a:not(" + tabNavigator.settings.expanderSelector + ")").click(function(event) {
                        event.preventDefault();
                        tabNavigator.activateTab($(this).closest(tabNavigator.settings.tabSelector));
                    });
                });
            },
            activateTab: function(tab) {
                var tabNavigator = this;
                $tab = $(tab);
                $tabLink = $tab.find("a:not(" + tabNavigator.settings.expanderSelector + ")");
                $panel = $(tabNavigator.settings.tabMap[$tab.attr("id")]);
                
                $(tabNavigator.currentList).find(tabNavigator.settings.tabSelector).each(function() {
                    $(this).removeClass(tabNavigator.settings.activationClass);
                });
                $tab.addClass(tabNavigator.settings.activationClass);
                
                $(tabNavigator.settings.allPanelsSelector).each(function() { 
                    $(this).removeClass(tabNavigator.settings.activationClass); 
                });
                
                $panel.addClass(tabNavigator.settings.activationClass);
                
                tabNavigator.settings.switchCompleteCallback();
            },
            expandTabPanels: function() {
                var tabNavigator = this;
                
                // Toggle all arrows.
                $(tabNavigator.currentList)
                    .find(tabNavigator.settings.expanderSelector)
                    .toggleClass(tabNavigator.settings.expandedClass);
                
                if ($(tabNavigator.currentList).data("isExpanded"))
                {
                    $(tabNavigator.settings.expandableSelector).each(function()
                    {
                        if ($(this).is(":visible"))
                        {
                            $(this).slideUp("fast", function() {
                                tabNavigator.settings.switchCompleteCallback();
                            });
                        }
                        else
                        {
                            $(this).hide();
                        }
                    });
                    $(tabNavigator.currentList).data("isExpanded", false);
                }
                else
                {
                    $(tabNavigator.settings.expandableSelector).slideDown("fast", function() {
                        tabNavigator.settings.switchCompleteCallback();
                    });
                    $(tabNavigator.currentList).data("isExpanded", true);
                }
                
                // Toggle all panels.
                $(tabNavigator.settings.allPanelsSelector).toggleClass(tabNavigator.settings.expandedClass);
            }
        }
    });

})(jQuery);
