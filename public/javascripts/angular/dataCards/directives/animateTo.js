(function() {
  'use strict';

  /**
   * An attribute you can add to a tag, to have it animate between positions.
   * Assumptions:
   *   The position of the element is either fixed or absolute.
   *   There is one child element, and it is the one setting the background color.
   */
  angular.module('dataCards.directives').directive('animateTo', function() {
    var ANIMATION_DURATION = .5;
    var ANIMATION_STAGGER = .04;
    return {
      restrict: 'A',

      link: function($scope, element, attrs) {
        var jqueryWindow = $(window);
        var oldStyles;
        var child;
        var offsetParent = $(element[0].offsetParent);
        // An array of functions to run, to restore any transition-specific modifications we make
        var restoreFunctions;

        /**
         * Maps an absolute position to the fixed coordinate system.
         */
        function absToFixed(top) {
          return top + offsetParent.offset().top - jqueryWindow.scrollTop();
        }
        /**
         * Maps a fixed position to the absolute coordinate system.
         */
        function fixedToAbs(top) {
          return jqueryWindow.scrollTop() + top - offsetParent.offset().top;
        }

        function transitionEnd() {
          var jqEl = $(this);

          _.each(restoreFunctions, function(f) {
            f(jqEl);
          });
          restoreFunctions = null;
        }

        if (Modernizr.csstransitions) {
          $scope.$watch(attrs.animateTo, function(newStyles) {
            restoreFunctions = [];
            var styles = $.extend({}, newStyles);
            $scope.newStyles = newStyles;
            var animateToIndex = parseInt(attrs.animateToIndex, 10);
            // Don't animate if it's the first time setting the styles, or the index is -1
            if (oldStyles &&
                (!animateToIndex || animateToIndex > 0) &&
                !_.isEqual(oldStyles, styles)) {
              if (styles.position !== oldStyles.position) {
                // Transitioning from fixed-position to absolute-position (and vice-versa) sucks -
                // top/left have completely different reference points. SO - keep its position-property
                // the same (and translate the top/left to the cooresponding coordinate system) until
                // the transition ends, and THEN set the card's style to its final state (so scrolling
                // works as expected).
                if (styles.position === 'fixed') {
                  $.extend(styles, {
                    position: 'absolute',
                    top: fixedToAbs(styles.top)
                  });
                  restoreFunctions.push(function(curElement) {
                    curElement.css($scope.newStyles);
                  });
                } else {
                  $.extend(styles, {
                    position: 'fixed',
                    top: absToFixed(styles.top)
                  });
                  restoreFunctions.push(function(curElement) {
                    curElement.css($scope.newStyles);
                  });
                }
              }

              // fix the child in place to prevent unnecessary redraws during animation
              child = element.children();
              if (child.length === 1) {
                child.css(child.css(['width', 'height']));
                restoreFunctions.push(function() {
                  // Let the child readjust itself
                  child.css({width: '', height: ''});
                });

                // Animating a resize when the background is transparent is basically like not
                // animating at all...
                if (/rgba([^)]*, *0)|transparent/.test(element.css('background-color'))) {
                  element.css(child.css(['background-color']));
                  restoreFunctions.push(function(curElement) {
                    curElement.css('background-color', '');
                  });
                }
              }

              // Collapse animations don't mean much if you can see the child, and the child stays the
              // same size.
              styles.overflow = 'hidden';
              restoreFunctions.push(function(curElement) {
                curElement.css('overflow', '');
              });

              // The actual animation stuff
              styles.transition = 'all ' + ANIMATION_DURATION + 's ease-in-out';
              // Order animations as necessary
              if (animateToIndex) {
                styles.transition += ' ' + (animateToIndex * ANIMATION_STAGGER) + 's';
              }
              restoreFunctions.push(function(curElement) {
                // Remove transition - eg so during drag/drop, you don't interfere with the js
                // moving the card with the mouse
                curElement.css('transition', '');
              });
            }

            // IE won't fire transitionend during tests if the transition property isn't set before
            // the other properties... So set it separately. -_-;
            if (styles.transition) {
              element.css('transition', styles.transition);
              delete styles.transition;
            }
            element.css(styles);
            oldStyles = newStyles;
          });

          element.on('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
            transitionEnd);

          // Clean up
          $scope.$destroyAsObservable(element).subscribe(function() {
            element.off('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
              transitionEnd);
          });
        } else {
          // For IE9 - no animations for now
          $scope.$watch(attrs.animateTo, function(newStyles) {
            element.css(newStyles);
          });
        }
      }
    };
  });
})();
