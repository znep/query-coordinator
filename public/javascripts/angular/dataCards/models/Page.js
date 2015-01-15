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

      var baseInfoPromise;
      if (usingBlob) {
        baseInfoPromise = function() { return $q.when(idOrSerializedBlob); };
      } else {
        baseInfoPromise = function() { return PageDataService.getBaseInfo(self.id); };
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

      // Synchronize changes between primaryAmountField and primaryAggregation
      var aggregationObservable = self.observe('primaryAmountField').
        combineLatest(self.observe('primaryAggregation'),
        function(primaryAmountField, primaryAggregation) {
          return { field: primaryAmountField || null, aggregation: primaryAggregation || null };
        }).
        startWith({ field: null, aggregation: null }).
        distinctUntilChanged();

      self.defineReadOnlyObservableProperty('aggregation', aggregationObservable);

      var columnAggregatedUpon = aggregationObservable.map(function(aggregation) {
        return _.isPresent(aggregation.field) ?
          self.observe('dataset.columns.{0}'.format(aggregation.field)) :
          Rx.Observable.returnValue(null);
      }).switchLatest();

      self.defineReadOnlyObservableProperty('aggregatedDisplayUnit', aggregationObservable.combineLatest(
        self.observe('dataset.rowDisplayUnit').filter(_.isPresent),
        columnAggregatedUpon,
        function(aggregation, rowDisplayUnit, columnAggregatedUpon) {
          var aggregationName = _.isPresent(aggregation.aggregation) ? aggregation.aggregation : 'number';
          var label = columnAggregatedUpon ? columnAggregatedUpon.title : rowDisplayUnit;
          return aggregationName + ' of ' + label.pluralize();
        }
        )
      );


      var allCardsFilters = self.observe('cards').flatMap(function(cards) {
        if (!cards) { return Rx.Observable.never(); }
        return Rx.Observable.combineLatest(_.map(cards, function(d) {
          return d.observe('activeFilters');
        }), function() {
          return _.zipObject(_.pluck(cards, 'fieldName'), arguments);
        });
      });

      self.defineReadOnlyObservableProperty('activeFilters', allCardsFilters);

      var allCardsWheres = allCardsFilters.map(function(filters) {
        var wheres = _.map(filters, function(operators, field) {
          if (_.isEmpty(operators)) {
            return null;
          } else {
            return _.invoke(operators, 'generateSoqlWhereFragment', field).join(' AND ');
          }
        });
        return _.compact(wheres).join(' AND ');
      });

      self.defineReadOnlyObservableProperty('computedWhereClauseFragment',
        allCardsWheres.
        combineLatest(
          self.observe('baseSoqlFilter'),
          function(cardWheres, basePageWhere) {
            return _.compact([basePageWhere, cardWheres]).join(' AND ');
          }
        )
      );

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

      // Since swapping the expanded card is not an atomic operation, observers listening
      // to the expanded state (eg card-layout.js) will trigger multiple times for the
      // same operation. Ideally it'd be an atomic operation, but since it isn't, let's
      // at least let the subscribers know by preferring to set more cards to expanded.
      // (ie since having 0 expanded cards is a valid state, but having 2 expanded cards
      // isn't, subscribers can just ignore the intermediate state of having 2 expanded
      // cards.)
      var currentlyExpanded = _.filter(this.getCurrentValue('cards'), function(card) {
        return card.getCurrentValue('expanded');
      });
      theCard.set('expanded', !theCard.getCurrentValue('expanded'));
      _.each(currentlyExpanded, function(card) {
        if (card !== theCard) {
          card.set('expanded', false);
        }
      });
    },

    /**
     * Adds the given card to the page's collection of cards. The card will be added immediately
     * after the last existing card with the same cardSize.
     *
     * @param {Card} card The card to add.
     */
    addCard: function(card) {
      var cards = this.getCurrentValue('cards');
      var cardSize = card.getCurrentValue('cardSize');
      var insertionIndex = _.findIndex(cards, function(model) {
        return model.getCurrentValue('cardSize') > cardSize;
      });
      if (insertionIndex < 0) {
        insertionIndex = cards.length;
      }
      cards.splice(insertionIndex, 0, card);
      this.set('cards', cards);
      return cards;
    },

    /**
     * Updates the card within the collection if it already exists. Otherwise, adds it.
     */
    addOrUpdateCard: function(card) {
      var uniqueId = card.uniqueId;
      var cards = this.getCurrentValue('cards');
      var existingModelIndex = _.findIndex(cards, function(model) {
        return model.uniqueId === uniqueId;
      });
      if (existingModelIndex >= 0) {
        cards[existingModelIndex] = card;
        this.set('cards', cards);
      } else {
        cards = this.addCard(card);
      }
      return cards;
    }
  });

  return Page;
});
