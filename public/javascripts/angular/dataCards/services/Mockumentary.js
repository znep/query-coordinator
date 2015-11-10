(function() {
  'use strict';

  function Mockumentary(Page, Dataset, Card) {

    function createCardMetadata(cardOptions) {
      var minimalInitialValues = {
        fieldName: 'blood_alcohol_level',
        cardSize: 2,
        cardType: 'column',
        expanded: false,
        computedColumn: null,
        activeFilters: [
          {
            'function': 'BinaryOperator',
            arguments: {
              operand: 0.12,
              operator: '='
            }
          }
        ]
      };

      return $.extend(true, minimalInitialValues, cardOptions);
    }

    function createCard(page, fieldName, cardOptions) {
      return new Card(page, fieldName, cardOptions);
    }

    function createPageMetadata(pageOptions) {

      var minimalPageMetadata = {
        cards: [],
        datasetId: 'asdf-fdsa',
        description: 'Description',
        name: 'Name',
        pageId: 'page-page',
        moderationStatus: true,
        permissions: {
          isPublic: true
        },
        primaryAmountField: null,
        primaryAggregation: null,
        version: 3
      };

      return _.merge(minimalPageMetadata, pageOptions);
    }

    function createPage(pageOptions, datasetOptions) {

      var pageMetadata = createPageMetadata(pageOptions);

      return new Page(pageMetadata, createDataset(datasetOptions));
    }

    function createDatasetMetadata(datasetOptions) {

      var minimalDatasetMetadata = {
        id: 'asdf-fdsa',
        name: 'test dataset name',
        rowDisplayUnit: 'row',
        ownerId: 'fdsa-asdf',
        updatedAt: '2004-05-20T17:42:55+00:00',
        locale: 'en_US',
        columns: {},
        pages: {
          publisher: [
            {
              cards: [],
              datasetId: 'asdf-fdsa',
              description: 'Description',
              name: 'Name',
              pageId: 'page-page',
              moderationStatus: true,
              primaryAmountField: null,
              primaryAggregation: null,
              version: 1
            },
            {
              cards: [],
              datasetId: 'asdf-fdsa',
              description: 'Description',
              name: 'Name',
              pageId: 'aaaa-aaaa',
              moderationStatus: true,
              primaryAmountField: null,
              primaryAggregation: null,
              version: 1
            }
          ],
          user: []
        },
        permissions: {
          isPublic: true
        },
        version: 1
      };

      return $.extend(true, minimalDatasetMetadata, datasetOptions);
    }

    function createDataset(datasetOptions) {

      var datasetMetadata = createDatasetMetadata(datasetOptions);

      return new Dataset(datasetMetadata);
    }

    return {
      createPageMetadata: createPageMetadata,
      createCardMetadata: createCardMetadata,
      createCard: createCard,
      createPage: createPage,
      createDatasetMetadata: createDatasetMetadata,
      createDataset: createDataset
    };
  }

  angular.
    module('dataCards.services').
    factory('Mockumentary', Mockumentary);
})();
