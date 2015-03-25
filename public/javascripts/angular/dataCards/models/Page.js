(function() {
  'use strict';

  function PageModelFactory($q, ServerConfig, Dataset, Card, Model, PageDataService) {
    return Model.extend({
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

        var pageMetadataPromise;
        if (usingBlob) {
          pageMetadataPromise = function() {
            return $q.when(idOrSerializedBlob);
          };
        } else {
          pageMetadataPromise = function() {
            return PageDataService.getPageMetadata(self.id);
          };
        }

        var fields = [
          'datasetId',
          'description',
          'name',
          'layoutMode',
          'primaryAmountField',
          'isDefaultPage',
          'pageSource',
          'baseSoqlFilter'
        ];
        _.each(fields, function(field) {
          self.defineObservableProperty(field, undefined, function() {
            return pageMetadataPromise().then(_.property(field));
          });
        });

        // Initialize this property to 'invalid' so we can filter it and determine
        // when the model has actually loaded - no bueno but necessary in the short-term
        self.defineObservableProperty('primaryAggregation', 'invalid', function() {
          return pageMetadataPromise().then(_.property('primaryAggregation'));
        });

        self.defineObservableProperty('dataset', null, function() {
          return pageMetadataPromise().then(function(data) {
            return new Dataset(data.datasetId);
          });
        });

        self.defineObservableProperty('cards', [], function() {
          return pageMetadataPromise().then(function(data) {
            return _.map(data.cards, function(serializedCard) {
              return Card.deserialize(self, serializedCard);
            });
          });
        });

        var columnAggregatedUpon = self.observe('primaryAmountField').map(function(field) {
          return _.isPresent(field) ?
            self.observe('dataset.columns.{0}'.format(field)) :
            Rx.Observable.returnValue(null);
        }).switchLatest();

        // Synchronize changes between primaryAmountField and primaryAggregation
        // Normalize aggregation-related fields.
        var aggregationObservable = Rx.Observable.combineLatest(
          self.observe('primaryAggregation').filter(function(value) { return value !== 'invalid'; }),
          self.observe('dataset.rowDisplayUnit'),
          self.observe('primaryAmountField'),
          columnAggregatedUpon,
          function(primaryAggregation, rowDisplayUnit, fieldNameAggregatedUpon, columnAggregatedUpon) {
            var unit = rowDisplayUnit;
            if (columnAggregatedUpon) {
              unit = columnAggregatedUpon.dataset.version === '1' ?
                columnAggregatedUpon.name :
                columnAggregatedUpon.title;
            }

            return {
              'function': primaryAggregation || 'count',
              'column': columnAggregatedUpon, // MAY BE NULL IF COUNT(*)
              'fieldName': fieldNameAggregatedUpon, // MAY BE NULL IF COUNT(*)
              'unit': unit || 'row'
            };
          }
        ).filter(function(aggregation) {
            // While things settle, we may not have all the information needed
            // to build the aggregation properly. Don't emit while this is true.
            if (aggregation['function'] === 'count') {
              // Count is only valid if not against a column.
              return aggregation.column === null;
            } else {
              // All other aggregations are valid as long as they are
              // against a column.
              return _.isPresent(aggregation.column);
            }
          });

        self.defineEphemeralObservablePropertyFromSequence('aggregation', aggregationObservable);

        var allCardsFilters = self.observe('cards').flatMap(function(cards) {
          if (!cards) {
            return Rx.Observable.never();
          }
          return Rx.Observable.combineLatest(_.map(cards, function(d) {
            return d.observe('activeFilters');
          }), function() {
            return _.zipObject(_.pluck(cards, 'fieldName'), arguments);
          });
        });

        self.defineEphemeralObservablePropertyFromSequence('activeFilters', allCardsFilters);

        var allCardsWheres = allCardsFilters.map(function(filters) {
          var wheres = _.map(filters, function(operators, field) {
            if (_.isEmpty(operators)) {
              return null;
            } else {
              return _.invoke(operators, 'generateSoqlWhereFragment', field).join(' AND ');
            }
          });
          return _.compact(wheres).join(' AND ');
        }).startWith('');

        self.defineEphemeralObservablePropertyFromSequence('computedWhereClauseFragment',
          allCardsWheres.
            combineLatest(
            self.observe('baseSoqlFilter'),
            function(cardWheres, basePageWhere) {
              return _.compact([basePageWhere, cardWheres]).join(' AND ');
            }
          )
        );

        self.defineEphemeralObservableProperty('permissions', null, function() {
          return pageMetadataPromise().then(_.property('permissions'));
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
       * @return {Card[]} the new array of cards.
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
        var newCards = cards.slice(0, insertionIndex).concat([card]).
          concat(cards.slice(insertionIndex));
        this.set('cards', newCards);
        return newCards;
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
  }

  angular.
    module('dataCards.models').
    factory('Page', PageModelFactory);
})();
