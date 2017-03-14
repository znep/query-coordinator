/* Reorderable List widget
 * Allows users to choose items to use and ignore, and order those that
 * are used.
 *
 * Note that all list items should be the same height.
 *
 * author: clint.tseng@socrata.com
 */

(function($) {
  $.fn.reorderableList = function(options) {
    var opts = $.extend({}, $.fn.reorderableList.defaults, options);

    // Helper for the sake of sorting the items; sorts such that
    // the draggable item is offset by half an item
    var getOffsetHeight = function(elem, other) {
      var $elem = $(elem);
      var result = $elem.position().top;
      if ($elem.hasClass('ui-draggable-dragging')) {
        if ($(other).position().top < result) {
          result -= $elem.outerHeight(false) / 2;
        } else {
          result += $elem.outerHeight(false) / 2;
        }
      }
      return result;
    };

    // Helper to get the relatively positioned offset given the
    // expected absolute offset from the parent
    var getRelativeOffset = function($elem, absoluteOffset) {
      return absoluteOffset - ($elem.data('reorderableList-initialOrder') * $elem.outerHeight(true));
    };

    // Reposition and renumber the items while dragging is occurring
    var orderListItems = function($listItems, config, skipAnimation) {
      // Abort if we're in a state of flux
      if ($listItems.filter(':animated').length > 0) {
        return;
      }

      var $sorted = $($listItems.get().sort(function(a, b) {
        return getOffsetHeight(a, b) - getOffsetHeight(b, a);
      }));

      $sorted.each(function(i) {
        var $this = $(this);
        $this.find(config.orderFieldSelector).val(i);
        $this.find(config.orderSpanSelector).text(i + 1);
        $this.data('reorderableList-order', i);

        // Remove the upper border on the first list item
        if (i === 0) {
          $this.addClass(config.firstListItemClass);
        } else {
          $this.removeClass(config.firstListItemClass);
        }

        // Do not move the dragging item
        if (!$this.hasClass('ui-draggable-dragging')) {
          // Do not move if there's no reason to
          var targetY = getRelativeOffset($this, (i * $this.outerHeight(true))) + 'px';
          if (targetY !== $this.css('top')) {
            if (skipAnimation) {
              $this.stop().css('top', targetY);
            } else {
              $this.stop().animate({ top: targetY }, 'fast', 'linear');
            }
          }
        }
      });
    };

    // Fill in initial internal tracking data
    var initListItems = function($listItems, config) {
      var $sorted = $($listItems.get().sort(function(a, b) {
        return ($(a).find(config.orderFieldSelector).val() || 0) -
          ($(b).find(config.orderFieldSelector).val() || 0);
      }));

      $sorted.each(function(i) {
        var $item = $(this);
        $item.data('reorderableList-initialOrder', i);
        $item.data('reorderableList-order', i);
        $item.css('top', '');

        if (i === 0) {
          $item.addClass(config.firstListItemClass);
        }
      });
    };

    // Move a list item to the active list and set data
    var moveItemToActiveList = function($elem, $list, config) {
      // abort if we're already there or there is no selected item
      if (($elem.length == 0) || ($elem.parents('.activeList').length > 0)) {
        return;
      }

      $list.append($elem);
      $elem.find(config.orderSpanSelector).removeClass('hide');
      $elem.draggable('enable');

      var itemCount = $list.find('li').length;
      $elem.find(config.orderFieldSelector).val(itemCount - 1);
      $elem.find(config.activeFieldSelector).val(true);
      $elem.find(config.orderSpanSelector).text(itemCount);
      $elem.data('reorderableList-order', itemCount - 1);
      $elem.data('reorderableList-initialOrder', itemCount - 1);

      if ($elem.is(':first-child')) {
        $elem.addClass(config.firstListItemClass);
      }

      config.onChange();
    };

    // Move a list item to the inactive list and set data
    var moveItemToInactiveList = function($elem, $list, config) {
      // abort if we're already there or there is no selected item
      if (($elem.length == 0) || ($elem.parents('.inactiveList').length > 0)) {
        return;
      }

      $elem.stop(); // stop animation

      var $siblings = $elem.siblings('li');

      // bump up the lower elements' offset calculations
      var cutoff = $elem.data('reorderableList-initialOrder');
      $siblings.each(function() {
        var $item = $(this);
        var index = $item.data('reorderableList-initialOrder');
        if (index > cutoff) {
          $item.data('reorderableList-initialOrder', index - 1);
        }
      });

      $list.append($elem);
      $elem.find(config.orderSpanSelector).addClass('hide');
      $elem.draggable('disable');

      $elem.removeClass(config.firstListItemClass);
      $elem.css('top', 0);

      $elem.find(config.activeFieldSelector).val(false);

      orderListItems($siblings, config, true);

      config.onChange();
    };

    return this.each(function() {
      var $this = $(this);

      var config = $.meta ? $.extend({}, opts, $this.data()) : opts;
      $this.data('config-reorderableList', config);

      // Make items in both lists draggable
      $this.find('.activeList li' +
        (config.enableInactiveList ? ', .inactiveList li' : '')).draggable({
        axis: 'y',
        containment: 'parent',
        distance: 3,
        start: function() {
          $this.find('.activeList').removeClass('ui-draggable-not-dragging');
        },
        drag: function() {
          orderListItems($this.find('.activeList li'), config);
        },
        stop: function() {
          config.onChange();
          $this.find('.activeList').addClass('ui-draggable-not-dragging');
          var $item = $(this);
          $item.stop().animate({
            top: getRelativeOffset(
              $item,
              ($item.data('reorderableList-order') * ($item.outerHeight(true) + 1))
            ) + 'px'
          }, 'fast', 'linear');
        }
      });

      // Set not dragging class
      $this.find('.activeList').addClass('ui-draggable-not-dragging');

      if (config.enableInactiveList) {
        // Disable dragging on the inactive list items
        $this.find('.inactiveList li').draggable('disable');
      }

      // Set default data on list items
      initListItems($this.find('.activeList li'), config);

      if (config.enableInactiveList) {
        // Wire up click behavior on list items
        $this.find('li').mousedown(function() {
          $this.find('.' + config.selectedListItemClass).removeClass(config.selectedListItemClass);
          $(this).addClass(config.selectedListItemClass);
        });

        $this.find('li').dblclick(function() {
          var $item = $(this);
          $item.removeClass('hover');
          if ($item.parents('.activeList').length == 0) {
            moveItemToActiveList($item, $this.find('.activeList ul'),
              config);
          } else {
            moveItemToInactiveList($item, $this.find('.inactiveList ul'),
              config);
          }
        });
      }

      // Wire up manual hover for IE's sake, because IE is awesome
      $this.find('li').mouseover(function() {
        $(this).addClass('hover');
      });
      $this.find('li').mouseout(function() {
        $(this).removeClass('hover');
      });

      if (config.enableInactiveList) {
        // Wire up click behavior on arrow buttons
        $this.find(config.addItemButtonSelector).click(function(event) {
          event.preventDefault();
          moveItemToActiveList($this.find('.' + config.selectedListItemClass),
            $this.find('.activeList ul'), config);
        });
        $this.find(config.removeItemButtonSelector).click(function(event) {
          event.preventDefault();
          moveItemToInactiveList($this.find('.' +
              config.selectedListItemClass), $this.find('.inactiveList ul'),
            config);
        });

        // Wire up behavior on add all button
        $this.find(config.addAllLinkSelector).click(function(event) {
          event.preventDefault();
          var $items = $this.find('.inactiveList li');
          $items.find(config.orderSpanSelector).removeClass('hide');
          $items.find(config.activeFieldSelector).val(true);
          $items.css('top', 0);
          $items.draggable('enable');
          var activeNum = $this.find('.activeList li').length;

          $items.each(function(i, item) {
            var curI = i + activeNum;
            var $item = $(item);
            $item.find(config.orderFieldSelector).val(curI);
            $item.find(config.orderSpanSelector).text(curI + 1);
            $item.data('reorderableList-order', curI);
            $item.data('reorderableList-initialOrder', curI);
          });

          $this.find('.activeList ul').append($items);
          $this.find('.activeList li:first').addClass(config.firstListItemClass);

          config.onChange();
        });

        // Wire up behavior on remove all button
        $this.find(config.removeAllLinkSelector).click(function(event) {
          event.preventDefault();
          var $items = $this.find('.activeList li');
          $items.find(config.orderSpanSelector).addClass('hide');
          $items.find(config.activeFieldSelector).val(false);
          $items.removeClass(config.firstListItemClass);
          $items.css('top', 0);
          $items.draggable('disable');
          $this.find('.inactiveList ul').append($items);
          config.onChange();
        });
      }
    });
  };

  $.fn.reorderableList_updateFromData = function() {
    var $this = $(this);
    var config = $this.data('config-reorderableList');
    var $sorted = $($this.find('li').get().sort(function(a, b) {
      return ($(a).find(config.orderFieldSelector).val() || 0) -
        ($(b).find(config.orderFieldSelector).val() || 0);
    }));

    $this.find('.inactiveList ul').append($sorted);
    $sorted.find(config.orderSpanSelector).addClass('hide');
    $sorted.removeClass(config.firstListItemClass);
    $sorted.draggable('disable');
    $sorted.css('top', 0);

    $sorted.filter(':has(' + config.activeFieldSelector + '[value="true"])').each(function(i) {
      var $item = $(this);
      $this.find('.activeList ul').append($item);
      $item.find(config.orderSpanSelector).removeClass('hide');
      $item.find(config.orderFieldSelector).val(i);
      $item.find(config.orderSpanSelector).text(i + 1);
      $item.data('reorderableList-order', i);
      $item.data('reorderableList-initialOrder', i);
      $item.draggable('enable');

      if ($item.is(':first-child')) {
        $item.addClass(config.firstListItemClass);
      }
    });
  };

  // default options
  $.fn.reorderableList.defaults = {
    activeFieldSelector: '.activeField',
    orderFieldSelector: '.orderField',
    orderSpanSelector: '.orderIndex',
    firstListItemClass: 'first-child',
    selectedListItemClass: 'reorderList-selected',
    addItemButtonSelector: '.addItemButton',
    addAllLinkSelector: '.addAllLink',
    removeItemButtonSelector: '.removeItemButton',
    removeAllLinkSelector: '.removeAllLink',
    enableInactiveList: true,
    onChange: function() {}
  };

})(jQuery);
