// A directive to encapsulate the dotdotdot multiline ellipsis functionality
//
// Example:
// <div multiline-ellipsis max-lines="2" tolerance="2">large multi-line content</div>
angular.module('dataCards.directives').directive('multilineEllipsis', function(AngularRxExtensions) {
  return {
    scope: {
      'maxLines': '@',
      'tolerance': '@',
      'text': '@',
      'expanded': '='
    },
    template: '<div class="content"></div>' +
      '<div class="show-more" ng-class="{less: expanded, clamped: textClamped}" ng-click="expanded = !expanded"></div>',
    restrict : 'A',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

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
          });
        }
      );

    }
  }
});
