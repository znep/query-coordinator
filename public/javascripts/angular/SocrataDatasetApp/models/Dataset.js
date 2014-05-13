// This model is intended to be an immutable reference to a Dataset.
angular.module('socrataDatasetApp.models').factory('Dataset', function() {
  //TODO cache instances or share cache.
  function Dataset(id) {
    this.id = id;
  };

  return Dataset;
});
