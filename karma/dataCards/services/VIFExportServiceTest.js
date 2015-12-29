describe('VIFExportService', function() {
  'use strict';

  var VALID_UNIQUE_CARD_ID = 1;
  var VALID_TITLE = 'Visualization title';
  var VALID_DESCRIPTION = 'Visualization description';

  var VALID_COLUMN_NAME = 'test_column';
  var VALID_COMPUTED_COLUMN_NAME = ':@test_computed_column';
  var VALID_DATASET_UID = 'test-test';
  var VALID_DOMAIN = 'test.example.com';
  var VALID_ROW_DISPLAY_UNIT = 'record';

  var Mockumentary;
  var Page;
  var Card;
  var Dataset;
  var DateHelpers;
  var VIFExportService;

  function generateCardMetadata(cardType, activeFilters, computedColumn) {
    var card = {
      'description': VALID_DESCRIPTION,
      'fieldName': VALID_COLUMN_NAME,
      'cardSize': 1,
      'cardType': cardType,
      'expanded': false,
      'activeFilters': activeFilters
    };

    if (computedColumn) {
      card.computedColumn = computedColumn;
    }

    return card;
  }

  function getUniqueIdOfCardWithType(pageModel, cardType) {
    return pageModel.
      getCurrentValue('cards').
      filter(function(cardModel) {
        return cardType === cardModel.getCurrentValue('cardType');
      }).map(function(cardModel) {
        return cardModel.uniqueId;
      })[0];
  }

  beforeEach(module('dataCards'));
  beforeEach(inject(function($injector) {
    Mockumentary = $injector.get('Mockumentary');
    Page = $injector.get('Page');
    Card = $injector.get('Card');
    Dataset = $injector.get('Dataset');
    DateHelpers = $injector.get('DateHelpers');
    VIFExportService = $injector.get('VIFExportService');
  }));

  describe('.exportVIF()', function() {

    var validPage;
    var pageOverrides = {};
    var datasetOverrides = {
      id: VALID_DATASET_UID,
      domain: VALID_DOMAIN,
      rowDisplayUnit: VALID_ROW_DISPLAY_UNIT
    };
    var cardObjects;

    beforeEach(function() {
      validPage = Mockumentary.createPage(pageOverrides, datasetOverrides);

      cardObjects = [
        new Card(validPage, VALID_COLUMN_NAME, generateCardMetadata('column', [])),
        new Card(validPage, VALID_COLUMN_NAME, generateCardMetadata('histogram', [])),
        new Card(validPage, VALID_COLUMN_NAME, generateCardMetadata('timeline', [])),
        new Card(validPage, VALID_COLUMN_NAME, generateCardMetadata('choropleth', [], VALID_COMPUTED_COLUMN_NAME)),
        new Card(validPage, VALID_COLUMN_NAME, generateCardMetadata('feature', []))
      ];

      validPage.set('cards', cardObjects);
    });

    describe('when passed invalid arguments', function() {

      it('throws an error', function() {
        expect(function() { VIFExportService.exportVIF(undefined, VALID_CARD_UNIQUE_ID, VALID_TITLE, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF(null, VALID_CARD_UNIQUE_ID, VALID_TITLE, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF(false, VALID_CARD_UNIQUE_ID, VALID_TITLE, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF({}, VALID_CARD_UNIQUE_ID, VALID_TITLE, VALID_DESCRIPTION); }).to.throw();

        expect(function() { VIFExportService.exportVIF(validPage, undefined, VALID_TITLE, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, null, VALID_TITLE, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, false, VALID_TITLE, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, {}, VALID_TITLE, VALID_DESCRIPTION); }).to.throw();

        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, undefined, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, null, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, false, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, 99, VALID_DESCRIPTION); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, {}, VALID_DESCRIPTION); }).to.throw();

        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, VALID_TITLE, undefined); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, VALID_TITLE, null); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, VALID_TITLE, false); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, VALID_TITLE, 99); }).to.throw();
        expect(function() { VIFExportService.exportVIF(validPage, VALID_CARD_UNIQUE_ID, VALID_TITLE, {}); }).to.throw();
      });
    });

    describe('when passed valid arguments', function() {

      describe('when passed the unique id of a card with an invalid card type', function() {

        it('throws an error', function() {

          var pageWithInvalidCardTypeOverrides = {};
          var datasetWithInvalidCardTypeOverrides = {
            id: VALID_DATASET_UID,
            domain: VALID_DOMAIN,
            rowDisplayUnit: VALID_ROW_DISPLAY_UNIT
          };
          var pageWithInvalidCardType = Mockumentary.createPage(pageWithInvalidCardTypeOverrides, datasetWithInvalidCardTypeOverrides);
          var cardsWithInvalidCardType = [
            new Card(pageWithInvalidCardType, VALID_COLUMN_NAME, generateCardMetadata('invalid', []))
          ];

          pageWithInvalidCardType.set('cards', cardsWithInvalidCardType);

          var cardUniqueId = getUniqueIdOfCardWithType(validPage, 'invalid');

          expect(function() { VIFExportService.exportVIF(pageWithInvalidCardType, cardUniqueId, VALID_TITLE, VALID_DESCRIPTION); }).to.throw();
        });
      });

      describe('when passed the unique id of a columnChart', function() {

        it('synthesizes a "columnChart" VIF', function() {

          var cardUniqueId = getUniqueIdOfCardWithType(validPage, 'column');
          var vif = VIFExportService.exportVIF(validPage, cardUniqueId, VALID_TITLE, VALID_DESCRIPTION);

          expect(vif.columnName).to.equal(VALID_COLUMN_NAME);
          expect(vif.datasetUid).to.equal(VALID_DATASET_UID);
          expect(vif.domain).to.equal(VALID_DOMAIN);
          expect(vif.description).to.equal(VALID_DESCRIPTION);
          expect(vif.title).to.equal(VALID_TITLE);
          expect(vif.type).to.equal('columnChart');
        });
      });

      describe('when passed the unique id of a histogram', function() {

        it('synthesizes a "histogramChart" VIF', function() {

          var cardUniqueId = getUniqueIdOfCardWithType(validPage, 'histogram');
          var vif = VIFExportService.exportVIF(validPage, cardUniqueId, VALID_TITLE, VALID_DESCRIPTION);

          expect(vif.columnName).to.equal(VALID_COLUMN_NAME);
          expect(vif.datasetUid).to.equal(VALID_DATASET_UID);
          expect(vif.domain).to.equal(VALID_DOMAIN);
          expect(vif.description).to.equal(VALID_DESCRIPTION);
          expect(vif.title).to.equal(VALID_TITLE);
          expect(vif.type).to.equal('histogramChart');
        });
      });

      describe('when passed the unique id of a timelineChart', function() {

        it('synthesizes a "timelineChart" VIF', function() {

          var cardUniqueId = getUniqueIdOfCardWithType(validPage, 'timeline');
          var vif = VIFExportService.exportVIF(validPage, cardUniqueId, VALID_TITLE, VALID_DESCRIPTION);

          expect(vif.columnName).to.equal(VALID_COLUMN_NAME);
          expect(vif.datasetUid).to.equal(VALID_DATASET_UID);
          expect(vif.domain).to.equal(VALID_DOMAIN);
          expect(vif.description).to.equal(VALID_DESCRIPTION);
          expect(vif.title).to.equal(VALID_TITLE);
          expect(vif.type).to.equal('timelineChart');
        });
      });

      describe('when passed the unique id of a choropleth', function() {

        it('synthesizes a "choroplethMap" VIF', function() {

          var cardUniqueId = getUniqueIdOfCardWithType(validPage, 'choropleth');
          var vif = VIFExportService.exportVIF(validPage, cardUniqueId, VALID_TITLE, VALID_DESCRIPTION);

          expect(vif.columnName).to.equal(VALID_COLUMN_NAME);
          expect(vif.configuration.computedColumnName).to.equal(VALID_COMPUTED_COLUMN_NAME);
          expect(vif.datasetUid).to.equal(VALID_DATASET_UID);
          expect(vif.domain).to.equal(VALID_DOMAIN);
          expect(vif.description).to.equal(VALID_DESCRIPTION);
          expect(vif.title).to.equal(VALID_TITLE);
          expect(vif.type).to.equal('choroplethMap');
        });
      });

      describe('when passed the unique id of a featureMap', function() {

        it('synthesizes a "featureMap" VIF', function() {

          var cardUniqueId = getUniqueIdOfCardWithType(validPage, 'feature');
          var vif = VIFExportService.exportVIF(validPage, cardUniqueId, VALID_TITLE, VALID_DESCRIPTION);

          expect(vif.columnName).to.equal(VALID_COLUMN_NAME);
          expect(vif.datasetUid).to.equal(VALID_DATASET_UID);
          expect(vif.domain).to.equal(VALID_DOMAIN);
          expect(vif.description).to.equal(VALID_DESCRIPTION);
          expect(vif.title).to.equal(VALID_TITLE);
          expect(vif.type).to.equal('featureMap');
        });
      });

      describe('units', function() {

        describe('when passed a page with a dataset that does not have a rowDisplayUnit', function() {

          it('synthesizes a VIF with the default unit', function() {

            // This is a little involved because Mockumentary does not provide a way
            // to arbitrarily omit a metadata key => value pair.
            //
            // Therefore, we use Mockumentary to create the page and dataset metadata,
            // manipulate the dataset metadata, then instantiate the Page and Dataset
            // objects manually.
            var pageMetadata = Mockumentary.createPageMetadata({});
            var datasetMetadataWithNoRowDisplayUnitOverrides = {
              id: VALID_DATASET_UID,
              domain: VALID_DOMAIN
            };
            var datasetMetadataWithNoRowDisplayUnit = Mockumentary.createDatasetMetadata(datasetMetadataWithNoRowDisplayUnitOverrides);

            delete datasetMetadataWithNoRowDisplayUnit.rowDisplayUnit;

            var pageWithNoDatasetMetadataRowDisplayUnit = new Page(pageMetadata, new Dataset(datasetMetadataWithNoRowDisplayUnit));

            var cards = [
              new Card(pageWithNoDatasetMetadataRowDisplayUnit, VALID_COLUMN_NAME, generateCardMetadata('column', []))
            ];

            pageWithNoDatasetMetadataRowDisplayUnit.set('cards', cards);

            var cardUniqueId = getUniqueIdOfCardWithType(pageWithNoDatasetMetadataRowDisplayUnit, 'column');
            var vif = VIFExportService.exportVIF(pageWithNoDatasetMetadataRowDisplayUnit, cardUniqueId, VALID_TITLE, VALID_DESCRIPTION);

            expect(vif.unit.one).to.equal('row');
            expect(vif.unit.other).to.equal('rows');
          });
        });

        describe('when passed a page with a dataset that has a rowDisplayUnit', function() {

          it('synthesizes a VIF with that the specified unit', function() {

            var cardUniqueId = getUniqueIdOfCardWithType(validPage, 'feature');
            var vif = VIFExportService.exportVIF(validPage, cardUniqueId, VALID_TITLE, VALID_DESCRIPTION);

            expect(vif.unit.one).to.equal(VALID_ROW_DISPLAY_UNIT);
            expect(vif.unit.other).to.equal(VALID_ROW_DISPLAY_UNIT);
          });
        });
      });
    });
  });
});
