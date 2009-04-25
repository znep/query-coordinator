$(function ()
{
    $("#featuredCarousel").jcarousel({
        visible: 2
    });
    
    $(".discoverTabs").discoverTabNavigate();
});


$.fn.discoverTabNavigate = function(options) {
    // check if a navigator for this list was already created
    var tabNavigator = $(this[0]).data("tabNavigator");
    if (tabNavigator) {
        return tabNavigator;
    }
    
    tabNavigator = new $.discoverTabNavigator( options, this[0] );
    $(this[0]).data("tabNavigator", tabNavigator);
    
    return tabNavigator;
};

$.discoverTabNavigator = function(options, list) {
    this.settings = $.extend({}, $.discoverTabNavigator.defaults, options);
    this.currentList = list;
    this.init();
};
$.extend($.discoverTabNavigator, {
    defaults: {
        activationClass : "active",
        tabSelector: "li",
        tabMap: {
            "tabPopular" : "#discoverTabPopular",
            "tabAll" : "#discoverTabAll"
        },
        allPanelsSelector : ".discoverContentContainer",
        switchCompleteCallback: function(){}
    },
    prototype: {
        init: function() {
            var tabNavigator = this;
            // Enumerate the tabs..
            $(tabNavigator.currentList).find(tabNavigator.settings.tabSelector).each(function() {
                var $li = $(this);
                // Wire up the click event for the tab itself for activation
                $li.find("a").click(function(event) {
                    event.preventDefault();
                    tabNavigator.activateTab($(this).closest(tabNavigator.settings.tabSelector));
                });
            });
        },
        activateTab: function(tab) {
            var tabNavigator = this;
            var $tab = $(tab);
            var $tabLink = $tab.find("a");
            var $panel = $(tabNavigator.settings.tabMap[$tab.attr("id")]);

            $(tabNavigator.currentList).find(tabNavigator.settings.tabSelector).each(function() {
                $(this).removeClass(tabNavigator.settings.activationClass);
            });
            $tab.addClass(tabNavigator.settings.activationClass);

            $(tabNavigator.settings.allPanelsSelector).each(function() { 
                $(this).removeClass(tabNavigator.settings.activationClass); 
            });

            $panel.addClass(tabNavigator.settings.activationClass);

            tabNavigator.settings.switchCompleteCallback($tab);
        }
    }
});
