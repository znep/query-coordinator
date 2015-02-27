// A simple directive which broadcasts a scope event when its element is resized.
//
// Example:
// <div notify-resize="myDivResized">variable content</div>
//
// If the div is resized, myDivResized will be broadcast with the new size as the arguments to the event
// contained within an object of the form: { height: N, width: N } -- not including outer margins.
angular.module('dataCards.directives').directive('notifyResize', function(AngularRxExtensions) {
  return {
    restrict: 'A',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var eventName = attrs.notifyResize;
      if (_.isEmpty(eventName)) {
        throw new Error('Expected a non-blank event name');
      }
      var onElementResize = function() {
        $scope.safeApply(function() {
          $scope.$broadcast(eventName, element.dimensions());
        });
      };
      element.resize(onElementResize);

      $scope.observeDestroy(element).subscribe(function() {
        element.removeResize(onElementResize);
      });
    }
  }
});
