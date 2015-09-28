describe('Page model', function() {
  'use strict';

  var CURRENT_PAGE_METADATA_VERSION = 1;

  var injector;
  var Mockumentary;
  var Page;
  var Model;
  var ServerConfig;

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    injector = $injector;
    Mockumentary = $injector.get('Mockumentary');
    Page = $injector.get('Page');
    Model = $injector.get('Model');
    ServerConfig = $injector.get('ServerConfig');

    // Set the current page metadata verison to 1
    ServerConfig.override('currentPageMetadataVersion', CURRENT_PAGE_METADATA_VERSION);
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
    var pageOverrides = {pageId: 'test-page'};
    var datasetOverrides = {id: 'test-data'};
    var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);
    var expectedFields = ['cards', 'datasetId', 'description', 'name', 'pageId', 'primaryAggregation', 'primaryAmountField', 'version', 'moderationStatus'];
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

  describe('toggleExpanded', function() {
    it('should toggle expanded on the given card', function() {
      var pageOverrides = {pageId: 'test-page'};
      var datasetOverrides = {id: 'test-data'};
      var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);
      var card = new Model();

      card.defineObservableProperty('expanded', false);
      instance.set('cards', [ card ]);

      instance.toggleExpanded(card);
      expect(card.getCurrentValue('expanded')).to.be.true;
      instance.toggleExpanded(card);
      expect(card.getCurrentValue('expanded')).to.be.false;
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

  describe('aggregation ephemeral property', function() {

    var existingColumn = {
      name: 'title',
      description: 'blank!',
      physicalDatatype: 'number',
      defaultCardType: 'column',
      availableCardTypes: ['column', 'search']
    };

    function makePage(primaryAggregation, primaryAmountField) {
      var pageOverrides = {
        pageId: 'test-page',
        primaryAggregation: primaryAggregation,
        primaryAmountField: primaryAmountField
      };
      var datasetOverrides = {
        id: 'test-data',
        columns: {
          'existing_column': existingColumn
        }
      };
      return Mockumentary.createPage(pageOverrides, datasetOverrides);
    }

    function aggregationExpectation(
      instance,
      aggregationFunction,
      aggregationColumnIsNull,
      aggregationFieldName,
      done
    ) {
      instance.observe('aggregation').subscribe(function(aggregation) {
        expect(aggregation['function']).to.equal(aggregationFunction);
        expect(aggregation.column === null).to.equal(aggregationColumnIsNull);
        expect(aggregation.fieldName).to.equal(aggregationFieldName);
        done();
      });
    }

    it('handles a count aggregation with no primaryAmountField', function(done) {
      var instance = makePage('count', null);
      aggregationExpectation(instance, 'count', true, null, done);
    });

    it('handles a count aggregation with a primaryAmountField that does not exist', function(done) {
      var instance = makePage('count', 'unused');
      aggregationExpectation(instance, 'count', true, 'unused', done);
    });

    it('handles a non-count aggregation with a null primaryAmountField', function(done) {
      var instance = makePage('sum', null);
      aggregationExpectation(instance, 'count', true, null, done);
    });

    it('handles a non-count aggregation with a primaryAmountField that does not exist', function(done) {
      var instance = makePage('sum', 'unused');
      aggregationExpectation(instance, 'count', true, null, done);
    });

    it('handles a non-count aggregation with a valid primaryAmountField', function(done) {
      var instance = makePage('sum', 'existing_column');
      aggregationExpectation(instance, 'sum', false, 'existing_column', done);
    })
  });
});
