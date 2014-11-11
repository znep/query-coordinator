/**
 * A dropdown menu that positions itself underneath its parent.
 */
angular.module('dataCards.directives').directive('dropdownMenu', function(WindowState) {
  'use strict';

  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    template: '<div ng-if="show" ng-transclude></div>',
    transclude: true,

    link: function($scope, element, attrs) {
      // This won't work if we can't position based on the parent element
      if (element.parent().css('position') === 'static') {
        element.parent().css('position', 'relative');
      }

      // Make sure the menu doesn't go off the screen
      var windowDimensions = {};
      Rx.Observable.subscribeLatest(
        WindowState.windowSizeSubject,
        element.observeDimensions(),
        function(windowDimensions, elementDimensions) {
          if (elementDimensions.width) {
            if (element.parent().offset().left + elementDimensions.width > windowDimensions.width) {
              element.css({
                left: 'auto',
                right: 0
              });
            } else {
              element.css({
                left: 0,
                right: 'auto'
              });
            }
          }
      });
    }
  }
});
