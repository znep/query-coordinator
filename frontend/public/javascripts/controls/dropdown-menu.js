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
 *  forcePosition: Reassert the position of the menu when it is shown.  Use
 *      when the position might change (eg due to browser resizing or column
 *      resizing).
 *
 *  matchTriggerWidth: Set the width of the dropdown to the same as the width
 *      of the trigger upon shown — good if the width is difficult to style.
 *
 *  closeOnResize: Closes the menu if the browser is resized.  Repositioning
 *      the menu automatically can get sticky; this is a cleaner compromise.
 *
 * Author: jeff.scherpelz@blist.com
 */

(function($) {
  $.fn.dropdownMenu = function(options) {
    // build main options before element iteration
    var opts = $.extend({}, $.fn.dropdownMenu.defaults, options);

    // iterate and do stuff to each matched element
    return this.each(function() {
      var $menu = $(this);
      // build element specific options and store them on the menu
      // Dropdown menu can get re-called on an existing menu, and if
      // there are any pieces of data saved in the config, we need to carry
      // them over when we re-apply the config
      var config = $.meta ? $.extend({}, opts, $menu.data()) :
        $.extend({}, $menu.data('config-dropdownMenu'), opts);
      $menu.data('config-dropdownMenu', config);

      var $trigger = config.triggerButton ||
        $menu.closest(config.menuContainerSelector).find(config.triggerButtonSelector);
      $menu.data('triggerButton', $trigger);

      // Unhook any old handlers in case we're re-applying this
      $trigger.unbind('click.dropdownMenu.menu_trigger');
      // Hook up click handler to show menu
      $trigger.bind('click.dropdownMenu.menu_trigger', function(event) {
        event.preventDefault();
        if (config.openTest === undefined || config.openTest(event, $menu)) {
          event.stopPropagation();
          if (!$menu.hasClass(config.menuOpenClass)) {
            showMenu($menu);
          } else {
            hideMenu($menu);
          }
        }
      });

      $menu.unbind('close.dropdownMenu');
      $menu.bind('close.dropdownMenu', function() {
        hideMenu($menu);
      });

      // If they want a callback when a link is clicked, add it
      if (config.linkCallback !== undefined) {
        $menu.find('a').unbind('click.dropdownMenu.menu_callback').
          bind('click.dropdownMenu.menu_callback', function(event) {
            config.linkCallback(event, $menu, $trigger);
          });
      }

      /* Hook up submenu handlers */
      var $submenus = $menu.find(config.submenuSelector);
      if ($submenus.length > 0) {
        $submenus.unbind('click.dropdownMenu.menu_subclick').
          bind('click.dropdownMenu.menu_subclick', function(event) {
            // Only stop the event if we clicked on the a that launches
            //  this submenu.  Find all the direct links under this li,
            //  and check if we clicked on or in that a
            if ($(event.currentTarget).children('a').find('*').andSelf().index(event.target) >= 0) {
              event.stopPropagation();
            }
          }).
          unbind('mouseover.dropdownMenu.menu_subactivate').
          bind('mouseover.dropdownMenu.menu_subactivate',
            function(event) {
              activateSubmenu(event, $menu);
            });
        $menu.find('li').unbind('mouseover.dropdownMenu.menu_subclose').
          bind('mouseover.dropdownMenu.menu_subclose', function(event) {
            closeSubmenus(event, $menu);
          });
      }

      /* For all optionMenus, hook up special behavior */
      $menu.find(config.menuSelector).andSelf().
        filter(config.optionMenuSelector).
        children('li').
        unbind('click.dropdownMenu.menu_optclick').
        bind('click.dropdownMenu.menu_optclick', function() {
          $(this).closest(config.menuSelector).children('li').removeClass(config.selectedItemClass);
          $(this).closest('li').addClass(config.selectedItemClass);
        });

      /* If it's a multilevelMenu, hook up special behavior */
      if ($menu.is(config.multilevelMenuSelector)) {
        $menu.find(config.topLevelLinkSelector).
          unbind('click.dropdownMenu.menu_multilevel').
          bind('click.dropdownMenu.menu_multilevel', function(event) {
            event.stopPropagation();
          }).
          unbind('mouseover.dropdownMenu.menu_multilevel').
          bind('mouseover.dropdownMenu.menu_multilevel', function(event) {
            activateTopLevelOption(event, $menu);
          });
      }

      // If they provided a menuBar, hook up a mouseover
      if (config.menuBar !== undefined) {
        $trigger.unbind('mouseover.dropdownMenu.menu_menubar').
          bind('mouseover.dropdownMenu.menu_menubar', function() {
            // Look for other open menus in the menuBar
            var $otherMenus =
              config.menuBar.find('.' + config.menuOpenClass +
                ':not(#' + $menu.attr('id') + ')');
            // If we find some, then hide those and show this menu
            if ($otherMenus.length > 0) {
              $otherMenus.each(function() {
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
  function showMenu($menu) {
    var documentHeight = $(document).height();
    var config = $menu.data('config-dropdownMenu');
    // We've got to close all other menus; there can be only one!
    $(config.menuSelector + ':visible').each(function() {
      hideMenu($(this));
    });

    $menu.addClass(config.menuOpenClass);

    if (config.openCallback != null) {
      config.openCallback($menu);
    }

    var $trigger = $menu.data('triggerButton');
    $trigger.addClass(config.triggerOpenClass);
    $(document).bind('click.' + $menu.attr('id'), function(event) {
      documentClickedHandler(event, $menu);
    });

    // If they want any keyup to close the window, hook it up.
    if (config.closeOnKeyup) {
      $(document).one('keyup', function() {
        hideMenu($menu);
      });
    }

    if (config.matchTriggerWidth) {
      $menu.width($trigger.outerWidth(false));
    }

    if (config.forcePosition) {
      $menu.css('left', $trigger.position().left);
      $menu.css('top', $trigger.position().top + $trigger.outerHeight(true));
    }

    if (config.pullToTop) {
      config._origPosition = $menu.position();
      var offsetPos = $menu.offset();
      offsetPos.top += $menu.offsetParent().scrollTop();
      $menu.css(offsetPos).appendTo('body');
    }

    if (config.closeOnResize) {
      $(window).one('resize', function() {
        hideMenu($menu);
      });
    }

    // Check if we need to restore the original width first
    if (config._origWidth) {
      $menu.css('width', config._origWidth);
    }

    // Check if the menu is wider or taller than the window
    if ($menu.offset().left + $menu.outerWidth(true) > $(window).width()) {
      // if the menu can be flipped left, do so; otherwise, crop it
      if ($trigger.offset().left + $trigger.outerWidth(true) -
        $menu.outerWidth(true) < 0) {
        config._origWidth = $menu.css('width');
        $menu.css('width', $(window).width() - $menu.offset().left - 5);
      } else {
        $menu.css('left', $menu.position().left -
          ($menu.outerWidth(true) - $trigger.outerWidth(true)));
      }
    }

    if ($menu.offset().top + $menu.outerHeight(false) > documentHeight) {
      // if the menu can be flipped up, do so; otherwise, leave it alone
      if ($trigger.offset().top - $menu.outerHeight(true) > 0) {
        $menu.css('top', $menu.position().top -
          ($menu.outerHeight(true) + $trigger.outerHeight(true)));
      }
    }
  }

  /* Hide a menu, and toggle the button state.  Stop listening for
   *  document clicks */
  function hideMenu($menu) {
    var config = $menu.data('config-dropdownMenu');
    if (!config) {
      return;
    }

    var $trigger = $menu.data('triggerButton');
    if (config.pullToTop && $trigger[0].parentNode) {
      $menu.css(config._origPosition).insertAfter($trigger);
    }

    $menu.removeClass(config.menuOpenClass);
    // Close any submenus
    closeSubmenus(null, $menu);

    $trigger.removeClass(config.triggerOpenClass);
    $(document).unbind('click.' + $menu.attr('id'));
  }

  function closeSubmenus(event, $menu) {
    var config = $menu.data('config-dropdownMenu');
    $menu.find('.' + config.menuOpenClass).each(function() {
      if (!event ||
        ($(this).find('*').index(event.currentTarget) < 0 &&
          $(this).parents('*').index(event.currentTarget) < 0)) {
        $(this).removeClass(config.menuOpenClass);
      }
    });
  }

  /* If they clicked on the document, check if they clicked outside the
   *  menu, or clicked on a link.  If so, close the menu */
  function documentClickedHandler(event, $menu) {
    var $target = $(event.target);
    if ($target.parents('*').index($menu[0]) < 0 ||
      $target.is('a:not(.noClose)') ||
      $target.parents('a:not(.noClose)').length > 0) {
      hideMenu($menu);
    }
  }

  function activateTopLevelOption(event, $menu) {
    var config = $menu.data('config-dropdownMenu');
    closeSubmenus(null, $menu);
    $menu.find('.' + config.activeClass).removeClass(config.activeClass);
    $(event.currentTarget).closest('li').addClass(config.activeClass);
  }

  function activateSubmenu(event, $menu) {
    var config = $menu.data('config-dropdownMenu');
    var $submenus = $(event.currentTarget).children(config.menuSelector);
    $submenus.addClass(config.menuOpenClass);
    $submenus.css('top', Math.min(0,
      $(window).height() + $(window).scrollTop() -
      ($submenus.offsetParent().offset().top +
        $submenus.outerHeight(true))));
    $submenus.css('left', '');
    if ($(window).width() < $submenus.offset().left +
      $submenus.outerWidth(true)) {
      $submenus.css('left', -$submenus.outerWidth(true) + 5);
    }
  }

  //
  // plugin defaults
  //
  $.fn.dropdownMenu.defaults = {
    activeClass: 'active',
    closeOnKeyup: false,
    forcePosition: false,
    matchTriggerWidth: false,
    menuContainerSelector: 'li',
    menuOpenClass: 'shown',
    menuSelector: 'ul.menu',
    multilevelMenuSelector: '.multilevelMenu',
    openCallback: function() {},
    optionMenuSelector: '.optionMenu',
    pullToTop: false,
    selectedItemClass: 'checked',
    submenuSelector: '.submenu',
    topLevelLinkSelector: 'dt a',
    triggerButtonSelector: 'a.dropdownLink',
    triggerOpenClass: 'clicked'
  };

})(jQuery);
