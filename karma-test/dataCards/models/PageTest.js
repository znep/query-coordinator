describe('Page model', function() {
  'use strict';

  var DatasetV0;
  var DatasetV1;
  var Dataset;
  var injector;
  var testHelpers;
  var Model;
  var Mockumentary;
  var $rootScope;

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {

    DatasetV0 = $injector.get('DatasetV0');
    DatasetV1 = $injector.get('DatasetV1');
    injector = $injector;
    $rootScope = $injector.get('$rootScope');
    testHelpers = $injector.get('testHelpers');
    Model = $injector.get('Model');
    Mockumentary = $injector.get('Mockumentary');
  }));

  it('should correctly deserialize serialized page metadata passed into the constructor.', inject(function(Page) {
    var pageOverrides = {pageId: 'test-page'};
    var datasetOverrides = {id: 'test-data'};
    var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);

    expect(instance.id).to.equal('test-page');
  }));

  it('should return a DatasetV1 model from the dataset property', function(done) {
    var pageOverrides = {pageId: 'test-page'};
    var datasetOverrides = {id: 'test-data'};
    var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);

    instance.observe('dataset').subscribe(function(dataset) {
      expect(dataset.id).to.equal('test-data');
      done();
    });

    instance.set('description', desc2);
    instance.set('description', desc3);
    expect(expectedSequence).to.be.empty;
  });

  it('should correctly serialize', function() {
    var pageOverrides = {pageId: 'test-page'};
    var datasetOverrides = {id: 'test-data'};
    var instance = Mockumentary.createPage(pageOverrides, datasetOverrides);
    var expectedFields = ['cards', 'datasetId', 'description', 'name', 'pageId', 'primaryAggregation', 'primaryAmountField', 'version'];
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
    var Page;
    beforeEach(inject(function($injector) {
      Page = $injector.get('Page');
    }));
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
      var cards = [ new Model(), new Model(), new Model() ]

      _.each(cards, function(card) {
        card.defineObservableProperty('expanded', false);
      });
      instance.set('cards', cards);

      function expandedValues() {
        return _.map(cards, function(card) {
          return card.getCurrentValue('expanded');
        });
      };

      instance.toggleExpanded(cards[0]);
      expect(expandedValues()).to.deep.equal([true, false, false]);
      instance.toggleExpanded(cards[2]);
      expect(expandedValues()).to.deep.equal([false, false, true]);
      instance.toggleExpanded(cards[2]);
      expect(expandedValues()).to.deep.equal([false, false, false]);
    });
  });
});
