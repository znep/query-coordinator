/**
 * A dropdown menu that positions itself underneath its parent.
 */
angular.module('dataCards.directives').directive('dropdownMenu', function(
  WindowState,
  AngularRxExtensions
) {
  'use strict';

  return {
    restrict: 'E',
    scope: {
    },
    template: '<div ng-transclude></div>',
    transclude: true,

    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);
      var subscriptions = [];

      // Disable anchors that don't have urls
      element.on('click', 'a', function(e) {
        var href = $(e.target).attr('href');
        if (!href || '#' === href) {
          e.preventDefault();
        }
      });

      // This won't work if we can't position based on the parent element
      if (element.parent().css('position') === 'static') {
        element.parent().css('position', 'relative');
      }

      // Make sure the menu doesn't go off the screen
      element.css('visibility', 'hidden');
      var windowDimensions = {};
      subscriptions.push(Rx.Observable.subscribeLatest(
        WindowState.windowSizeSubject,
        element.observeDimensions(),
        function(windowDimensions, elementDimensions) {
          if (elementDimensions.width) {
            if (element.parent().offset().left + elementDimensions.width > windowDimensions.width) {
              element.css({
                left: 'auto',
                right: 0,
                visibility: ''
              });
            } else {
              element.css({
                left: 0,
                right: 'auto',
                visibility: ''
              });
            }
          }
      }));

      $scope.$destroyAsObservable(element).subscribe(function() {
        // During unit tests, these subscriptions stick around and cause errors (since element isn't
        // in the dom anymore, so no parent()), so practice good hygiene!
        _.invoke(subscriptions, 'dispose');
      });
    }
  }
});
