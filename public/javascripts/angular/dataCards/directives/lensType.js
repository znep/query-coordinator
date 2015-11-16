var templateUrl = require('angular_templates/dataCards/lensType.html');
const angular = require('angular');
function lensType(ServerConfig, rx) {
  const Rx = rx;
  return {
    templateUrl: templateUrl,
    restrict: 'E',
    scope: true,
    link: function($scope) {

      // CORE-7419: If enable_data_lens_provenance is false, assume all data lenses are official
      $scope.$bindObservable('lensType', ServerConfig.get('enableDataLensProvenance') ?
        $scope.page.observe('provenance') :
        Rx.Observable.returnValue('official'));
    }
  };
}

angular.
  module('dataCards.directives').
  directive('lensType', lensType);
