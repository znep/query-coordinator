describe('customize card dialog', function() {
  'use strict';

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/customizeCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/socSelect.html'));

  var AngularRxExtensions;
  var Card;
  var Model;
  var Page;
  var $httpBackend;
  var $rootScope;
  var $templateCache;
  var testHelpers;

  beforeEach(inject(function($injector) {
    AngularRxExtensions = $injector.get('AngularRxExtensions');
    Card = $injector.get('Card');
    Model = $injector.get('Model');
    Page = $injector.get('Page');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $templateCache = $injector.get('$templateCache');
    testHelpers = $injector.get('testHelpers');

    // We don't actually care about the contents of this
    $templateCache.put('/angular_templates/dataCards/cardVisualizationColumnChart.html', '');
    $templateCache.put('/angular_templates/dataCards/cardVisualizationTimelineChart.html', '');
    $templateCache.put('/angular_templates/dataCards/cardVisualizationChoropleth.html', '');
    $templateCache.put('/angular_templates/dataCards/cardVisualizationTable.html', '');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  var columns = {
    spot: {
      name: 'spot',
      title: 'Spot where cool froods hang out.',
      description: '???',
      logicalDatatype: 'location',
      physicalDatatype: 'number',
      importance: 2,
      shapefile: 'mash-apes'
    },
    bar: {
      name: 'bar',
      title: 'A bar where cool froods hang out.',
      description: '???',
      logicalDatatype: 'amount',
      physicalDatatype: 'number'
    }
  };

  function createDialog(cards, card) {
    var datasetModel = new Model();
    datasetModel.id = 'rook-king';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'row');
    datasetModel.defineObservableProperty('columns', columns);

    var pageModel = new Page('asdf-fdsa');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    pageModel.set('cards', cards || []);

    var outerScope = $rootScope.$new();
    AngularRxExtensions.install(outerScope);

    outerScope.page = pageModel;
    outerScope.bindObservable('cardModels', pageModel.observe('cards'));
    outerScope.dialogState = {show: true};
    outerScope.cardModel = Card.deserialize(pageModel, card);

    var html = [
      '<div ng-if="dialogState.show"> ',
        '<customize-card-dialog ',
          'card-models="cardModels" ',
          'card-model="cardModel" ',
          'dialog-state="dialogState" ',
          'page="page" ',
        '></add-card-dialog>',
      '</div>'].join('');

    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    // Because we have an ng-if, the element returned by $compile isn't the one we want (it's a
    // comment). So grab all the children of the element's parent.
    element = element.parent().children();

    return {
      outerScope: outerScope,
      element: element,
      // The ng-if introduces another scope
      scope: outerScope.$$childHead.$$childHead
    };
  }

  it('should display a card preview', function() {
    var cards = [];
    var card = {
      fieldName: 'spot',
      cardSize: 2,
      cardCustomStyle: {},
      expandedCustomStyle: {},
      displayMode: 'visualization',
      expanded: false
    };
    $httpBackend.expectGET(/\/api\/id\/rook-king.json.*/).respond([]);
    $httpBackend.expectGET(/\/resource\/mash-apes.geojson.*/).respond([]);
    var dialog = createDialog(cards, card);

    expect(dialog.element.find('card').length).to.equal(1);
    expect(dialog.element.find('card').scope().$$childHead.model).
      to.equal(dialog.outerScope.cardModel);
    expect(dialog.element.find('option:contains("Default Map")').length).to.equal(1);
  });
});
