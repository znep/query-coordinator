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

      Rx.Observable.subscribeLatest(
        element.observeDimensions(),
        $scope.observe('text'),
        $scope.observe('maxLines'),
        $scope.observe('tolerance'),
        $scope.observe('expanded'),
        function(dimensions, text, maxLines, tolerance, expanded) {
          maxLines = parseInt(maxLines);
          tolerance = parseInt(tolerance);
          content.text(text);

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
