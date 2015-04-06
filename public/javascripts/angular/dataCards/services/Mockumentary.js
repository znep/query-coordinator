(function() {
  'use strict';

  function Mockumentary(Page, DatasetV1) {

    function createPageMetadata(pageOptions) {

      var minimalPageMetadata = {
        cards: [],
        datasetId: 'asdf-fdsa',
        description: 'Description',
        name: 'Name',
        pageId: 'page-page',
        permissions: {
          isPublic: true
        },
        primaryAmountField: null,
        primaryAggregation: null,
        version: 1
      };

      return $.extend(true, minimalPageMetadata, pageOptions);
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

      return new DatasetV1(datasetMetadata);
    }

    return {
      createPageMetadata: createPageMetadata,
      createPage: createPage,
      createDatasetMetadata: createDatasetMetadata,
      createDataset: createDataset
    };
  }

  angular.
    module('dataCards.services').
    factory('Mockumentary', Mockumentary);
})();
