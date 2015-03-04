describe("cardVisualization directive", function() {
  var $rootScope, testHelpers, ServerConfig, Model;

  beforeEach(module('/angular_templates/dataCards/cardVisualization.html'));
  beforeEach(module('test'));
  beforeEach(module('dataCards'));

  beforeEach(inject(['$rootScope', '$templateCache', 'testHelpers', 'ServerConfig', 'Model', function(_$rootScope, _$templateCache, _testHelpers, _ServerConfig, _Model) {
    $rootScope = _$rootScope;
    testHelpers = _testHelpers;
    Model = _Model;
    ServerConfig = _ServerConfig;

    // NOTE: Right now it's impossible to reconfigure CardTypeMapping,
    // so testing that feature maps actually can be enabled is not
    // trivial.
    ServerConfig.setup({
      oduxEnableFeatureMap: false
    });


    // Override the templates of the other directives. We don't need to test them.
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationColumnChart.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationChoropleth.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationTable.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationTimelineChart.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationSearch.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationInvalid.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationFeatureMap.html', '');
  }]));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('choosing a card visualization', function() {
    var el;
    var html = '<card-visualization model="cardModel"></card-visualization>';
    var cardModel;
    beforeEach(function() {
      var scope = $rootScope.$new();
      cardModel = new Model();
      cardModel.defineObservableProperty('fieldName', 'foo');
      cardModel.defineObservableProperty('expanded', false);
      cardModel.defineObservableProperty('cardSize', 1);
      cardModel.defineObservableProperty('cardType', 'column');
      cardModel.defineObservableProperty('page', null);
      cardModel.defineObservableProperty('activeFilters', []);
      cardModel.defineObservableProperty('column', { availableCardTypes: ['column'] });
      scope.cardModel = cardModel;
      el = testHelpers.TestDom.compileAndAppend(html, scope);
    });

    describe('when the card type is supported', function() {
      it('should choose the relevant visualization', function() {
        cardModel.set('cardType', 'column');
        expect($('card-visualization-column-chart').length).to.equal(1);
        expect($('card-visualization-feature-map').length).to.equal(0);

        cardModel.set('cardType', 'feature');
        expect($('card-visualization-column-chart').length).to.equal(0);
        expect($('card-visualization-feature-map').length).to.equal(0);
      });
    });
    describe('when the card type is not supported', function() {
      it('should choose the placeholder invalid visualization', function() {
        cardModel.set('cardType', 'feature');
        expect($('card-visualization-invalid').length).to.equal(1);
        expect($('card-visualization-feature-map').length).to.equal(0);
      });
    });
  });
});
