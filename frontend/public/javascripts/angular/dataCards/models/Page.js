module.exports = function PageModelFactory(ServerConfig, Card, Dataset, Model, Filter, I18n, $log, rx) {
  const Rx = rx;

  return Model.extend({
    // Builds a page model from either the page ID (given as a string),
    // or as a full serialized blob.
    init: function(pageMetadata, dataset) {

      if (!_.isObject(pageMetadata)) {
        throw new Error(
          `Error instantiating Page model: pageMetadata argument is not an object: ${pageMetadata}`
        );
      }

      if (!_.isObject(dataset)) {
        throw new Error(
          `Error instantiating Page model: dataset argument is not an object: ${dataset}`
        );
      }

      this._super();

      function getDefaultPageMetadataVersion() {
        var currentPageMetadataVersion = parseInt(ServerConfig.get('current_page_metadata_version'), 10);
        if (_.isNaN(currentPageMetadataVersion)) {
          currentPageMetadataVersion = 1;
          $log.warn('current_page_metadata_version could not be parsed as an integer; falling back to "1"');
        }
        return currentPageMetadataVersion;
      }

      var self = this;
      this.id = pageMetadata.pageId;
      this.version = (_.isNumber(pageMetadata.version)) ?
        pageMetadata.version :
        getDefaultPageMetadataVersion();

      this.isFromDerivedView = pageMetadata.isFromDerivedView;

      var fields = [
        'datasetId',
        'description',
        'name',
        'primaryAmountField',
        'primaryAggregation',
        'baseSoqlFilter',
        'rights'
      ];

      var deserializedCards = _.map(pageMetadata.cards, function(serializedCard) {
        return Card.deserialize(self, serializedCard);
      });

      self.defineObservableProperty('cards', deserializedCards);

      _.each(fields, function(field) {
        self.defineObservableProperty(field, pageMetadata[field]);
      });

      self.defineObservableProperty('dataset', dataset);
      self.defineEphemeralObservableProperty('hasExpandedCard', null);
      self.defineEphemeralObservableProperty('shares', pageMetadata.shares);
      self.defineEphemeralObservableProperty('provenance', pageMetadata.provenance);
      self.defineEphemeralObservableProperty('hideFromCatalog', pageMetadata.hideFromCatalog);
      self.defineEphemeralObservableProperty('hideFromDataJson', pageMetadata.hideFromDataJson);
      self.defineEphemeralObservableProperty('ownerId', pageMetadata.ownerId);
      self.defineEphemeralObservableProperty('ownerDisplayName', pageMetadata.ownerDisplayName);
      self.defineEphemeralObservableProperty('enableAxisRescaling', ServerConfig.get('enable_data_lens_axis_rescaling'));

      var rowDisplayUnit$ = self.observe('dataset.rowDisplayUnit');

      self.defineEphemeralObservablePropertyFromSequence('rowDisplayUnit',
        rowDisplayUnit$.filter(_.isDefined).startWith(I18n.common.row));

      var allCardsFilters;

      if (pageMetadata.sourceVif) {

        allCardsFilters = Rx.Observable.returnValue(
          _.map(pageMetadata.sourceVif.filters, function(filter) {
            var filteredColumn;

            if (filter['function'] === 'BinaryComputedGeoregionOperator') {
              filteredColumn = filter.computedColumnName;
            } else {
              filteredColumn = filter.columnName;
            }

            return {
              filters: [
                Filter.deserialize(filter)
              ],
              fieldName: filter.columnName,
              filteredColumn: filteredColumn,
              uniqueId: _.uniqueId()
            };
          })
        );

      } else {

        allCardsFilters = self.observe('cards').flatMap(function(cards) {
          if (!cards) {
            return Rx.Observable.never();
          }
          return Rx.Observable.combineLatest(_.map(cards, function(d) {
            return d.observe('activeFilters');
          }), function() {
            return _.map(cards, function(card) {
              return {
                filters: card.getCurrentValue('activeFilters'),
                fieldName: card.fieldName,
                filteredColumn: card.getFilteredColumn(),
                uniqueId: card.uniqueId
              };
            });
          });
        });

      }

      self.defineEphemeralObservablePropertyFromSequence('activeFilters',
        allCardsFilters);

      var allCardsWheres = allCardsFilters.map(function(pageFilters) {
        var wheres = _.map(pageFilters, function(cardFilterInfo) {
          if (_.isEmpty(cardFilterInfo.filters)) {
            return null;
          } else {
            return _.invokeMap(cardFilterInfo.filters, 'generateSoqlWhereFragment', cardFilterInfo.filteredColumn).
              join(' AND ');
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
      serialized.isFromDerivedView = this.isFromDerivedView;
      delete serialized.dataset;
      return serialized;
    },

    toggleExpanded: function(theCard) {
      // NOTE: For the MVP, we only ever allow one expanded card.
      // Enforce that here.

      // Since swapping the expanded card is not an atomic operation, observers listening
      // to the expanded state (eg cardLayout.js) will trigger multiple times for the
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
};
