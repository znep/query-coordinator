describe("CardsViewController", function() {
  var Card, Page, $q, $rootScope, $controller;
  var mockPageDataService = {
  };

  beforeEach(module('dataCards'));
  beforeEach(function() {
    module(function($provide) {
      $provide.value('PageDataService', mockPageDataService);
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

    var cardsPromise = $q.defer();
    var staticInfoPromise = $q.defer();

    mockPageDataService.getCards = function() { return cardsPromise.promise; };
    mockPageDataService.getStaticInfo = function() { return staticInfoPromise.promise; };

    var controller = $controller('CardsViewController', {
      $scope: scope,
      page: new Page(fakePageId),
    });

    scope.$apply();
    expect(scope.page).to.be.instanceof(Page);

    return {
      cardsPromise: cardsPromise,
      staticInfoPromise: staticInfoPromise,
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

  it('should update the pageName and pageDescription values on the scope when these properties change on the model', function() {
    var controllerHarness = makeController();

    var controller = controllerHarness.controller;
    var scope = controllerHarness.scope;

    var nameOne = _.uniqueId('name');
    var nameTwo = _.uniqueId('name');
    var descriptionOne = _.uniqueId('description');
    var descriptionTwo = _.uniqueId('description');
    controllerHarness.staticInfoPromise.resolve({
      datasetId: 'fake-fbfr',
      name: nameOne,
      description: descriptionOne
    });
    $rootScope.$digest();

    expect(scope.pageName).to.equal(nameOne);
    expect(scope.pageDescription).to.equal(descriptionOne);

    scope.page.name = nameTwo;
    scope.page.description = descriptionTwo;
    expect(scope.pageName).to.equal(nameTwo);
    expect(scope.pageDescription).to.equal(descriptionTwo);
  });

  it('should calculate expandedCards, collapsedCards, and useExpandedView correctly', function() {
    var controllerHarness = makeController();

    var controller = controllerHarness.controller;
    var scope = controllerHarness.scope;
    var cardBlobs = _.times(3, testCard);
    controllerHarness.cardsPromise.resolve({cards: cardBlobs});
    $rootScope.$digest();

    // NB these tests intentionally care about the order of things in collapsedCards and expandedCards.
    // These should be in the same order as found in cardBlobs.

    expect(scope.useExpandedLayout).to.be.false;
    expect(scope.expandedCards).to.be.empty;
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName, cardBlobs[1].fieldName, cardBlobs[2].fieldName]
    );

    scope.page.cards.value[1].expanded = true;
    expect(scope.useExpandedLayout).to.be.true;
    expect(_.pluck(scope.expandedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[1].fieldName]
    );
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName, cardBlobs[2].fieldName]
    );

    scope.page.cards.value[1].expanded = false;
    expect(scope.useExpandedLayout).to.be.false;
    expect(scope.expandedCards).to.be.empty;
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName, cardBlobs[1].fieldName, cardBlobs[2].fieldName]
    );

    scope.page.cards.value[1].expanded = true;
    scope.page.cards.value[0].expanded = true;
    expect(scope.useExpandedLayout).to.be.true;
    expect(_.pluck(scope.expandedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName, cardBlobs[1].fieldName]
    );
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[2].fieldName]
    );

    scope.page.cards.value[1].expanded = false;
    expect(scope.useExpandedLayout).to.be.true;
    expect(_.pluck(scope.expandedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[0].fieldName]
    );
    expect(_.pluck(scope.collapsedCards, 'fieldName')).to.deep.equal(
      [cardBlobs[1].fieldName, cardBlobs[2].fieldName]
    );
  });

  it('should calculate cardLinesBySizeGroup and cardSizeNamesInDisplayOrder correctly', function() {
    var controllerHarness = makeController();

    var controller = controllerHarness.controller;
    var scope = controllerHarness.scope;
    var cardBlobs = _.times(3, testCard);
    controllerHarness.cardsPromise.resolve({cards: cardBlobs});
    $rootScope.$digest();
    var cardModels = scope.page.cards.value;

    expect(scope.useExpandedLayout).to.be.false;

    expect(scope.cardLinesBySizeGroup).to.have.key('1');
    expect(scope.cardLinesBySizeGroup[1]).to.have.length(2); // Two rows in this group.
    expect(scope.cardSizeNamesInDisplayOrder).to.deep.equal(['1']);

    cardModels[0].cardSize = 2;
    expect(scope.cardLinesBySizeGroup).to.have.keys('1', '2');
    expect(scope.cardLinesBySizeGroup[1]).to.have.length(1); // One row in this group.
    expect(scope.cardLinesBySizeGroup[2]).to.have.length(1); // One row in this group.
    expect(scope.cardSizeNamesInDisplayOrder).to.deep.equal(['1', '2']);
  });
});
