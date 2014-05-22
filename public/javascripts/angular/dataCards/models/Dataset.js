// This model is intended to be an immutable reference to a Dataset.
angular.module('dataCards.models').factory('Dataset', function(ModelHelper, DatasetDataService, $injector) {
  var uid_regexp = /^\w{4}-\w{4}$/;
  //TODO cache instances or share cache.
  function Dataset(id) {
    var _this = this;
    var Page = $injector.get('Page'); // Inject Page here to avoid circular dep.

    if (!uid_regexp.test(id)) {
      throw new Error('Bad dataset ID passed to Dataset constructor.');
    }
    this.id = id;

    // Reuse promises across lazy properties.
    // NOTE! It's important that the various getters on PageDataService are _not_ called
    // until the lazy evaluator gets called. Otherwise we'll fetch all the data before we
    // actually need it.
    var staticDataPromise = function() { return DatasetDataService.getStaticInfo(_this.id); };
    var pageIdsPromise = function() { return DatasetDataService.getPageIds(_this.id); };

    //TODO Columns may need to also be observable properties. Maybe.
    var fields = ["rowDisplayUnit", "defaultAggregateColumn", "domain", "owner", "updatedAt", "columns"];
    _.each(fields, function(field) {
      ModelHelper.addReadOnlyPropertyWithLazyDefault(field, _this, function() {
        return staticDataPromise().then(_.property(field));
      });
    });

    ModelHelper.addReadOnlyPropertyWithLazyDefault('pages', _this, function() {
      return pageIdsPromise().then(function(pagesBySource) {
        return _.transform(pagesBySource, function(res, ids, source) {
          res[source] = _.map(ids, function(id) {
            return new Page(id);
          });
        })
      });
    });
  };

  return Dataset;
});
