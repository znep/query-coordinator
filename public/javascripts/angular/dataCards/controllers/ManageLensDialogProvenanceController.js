/*
We are now introducing 'Provenance' to our users. Provenance has two values:
  - OFFICIAL
  - null

Eventually we want to introduce another value, "COMMUNITY", but for now it is either OFFICIAL or null.
*/

(function() {
  'use strict';

  function ManageLensDialogProvenanceController($scope, http, $q, ServerConfig) {

    var initialProvenance$ = $scope.page.observe('provenance');

    var initialOfficial$ = initialProvenance$.map(function(provenance) {
      return !!(provenance && provenance.toLowerCase() === 'official');
    });

    // Set initial value of checkbox
    $scope.$bindObservable('isOfficial', initialOfficial$);

    var currentProvenance$ = $scope.$observe('isOfficial').map(function(isOfficial) {
      return isOfficial ? 'official' : null;
    });

    var save = function() {
      if (!$scope.components.provenance.hasChanges) {
        return $q.when(null);
      }

      var url = '/api/views/{0}.json'.format(
        $scope.page.id
      );

      // Core expects all caps for the payload
      var payload = {
        provenance: $scope.isOfficial ? 'OFFICIAL' : null
      };

      return http.put(url, payload);
    };

    var postSave = function() {
      $scope.page.set('provenance', $scope.isOfficial ? 'official' : null);
    };

    Rx.Observable.subscribeLatest(
      currentProvenance$,
      initialProvenance$,
      function(currentProvenance, initialProvenance) {
        if ($scope.components.provenance) {
          $scope.components.provenance.hasChanges = currentProvenance !== initialProvenance;
        }
      }
    );

    $scope.components.provenance = {
      save: save,
      postSave: postSave,
      hasChanges: false,
      hasErrors: false
    };
  }

  angular.
    module('dataCards.controllers').
    controller('ManageLensDialogProvenanceController', ManageLensDialogProvenanceController);
})();
