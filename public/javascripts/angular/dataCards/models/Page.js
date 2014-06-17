angular.module('dataCards.models').factory('Page', function(Dataset, Card, ModelHelper, PageDataService) {
  function Page(id) {
    if (_.isEmpty(id)) {
      throw new Error('All pages must have an ID');
    }

    var self = this;
    this.id = id;

    // Reuse promises across lazy properties.
    // These are wrapped in functions so that control over when data requests are made
    // is given to the ModelHelper. If we were to obtain the below promises right away,
    // the HTTP calls required to fulfill them would be made without any regard to whether
    // or not the calls are needed.
    var baseInfoPromise = function() { return PageDataService.getBaseInfo(self.id); };

    var fields = ['description', 'name', 'layoutMode', 'primaryAmountField', 'primaryAggregation', 'isDefaultPage', 'pageSource'];
    _.each(fields, function(field) {
      ModelHelper.addPropertyWithLazyDefault(field, self, function() {
        return baseInfoPromise().then(_.property(field));
      });
    });

    ModelHelper.addReadOnlyPropertyWithLazyDefault('dataset', this, function() {
      return baseInfoPromise().then(function(data) {
        return new Dataset(data.datasetId);
      });
    });

    ModelHelper.addPropertyWithLazyDefault('cards', this, function() {
      return baseInfoPromise().then(function(data) {
        return _.map(data.cards, function(serializedCard) {
          return Card.deserialize(self, serializedCard);
        });
      });
    });
  };

  return Page;
});
