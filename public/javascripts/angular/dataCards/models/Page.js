angular.module('dataCards.models').factory('Page', function($q, Dataset, Card, Model, PageDataService) {
  var Page = Model.extend({
    // Builds a page model from either the page ID (given as a string),
    // or as a full serialized blob.
    init: function(idOrSerializedBlob) {
      this._super();

      var usingBlob = _.isObject(idOrSerializedBlob);
      var id = usingBlob ? idOrSerializedBlob.pageId : idOrSerializedBlob;

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

      if (usingBlob) {
        var baseInfoPromise = function() { return $q.when(idOrSerializedBlob); };
      } else {
        var baseInfoPromise = function() { return PageDataService.getBaseInfo(self.id); };
      }

      var fields = ['datasetId', 'description', 'name', 'layoutMode', 'primaryAmountField', 'primaryAggregation', 'isDefaultPage', 'pageSource', 'baseSoqlFilter'];
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
    },

    serialize: function() {
      var dataset = this.getCurrentValue('dataset');
      var serialized = this._super();
      serialized.datasetId = dataset.id;
      delete serialized.dataset;
      return serialized;
    },

    toggleExpanded: function(theCard) {
      // NOTE: For the MVP, we only ever allow one expanded card.
      // Enforce that here.
      _.each(this.getCurrentValue('cards'), function(card) {
        var expanded = card === theCard ? !theCard.getCurrentValue('expanded') : false;
        if (expanded != card.getCurrentValue('expanded')) {
          card.set('expanded', expanded);
        }
      });
    }
  });

  return Page;
});
