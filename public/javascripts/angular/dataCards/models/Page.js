(function() {
  'use strict';
  var DEFAULT_ROW_DISPLAY_UNIT = 'row';

  function PageModelFactory(ServerConfig, Card, Dataset, Model, $log) {

    return Model.extend({
      // Builds a page model from either the page ID (given as a string),
      // or as a full serialized blob.
      init: function(pageMetadata, dataset) {

        if (!_.isObject(pageMetadata)) {
          throw new Error(
            'Error instantiating Page model: pageMetadata argument is not an object: {0}'.
              format(pageMetadata)
          );
        }

        if (!_.isObject(dataset)) {
          throw new Error(
            'Error instantiating Page model: dataset argument is not an object: {0}'.
              format(dataset)
          );
        }

        this._super();

        function getDefaultPageMetadataVersion() {
          var currentPageMetadataVersion = parseInt(ServerConfig.get('currentPageMetadataVersion'), 10);
          if (_.isNaN(currentPageMetadataVersion)) {
            currentPageMetadataVersion = 1;
            $log.warn("currentPageMetadataVersion could not be parsed as an integer; falling back to '1'");
          }
          return currentPageMetadataVersion;
        }

        var self = this;
        this.id = pageMetadata.pageId;
        this.version = (_.isNumber(pageMetadata.version)) ?
          pageMetadata.version :
          getDefaultPageMetadataVersion();

        var fields = [
          'datasetId',
          'description',
          'name',
          'primaryAmountField',
          'primaryAggregation',
          'baseSoqlFilter',
          'defaultDateTruncFunction'
        ];

        var cards = _.map(pageMetadata.cards, function(serializedCard) {
          return Card.deserialize(self, serializedCard);
        });
        self.defineObservableProperty('cards', cards);

        _.each(fields, function(field) {
          self.defineObservableProperty(field, pageMetadata[field]);
        });

        self.defineObservableProperty('dataset', dataset);
        self.defineEphemeralObservableProperty('hasExpandedCard', null);

        var primaryAmountField$ = self.observe('primaryAmountField');

        var columnAggregatedUpon = primaryAmountField$.
          distinctUntilChanged().
          map(function(field) {
            return _.isPresent(field) ?
              self.observe('dataset.columns.{0}'.format(field)) :
              Rx.Observable.returnValue(null);
          }).
          switchLatest();

        var validPrimaryAggregation$ = self.observe('primaryAggregation').
          filter(function(value) {
            return value !== 'invalid';
          });
        var rowDisplayUnit$ = self.observe('dataset.rowDisplayUnit');

        // Synchronize changes between primaryAmountField and primaryAggregation
        // Normalize aggregation-related fields.
        var aggregationObservable = Rx.Observable.combineLatest(
          validPrimaryAggregation$,
          rowDisplayUnit$,
          primaryAmountField$,
          columnAggregatedUpon,
          function(
            primaryAggregation,
            rowDisplayUnit,
            fieldNameAggregatedUpon,
            columnAggregatedUpon
          ) {
            var unit = rowDisplayUnit;

            if (columnAggregatedUpon) {
              unit = Dataset.extractHumanReadableColumnName(columnAggregatedUpon);
            }

            return {
              'function': primaryAggregation || 'count',
              'column': columnAggregatedUpon, // MAY BE NULL IF COUNT(*)
              'fieldName': fieldNameAggregatedUpon, // MAY BE NULL IF COUNT(*)
              'unit': unit || DEFAULT_ROW_DISPLAY_UNIT,
              'rowDisplayUnit': rowDisplayUnit || DEFAULT_ROW_DISPLAY_UNIT
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

        self.defineEphemeralObservablePropertyFromSequence('aggregation',
          aggregationObservable);

        self.defineEphemeralObservablePropertyFromSequence('rowDisplayUnit',
          rowDisplayUnit$.filter(_.isDefined).startWith(DEFAULT_ROW_DISPLAY_UNIT));

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

        self.defineEphemeralObservablePropertyFromSequence('activeFilters',
          allCardsFilters);

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

        self.defineEphemeralObservableProperty('permissions',
          pageMetadata.permissions || null);
      },

      serialize: function() {
        var dataset = this.getCurrentValue('dataset');
        var serialized = this._super();
        serialized.pageId = this.id;
        serialized.datasetId = dataset.id;
        serialized.version = this.version;
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
        var newExpandedState = !theCard.getCurrentValue('expanded');
        theCard.set('expanded', newExpandedState);
        _.each(currentlyExpanded, function(card) {
          if (card !== theCard) {
            card.set('expanded', false);
          }
        });
        this.set('hasExpandedCard', newExpandedState);
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
