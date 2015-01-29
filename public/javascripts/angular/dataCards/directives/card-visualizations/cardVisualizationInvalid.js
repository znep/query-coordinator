(function() {
  'use strict';

  function cardVisualizationInvalid($log) {
    return {
      restrict: 'E',
      scope: {
        'model': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationInvalid.html',
      link: function($scope) {
        $scope.model.observe('fieldName').subscribe(function(fieldName) {
          $log.warn('Invalid cardType for column {0}'.format(fieldName));
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('cardVisualizationInvalid', cardVisualizationInvalid);

})();
