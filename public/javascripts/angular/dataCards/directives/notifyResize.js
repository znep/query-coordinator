// A simple directive which broadcasts a scope event when its element is resized.
// The event is 'elementResized'. If a string is assigned to the notifyResize
// attribute, that string is provided as the event args.
//
// Example 1:
// <div notify-resize>variable content</div>
//
// If the div is resized, elementResized will be broadcast with no args.
//
// Example 2:
// <div notify-resize="myDivResized">variable content</div>
//
// If the div is resized, elementResized will be broadcast with 'myDivResized'
// as args.
angular.module('dataCards.directives').directive('notifyResize', function() {
  return {
    restrict: 'A',
    link: function($scope, element, attrs) {
      var resizeKey = attrs.notifyResize;

      element.resize(function() {
        $scope.$apply(function() {
          var height = element.height(), width = element.width();
          if (_.isEmpty(resizeKey)) {
            $scope.$broadcast('elementResized', [undefined, width, height]);
          } else {
            $scope.$broadcast('elementResized', [resizeKey, width, height]);
          }
        });
      });
    }
  }
});
