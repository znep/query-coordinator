(function() {
  'use strict';

  function LastUpdated($filter, AngularRxExtensions, LastModified) {
    return {
      templateUrl: '/angular_templates/dataCards/lastUpdated.html',
      restrict: 'E',
      scope: {},
      link: function($scope) {
        AngularRxExtensions.install($scope);
        var lastModified = LastModified.observable.map($filter('fromNow'));

        $scope.$bindObservable('datasetDaysUnmodified', lastModified);
      }
    }
  }

  angular.
    module('dataCards.directives').
    directive('lastUpdated', LastUpdated);

})();
