import { expect, assert } from 'chai';
const angular = require('angular');

describe('Page model', function() {
  'use strict';

  var CURRENT_PAGE_METADATA_VERSION = 1;

  var injector;
  var Mockumentary;
  var Page;
  var Model;
  var ServerConfig;
  var testHelpers;

  var sampleVifJson = require('karma/dataCards/test-data/pageTest/sampleVif.json');
  var sampleVif;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    injector = $injector;
    testHelpers = $injector.get('testHelpers');
    Mockumentary = $injector.get('Mockumentary');
    Page = $injector.get('Page');
    Model = $injector.get('Model');
    ServerConfig = $injector.get('ServerConfig');

    // Set the current page metadata verison to 1
    ServerConfig.override('current_page_metadata_version', CURRENT_PAGE_METADATA_VERSION);

    sampleVif = _.clone(sampleVifJson);
  }));


  it('should correctly deserialize serialized page metadata passed into the constructor.', function() {
    var pageOverrides = {pageId: 'test-page'};
    var datasetOverrides = {id: 'test-data'};
    var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);

    expect(instance.id).to.equal('test-page');
  });

  it('should return a Dataset model from the dataset property', function(done) {
    var pageOverrides = {pageId: 'test-page'};
    var datasetOverrides = {id: 'test-data'};
    var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);

    instance.observe('dataset').subscribe(function(dataset) {
      expect(dataset.id).to.equal('test-data');
      done();
    });
  });

  it('should default to the current version if the version property is not present or is not a number', function() {
    var page;
    var serialized;

    var datasetOverrides = {id: 'test-data'};
    var dataset = Mockumentary.createDataset(datasetOverrides);
    var pageOverrides = {pageId: 'test-page'};
    var pageMetadata = Mockumentary.createPageMetadata(pageOverrides);

    delete pageMetadata['version'];
    page = new Page(pageMetadata, dataset);
    serialized = page.serialize();
    expect(serialized.version).to.equal(CURRENT_PAGE_METADATA_VERSION);

    pageMetadata.version = 'not a number';
    page = new Page(pageMetadata, dataset);
    serialized = page.serialize();
    expect(serialized.version).to.equal(CURRENT_PAGE_METADATA_VERSION);

    pageMetadata.version = '0';
    page = new Page(pageMetadata, dataset);
    serialized = page.serialize();
    expect(serialized.version).to.equal(CURRENT_PAGE_METADATA_VERSION);
  });

  it('should correctly serialize', function() {
    var pageOverrides = {pageId: 'test-page', isFromDerivedView: true};
    var datasetOverrides = {id: 'test-data'};
    var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);
    var expectedFields = ['cards', 'datasetId', 'description', 'name', 'pageId', 'primaryAggregation', 'primaryAmountField', 'version', 'isFromDerivedView'];
    var serialized = instance.serialize();

    expect(serialized).to.have.keys(expectedFields);
    expect(serialized).to.have.property('datasetId', 'test-data');
  });

  it('should correctly deserialize', function() {
    var pageOverrides = {pageId: 'test-page', description: 'test description'};
    var datasetOverrides = {id: 'test-data'};
    var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);

    instance.observe('description').subscribe(function(description) {
      expect(description).to.equal('test description');
    });
  });

  it('should set the "isFromDerivedView" property', function() {
    var pageOverrides = {pageId: 'test-page', isFromDerivedView: true};
    var datasetOverrides = {id: 'test-data'};
    var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);

    expect(instance.isFromDerivedView).to.equal(true);
  });

  describe('toggleExpanded', function() {
    it('should toggle expanded on the given card', function() {
      var pageOverrides = {pageId: 'test-page'};
      var datasetOverrides = {id: 'test-data'};
      var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);
      var card = new Model();

      card.defineObservableProperty('expanded', false);
      instance.set('cards', [ card ]);

      instance.toggleExpanded(card);
      assert.isTrue(card.getCurrentValue('expanded'));
      instance.toggleExpanded(card);
      assert.isFalse(card.getCurrentValue('expanded'));
    });

    it('should only allow expanded on one card', function() {
      var pageOverrides = {pageId: 'test-page'};
      var datasetOverrides = {id: 'test-data'};
      var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);
      var cards = [ new Model(), new Model(), new Model() ];

      _.each(cards, function(card) {
        card.defineObservableProperty('expanded', false);
      });
      instance.set('cards', cards);

      function expandedValues() {
        return _.map(cards, function(card) {
          return card.getCurrentValue('expanded');
        });
      }

      instance.toggleExpanded(cards[0]);
      expect(expandedValues()).to.deep.equal([true, false, false]);
      instance.toggleExpanded(cards[2]);
      expect(expandedValues()).to.deep.equal([false, false, true]);
      instance.toggleExpanded(cards[2]);
      expect(expandedValues()).to.deep.equal([false, false, false]);
    });

    it('should set the "hasExpandedCard" property', function() {
      var pageOverrides = {pageId: 'test-page'};
      var datasetOverrides = {id: 'test-data'};
      var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);
      var card = new Model();

      card.defineObservableProperty('expanded', false);
      instance.set('cards', [ card ]);
      expect(instance.getCurrentValue('hasExpandedCard')).to.equal(null);
      instance.toggleExpanded(card);
      expect(instance.getCurrentValue('hasExpandedCard')).to.equal(true);
      instance.toggleExpanded(card);
      expect(instance.getCurrentValue('hasExpandedCard')).to.equal(false);
    });
  });

  var existingColumn = {
    name: 'title',
    description: 'blank!',
    physicalDatatype: 'number',
    defaultCardType: 'column',
    availableCardTypes: ['column', 'search']
  };

  function makePage(primaryAggregation, primaryAmountField, cards, vif) {
    var pageOverrides = {
      pageId: 'test-page',
      primaryAggregation: primaryAggregation,
      primaryAmountField: primaryAmountField,
      cards: cards,
      sourceVif: vif
    };
    var datasetOverrides = {
      id: 'test-data',
      columns: {
        'existing_column': existingColumn
      }
    };
    return Mockumentary.createPage(pageOverrides, datasetOverrides);
  }

  describe('activeFilters ephemeral property', function() {

    it('is computed from cards when there is no VIF', function(done) {
      var instance = makePage('count', null, [Mockumentary.createCardMetadata()]);

      instance.observe('activeFilters').subscribe(function(activeFilters) {
        expect(activeFilters[0].filters[0].serialize()).to.eql({
          function: 'BinaryOperator',
          arguments: {
            operator: '=',
            operand: 0.12,
            humanReadableOperand: undefined
          }
        });
        done();
      });

    });

    it('is computed from the VIF when there is one', function(done) {
      var instance = makePage('count', null, [Mockumentary.createCardMetadata()], sampleVif);

      instance.observe('activeFilters').subscribe(function(activeFilters) {
        expect(activeFilters[0].filters[0].serialize()).to.eql({
          function: 'BinaryOperator',
          arguments: {
            operator: '=',
            operand: 0.23,
            humanReadableOperand: undefined
          }
        });
        done();
      });
    });

  });

  describe('computedWhereClauseFragment ephemeral property', function() {

    it('is computed from cards when there is no VIF', function(done) {
      var instance = makePage('count', null, [Mockumentary.createCardMetadata()]);

      instance.observe('computedWhereClauseFragment').subscribe(function(computedWhereClauseFragment) {
        expect(computedWhereClauseFragment).to.eql('`blood_alcohol_level`=0.12');
        done();
      });
    });

    it('is computed from the VIF when there is one', function(done) {
      var instance = makePage('count', null, [Mockumentary.createCardMetadata()], sampleVif);

      instance.observe('computedWhereClauseFragment').subscribe(function(computedWhereClauseFragment) {
        expect(computedWhereClauseFragment).to.eql('`blood_alcohol_level`=0.23');
        done();
      });
    });

  });

  describe('enableAxisRescaling', function() {
    it('reflects the value of enable_data_lens_axis_rescaling', function() {
      ServerConfig.override('enable_data_lens_axis_rescaling', null);
      var instance = Mockumentary.createPage();
      expect(instance.getCurrentValue('enableAxisRescaling')).to.equal(null);

      ServerConfig.override('enable_data_lens_axis_rescaling', true);
      instance = Mockumentary.createPage();
      expect(instance.getCurrentValue('enableAxisRescaling')).to.equal(true);

      ServerConfig.override('enable_data_lens_axis_rescaling', false);
      instance = Mockumentary.createPage();
      expect(instance.getCurrentValue('enableAxisRescaling')).to.equal(false);
    });
  });
});
