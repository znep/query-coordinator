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

            $this.find(".panelHeader.editItem").hover(
                function()
                {
                    $(this).addClass("hover");
                },
                function()
                {
                    $(this).removeClass("hover");
                }
            );

            $this.find(opts.clickSelector).click(function(event)
            {
                var $this = $(this);
                if ($(event.target).is('a'))
                {
                    return;
                }
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
        itemContainerSelector: "dd, .editItem",
        clickSelector: ".itemContent > *:not(form)",
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
            closeAllForms();

            var $currentItemContainer = $this.closest(opts.containerSelector)
                .find(opts.itemContentSelector);
            $currentItemContainer.find("span").hide();
            var $form = $currentItemContainer.find("form").keyup(function(event)
            {
                if (event.keyCode == 27) closeAllForms();
            });
            $form.show().find("input[type='text']").focus().select();
        };

        function closeAllForms()
        {
            var $allItemContainers = $(opts.allItemSelector);
            $allItemContainers.find("form").hide();
            $allItemContainers.find("span").show();
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
                    opts.submitSuccessCallback(fieldType, fieldValue, responseData.id, responseData);
                },
                error: function(request, textStatus, errorThrown)
                {
                    opts.submitErrorCallback(fieldType, request);
                }
            });
        };

        function editCancel(event)
        {
            event.preventDefault();
            closeAllForms();
        };
    };

     // default options
     $.fn.infoPaneItemEdit.defaults = {
       containerSelector: '.editItem',
       editClickSelector: ".itemActions .editLink",
       editSubmitSelector: ".itemContent form",
       editCancelSelector: ".itemContent form .formCancelLink",
       allItemSelector: "#infoPane .summaryList dd .itemContent, #infoPane .panelHeader.editItem .itemContent",
       itemContentSelector: ".itemContent",
       submitSuccessCallback: function(){},
       submitErrorCallback: function(){}
     };



    $.fn.infoPaneNavigate = function(options) {
        if (this.length < 1)
        {
            return false;
        }

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
                "tabComments" : ".singleInfoComments",
                "tabSharing" : ".singleInfoSharing",
                "tabPublishing" : ".singleInfoPublishing",
                "tabActivity" : ".singleInfoActivity"
            },
            allPanelsSelector : ".infoContentOuter",
            allPanelsHeaderSelector: ".infoContentHeader",
            expandableSelector: ".infoContent",
            expandableContainerSelector: ".infoContentWrapper",
            switchCompleteCallback: function(){},
            initialTab: '',
            isWidget: false,
            widgetMetaContainerSelector: "#widgetMeta",
            widgetMetaHeaderSelector: "#widgetMeta .header",
            widgetOuterContainerSelector: ".gridInner", 
            initialMetaHeight: 0
        },
        prototype: {
            init: function() {
                var tabNavigator = this;
                // Set the expanded state.
                var isExpanded = $(tabNavigator.currentList).find(tabNavigator.settings.expanderSelector)
                                    .is("." + tabNavigator.settings.expandedClass);
                $(tabNavigator.currentList).data("isExpanded", isExpanded);
                // Enumerate the tabs..
                $(tabNavigator.currentList).find(tabNavigator.settings.tabSelector).each(function() {
                    $li = $(this);
                    // Wire up the click event for the expander arrow.
                    $li.find(tabNavigator.settings.expanderSelector).click(function(event) {
                        event.preventDefault();
                        if (tabNavigator.settings.isWidget)
                        {
                            tabNavigator.expandWidgetTabPanels();
                        }
                        else
                        {
                            tabNavigator.expandTabPanels();
                        }
                    });
                    // Wire up the click event for the tab itself for activation
                    $li.find("a:not(" + tabNavigator.settings.expanderSelector + ")").click(function(event) {
                        event.preventDefault();
                        tabNavigator.activateTab($(this).closest(tabNavigator.settings.tabSelector));
                    });
                });

                if (tabNavigator.settings.initialTab &&
                    tabNavigator.settings.initialTab != '')
                {
                    if ($(tabNavigator.currentList).data("isExpanded"))
                    {
                        tabNavigator.activateTab('#' +
                            tabNavigator.settings.initialTab);
                    }
                    else
                    {
                        tabNavigator.expandTabPanels(function ()
                        {
                            tabNavigator.activateTab('#' +
                                tabNavigator.settings.initialTab);
                        });
                    }
                }
                
                var $metaContainer = $(tabNavigator.settings.widgetMetaContainerSelector);
                if ($metaContainer)
                {
                    tabNavigator.settings.initialMetaHeight = $metaContainer.height();
                }
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
                tabNavigator.settings.switchCompleteCallback($tab);
                $tab[0].scrollIntoView();
            },
            expandTabPanels: function(openCallback) {
                
                var tabNavigator = this;

                // Toggle all arrows.
                var $allExpanders = $(tabNavigator.currentList).find(tabNavigator.settings.expanderSelector);
                $allExpanders.toggleClass(tabNavigator.settings.expandedClass);

                if ($(tabNavigator.currentList).data("isExpanded"))
                {
                    $allExpanders.attr("title", "more info").text("more info");
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
                    $allExpanders.attr("title", "less info").text("less info");
                    $(tabNavigator.settings.expandableSelector).slideDown("fast", function() {
                        tabNavigator.settings.switchCompleteCallback();
                        if (openCallback !== undefined)
                        {
                            openCallback();
                        }
                    });
                    $(tabNavigator.currentList).data("isExpanded", true);
                }

                // Toggle all panels.
                $(tabNavigator.settings.allPanelsSelector).toggleClass(tabNavigator.settings.expandedClass);
            },
            expandWidgetTabPanels: function(openCallback) {
                var tabNavigator = this;

                // Toggle all arrows.
                var $allExpanders = $(tabNavigator.currentList).find(tabNavigator.settings.expanderSelector);
                $allExpanders.toggleClass(tabNavigator.settings.expandedClass);
                
                var $metaContainer = $(tabNavigator.settings.widgetMetaContainerSelector);
                
                if ($(tabNavigator.currentList).data("isExpanded"))
                {
                    $allExpanders.attr("title", "more info").text("more info");
                    
                    var metaPosition = $metaContainer.height() - tabNavigator.settings.initialMetaHeight;
                    $metaContainer.animate(
                        { top: metaPosition + "px" },
                        function(){
                            $metaContainer.removeClass("expanded").height("");
                            $(tabNavigator.settings.expandableSelector).each(function()
                            {
                                $(this).hide();
                            });
                        }
                    );
                    
                    $(tabNavigator.currentList).data("isExpanded", false);
                }
                else
                {
                    $allExpanders.attr("title", "less info").text("less info");
                    
                    var expandMinHeight = 
                        $(tabNavigator.settings.widgetOuterContainerSelector).outerHeight() -
                        $(tabNavigator.settings.widgetMetaHeaderSelector).outerHeight() -
                        $(tabNavigator.settings.allPanelsHeaderSelector + ":visible").outerHeight() - 1;
                    $(tabNavigator.settings.expandableSelector).show();
                    $(tabNavigator.settings.expandableContainerSelector).css("min-height", expandMinHeight + "px");
                    tabNavigator.settings.switchCompleteCallback();
                    if (openCallback !== undefined)
                    {
                        openCallback();
                    }
                    $(tabNavigator.currentList).data("isExpanded", true);
                    
                    // Set the height explicitly because IE6 cannot render height 100% properly.
                    $metaContainer.addClass("expanded")
                                    .height($(tabNavigator.settings.widgetOuterContainerSelector).height());
                    $metaContainer.animate({
                        top: "0"
                    });
                    
                }
                
                // Toggle all panels.
                $(tabNavigator.settings.allPanelsSelector).toggleClass(tabNavigator.settings.expandedClass);
            }
        }
    });

})(jQuery);
