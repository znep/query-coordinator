(function() {
  'use strict';

  function singleCardLayout(WindowState) {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/angular_templates/dataCards/singleCardLayout.html',
      link: function($scope, cardContainer) {
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

})();
