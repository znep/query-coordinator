// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function() {
  var uid_regexp = /^\w{4}-\w{4}$/;
  //TODO cache instances or share cache.
  function Dataset(id) {
    if (!uid_regexp.test(id)) {
      throw new Error('Bad dataset ID passed to Dataset constructor.');
    }
    this.id = id;
  };

  return Dataset;
});
