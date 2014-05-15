// This model is intended to be an immutable reference to a View.
angular.module('socrataDatasetApp.models').factory('View', function($q, Dataset, ViewFacet) {
  function View(id) {
    this.id = id;
  };

  View.prototype.getDataset = function() {
    //TODO real impl.
    return new Dataset('fake-ekaf');
  };

  View.prototype.getFacetsAsync = function() {
    return $q.when(_.map(_.times(20, _.uniqueId), function(facetId) {
      return new ViewFacet(facetId);
    }));
  };

  View.prototype.getFacetFromIdAsync = function(id) {
    return $q.when(new ViewFacet(id));
  };

  return View;
});
