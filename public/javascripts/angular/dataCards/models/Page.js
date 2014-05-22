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

    // Add a property of the given name with a lazy-evaluated default.
    // The default is taken from the object returned by the promise returned
    // from promiseGenerator, under the key of propName.
    // We need to take a promiseGenerator over a regular promise, because pre-creating
    // the promise instance will trigger an API hit.
    function lazyPropertyFromPromise(promiseGenerator, propName) {
      ModelHelper.addPropertyWithLazyDefault(propName, _this, function() {
        return promiseGenerator().then(function(data) { return data[propName]; });
      });
    };

    lazyPropertyFromPromise(staticDataPromise, 'description');

    ModelHelper.addPropertyWithLazyDefault('dataset', this, function() {
      return staticDataPromise().then(function(data) {
        return new Dataset(data.datasetId);
      });
    });
    // TODO Cards, Filters objects.
  };

  return Page;
});
