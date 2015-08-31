describe('Invalid Card Visualization', function() {
  'use strict';

  var testHelpers;
  var _$provide;
  var $q;
  var $rootScope;
  var Model;

  beforeEach(module('/angular_templates/dataCards/cardVisualizationInvalid.html'));
  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module(function($provide) {
    _$provide = $provide;
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  var directiveTemplate = '<card-visualization-invalid model="model"></card-visualization-invalid>';

  function stubCardModel() {
    var card = new Model();
    var page = new Model();
    var dataset = new Model();

    dataset.id = 'grrr-arrg';
    dataset.defineObservableProperty('rowDisplayUnit', '');
    page.defineObservableProperty('dataset', dataset);
    page.defineObservableProperty('baseSoqlFilter', '');
    page.defineObservableProperty('aggregation', {});
    card.page = page;
    card.fieldName = 'refurbished_jellyfish';
    card.defineObservableProperty('expanded', false);
    card.defineObservableProperty('activeFilters', []);

    return card;
  }

  function createInvalidCard() {
    var model = stubCardModel();
    var rootScope = $rootScope.$new();
    rootScope.model = model;

    var element = testHelpers.TestDom.compileAndAppend(directiveTemplate, rootScope);

    return {
      model: model,
      element: element,
      rootScope: rootScope
    };
  }

  it('should contain the appropriate text', function() {
    var invalidCard = createInvalidCard();
    expect(invalidCard.element.text()).to.match(/Invalid Card Visualization/);
  });
});
