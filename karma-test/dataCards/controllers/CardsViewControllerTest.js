describe("CardsViewController", function() {
  var Card, Page, $q, $rootScope, $controller;
  var mockPageDataService = {
  };
  var mockDatasetDataService = {
    getBaseInfo: function() {
      return $q.when({
        id: 'asdf-fdsa',
        defaultAggregateColumn: 'foo',
        rowDisplayUnit: 'bar',
        ownerId: 'fdsa-asdf',
        updatedAt: '2004-05-20T17:42:55+00:00',
        columns: []
      });
    },
    getPageIds: function() {
      return $q.when({
        publisher: [],
        user: []
      });
    }
  };

  beforeEach(module('dataCards'));
  beforeEach(function() {
    module(function($provide) {
      $provide.value('PageDataService', mockPageDataService);
      $provide.value('DatasetDataService', mockDatasetDataService);
    });
  });
  beforeEach(inject(['$q', 'Card', 'Page', '$rootScope', '$controller', function(_$q, _Card, _Page, _$rootScope, _$controller) {
    Card = _Card;
    Page = _Page;
    $q = _$q;
    $rootScope = _$rootScope;
    $controller = _$controller;
  }]));

  function makeController() {
    var scope = $rootScope.$new();
    var fakePageId = 'fooo-baar';

    var baseInfoPromise = $q.defer();

    mockPageDataService.getBaseInfo = function() { return baseInfoPromise.promise; };

    var controller = $controller('CardsViewController', {
      $scope: scope,
      page: new Page(fakePageId),
    });

    scope.$apply();
    expect(scope.page).to.be.instanceof(Page);

    return {
      baseInfoPromise: baseInfoPromise,
      scope: scope,
      controller: controller
    };
  };

  function testCard() {
    return {
      'description': '',
      'fieldName': _.uniqueId('testFieldName'),
      'cardSize': 1,
      'cardCustomStyle': {},
      'expandedCustomStyle': {},
      'displayMode': 'figures',
      'expanded': false
    };
  };

  describe('page name', function() {
    it('should update on the scope when the property changes on the model', function() {
      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var scope = controllerHarness.scope;

      var nameOne = _.uniqueId('name');
      var nameTwo = _.uniqueId('name');
      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        name: nameOne
      });
      $rootScope.$digest();

      expect(scope.pageName).to.equal(nameOne);

      scope.page.set('name', nameTwo);
      expect(scope.pageName).to.equal(nameTwo);
    });

    it('should default to "Untitled"', function() {
      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var scope = controllerHarness.scope;

      var nameOne = undefined;
      var nameTwo = _.uniqueId('name');
      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        name: undefined
      });
      $rootScope.$digest();

      expect(scope.pageName).to.equal("Untitled");

      scope.page.set('name', nameTwo);
      expect(scope.pageName).to.equal(nameTwo);
    });
  });

  describe('page description', function() {
    it('should update on the scope when the property changes on the model', function() {
      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var scope = controllerHarness.scope;

      var descriptionOne = _.uniqueId('description');
      var descriptionTwo = _.uniqueId('description');
      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        description: descriptionOne
      });
      $rootScope.$digest();

      expect(scope.pageDescription).to.equal(descriptionOne);

      scope.page.set('description', descriptionTwo);
      expect(scope.pageDescription).to.equal(descriptionTwo);
    });
  });

  it('should calculate expandedCards, collapsedCards, and useExpandedView correctly', function() {
    var controllerHarness = makeController();

    var controller = controllerHarness.controller;
    var scope = controllerHarness.scope;
    var cardBlobs = _.times(3, testCard);
    controllerHarness.baseInfoPromise.resolve({
      datasetId: 'fake-fbfr',
      name: 'fakeName',
      cards: cardBlobs,
    });
    $rootScope.$digest();

    // NB these tests intentionally care about the order of things in collapsedCards and expandedCards.
    // These should be in the same order as found in cardBlobs.

    expect(scope.useExpandedLayout).to.be.false;
    expect(scope.expandedCards).to.be.empty;
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName, cardBlobs[1].fieldName, cardBlobs[2].fieldName]
    );

    scope.page.getCurrentValue('cards')[1].set('expanded', true);
    expect(scope.useExpandedLayout).to.be.true;
    expect(_.pluck(scope.expandedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[1].fieldName]
    );
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName, cardBlobs[2].fieldName]
    );

    scope.page.getCurrentValue('cards')[1].set('expanded', false);
    expect(scope.useExpandedLayout).to.be.false;
    expect(scope.expandedCards).to.be.empty;
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName, cardBlobs[1].fieldName, cardBlobs[2].fieldName]
    );

    scope.page.getCurrentValue('cards')[1].set('expanded', true);
    scope.page.getCurrentValue('cards')[0].set('expanded', true);
    expect(scope.useExpandedLayout).to.be.true;
    expect(_.pluck(scope.expandedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName, cardBlobs[1].fieldName]
    );
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[2].fieldName]
    );

    scope.page.getCurrentValue('cards')[1].set('expanded', false);
    expect(scope.useExpandedLayout).to.be.true;
    expect(_.pluck(scope.expandedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName]
    );
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[1].fieldName, cardBlobs[2].fieldName]
    );
  });

  it('should calculate rowsOfCardsBySize and cardSizeNamesInDisplayOrder correctly', function() {
    var controllerHarness = makeController();

    var controller = controllerHarness.controller;
    var scope = controllerHarness.scope;
    var cardBlobs = _.times(3, testCard);
    controllerHarness.baseInfoPromise.resolve({
      datasetId: 'fake-fbfr',
      name: 'fakeName',
      cards: cardBlobs,
    });
    $rootScope.$digest();
    var cardModels = scope.page.getCurrentValue('cards');

    expect(scope.useExpandedLayout).to.be.false;

    expect(scope.rowsOfCardsBySize).to.have.key('1');
    expect(scope.rowsOfCardsBySize[1]).to.have.length(2); // Two rows in this group.
    expect(scope.cardSizeNamesInDisplayOrder).to.deep.equal(['1']);

    cardModels[0].set('cardSize', 2);
    expect(scope.rowsOfCardsBySize).to.have.keys('1', '2');
    expect(scope.rowsOfCardsBySize[1]).to.have.length(1); // One row in this group.
    expect(scope.rowsOfCardsBySize[2]).to.have.length(1); // One row in this group.
    expect(scope.cardSizeNamesInDisplayOrder).to.deep.equal(['1', '2']);
  });

  describe('card layout', function() {
    it('should provide an classForScreenPosition implementation that is left-weighted', function() {
      var controllerHarness = makeController();
      var classForScreenPosition = controllerHarness.scope.classForScreenPosition;
      expect(classForScreenPosition).to.exist;

      /* args are cardIndex, cardsInLine */
      var left = 'onLeft';
      var right = 'onRight';
      expect(classForScreenPosition(0, 1)).to.equal(left);

      expect(classForScreenPosition(0, 2)).to.equal(left);
      expect(classForScreenPosition(1, 2)).to.equal(right);

      expect(classForScreenPosition(0, 3)).to.equal(left);
      expect(classForScreenPosition(1, 3)).to.equal(left);
      expect(classForScreenPosition(2, 3)).to.equal(right);

      expect(classForScreenPosition(0, 4)).to.equal(left);
      expect(classForScreenPosition(1, 4)).to.equal(left);
      expect(classForScreenPosition(2, 4)).to.equal(right);
      expect(classForScreenPosition(3, 4)).to.equal(right);
    });
  });
});
