angular.module('dataCards.models').factory('Page', function($q, Dataset, ModelHelper, PageDataService) {
  function Page(id) {
    var _this = this;
    this.id = id;

    // Reuse promises across lazy properties.
    // NOTE! It's important that the various getters on PageDataService are _not_ called
    // until the lazy evaluator gets called. Otherwise we'll fetch all the data before we
    // actually need it.
    var staticDataPromise = function() { return PageDataService.getStaticInfo(_this.id); };
    var filtersPromise = function() { return PageDataService.getFilters(_this.id); };
    var cardsPromise = function() { return PageDataService.getCards(_this.id); };

    var fields = ['description'];
    _.each(fields, function(field) {
      ModelHelper.addPropertyWithLazyDefault(field, _this, function() {
        return staticDataPromise().then(_.property(field));
      });
    });

    ModelHelper.addReadOnlyPropertyWithLazyDefault('dataset', this, function() {
      return staticDataPromise().then(function(data) {
        return new Dataset(data.datasetId);
      });
    });
    // TODO Cards, Filters objects.
  };

  return Page;
});
