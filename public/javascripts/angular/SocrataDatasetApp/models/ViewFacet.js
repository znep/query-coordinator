// This model is intended to be an immutable reference to a View.
angular.module('socrataDatasetApp.models').factory('ViewFacet', function() {
  function ViewFacet(id) {
    this.id = id;
  };

  return ViewFacet;
});
