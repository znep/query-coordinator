(function($) {
  // Scroll the meta tabs into view.
  $.fn.scrollTabs = function(options) {
    var opts = $.extend({}, $.fn.scrollTabs.defaults, options);

    return this.each(function() {
      var $this = $(this);

      // Support for the Metadata Plugin.
      var config = $.meta ? $.extend({}, opts, $this.data()) : opts;
      $this.data('config-scrollTabs', config);

      $(window).resize(function() {
        resizeHandler($this);
      });
      resizeHandler($this);
    });

    function resizeHandler($this) {
      var config = $this.data('config-scrollTabs');
      if (needsScrolling($this)) {
        $(config.scrollArrowsSelector).show();

        // Initially, set the state of the arrow buttons.
        $(config.scrollArrowPrevSelector).addClass('disabled');

        $(config.scrollArrowsSelector + '.disabled a').
          live('click', function(event) {
            event.preventDefault();
          });
        $(config.scrollArrowsSelector + ":not('.disabled') a").
          live('click', function(event) {
            event.preventDefault();
            var $a = $(this);

            if ($a.closest('li').is('.prev')) {
              scrollPrevious($this);
            } else {
              scrollNext($this);
            }

            updateArrowStates($this);
          });
      } else {
        $(config.scrollArrowsSelector).hide();
        $(config.scrollArrowPrevSelector).removeClass('disabled');
        $(config.scrollArrowsSelector + '.disabled a').die('click');
        $(config.scrollArrowsSelector + ":not('.disabled') a").die('click');
      }
    }

    function needsScrolling($this) {
      var config = $this.data('config-scrollTabs');
      var tabsWidth = 0;
      $(config.scrollableSelector).each(function() {
        tabsWidth += $(this).outerWidth();
      });
      return tabsWidth > $(config.containerSelector).width();
    }

    function updateArrowStates($this) {
      var config = $this.data('config-scrollTabs');

      var $prev = $(config.scrollArrowPrevSelector);
      var $next = $(config.scrollArrowNextSelector);

      // If there are any tabs scrolled away, enable the previous button.
      if ($('.' + config.scrolledAwayClass).length > 0) {
        $prev.removeClass('disabled');
      } else {
        $prev.addClass('disabled');
      }

      // Adjust the container width to account for prev/next arrows.
      var adjustedContainerWidth = $(config.containerSelector).width() -
        ($prev.outerWidth() + $next.outerWidth());

      var visibleTabsSelector = config.scrollableSelector + ":not('." + config.scrolledAwayClass + "')";

      // Determine the width of the visible tabs.
      var visibleTabsWidth = 0;
      $(visibleTabsSelector).each(function() {
        visibleTabsWidth += $(this).outerWidth();
      });

      // If the visible tabs are wider than the adjusted container, enable the next button.
      if (visibleTabsWidth > adjustedContainerWidth) {
        $next.removeClass('disabled');
      } else {
        $next.addClass('disabled');
      }
    }

    function scrollPrevious($this) {
      var config = $this.data('config-scrollTabs');

      var $tabToScrollIn = $($(config.scrollableSelector + '.' + config.scrolledAwayClass + ':last'));

      var scrolledAwayWidth = 0;
      $('.' + config.scrolledAwayClass).each(function() {
        scrolledAwayWidth += $(this).outerWidth();
      });

      var newMargin = scrolledAwayWidth - $tabToScrollIn.outerWidth();
      $(config.listSelector).animate({
        marginLeft: '-' + newMargin + 'px'
      });

      $tabToScrollIn.removeClass(config.scrolledAwayClass);
    }

    function scrollNext($this) {
      var config = $this.data('config-scrollTabs');

      var $tabToScrollOff = $($(config.scrollableSelector + ":not('." + config.scrolledAwayClass + "'):first"));

      var scrolledAwayWidth = 0;
      $('.' + config.scrolledAwayClass).each(function() {
        scrolledAwayWidth += $(this).outerWidth();
      });

      var newMargin = scrolledAwayWidth + $tabToScrollOff.outerWidth();
      $(config.listSelector).animate({
        marginLeft: '-' + newMargin + 'px'
      });

      $tabToScrollOff.addClass(config.scrolledAwayClass);
    }

  };

  // default options
  $.fn.scrollTabs.defaults = {
    containerSelector: '#widgetMeta .header',
    listSelector: 'ul.summaryTabs',
    scrollableSelector: 'ul.summaryTabs li.scrollable',
    scrollArrowsSelector: 'ul.summaryTabs li.scrollArrow',
    scrollArrowPrevSelector: 'ul.summaryTabs li.prev',
    scrollArrowNextSelector: 'ul.summaryTabs li.next',
    scrolledAwayClass: 'scrolledAway'
  };

})(jQuery);
