describe("CardsViewController", function() {
  var Page;
  var Card;
  var $q;
  var $rootScope;
  var $controller;
  var mockPageDataService = {
    save: function() {
      return $q.when({});
    }
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
  var mockUserSessionService = {
    getCurrentUser: function() {
      return $q.when(null);
    }
  };

  beforeEach(module('dataCards'));
  beforeEach(function() {
    module(function($provide) {
      $provide.value('PageDataService', mockPageDataService);
      $provide.value('DatasetDataService', mockDatasetDataService);
      $provide.value('UserSession', mockUserSessionService);
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

    var page = new Page(fakePageId);

    var controller = $controller('CardsViewController', {
      $scope: scope,
      page: page,
    });

    scope.$apply();
    expect(scope.page).to.be.instanceof(Page);

    return {
      baseInfoPromise: baseInfoPromise,
      scope: scope,
      controller: controller,
      page: page
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

  describe('filtering', function() {
    function makeMinimalController() {
      var controllerHarness = makeController();
      var cardBlobs = _.times(3, testCard);
      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        name: 'fakeName',
        cards: cardBlobs,
      });
      $rootScope.$digest();
      return controllerHarness;
    }
    describe('with no card filters applied', function() {
      describe('with no base filter', function() {
        it('should yield an empty WHERE', function() {
          var harness = makeMinimalController();
          expect(harness.scope.globalWhereClauseFragment).to.be.empty;
        });
        it('should yield an empty set of filtered column names', function() {
          var harness = makeMinimalController();
          expect(harness.scope.appliedFiltersForDisplay).to.be.empty;
        });
      });

      describe('with a base filter', function() {
        it('should reflect the base filterSoql', function() {
          var harness = makeMinimalController();
          var fakeFilter = "fakeField='fakeValue'";
          harness.page.set('baseSoqlFilter', fakeFilter);
          expect(harness.scope.globalWhereClauseFragment).to.equal(fakeFilter);
        });
        it('should yield an empty set of filtered column names', function() {
          var harness = makeMinimalController();
          var fakeFilter = "fakeField='fakeValue'";
          harness.page.set('baseSoqlFilter', fakeFilter);
          expect(harness.scope.appliedFiltersForDisplay).to.be.empty;
        });
      });
    });
    describe('with card filters applied', function() {
      describe('with no base filter', function() {
        it("should yield just the filtered card's WHERE", inject(function(Filter) {
          var harness = makeMinimalController();
          var filterOne = new Filter.IsNullFilter(true);
          var filterTwo = new Filter.BinaryOperatorFilter('=', 'test');

          var firstCard = harness.page.getCurrentValue('cards')[0];
          var thirdCard = harness.page.getCurrentValue('cards')[2];

          // Just one card
          firstCard.set('activeFilters', [filterOne]);
          expect(harness.scope.globalWhereClauseFragment).to.equal(filterOne.generateSoqlWhereFragment(firstCard.fieldName));

          // Two filtered cards
          thirdCard.set('activeFilters', [filterTwo]);
          expect(harness.scope.globalWhereClauseFragment).to.equal(
            "{0} AND {1}".format(
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(thirdCard.fieldName)
              ));

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          thirdCard.set('activeFilters', []);
          expect(harness.scope.globalWhereClauseFragment).to.equal(
            "{0} AND {1}".format(
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(firstCard.fieldName)
              ));
        }));
        it("should yield the filtered column names on appliedFiltersForDisplay", inject(function(Filter) {
          var harness = makeMinimalController();
          var filterOne = new Filter.IsNullFilter(false);
          var filterTwo = new Filter.BinaryOperatorFilter('=', 'test');

          var firstCard = harness.page.getCurrentValue('cards')[0];
          var thirdCard = harness.page.getCurrentValue('cards')[2];

          // Just one card
          firstCard.set('activeFilters', [filterOne]);
          expect(_.pluck(harness.scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' ]);
          expect(_.pluck(harness.scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank' ]);

          // Two filtered cards
          thirdCard.set('activeFilters', [filterTwo]);
          expect(_.pluck(harness.scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' , 'is' ]);
          expect(_.pluck(harness.scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', filterTwo.operand ]);

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          thirdCard.set('activeFilters', []);
          // NOTE: for MVP, only the first filter is honored for a particular card. See todo in production code.
          expect(_.pluck(harness.scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' ]);
          expect(_.pluck(harness.scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank' ]);
        }));
      });

      describe('with a base filter', function() {
        it('should reflect the base filterSoql', inject(function(Filter) {
          var harness = makeMinimalController();

          var fakeBaseFilter = "fakeField='fakeValueForBase'";
          harness.page.set('baseSoqlFilter', fakeBaseFilter);

          var filterOne = new Filter.IsNullFilter(false);
          var filterTwo = new Filter.BinaryOperatorFilter('=', 'test2');
          var firstCard = harness.page.getCurrentValue('cards')[0];
          var thirdCard = harness.page.getCurrentValue('cards')[2];

          // Just one card
          firstCard.set('activeFilters', [filterOne]);
          harness.scope.$digest();

          expect(harness.scope.globalWhereClauseFragment).to.equal(
            "{0} AND {1}".format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName))
            );

          // Two filtered cards
          thirdCard.set('activeFilters', [filterTwo]);
          expect(harness.scope.globalWhereClauseFragment).to.equal(
            "{0} AND {1} AND {2}".format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(thirdCard.fieldName)
              ));

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          thirdCard.set('activeFilters', []);
          expect(harness.scope.globalWhereClauseFragment).to.equal(
            "{0} AND {1} AND {2}".format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(firstCard.fieldName)
              ));
        }));
      });
    });
  });

  describe('page unsaved state', function() {
    it('should set hasChanges to true when a property changes on any model hooked to the page', function() {
      var controllerHarness = makeController();
      var scope = controllerHarness.scope;

      expect(scope.hasChanges).to.be.falsy;

      scope.page.set('name', 'name2');
      expect(scope.hasChanges).to.be.true;
    });

    it('should call PageDataService.save when savePage is called with hasChanges = true', function() {
      var controllerHarness = makeController();
      var scope = controllerHarness.scope;

      scope.page.set('name', 'name2'); // Cause a change.

      var spy = sinon.spy(mockPageDataService, 'save');
      scope.savePage();
      expect(spy.calledOnce).to.be.true;
      mockPageDataService.save.restore();
    });

    it('should not call PageDataService.save when savePage is called with hasChanges = false', function() {
      var controllerHarness = makeController();
      var scope = controllerHarness.scope;

      var spy = sinon.spy(mockPageDataService, 'save');
      scope.savePage();
      expect(spy.called).to.be.false;
      mockPageDataService.save.restore();
    });

    it('should set hasChanges to false after saving', function() {
      var controllerHarness = makeController();
      var scope = controllerHarness.scope;

      scope.page.set('name', 'name2');
      scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.
      expect(scope.hasChanges).to.be.false;
    });

    it('should set hasChanges to true after making a change after saving', function() {
      var controllerHarness = makeController();
      var scope = controllerHarness.scope;

      scope.page.set('name', 'name2');
      scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.
      scope.page.set('name', 'name3');
      expect(scope.hasChanges).to.be.true;
    });

    it('should set editMode to false after saving', function() {
      var controllerHarness = makeController();
      var scope = controllerHarness.scope;

      scope.editMode = true;
      scope.page.set('name', 'name2');
      scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.
      expect(scope.editMode).to.be.false;
    });
  });
});
