(function() {
  'use strict';

  function Mockumentary(Page, DatasetV1) {

    function createPage(pageOptions, datasetOptions) {

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

      var pageMetadata = $.extend(true, minimalPageMetadata, pageOptions);

      return new Page(pageMetadata, createDataset(datasetOptions));
    }

    function createDataset(datasetOptions) {

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
            },
          ],
          user: []
        },
        permissions: {
          isPublic: true
        },
        version: 1
      };

      var datasetMetadata = $.extend(true, minimalDatasetMetadata, datasetOptions);

      return new DatasetV1(datasetMetadata);
    }

    return {
      createPage: createPage,
      createDataset: createDataset
    };
  }

  angular.
    module('dataCards.services').
    factory('Mockumentary', Mockumentary);
})();
