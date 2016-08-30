(function($) {
  $.fn.tickerLayout = function(opts) {
    var $ticker = this;
    var $tickerChildrenContainer = $ticker.children('.tickerLayoutChildren');
    var $tickerChildren = $tickerChildrenContainer.children();
    var $firstChild = $tickerChildren.first();
    var $currentChildName = $ticker.find('.currentChildName');

    var $activePane = $firstChild;

    // wire up autorotate
    var rotationTimer = null;
    var rotationSuppressed = false;
    var setAutorotate = function() {
      clearTimeout(rotationTimer);
      if (!rotationSuppressed && _.isNumber(opts.rotationInterval) && (opts.rotationInterval > 0)) {
        rotationTimer = setTimeout(function() {
          var $nextPane = $activePane.next();
          if ($nextPane.length === 0) {
            $nextPane = $firstChild;
          }
          activatePane($nextPane);
        }, (opts.rotationInterval * 1000));
      }
    };
    $ticker.hover(function() {
      rotationSuppressed = true;
      clearTimeout(rotationTimer);
    }, function() {
      rotationSuppressed = false;
      setAutorotate();
    });
    setAutorotate();

    // base action
    var activatePane = function($pane) {
      var currentIndex = $pane.prevAll().length;

      if (!$.support.svg) {
        // IE7 and older have issues clipping charts correctly.
        // also, idiot installations of IE9 that have been forced to use
        // the IE7 renderer for some fucking reason
        // LOOK AT US WE'RE USING MODERN TECHNOLOGY. IT'S STEAM POWERED OLOLOLOLOLOLOLOL
        $tickerChildren.hide();
        $pane.show();
        $tickerChildrenContainer.height($pane.outerHeight(false));

        // since the chart isn't rendered properly when display:none'd, we need to rerender
        $(window).resize();
      } else {
        var totalHeight = 0;
        $pane.prevAll().each(function() {
          totalHeight -= $(this).outerHeight(false);
        });

        if (opts.rotationType == 'slide') {
          $firstChild.stop().animate({
            marginTop: totalHeight
          }, 1000);
          $tickerChildrenContainer.stop().animate({
            height: $pane.outerHeight(false)
          }, 1000);
        } else if (opts.rotationType == 'instant') {
          $firstChild.css('margin-top', totalHeight);
          $tickerChildrenContainer.height($pane.outerHeight(false));
        }
      }

      $currentChildName.text(opts.childTitles[currentIndex]);
      $('.currentPage').text(currentIndex + 1);

      $activePane = $pane;
      setAutorotate();
    };

    activatePane($activePane);
    $tickerChildren.css('visibility', 'visible');

    // wire up pagers
    var $incrementalPager = $ticker.find('.incrementalPager');
    if ($incrementalPager.length > 0) {
      $incrementalPager.find('.prevPageButton').click(function(event) {
        event.preventDefault();
        var $prevPane = $activePane.prev();
        if ($prevPane.length === 0) {
          return;
        }
        activatePane($prevPane);
      });
      $incrementalPager.find('.nextPageButton').click(function(event) {
        event.preventDefault();
        var $nextPane = $activePane.next();
        if ($nextPane.length === 0) {
          return;
        }
        activatePane($nextPane);
      });
    }

    // When RTM adds a node and shows it, it triggers a window resize; so
    // re-show the current item to get the correct size
    $(window).one('resize', function() {
      activatePane($activePane);
    });
  };
})(jQuery);
