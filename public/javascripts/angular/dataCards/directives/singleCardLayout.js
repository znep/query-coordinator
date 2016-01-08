var templateUrl = require('angular_templates/dataCards/singleCardLayout.html');
const angular = require('angular');
function singleCardLayout(WindowState, $window) {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: templateUrl,
    link: function($scope, cardContainer) {
      $window.socrata.utils.assertEqual($scope.page.getCurrentValue('cards').length, 1);

      $scope.model = $scope.page.getCurrentValue('cards')[0];
      $scope.cardType = $scope.model.cardType;

      var windowHeight$ = WindowState.windowSize$.shareReplay().pluck('height');
      $scope.$bindObservable('height', windowHeight$.map(function(height) {
        var topOfCardArea = cardContainer.offset().top;
        var roomForCard = height - topOfCardArea;
        return Math.max(500, roomForCard);
      }));

    }
  };
}

angular.
  module('dataCards.directives').
  directive('singleCardLayout', singleCardLayout);
