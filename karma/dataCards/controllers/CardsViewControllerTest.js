describe('CardsViewController', function() {
  'use strict';

  var TEST_PAGE_ID = 'boom-poww';
  var DEFAULT_PAGE_NAME = 'Name';
  var DEFAULT_PAGE_DESCRIPTION = 'page description';

  var Card;
  var Page;
  var ViewRights;
  var Mockumentary;
  var testHelpers;
  var $q;
  var $rootScope;
  var $controller;
  var _$provide;
  var $httpBackend;
  var $document;
  var ServerConfig;
  var PageDataService;
  var DeviceService;
  var controllerHarness;
  var $scope;
  var mockWindowServiceLocationSeq;
  var mockWindowOperations = {
    navigateTo: function(url) {
      mockWindowOperations.currentUrl = url;
      mockWindowServiceLocationSeq.onNext(url);
    }
  };
  var datasetOwnerId = 'fdsa-asdf';
  var mockUserSessionService = {};

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      _$provide = $provide;
      $provide.value('UserSessionService', mockUserSessionService);
      $provide.value('WindowOperations', mockWindowOperations);
    });
  });

  beforeEach(
    inject(
      [
        '$q',
        'Card',
        'Page',
        'ViewRights',
        'Mockumentary',
        '$rootScope',
        '$controller',
        '$document',
        'testHelpers',
        '$httpBackend',
        'ServerConfig',
        'PageDataService',
        'DeviceService',
        function(
          _$q,
          _Card,
          _Page,
          _ViewRights,
          _Mockumentary,
          _$rootScope,
          _$controller,
          _$document,
          _testHelpers,
          _$httpBackend,
          _ServerConfig,
          _PageDataService,
          _DeviceService) {

      Card = _Card;
      Page = _Page;
      ViewRights = _ViewRights;
      Mockumentary = _Mockumentary;
      $q = _$q;
      $rootScope = _$rootScope;
      $controller = _$controller;
      $document = _$document;
      testHelpers = _testHelpers;
      $httpBackend = _$httpBackend;
      ServerConfig = _ServerConfig;
      PageDataService = _PageDataService;
      DeviceService = _DeviceService;
      testHelpers.mockDirective(_$provide, 'suggestionToolPanel');
      testHelpers.mockDirective(_$provide, 'pageHeader');
      testHelpers.mockDirective(_$provide, 'infoPane');
      testHelpers.mockDirective(_$provide, 'quickFilterBar');
  }]));

  beforeEach(function() {
    ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});
    window.currentUser = {};
  });

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  function makeContext(datasetOverrides, pageOverrides) {
    pageOverrides = pageOverrides || {};
    _.defaults(
      pageOverrides, {
        name: DEFAULT_PAGE_NAME,
        description: DEFAULT_PAGE_DESCRIPTION,
        version: 1
      }
    );
    if (datasetOverrides && datasetOverrides.id) {
      pageOverrides.datasetId = datasetOverrides.id;
    }
    var page = Mockumentary.createPage(pageOverrides, datasetOverrides);

    var currentUserDefer = $q.defer();
    var promise = currentUserDefer.promise;

    mockUserSessionService.getCurrentUser = _.constant(promise);
    mockUserSessionService.getCurrentUser$ = _.constant(
      Rx.Observable.fromPromise(promise).catch(Rx.Observable.returnValue(null))
    );

    var $scope = $rootScope.$new();

    return {
      $scope: $scope,
      page: page,
      currentUserDefer: currentUserDefer
    };
  }

  function makeController(datasetOverrides, pageOverrides) {
    var context = makeContext(datasetOverrides, pageOverrides);
    var controller = $controller('CardsViewController', context);
    testHelpers.mockDirective(_$provide, 'modalDialog');
    testHelpers.mockDirective(_$provide, 'addCardDialog');
    testHelpers.mockDirective(_$provide, 'manageLensDialog');
    testHelpers.mockDirective(_$provide, 'mobileWarningDialog');
    context.$scope.$apply();
    expect(context.$scope.page).to.be.instanceof(Page);

    return $.extend(context, {
      controller: controller
    });
  }

  function testCard(id) {
    return {
      'description': '',
      'fieldName': 'testFieldName_{0}'.format(id),
      'cardSize': 1,
      'cardType': 'column',
      'expanded': false,
      'activeFilters': []
    };
  }

  beforeEach(function() {
    mockWindowServiceLocationSeq = new Rx.BehaviorSubject(undefined);
  });

  describe('page name', function() {

    it('syncs the model and scope references to the page name', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      var pageDirtied = false;
      $scope.page.observeDirtied().subscribe(function() {
        pageDirtied = true;
      });

      expect(pageDirtied).to.equal(false);
      // Make sure changing the scope updates the model
      $scope.$safeApply(function() {
        $scope.writablePage.name = 'Hello there I am a new name';
      });

      expect(pageDirtied).to.equal(true);
      expect($scope.page.getCurrentValue('name')).to.equal('Hello there I am a new name');

      // Make sure changing the model updates the scope
      $scope.page.set('name', 'tally ho, chap!');
      expect($scope.writablePage.name).to.equal('tally ho, chap!');
    });

    it('sets a warning when > 255 chars, and clears it when < 255 chars', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      $scope.page.set('name', _.map(_.range(255 / 5), _.constant('badger')).join(' '));

      expect($scope.writablePage.warnings.name).to.deep.equal(['Your title is too long']);

      $scope.page.set('name', 'mushroom mushroom');

      expect($scope.writablePage.warnings.name).to.not.be.ok;
    });

    it('surfaces warning names as a flyout on the warning icon', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      // Create a mock element that the flyout will trigger against.
      var editPageWarningElement = testHelpers.TestDom.append(
        '<div class="edit-page-warning">')[0];

      testHelpers.fireMouseEvent(editPageWarningElement, 'mousemove');
      expect($('#uber-flyout').text()).to.equal('');

      $scope.page.set('name', _.map(_.range(255 / 5), _.constant('badger')).join(' '));
      testHelpers.fireMouseEvent(editPageWarningElement, 'mousemove');
      expect($('#uber-flyout').text()).to.equal('Your title is too long');

      $scope.page.set('name', 'fireflower fireflower');
      testHelpers.fireMouseEvent(editPageWarningElement, 'mousemove');
      expect($('#uber-flyout').text()).to.equal('');
    });
  });

  describe('expanded card', function() {
    var controllerHarness;
    var $scope;
    var card;

    beforeEach(function() {
      controllerHarness = makeController(undefined, {
        cards: [testCard(1)]
      });

      $scope = controllerHarness.$scope;
      card = controllerHarness.page.getCurrentValue('cards')[0];
    });

    it('should assign the expanded card to the scope if a card is expanded', function() {
      expect($scope.expandedCard).to.equal(undefined);

      $scope.page.toggleExpanded(card);
      $scope.$digest();

      expect($scope.expandedCard).to.equal(card);
    });

    it('should clear the expanded card property from the scope if the card is collapsed', function() {
      $scope.page.toggleExpanded(card);
      $scope.page.toggleExpanded(card);

      expect($scope.expandedCard).to.equal(undefined);
    });
  });

  describe('globalWhereClauseFragment', function() {

    function makeMinimalController(datasetOverrides, pageOverrides) {
      var controllerHarness = makeController(datasetOverrides, pageOverrides);

      // This array will create a mixture of unique and non-unique field names.
      // For example: 'testFieldName_0', 'testFieldName_1', 'testFieldName_1'.
      // This is necessary because we need to test cards with the same and
      // different field names.
      var fieldNameIds = [0, 1, 1];
      var cardBlobs = _.map(fieldNameIds, function(n) {
        var cardBlob = testCard(n);
        return new Card(controllerHarness.page, cardBlob.fieldName, cardBlob);
      });
      controllerHarness.page.set('cards', cardBlobs);
      return controllerHarness;
    }

    describe('with no card filters applied', function() {
      describe('with no base filter', function() {
        it('should yield an empty WHERE', function() {
          var harness = makeMinimalController();
          expect(harness.$scope.globalWhereClauseFragment).to.be.empty;
        });
      });

      describe('with a base filter', function() {
        it('should reflect the base filterSoql', function() {
          var harness = makeMinimalController();
          var fakeFilter = "fakeField='fakeValue'";
          harness.page.set('baseSoqlFilter', fakeFilter);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(fakeFilter);
        });
      });
    });

    describe('with card filters applied', function() {
      var harness;
      var cards;
      var firstCard;
      var secondCard;
      var secondCardDuplicate;

      beforeEach(function() {
        harness = makeMinimalController();
        cards = harness.page.getCurrentValue('cards');
        firstCard = cards[0];
        secondCard = cards[1];
        secondCardDuplicate = cards[2];
      });

      afterEach(function() {
        testHelpers.fireMouseEvent(document.body, 'mousemove');
      });

      describe('with no base filter', function() {
        it("should yield just the filtered card's WHERE", inject(function(Filter) {
          var filterOne = new Filter.IsNullFilter(true);
          var filterTwo = new Filter.BinaryOperatorFilter('=', 'test');

          // Just one card
          firstCard.set('activeFilters', [filterOne]);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(filterOne.generateSoqlWhereFragment(firstCard.fieldName));

          // Two filtered cards
          secondCard.set('activeFilters', [filterTwo]);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1}'.format(
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(secondCard.fieldName)
              ));

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          secondCard.set('activeFilters', []);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1}'.format(
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(firstCard.fieldName)
              ));
        }));
      });

      describe('with a base filter', function() {
        it('should reflect the base filterSoql', inject(function(Filter) {
          var fakeBaseFilter = "fakeField='fakeValueForBase'";
          harness.page.set('baseSoqlFilter', fakeBaseFilter);

          var filterOne = new Filter.IsNullFilter(false);
          var filterTwo = new Filter.BinaryOperatorFilter('=', 'test2');

          // Just one card
          firstCard.set('activeFilters', [filterOne]);
          harness.$scope.$digest();

          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1}'.format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName))
            );

          // Two filtered cards
          secondCard.set('activeFilters', [filterTwo]);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1} AND {2}'.format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(secondCard.fieldName)
              ));

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          secondCard.set('activeFilters', []);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1} AND {2}'.format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(firstCard.fieldName)
              ));

          // Two identical filtered cards
          firstCard.set('activeFilters', []);
          secondCard.set('activeFilters', [filterOne]);
          secondCardDuplicate.set('activeFilters', [filterTwo]);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1} AND {2}'.format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(secondCard.fieldName),
              filterTwo.generateSoqlWhereFragment(secondCardDuplicate.fieldName)
              ));
        }));
      });
    });
  });

  describe('manage lens dialog', function() {
    it('should be initialized', function() {
      var harness = makeController();
      expect(harness.$scope.manageLensState).to.not.be.undefined;
    });

    it('should hide the manage lens button when the user lacks any sufficient permissions', function() {
      var harness = makeController({}, {
        rights: [ViewRights.ADD, ViewRights.WRITE, ViewRights.DELETE]
      });
      expect(harness.$scope.shouldShowManageLens).to.be.false;
    });

    it('should hide the manage lens button when on an ephemeral view', function() {
      var harness = makeController({}, {
        rights: [ViewRights.ADD, ViewRights.WRITE, ViewRights.GRANT],
        pageId: null
      });

      expect(harness.$scope.shouldShowManageLens).to.be.false;
    });

    it('should show the manage lens button when the user has the grant permission', function() {
      var harness = makeController({}, {
        rights: [ViewRights.ADD, ViewRights.WRITE, ViewRights.GRANT]
      });
      expect(harness.$scope.shouldShowManageLens).to.be.true;
    });

    it('should show the manage lens button when the user has the update_view permission', function() {
      var harness = makeController({}, {
        rights: [ViewRights.ADD, ViewRights.WRITE, ViewRights.UPDATE_VIEW]
      });
      expect(harness.$scope.shouldShowManageLens).to.be.true;
    });
  });

  describe('user save rights', function() {
    describe('shouldEnableSave on scope', function() {
      function runCase(hasCurrentUser, isDirty, hasEditRight) {
        if (hasCurrentUser) {
          window.currentUser = {
            id: 'asdf-asdf'
          };
        }

        var controllerHarness = makeController({}, {
          rights: hasEditRight ? [ViewRights.UPDATE_VIEW] : []
        });
        var $scope = controllerHarness.$scope;

        $scope.$digest();

        $scope.$safeApply(function() {
          if (isDirty) {
            $scope.writablePage.name = 'Something Different';
          } else {
            $scope.page.resetDirtied();
          }
        });

        return {
          expect: function(expectation) {
            expect($scope.shouldEnableSave).to.equal(expectation);
          }
        };
      }

      it('should be false if no user is logged in', function() {
        runCase(false, false, false).expect(false);
      });

      it('should be false if page is not dirty and user has update_view right', function() {
        runCase(true, false, true).expect(false);
      });

      it('should be false if page is dirty and if user does not have update_view right', function() {
        runCase(true, true, false).expect(false);
      });

      it('should be true if page is dirty and user has update_view right', function() {
        runCase(true, true, true).expect(true);
      });
    });
  });

  describe('user has provenance rights', function() {
    function mockUser(hasProvenanceRight) {
      return {
        rights: hasProvenanceRight ? ['manage_provenance'] : []
      };
    }

    function runCase(hasProvenanceRight) {
      window.currentUser = mockUser(hasProvenanceRight);
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      $scope.$digest();

      return {
        expect: function(expectation) {
          expect($scope.currentUserHasProvenanceRight).to.equal(expectation);
        }
      };
    }

    it('should be true if user has manage_provenance right', function() {
      runCase(true).expect(true);
    });

    it('should be false if user does not have manage_provenance right', function() {
      runCase(false).expect(false);
    });
  });

  describe('page unsaved state', function() {

    beforeEach(function() {
      controllerHarness = makeController();
      $scope = controllerHarness.$scope;
    });

    it('should set hasChanges to true when a property changes on any model hooked to the page, then back to false when changed back to its original value', function() {
      $scope.$digest();

      expect($scope.hasChanges).not.to.be.ok;

      $scope.page.set('name', 'name2');
      expect($scope.hasChanges).to.be.true;

      $scope.page.set('name', DEFAULT_PAGE_NAME);
      expect($scope.hasChanges).not.to.be.ok;
    });

    it('should call PageDataService.save when savePage is called with hasChanges = true', function() {
      $scope.page.set('name', 'name2'); // Cause a change.

      var spy = sinon.stub(PageDataService, 'save', _.constant(Promise.resolve(
        { data: { pageId: TEST_PAGE_ID } }
      )));
      $scope.savePage();
      expect(spy.calledOnce).to.be.true;
    });

    it('should not call PageDataService.save when savePage is called with hasChanges = false', function() {
      var spy = sinon.stub(PageDataService, 'save', _.constant(Promise.resolve(
        { data: { pageId: TEST_PAGE_ID } }
      )));
      $scope.savePage();
      expect(spy.called).to.be.false;
    });

    it('should set hasChanges to false after successfully saving', function(done) {
      sinon.stub(PageDataService, 'save', _.constant(Promise.resolve(
        { data: { pageId: TEST_PAGE_ID } }
      )));

      $scope.page.set('name', 'name2');
      $scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.

      // Due to our save debouncing, this change is intentionally delayed.
      $scope.$watch('hasChanges', function(hasChanges) {
        if (!hasChanges) { done(); }
      });
    });

    it('should NOT set hasChanges to false after failing to save', function() {
      $scope.page.set('name', 'name2');

      // always fail the save.
      sinon.stub(PageDataService, 'save', _.constant($q.reject()));

      $scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.

      expect($scope.hasChanges).to.be.true;
    });

    it('should set hasChanges to true after making a change after saving', function() {
      sinon.stub(PageDataService, 'save', _.constant(Promise.resolve(
        { data: { pageId: TEST_PAGE_ID } }
      )));
      $scope.page.set('name', 'name2');
      $scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.
      $scope.page.set('name', 'name3');
      expect($scope.hasChanges).to.be.true;
    });

    it('should set editMode to false after saving', function() {
      sinon.stub(PageDataService, 'save', _.constant(Promise.resolve(
        { data: { pageId: TEST_PAGE_ID } }
      )));
      $scope.editMode = true;
      $scope.page.set('name', 'name2');
      $scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.
      expect($scope.editMode).to.equal(false);
    });

    it('sets validation error and does not save when trying to save no title', function() {
      $scope.editMode = true;
      $scope.page.set('name', '');
      $scope.savePage();

      expect($scope.writablePage.warnings.name).to.deep.equal(['Please enter a title']);
    });
  });

  describe('add card modal dialog', function() {

    beforeEach(inject(['testHelpers', function(_testHelpers) {
      testHelpers = _testHelpers;
      controllerHarness = makeController();
      $scope = controllerHarness.$scope;
    }]));

    it('should become visible when an "add-card-with-size" event is received', function(done) {
      $scope.allVisualizableColumnsVisualized = false

      expect($scope.addCardState.show).to.equal(false);

      $scope.$on('add-card-with-size', function() {
        expect($scope.addCardState.show).to.equal(true);
        expect($scope.addCardState.cardSize).to.equal(1);
        done();
      });

      $rootScope.$broadcast('add-card-with-size', 1);
    });
  });

  describe('customize card modal dialog', function() {
    beforeEach(inject(['testHelpers', function(_testHelpers) {
      testHelpers = _testHelpers;
      controllerHarness = makeController();
      $scope = controllerHarness.$scope;
    }]));

    it('should become visible when a "customize-card-with-model" event is received which includes a model of a customizable card type', function(done) {

      var serializedCard;
      var cardModel;

      controllerHarness.$scope.$digest();

      expect($scope.customizeState.show).to.equal(false);

      $scope.$on('customize-card-with-model', function(e, model) {

        $scope.$apply();

        // NOTE: In order for this to work the physical and logical
        // datatypes of the column referenced by the fieldName of the
        // newly-created card must map to a card type which is actually
        // customizable.
        expect($scope.customizeState.show).to.equal(true);
        expect($scope.customizeState.cardModel).to.equal(cardModel);
        done();
      });

      serializedCard = {
        'cardSize': 1,
        'cardType': 'choropleth',
        'expanded': false,
        'fieldName': 'customizableFieldName'
      };

      cardModel = Card.deserialize($scope.page, serializedCard);

      $rootScope.$broadcast('customize-card-with-model', cardModel);

    });

  });

  describe('mobile warning dialog', function() {
    var cookieSet = function() {
      return (/(^|;)\s*mobileWarningClosed=/).test(document.cookie);
    };

    describe('on a desktop device', function() {
      it('should not be visible', function() {
        sinon.stub(DeviceService, 'isMobile').returns(false);

        controllerHarness = makeController();
        $scope = controllerHarness.$scope;
        expect($scope.mobileWarningState.show).to.equal(false);
      });
    });
  });

  describe('savePageAs', function() {
    var controllerHarness;
    var $scope;
    var NEW_PAGE_NAME = 'my new page name';
    var NEW_PAGE_DESCRIPTION = 'my new page description';
    var NEW_PAGE_MODERATION_STATUS = undefined;
    var NEW_PAGE_PROVENANCE = 'OFFICIAL';
    var saveStub;

    beforeEach(function() {
      controllerHarness = makeController();
      $scope = controllerHarness.$scope;
      saveStub = sinon.stub(PageDataService, 'save', _.constant(Promise.resolve(
        { data: { pageId: TEST_PAGE_ID } }
      )));
    });

    afterEach(function() {
      PageDataService.save.restore();
    });

    it('should call save on PageDataService with no id and updated data', function(done) {
      var saveEvents = $scope.savePageAs(NEW_PAGE_NAME, NEW_PAGE_DESCRIPTION, NEW_PAGE_MODERATION_STATUS, NEW_PAGE_PROVENANCE);

      saveEvents.subscribe(function(event) {
        if (event.status === 'saved') {
          expect(saveStub.calledOnce).to.be.true;
          done();
        }
      });
    });

    it('should redirect to the new page URL on success', function(done) {
      mockWindowServiceLocationSeq.onNext(undefined);
      $scope.savePageAs(NEW_PAGE_NAME, NEW_PAGE_DESCRIPTION, NEW_PAGE_MODERATION_STATUS, NEW_PAGE_PROVENANCE);
      mockWindowServiceLocationSeq.subscribe(function(href) {
        if (href) {
          expect(href).to.match(new RegExp('/view/{0}$'.format(TEST_PAGE_ID)));
          done();
        }
      });
    });
  });
});
