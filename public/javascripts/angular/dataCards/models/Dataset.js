// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function(ModelHelper, DatasetDataService) {
  var uid_regexp = /^\w{4}-\w{4}$/;
  //TODO cache instances or share cache.
  function Dataset(id) {
    var _this = this;

    if (!uid_regexp.test(id)) {
      throw new Error('Bad dataset ID passed to Dataset constructor.');
    }
    this.id = id;

    // Reuse promises across lazy properties.
    // NOTE! It's important that the various getters on PageDataService are _not_ called
    // until the lazy evaluator gets called. Otherwise we'll fetch all the data before we
    // actually need it.
    var staticDataPromise = function() { return DatasetDataService.getStaticInfo(_this.id); };

    //TODO Columns. Pages.
    var fields = ["whatIsARow", "primaryRowQuantity", "domain", "owner", "updatedAt", "rowCount"];
    _.each(fields, function(field) {
      ModelHelper.addPropertyWithLazyDefault(field, _this, function() {
        return staticDataPromise().then(_.property(field));
      });
    });
  };

  return Dataset;
});
