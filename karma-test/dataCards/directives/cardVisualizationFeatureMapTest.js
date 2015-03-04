'use strict';

describe("A FeatureMap Card Visualization", function() {
  var testHelpers;
  var $rootScope;
  var Model;
  var _$provide;

  beforeEach(module('/angular_templates/dataCards/cardVisualizationFeatureMap.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module(function($provide) {
    _$provide = $provide;
  }));
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    var $q = $injector.get('$q');
    var mockCardDataService = {
      getFeatureExtent: function(){ return $q.when([]); },
    };
    _$provide.value('CardDataService', mockCardDataService);
    testHelpers.mockDirective(_$provide, 'featureMap');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  it('should not crash given an undefined dataset binding', function() {
    var outerScope = $rootScope.$new();
    var html = '<div class="card-visualization"><card-visualization-feature-map model="model" where-clause="whereClause"></card-visualization-feature-map></div>';

    var card = new Model();
    var page = new Model();
    page.defineObservableProperty('dataset', undefined); // The important bit

    page.defineObservableProperty('baseSoqlFilter', '');
    page.defineObservableProperty('aggregation', {});
    card.defineObservableProperty('page', page);
    card.defineObservableProperty('expanded', false);
    card.defineObservableProperty('activeFilters', []);
    card.defineObservableProperty('baseLayerUrl', '');
    card.fieldName = 'foo';

    outerScope.model = card;

    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    var dataset = new Model();
    dataset.id = 'cras-hing';
    dataset.defineObservableProperty('rowDisplayUnit', '');

    var featureMapScope = element.find('feature-map').scope();

    // Use featureLayerUrl as a proxy for FeatureMap's happiness.
    expect(featureMapScope.featureLayerUrl).to.equal(undefined);
    page.set('dataset', dataset);
    expect(featureMapScope.featureLayerUrl).to.not.equal(undefined);
  });
});
