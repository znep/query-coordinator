'use strict';

describe('A FeatureMap Card Visualization', function() {
  var testHelpers;
  var $rootScope;
  var Model;
  var _$provide;
  var VectorTileDataService;
  var dataset;

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
      getFeatureExtent: function() { return $q.when([]); }
    };
    _$provide.value('CardDataService', mockCardDataService);
    testHelpers.mockDirective(_$provide, 'featureMap');
    VectorTileDataService = $injector.get('VectorTileDataService');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  beforeEach(function() {
    dataset = new Model();
    dataset.id = 'cras-hing';
    dataset.defineObservableProperty('rowDisplayUnit', '');
    sinon.stub(VectorTileDataService, 'buildTileGetter');
  });

  afterEach(function() {
    VectorTileDataService.buildTileGetter.restore();
  });

  function buildElement(options) {
    options = _.defaults({}, options, {
      dataset: undefined
    });

    var outerScope = $rootScope.$new();
    var html = [
      '<div class="card-visualization">',
      '<card-visualization-feature-map model="model" where-clause="whereClause">',
      '</card-visualization-feature-map>',
      '</div>'
    ].join('');

    var card = new Model();
    var page = new Model();
    page.defineObservableProperty('dataset', options.dataset); // The important bit

    page.defineObservableProperty('baseSoqlFilter', '');
    page.defineObservableProperty('aggregation', {});
    card.defineObservableProperty('page', page);
    card.defineObservableProperty('expanded', false);
    card.defineObservableProperty('activeFilters', []);
    card.defineObservableProperty('baseLayerUrl', '');
    card.fieldName = 'foo';

    outerScope.model = card;

    return {
      pageModel: page,
      cardModel: card,
      scope: outerScope,
      element: testHelpers.TestDom.compileAndAppend(html, outerScope)
    }
  }

  it('should not crash given an undefined dataset binding', function() {
    var elementInfo = buildElement();

    dataset.defineObservableProperty('permissions', '');

    elementInfo.element.find('feature-map').scope();

    // Use buildTileGetter as a proxy for FeatureMap's happiness.
    expect(VectorTileDataService.buildTileGetter).to.have.not.been.called;
    elementInfo.pageModel.set('dataset', dataset);
    expect(VectorTileDataService.buildTileGetter).to.have.been.called;
  });

  describe('tileserver sharding', function() {
    it('should parallelize tileserver requests if dataset is public', function() {
      dataset.defineObservableProperty('permissions', { isPublic: true });

      buildElement({
        dataset: dataset
      });
      expect(VectorTileDataService.buildTileGetter).to.have.been.called;
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      expect(lastCall).to.have.been.calledWithMatch(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.falsy
      );
    });

    it('should not parallelize tileserver requests if dataset is private', function() {
      dataset.defineObservableProperty('permissions', { isPublic: false });

      buildElement({
        dataset: dataset
      });
      expect(VectorTileDataService.buildTileGetter).to.have.been.called;
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      expect(lastCall).to.have.been.calledWithMatch(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.truthy
      );
    });

    it('should not parallelize tileserver request if dataset privacy is not available', function() {
      dataset.defineObservableProperty('permissions', undefined);

      buildElement({
        dataset: dataset
      });
      expect(VectorTileDataService.buildTileGetter).to.have.been.called;
      var lastCall = VectorTileDataService.buildTileGetter.lastCall;
      expect(lastCall).to.have.been.calledWithMatch(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.truthy
      );
    });
  });
});
