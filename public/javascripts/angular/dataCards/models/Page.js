angular.module('dataCards.models').factory('Page', function(Dataset, Card, Model, PageDataService) {
  function Page(id) {
    Model.call(this);
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

    var fields = ['description', 'name', 'layoutMode', 'primaryAmountField', 'primaryAggregation', 'isDefaultPage', 'pageSource', 'baseSoqlFilter'];
    _.each(fields, function(field) {
      self.defineObservableProperty(field, undefined, function() {
        return baseInfoPromise().then(_.property(field));
      });
    });

    self.defineObservableProperty('dataset', null, function() {
      return baseInfoPromise().then(function(data) {
        return new Dataset(data.datasetId);
      });
    });

    self.defineObservableProperty('cards', [], function() {
      return baseInfoPromise().then(function(data) {
        return _.map(data.cards, function(serializedCard) {
          return Card.deserialize(self, serializedCard);
        });
      });
    });
  }

  Model.extend(Page);
  Page.prototype.toggleExpanded = function(theCard) {
    // NOTE: For the MVP, we only ever allow one expanded card.
    // Enforce that here.
    _.each(this.getCurrentValue('cards'), function(card) {
      card.set('expanded', card === theCard ? !theCard.getCurrentValue('expanded') : false);
    });
  };

  return Page;
});
