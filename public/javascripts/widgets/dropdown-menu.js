/* dropdownMenu widget
 * This should be called on the dropdown menu.  The button it is triggered
 *  by is passed in as triggerButton.  Optionally you can pass in menuBar,
 *  which will act like a menu bar where mousing over other menu items once
 *  a dropdown is showing will automatically switch the shown menu.
 *  Both triggerButton and menuBar must be jQuery objects.
 *
 * Params:
 *  menuOpenClass: Class name to add/remove from a menu when it is shown/hidden
 *
 *  triggerOpenClass: Class name to add/remove from the triggerButton when it is
 *    shown/hidden
 *
 *  optionMenuClass: Class name that determines if a menu is an option menu,
 *    which means that you have one selected a at a time
 *
 *  selectedItemClass: Class to apply to the single selected item in an optionMenu
 *
 *  triggerButton: (no default) jQuery object that is the button to use to show
 *    the menu
 *
 *  menuBar: (no default) jQuery object in which to link other menus.  If
 *    another menu in this menu bar is open, then this menu will be triggered
 *    on mouseover, instead of click.  The other open menu(s) will be closed.
 *    If menuBar is used, menuOpenClass must be used only for open menus
 *    controlled by this plugin, and must be the same menuOpenClass used for
 *    all menus in the menuBar.
 *
 * Author: jeff.scherpelz@blist.com
 */

(function($)
{
    $.fn.dropdownMenu = function(options)
    {
        // build main options before element iteration
        var opts = $.extend({}, $.fn.dropdownMenu.defaults, options);

        // iterate and do stuff to each matched element
        return this.each(function()
        {
            var $menu = $(this);
            // build element specific options and store them on the menu
            var config = $.meta ? $.extend({}, opts, $menu.data()) : opts;
            $menu.data("config", config);

            // Hook up click handler to show menu
            config.triggerButton.click(function (event)
            {
                if (!$menu.hasClass(config.menuOpenClass))
                {
                    event.stopPropagation();
                    showMenu($menu);
                }
            });

            if ($menu.hasClass(config.optionMenuClass))
            {
                $menu.find('a').click(function (event)
                {
                    $menu.find('a').removeClass(config.selectedItemClass);
                    $(this).addClass(config.selectedItemClass);
                });
            }

            // If they provided a menuBar, hook up a mouseover
            if (config.menuBar !== undefined)
            {
                config.triggerButton.mouseover(function (event)
                {
                    // Look for other open menus in the menuBar
                    var $otherMenus =
                        config.menuBar.find('.' + config.menuOpenClass +
                        ':not(#' + $menu.attr('id') + ')');
                    // If we find some, then hide those and show this menu
                    if ($otherMenus.length > 0)
                    {
                        $otherMenus.each(function ()
                        {
                            hideMenu($(this));
                        });
                        showMenu($menu);
                    }
                });
            }
        });
    };

    //
    // private functions
    //

    /* Show a menu, and toggle the button state.  Start listening for
     *  document clicks to hide the menu */
    function showMenu($menu)
    {
        var config = $menu.data("config");
        $menu.addClass(config.menuOpenClass);
        config.triggerButton.addClass(config.triggerOpenClass);
        $(document).bind('click.' + $menu.attr('id'), function (event)
        {
            documentClickedHandler(event, $menu);
        });
    };

    /* Hide a menu, and toggle the button state.  Stop listening for
     *  document clicks */
    function hideMenu($menu)
    {
        var config = $menu.data("config");
        $menu.removeClass(config.menuOpenClass);
        config.triggerButton.removeClass(config.triggerOpenClass);
        $(document).unbind('click.' + $menu.attr('id'));
    };

    /* If they clicked on the document, check if they clicked outside the
     *  menu, or clicked on a link.  If so, close the menu */
    function documentClickedHandler(event, $menu)
    {
        var $target = $(event.target);
        if ($target.parents('#' + $menu.attr('id')).length == 0 ||
            $target.is('a') ||
            $target.parents('a').length > 0)
        {
            hideMenu($menu);
        }
    }

    //
    // plugin defaults
    //
    $.fn.dropdownMenu.defaults = {
        menuOpenClass: 'shown',
        triggerOpenClass: 'clicked',
        optionMenuClass: 'optionMenu',
        selectedItemClass: 'selected'
    };

})(jQuery);
