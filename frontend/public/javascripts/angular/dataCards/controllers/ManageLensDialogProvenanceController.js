/*
We are now introducing 'Provenance' to our users. Provenance has two values:
  - OFFICIAL
  - COMMUNITY

For historical reasons, the COMMUNITY status is internally represented as null.
*/

module.exports = function ManageLensDialogProvenanceController($scope, http, $q, rx) {
  const Rx = rx;

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

    var url = `/api/views/${$scope.page.id}.json`;

    // Core expects all caps for the payload
    var payload = {
      provenance: $scope.isOfficial ? 'OFFICIAL' : 'COMMUNITY'
    };

    return http.put(url, payload);
  };

  var postSave = function() {
    $scope.page.set('provenance', $scope.isOfficial ? 'official' : 'community');
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
};
