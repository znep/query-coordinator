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
angular.module('dataCards.directives').directive('multilineEllipsis', function(AngularRxExtensions) {
  return {
    scope: {
      'maxLines': '@',
      'tolerance': '@',
      'text': '@',
      'expanded': '='
    },
    template: '<div class="content" title="{{contentTitleAttr}}"></div>' +
      '<div ng-if="showMoreMode == \'expand-link\'" class="show-more" ng-class="{less: expanded, clamped: textClamped}" ng-click="$parent.expanded = !expanded"><span class="show-more-arrow"></span></div>',
    restrict : 'A',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      $scope.showMoreMode = attrs['showMoreMode'] || 'expand-link';

      var content = element.find('.content');

      // Hello! My name is col. hack! (P.S. 16px * 1.5 == 24px)
      var lineHeight = function() {
        return parseInt(element.css('line-height') === 'normal' ? '24px' : element.css('line-height'));
      };

      $scope.toggleExpanded = function() {
        $scope.expanded = !$scope.expanded;
      };

      var lastText = null;
      Rx.Observable.subscribeLatest(
        element.observeDimensions(),
        $scope.observe('text'),
        $scope.observe('maxLines'),
        $scope.observe('tolerance'),
        $scope.observe('expanded'),
        function(dimensions, text, maxLines, tolerance, expanded) {
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

          if (expanded) {
            content.dotdotdot({
              height: Infinity,
              tolerance: tolerance
            });
          } else {
            content.dotdotdot({
              height: lineHeight() * maxLines,
              tolerance: tolerance
            });
          }

          var isClamped = content.triggerHandler('isTruncated');
          $scope.safeApply(function() {
            $scope.textClamped = isClamped;
            $scope.animationsOn = true;
            $scope.contentTitleAttr = ($scope.showMoreMode === 'title-attr' && isClamped) ? text : null;
          });
        }
      );

    }
  }
});
