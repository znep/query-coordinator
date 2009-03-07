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
 *      shown/hidden
 *
 *  optionMenuSelector: Selector that determines if a menu is an option menu,
 *      which means that you have one selected a at a time
 *
 *  selectedItemClass: Class to apply to the single selected item in an optionMenu
 *
 *  menuSelector: Selector to find (sub) menus
 *
 *  submenuSelector: Selector to find item containers for submenus; i.e.,
 *      the menu item that contains a submenu
 *
 *  activeClass: Class to use for the active menu item for the top level of
 *      a multilevel menu
 *
 *  multilevelMenuSelector: Selector to determine if a menu is a multilevel menu
 *
 *  topLevelLinkSelector: Selector to find the top-level links for a multilevel menu
 *
 *  pullToTop: Whether or not to pull the menu out of the container into the top
 *      level of the HTML.  This allows it to escape scrollbars or other
 *      limitations of the container.  The disadvantage is that the menu is
 *      no longer if the same contaienr as the link, which can make manipulation
 *      or styling more difficult.  Also, the menuBar option does not work with
 *      this option.  Defaults to false.
 *
 *  triggerButton: (no default) jQuery object that is the button to use to show
 *      the menu
 *
 *  menuBar: (no default) jQuery object in which to link other menus.  If
 *      another menu in this menu bar is open, then this menu will be triggered
 *      on mouseover, instead of click.  The other open menu(s) will be closed.
 *      If menuBar is used, menuOpenClass must be used only for open menus
 *      controlled by this plugin, and must be the same menuOpenClass used for
 *      all menus in the menuBar.
 *
 *  linkCallback: (no default) Function to call whenever a link in the menu
 *      is clicked.  It passes three parameters: the event, the jQuery menu,
 *      and the jQuery button that triggered the menu
 *      The advantage to using this instead of adding your own click handler
 *      outside the menu is that this will pass in the menu & trigger button
 *
 *  openTest: (no default) Function to call for whether or not the menu should
 *      actually open when clicked.  It is called whenever the triggerButton is
 *      is clicked to open the menu, and passes in the event and the jQuery menu.
 *      It should return true if the menu should open, false otherwise.  If no
 *      function is set for openTest, the menu will always open.
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
                if (config.openTest === undefined || config.openTest(event, $menu))
                {
                    if (!$menu.hasClass(config.menuOpenClass))
                    {
                        event.stopPropagation();
                        showMenu($menu);
                    }
                }
            });

            // If they want a callback when a link is clicked, add it
            if (config.linkCallback !== undefined)
            {
                $menu.find('a').click(function (event)
                {
                    config.linkCallback(event, $menu, config.triggerButton);
                });
            }

            /* Hook up submenu handlers */
            var $submenus = $menu.find(config.submenuSelector);
            if ($submenus.length > 0)
            {
                $submenus.click(function (event)
                {
                    // Only stop the event if we clicked on the a that launches
                    //  this submenu.  Find all the direct links under this li,
                    //  and check if we clicked on or in that a
                    if ($(event.currentTarget).children('a')
                        .find('*').andSelf().index(event.target) >= 0)
                    {
                        event.stopPropagation();
                    }
                }).mouseover(function (event)
                {
                    activateSubmenu(event, $menu);
                });
                $menu.find('li').mouseover(function (event)
                {
                    closeSubmenus(event, $menu);
                });
            }

            /* For all optionMenus, hook up special behavior */
            $menu.find(config.menuSelector).andSelf()
                .filter(config.optionMenuSelector)
                .children('li').click(function (event)
                {
                    $(this).closest(config.menuSelector)
                        .children('li').removeClass(config.selectedItemClass);
                    $(this).closest('li').addClass(config.selectedItemClass);
                });

            /* If it's a multilevelMenu, hook up special behavior */
            if ($menu.is(config.multilevelMenuSelector))
            {
                $menu.find(config.topLevelLinkSelector).click(function (event)
                {
                    event.stopPropagation();
                }).mouseover(function (event)
                {
                    activateTopLevelOption(event, $menu);
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
        // We've got to close all other menus; there can be only one!
        $(config.menuSelector).each(function () { hideMenu($(this)) });

        $menu.addClass(config.menuOpenClass);
        config.triggerButton.addClass(config.triggerOpenClass);
        $(document).bind('click.' + $menu.attr('id'), function (event)
        {
            documentClickedHandler(event, $menu);
        });

        if (config.pullToTop)
        {
            config.origPosition = $menu.position();
            var offsetPos = $menu.offset();
            offsetPos.top += $menu.offsetParent().scrollTop();
            $menu.css(offsetPos).appendTo('body');
        }
    };

    /* Hide a menu, and toggle the button state.  Stop listening for
     *  document clicks */
    function hideMenu($menu)
    {
        var config = $menu.data("config");
        if (!config)
        {
            return;
        }

        if (config.pullToTop)
        {
            $menu.css(config.origPosition).insertAfter(config.triggerButton);
        }

        $menu.removeClass(config.menuOpenClass);
        // Close any submenus
        closeSubmenus(null, $menu);
        config.triggerButton.removeClass(config.triggerOpenClass);
        $(document).unbind('click.' + $menu.attr('id'));
    };

    function closeSubmenus(event, $menu)
    {
        var config = $menu.data("config");
        $menu.find('.' + config.menuOpenClass).each(function ()
        {
            if (!event ||
                ($(this).find('*').index(event.currentTarget) < 0 &&
                $(this).parents('*').index(event.currentTarget) < 0))
            {
                $(this).removeClass(config.menuOpenClass);
            }
        });
    };

    /* If they clicked on the document, check if they clicked outside the
     *  menu, or clicked on a link.  If so, close the menu */
    function documentClickedHandler(event, $menu)
    {
        var $target = $(event.target);
        if ($target.parents('*').index($menu[0]) < 0 ||
            $target.is('a') ||
            $target.parents('a').length > 0)
        {
            hideMenu($menu);
        }
    };

    function activateTopLevelOption(event, $menu)
    {
        var config = $menu.data("config");
        closeSubmenus(null, $menu);
        $menu.find('.' + config.activeClass)
            .removeClass(config.activeClass);
        $(event.currentTarget).closest('li').addClass(config.activeClass);
    };

    function activateSubmenu(event, $menu)
    {
        var config = $menu.data("config");
        $(event.currentTarget).children(config.menuSelector).
            addClass(config.menuOpenClass);
    };

    //
    // plugin defaults
    //
    $.fn.dropdownMenu.defaults = {
        menuSelector: 'ul.menu',
        menuOpenClass: 'shown',
        triggerOpenClass: 'clicked',
        optionMenuSelector: '.optionMenu',
        selectedItemClass: 'checked',
        submenuSelector: '.submenu',
        activeClass: 'active',
        multilevelMenuSelector: '.multilevelMenu',
        topLevelLinkSelector: 'dt a',
        pullToTop: false
    };

})(jQuery);
