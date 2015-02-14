// A directive to encapsulate the dotdotdot multiline ellipsis functionality
// Attributes:
//   max-lines: int. Max number of lines.
//   tolerance: Tolerance in height computation. Pixels. Used to account for rendering differences.
//   show-more-mode: One of ["expand-link", "alt-text"]. Controls how expanding text is handled. Defaults to expand-link.
//     expand-link: A show-more link (class: show-more). You need to style this yourself to have content. The default.
//     title-attr: Just use browser title attribute.
//   expanded: Whether or not the text is expanded. Two-way binding.
//
// Example:
// <div multiline-ellipsis max-lines="2" tolerance="2" show-more-mode="expand-link" text="{{large_multi_line_content}}"></div>
angular.module('dataCards.directives').directive('multilineEllipsis', function($q, AngularRxExtensions, FlyoutService) {
  return {
    scope: {
      'maxLines': '@',
      'tolerance': '@',
      'text': '@',
      'animationDuration': '@',
      'expanded': '='
    },
    template: '<div class="content" title="{{contentTitleAttr}}"></div>' +
      '<div ng-if="showMoreMode == \'expand-link\'" class="show-more" ng-class="{less: expanded, clamped: textClamped}" ng-click="$parent.expanded = !expanded"><span class="show-more-arrow"></span></div>',
    restrict : 'A',

    link: function($scope, element, attrs) {
      var content = element.find('.content');
      var contentFlyoutClass;

      AngularRxExtensions.install($scope);

      $scope.showMoreMode = attrs['showMoreMode'] || 'expand-link';

      if ($scope.showMoreMode === 'flyout') {
        contentFlyoutClass = _.uniqueId('multiline-ellipsis-flyout-');
        content.addClass(contentFlyoutClass);
      }

      // Hello! My name is col. hack! (P.S. 16px * 1.5 == 24px)
      var lineHeight = function() {
        var lineHeight = parseInt(element.css('line-height'), 10);
        if (lineHeight) {
          return lineHeight;
        }
        // The line height isn't conveniently set for us. Derive it by adding an inline element and
        // measuring its size.
        var sample = $('<span />').text("\ufeff"). // feff is the zero-width space.
            // chrome sizes it differently if it's inline vs inline-block
            css('display', 'inline-block').
            appendTo(content);
        lineHeight = sample.height();
        sample.remove();
        return lineHeight;
      };

      $scope.toggleExpanded = function() {
        $scope.expanded = !$scope.expanded;
      };

      var lastText = null;
      var animationRunning = false;
      var animationDuration = isNaN(parseInt($scope.animationDuration, 10)) ? 500 : parseInt($scope.animationDuration, 10);

      // Animate the (max) height of the content
      // between the provided values.
      // Returns a promise that will be resolved
      // when the animation completes or is canceled.
      function animateHeight(from, to) {
        animationRunning = true;
        var defer = $q.defer();
        content.css('max-height', from);
        content.animate( {
          'max-height': to
        }, {
          easing: 'socraticEase',
          duration: animationDuration,
          always: function() { defer.resolve(); }
        });
        return defer.promise;
      }

      // Cancels any running height animation and allows the content
      // to return to its natural height.
      function resetHeightAnimation() {
        animationRunning = false;
        content.stop();
        content.css('max-height', 'none');
      }

      if ($scope.showMoreMode === 'flyout') {
        FlyoutService.register(contentFlyoutClass, function() {
          if (content.triggerHandler('isTruncated')) {
            return '<div class="flyout-title">{0}</div>'.format($scope.text);
          } else {
            return undefined;
          }
        }, $scope.eventToObservable('$destroy'));
      }

      // We _could_ support maintaining the height animation if these are changed
      // while animating, but I value my sanity more.
      // Note that this does _not_ care about element dimensions, as otherwise
      // we'd cancel the animation by virtue of animating the height :)
      Rx.Observable.merge(
        $scope.observe('text'),
        $scope.observe('maxLines'),
        $scope.observe('tolerance'),
        $scope.observe('expanded')
      ).subscribe(resetHeightAnimation);

      // Track whether or not we ever rendered. This is used to prevent expansion animations
      // on first render.
      var everRendered = false;

      Rx.Observable.subscribeLatest(
        element.observeDimensions().throttle(100), // Mild throttling. This is to:
                                                   // 1) Not waste time on spurious size changes on initial load.
                                                   // 2) Ignore spurious incorrect size notifications on IE9,
                                                   //    which can cause infinite loops (IE will notify us of
                                                   //    old sizes occasionally and then immediately correct
                                                   //    itself. This causes us to bounce between two sizes).
        $scope.observe('text'),
        $scope.observe('maxLines'),
        $scope.observe('tolerance'),
        $scope.observe('expanded'),
        function(dimensions, text, maxLines, tolerance, expanded) {
          // If something important changed, the previous merge will cancel the animation.
          if (animationRunning) return;

          // While animating from expanded to collapsed, we lie to dotdotdot so it doesn't
          // try to ellipsify during the animation. However, the UI should still act as if
          // an ellipsis has been added.
          var forceReportAsClamped = false;

          maxLines = parseInt(maxLines);
          tolerance = parseInt(tolerance);

          // Dotdotdot overrides the default jQuery .text().
          // This sets the stage for the exposure of a nasty
          // bug in dotdotdot (update.dot's handler is not reentrant).
          // What ends up happening is that:
          //  1) this .text invalidates the size of the text dom nodes.
          //  2) the call to content.dotdotdot below triggers an update.dot.
          //  3) update.dot does an innocuous-looking check against the text
          //     node's height.
          //  3a) This causes IE to notice the size invalidation in step 1. This raises a resize event, re-invoking this function.
          //  3b) This ends up triggering update.dot again. Update.dot clears out some global state ($inr) used by the original
          //      update.dot call from step (2).
          //  4) Null ref thrown from update.dot, which breaks the ellipsis.
          // So, to break this loop, we don't set the text unless we really need to. There's still potential
          // for looping if the text is a function of the element size, but that would be silly. But if you're reading
          // this comment, I give it a 50% chance this has actually happened :)
          if (lastText !== text) {
            lastText = text;
            content.text(text);
          }

          // Since we react to changes in the "expanded" binding, this
          // value represents the UI state we want to be in. This might mean
          // we need to start an animation to this UI state if we're currently
          // showing the old state.
          if (expanded) {
            var needsAnimation = everRendered && content.triggerHandler('isTruncated');
            var currentUnexpandedHeight = content.height();

            content.dotdotdot({
              height: Infinity,
              tolerance: tolerance
            });

            if (needsAnimation) {
              // We just told dotdotdot to use infinite height, so this will be the expanded height.
              var fullHeight = content.height();

              animateHeight(currentUnexpandedHeight, fullHeight).then(resetHeightAnimation);
            }
          } else {
            var currentExpandedHeight = content.height();
            var targetCollapsedHeight = lineHeight() * maxLines;
            var currentlyTruncated = content.triggerHandler('isTruncated');
            var wouldBeTruncated = targetCollapsedHeight < currentExpandedHeight - tolerance;
            var needsAnimation = everRendered && !currentlyTruncated && wouldBeTruncated;

            function applyEllipsis() {
              content.dotdotdot({
                height: targetCollapsedHeight,
                tolerance: tolerance
              });
            }

            if (needsAnimation) {
              // If needed, force the UI to still show the expand button while animating.
              // See definition of this var for details.
              forceReportAsClamped = wouldBeTruncated;

              animateHeight(currentExpandedHeight, targetCollapsedHeight).then(function() {
                resetHeightAnimation();
                applyEllipsis();
              });

            } else {
              applyEllipsis();
            }
          }

          var isClamped = forceReportAsClamped || content.triggerHandler('isTruncated');

          $scope.safeApply(function() {
            $scope.textClamped = isClamped;
            $scope.contentTitleAttr = ($scope.showMoreMode === 'title-attr' && isClamped) ? text : null;
          });

          everRendered = true;
        }
      );

    }
  }
});
