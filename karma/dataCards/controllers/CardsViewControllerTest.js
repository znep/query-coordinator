describe('CardsViewController', function() {
  'use strict';

  var TEST_PAGE_ID = 'boom-poww';
  var DEFAULT_PAGE_NAME = 'Name';
  var DEFAULT_PAGE_DESCRIPTION = 'page description';

  var Card;
  var Page;
  var Domain;
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
    setTitle: function(title) {
      mockWindowOperations.currentTitle = title;
    },
    navigateTo: function(url) {
      mockWindowOperations.currentUrl = url;
      mockWindowServiceLocationSeq.onNext(url);
    }
  };
  var datasetOwnerId = 'fdsa-asdf';
  var mockUserSessionService = {};

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
        'Domain',
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
          _Domain,
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
      Domain = _Domain;
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
    var domain = new Domain({
      categories: [
        'Business',
        'Government'
      ]
    });

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
      domain: domain,
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

  // NOTE [AMH]: I have added some gross hackiness because our existing test helpers
  // did not allow us to customize the state adequately. This should be refactored
  // when time allows.
  function renderCardsView(options) {
    var options = options || {};
    var layout = typeof options.layout === 'undefined' ? 'multiCardLayout' : options.layout;

    var context = options.context || makeContext();
    var cardLayout = {};
    testHelpers.mockDirective(_$provide, 'apiExplorer');

    if (options.layout !== null) {
      testHelpers.mockDirective(_$provide, layout, function() {
        return {
          link: function($scope) {
            cardLayout.$scope = $scope;
          }
        };
      });
    }

    testHelpers.mockDirective(_$provide, 'multilineEllipsis');
    testHelpers.mockDirective(_$provide, 'notifyResize');
    testHelpers.mockDirective(_$provide, 'aggregationChooser');
    testHelpers.mockDirective(_$provide, 'newShareDialog');
    _$provide.value('page', context.page);
    _$provide.value('domain', context.domain);
    var html = '<ng-include ng-controller="CardsViewController"' +
        'src="\'/angular_templates/dataCards/pages/cards-view.html\'"></ng-include>';
    var element = testHelpers.TestDom.compileAndAppend(html, context.$scope);
    return $.extend({
      cardLayout: cardLayout,
      element: element.parent().children()
    }, context);
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

    it('should be used for the document title', function() {
      var controllerHarness = makeController();
      var nameOne = _.uniqueId('name');

      $rootScope.$digest();
      expect(mockWindowOperations.currentTitle).to.equal('{0} | Socrata'.format(DEFAULT_PAGE_NAME));
    });

    it('should update on the scope when the property changes on the model', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;
      var newName = _.uniqueId('name');

      $rootScope.$digest();

      expect($scope.pageName).to.equal(DEFAULT_PAGE_NAME);

      $scope.page.set('name', newName);
      expect($scope.pageName).to.equal(newName);
    });

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

  describe('page header', function() {
    it('should not display if a feature flag is set', function() {
      ServerConfig.override('showNewuxPageHeader', false);
      var context = renderCardsView();
      var pageHeader = context.element.find('page-header');
      var metadata = context.element.find('.cards-metadata');
      expect(pageHeader).to.have.class('ng-hide');
      expect(metadata).to.not.have.class('page-header-enabled');
    });
  });

  describe('source dataset link', function() {
    it('sets the sourceDatasetURL if the migration info is available', function() {
      var controllerHarness = makeController({ id: 'nach-oids', obeId: 'asdf-fdsa' });
      var $scope = controllerHarness.$scope;

      expect($scope.sourceDatasetURL).to.be.ok;
    });

    it('does not set the sourceDatasetURL if the migration info is not available', function() {
      var controllerHarness = makeController({ id: 'nach-oids', obeId: null });
      var $scope = controllerHarness.$scope;

      expect($scope.sourceDatasetURL).not.to.be.ok;
    });
  });

  describe('related views', function() {
    it('shows the related views area if feature flag enable_data_lens_other_views is true and currentUserHasSaveRight is true', function() {
      ServerConfig.override('enableDataLensOtherViews', true);
      var context = renderCardsView();
      $scope = context.element.scope();
      $scope.currentUserHasSaveRight = true;
      $scope.$digest();
      var relatedViews = context.element.find('related-views');
      expect(relatedViews).to.not.have.class('ng-hide');
    });

    it('does not show related views area if feature flag enable_data_lens_other_views is false', function() {
      ServerConfig.override('enableDataLensOtherViews', false);
      var context = renderCardsView();
      var relatedViews = context.element.find('related-views');
      expect(relatedViews).to.have.class('ng-hide');
    });

    it('does not show related views area if currentUserHasSaveRight is false', function() {
      ServerConfig.override('enableDataLensOtherViews', true);
      var context = renderCardsView();
      var relatedViews = context.element.find('related-views');
      $scope = context.$scope;
      $scope.currentUserHasSaveRight = false;
      $scope.$digest();
      expect(relatedViews).to.have.class('ng-hide');
    });
  });

  describe('page description', function() {
    it('should update on the scope when the property changes on the model', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;
      var newDescription = _.uniqueId('description');

      expect($scope.pageDescription).to.equal(DEFAULT_PAGE_DESCRIPTION);

      $scope.page.set('description', newDescription);
      expect($scope.pageDescription).to.equal(newDescription);
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

  describe('filtering', function() {

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
        it('should yield an empty set of filtered column names', function() {
          var harness = makeMinimalController();
          expect(harness.$scope.appliedFiltersForDisplay).to.be.empty;
        });
      });

      describe('with a base filter', function() {
        it('should reflect the base filterSoql', function() {
          var harness = makeMinimalController();
          var fakeFilter = "fakeField='fakeValue'";
          harness.page.set('baseSoqlFilter', fakeFilter);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(fakeFilter);
        });
        it('should yield an empty set of filtered column names', function() {
          var harness = makeMinimalController();
          var fakeFilter = "fakeField='fakeValue'";
          harness.page.set('baseSoqlFilter', fakeFilter);
          expect(harness.$scope.appliedFiltersForDisplay).to.be.empty;
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

      it('should be clear-all-able', inject(function(Filter) {
        var filters = [
          new Filter.IsNullFilter(true),
          new Filter.BinaryOperatorFilter('=', 'test'),
        ];

        firstCard.set('activeFilters', [filters[0]]);
        secondCard.set('activeFilters', [filters[1]]);

        harness.$scope.clearAllFilters();

        expect(firstCard.getCurrentValue('activeFilters')).to.be.empty;
        expect(secondCard.getCurrentValue('activeFilters')).to.be.empty;
        expect(secondCardDuplicate.getCurrentValue('activeFilters')).to.be.empty;
      }));

      it('should register a flyout for a clear-all-filters button', function() {
        var buttonElement = testHelpers.TestDom.append(
          '<button class="clear-all-filters-button" />');
        expect($('.flyout-title').length).to.equal(0);

        testHelpers.fireMouseEvent(buttonElement[0], 'mousemove');

        var flyout = $('.flyout-title');
        expect(flyout.length).to.equal(1);
        expect(flyout.text().indexOf('Click to reset all filters')).to.be.greaterThan(-1);
      });

      it('should register a flyout for the clear-all-filters button close icon', function() {
        var buttonHTML = [
          '<button class="clear-all-filters-button">',
            '<span class="icon-close"></span>',
          '</button>'
        ].join('');
        var buttonElement = testHelpers.TestDom.append(buttonHTML);
        expect($('.flyout-title').length).to.equal(0);

        testHelpers.fireMouseEvent(buttonElement.find('.icon-close')[0], 'mousemove');

        var flyout = $('.flyout-title');
        expect(flyout.length).to.equal(1);
        expect(flyout.text().indexOf('Click to reset all filters')).to.be.greaterThan(-1);
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
        it('should yield the filtered column names on appliedFiltersForDisplay', inject(function(Filter) {
          var filterOne = new Filter.IsNullFilter(false);
          var filterTwo = new Filter.BinaryOperatorFilter('=', 'test');

          // Just one card
          firstCard.set('activeFilters', [filterOne]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' ]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank' ]);

          // Two filtered cards
          secondCard.set('activeFilters', [filterTwo]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' , 'is' ]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', filterTwo.operand ]);

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          secondCard.set('activeFilters', []);
          // NOTE: for MVP, only the first filter is honored for a particular card. See todo in production code.
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' ]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank' ]);

          // Two identical filtered cards
          firstCard.set('activeFilters', []);
          secondCard.set('activeFilters', [filterOne]);
          secondCardDuplicate.set('activeFilters', [filterTwo]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' , 'is' ]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', filterTwo.operand ]);
        }));

        it('should render a whitespace-only operand filter the same way as a null filter', inject(function(Filter) {
          var filterOne = new Filter.IsNullFilter(true);
          var filterTwo = new Filter.BinaryOperatorFilter('=', ' ');

          firstCard.set('activeFilters', [filterOne]);
          secondCard.set('activeFilters', [filterTwo]);

          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is' , 'is' ]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', 'blank' ]);

          // Two identical filtered cards
          firstCard.set('activeFilters', []);
          secondCard.set('activeFilters', [filterOne]);
          secondCardDuplicate.set('activeFilters', [filterTwo]);

          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is' , 'is' ]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', 'blank' ]);
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

    describe('quickFilterBarTitle', function() {
      it('should use the aggregation-based title if the page metadata is v3 or lower', function() {
        ServerConfig.override('enableDataLensCardLevelAggregation', true);
        var harness = makeMinimalController({}, { version: 3 });
        expect(harness.$scope.quickFilterBarTitle).to.equal('Showing <span class="light">the number of rows</span>');
      });

      it('should use the aggregation-based title if the card-level aggregation feature flag is disabled', function() {
        ServerConfig.override('enableDataLensCardLevelAggregation', false);
        var harness = makeMinimalController();
        expect(harness.$scope.quickFilterBarTitle).to.equal('Showing <span class="light">the number of rows</span>');
      });

      it('should use the rowDisplayUnit-based title if the page is version 4 and the card-level aggregation feature flag is enabled', function() {
        ServerConfig.override('enableDataLensCardLevelAggregation', true);
        var harness = makeMinimalController({}, { version: 4 });
        expect(harness.$scope.quickFilterBarTitle).to.equal('Showing <span class="light">all rows</span>');
      });

      it('should change the new title if the page is filtered', inject(function(Filter) {
        ServerConfig.override('enableDataLensCardLevelAggregation', true);
        var harness = makeMinimalController({}, { version: 4 });
        var cards = harness.page.getCurrentValue('cards');
        cards[0].set('activeFilters', [new Filter.IsNullFilter(true)]);
        expect(harness.$scope.quickFilterBarTitle).to.equal('Showing <span class="light">rows</span>');
      }));
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

    describe('on a mobile device', function() {
      beforeEach(inject(['testHelpers', function(_testHelpers) {
        sinon.stub(DeviceService, 'isMobile').returns(true);
        testHelpers = _testHelpers;

        // Clear mobileWarningClosed cookie
        document.cookie = 'mobileWarningClosed=1; expires=' + new Date(0).toUTCString();
      }]));

      it('should not be visible if the cookie "mobileWarningClosed" is set', function() {
        document.cookie = 'mobileWarningClosed=1';

        controllerHarness = makeController();
        $scope = controllerHarness.$scope;

        expect($scope.mobileWarningState.show).to.equal(false);
      });

      // Helper function to render the modal and click an element.
      // Ensures the modal closes and the appropriate cookie is set.
      var runCaseWithSelector = function(selector) {
        var context = renderCardsView();
        var $scope = context.cardLayout.$scope.$parent;

        $scope.$digest();
        expect($scope.mobileWarningState.show).to.equal(true);

        var element = context.element.find(selector)[0];
        expect(element).to.exist;
        testHelpers.fireMouseEvent(element, 'click');

        $scope.$digest();
        expect($scope.mobileWarningState.show).to.equal(false);
        expect(cookieSet()).to.equal(true);
      };

      it('should hide and set a cookie when the acknowledgement button is clicked', function() {
        runCaseWithSelector('.mobile-warning-buttons button');
      });

      it('should hide and set a cookie when the close button is clicked', function() {
        runCaseWithSelector('.modal-close-button');
      });

      it('should hide and set a cookie when the modal overlay is clicked', function() {
        runCaseWithSelector('.modal-overlay');
      });
    });
  });

  describe('save-visualization-as dialog', function() {
    beforeEach(inject(['testHelpers', function(_testHelpers) {
      testHelpers = _testHelpers;
      controllerHarness = makeController();
      $scope = controllerHarness.$scope;
    }]));

    it('should become visible when a "save-visualization-as" event is received which includes a model of \
        a card type that can be persisted as a standalone visualization', function(done) {

      var serializedCard;
      var cardModel;

      controllerHarness.$scope.$digest();

      expect($scope.saveVisualizationAsState.show).to.equal(false);

      $scope.$on('save-visualization-as', function(e, model) {
        $scope.$apply();
        expect($scope.saveVisualizationAsState.show).to.equal(true);
        expect($scope.saveVisualizationAsState.cardModel).to.equal(cardModel);
        done();
      });

      serializedCard = {
        'cardSize': 1,
        'cardType': 'choropleth',
        'expanded': false,
        'fieldName': 'customizableFieldName'
      };

      cardModel = Card.deserialize($scope.page, serializedCard);

      $rootScope.$broadcast('save-visualization-as', cardModel);
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

  describe('download button', function() {
    it('should provide a default download link for the CSV', function() {
      var controllerHarness = makeController({obeId: null}); // simulate missing obeId

      expect(controllerHarness.$scope.datasetCSVDownloadURL).
        to.match(new RegExp('/api/views/asdf-fdsa/rows\\.csv\\?accessType=DOWNLOAD$'));
    });

    it('should allow the metadata to override the download link', function() {
      var controllerHarness = makeController({ downloadOverride: 'https://example.com' });

      expect(controllerHarness.$scope.datasetCSVDownloadURL).
        to.equal('https://example.com');
    });

    it('uses the obeid for the csv download link if available', function() {
      var controllerHarness = makeController();

      expect(controllerHarness.$scope.datasetCSVDownloadURL).
        to.match(new RegExp('/api/views/asdf-fdsa/rows\\.csv\\?accessType=DOWNLOAD&bom=true$'));
    });

    it('closes the dialog when clicking (or hitting esc) outside it', function() {
      ServerConfig.override('enablePngDownloadUi', true);
      var context = renderCardsView();
      var body = $('body');
      var downloadButton = context.element.find('.download-menu');

      function openMenu() {
        downloadButton.click();
        context.$scope.$digest();
        expect(downloadButton.find('dropdown-menu').length).to.equal(1);
      }
      function expectClosedMenu() {
        expect(downloadButton.find('dropdown-menu').length).to.equal(0);
      }

      openMenu();
      testHelpers.fireMouseEvent(body[0], 'click');
      context.$scope.$digest();
      expectClosedMenu();

      openMenu();
      body.trigger($.Event('keydown', { which: 27 }));
      context.$scope.$digest();
      expectClosedMenu();

      // Now test clicking inside a download menu
      openMenu();
      downloadButton.find('a').click();
      expectClosedMenu();
    });

    it('allows other dialogs to close when clicking download', inject(function(WindowState) {
      ServerConfig.override('enablePngDownloadUi', true);
      var context = renderCardsView();

      // Simulate another dialog waiting to be closed
      var closed = false;
      var subscription = WindowState.closeDialogEvent$.subscribe(function() {
        closed = true;
      });

      try {
        // Now click the download button.
        var downloadButton = context.element.find('.download-menu');
        expect(downloadButton.find('dropdown-menu').length).to.equal(0);
        testHelpers.fireMouseEvent(downloadButton[0], 'click');
        context.$scope.$digest();

        expect(downloadButton.find('dropdown-menu').length).to.equal(1);
        expect(closed).to.equal(true);
      } finally {
        // Clean up after ourselves
        subscription.dispose();
      }
    }));

    it('triggers chooser mode when selecting png download', function() {
      ServerConfig.override('enablePngDownloadUi', true);
      var context = renderCardsView();
      var downloadButton = context.element.find('.download-menu');
      testHelpers.fireMouseEvent(downloadButton[0], 'click');
      testHelpers.fireMouseEvent(downloadButton.find('a:contains("Visualization")')[0], 'click');
      expect(context.cardLayout.$scope.chooserMode.show).to.equal(true);
    });

    it('turns into a cancel button in chooser mode, which cancels chooser mode', function() {
      ServerConfig.override('enablePngDownloadUi', true);
      var context = renderCardsView();
      var downloadButton = context.element.find('.download-menu');
      testHelpers.fireMouseEvent(downloadButton[0], 'click');
      testHelpers.fireMouseEvent(downloadButton.find('a:contains("Visualization")')[0], 'click');
      expect(downloadButton.text()).to.match(/Cancel/);

      expect(context.cardLayout.$scope.chooserMode.show).to.equal(true);

      testHelpers.fireMouseEvent(downloadButton[0], 'click');

      expect(context.cardLayout.$scope.chooserMode.show).to.equal(false);
    });


    // IE10 and IE11 have an issue with setting nodeValue on textNode if the node has been replaced
    // so this test is failing. We have to manually skip the test. =(
    // See http://jsfiddle.net/bwrrp/a4qkeb26/
    ((navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) ?
      xit :
      it)('does not trigger when the the user is in customize edit mode', function() {
        ServerConfig.override('enablePngDownloadUi', true);
        ServerConfig.override('enableDataLensExportMenu', false);
        var context = renderCardsView();
        var cardLayout = context.cardLayout;
        var $scope = cardLayout.$scope;
        var $parentScope = $scope.$parent.$parent;
        var downloadButton = context.element.find('.download-menu');

        $parentScope.editMode = true;
        $httpBackend.when('GET', '/javascripts/plugins/squire.js').respond({});
        testHelpers.fireMouseEvent(downloadButton[0], 'click');
        $scope.$apply();
        expect(downloadButton.find('dropdown-menu').length).to.equal(0);
      });
  });

  describe('shouldShowExportMenu', function() {
    it('is true if dataLensEnableExportMenu is true', function() {
      ServerConfig.override('enableDataLensExportMenu', true);
      expect(makeController().$scope.shouldShowExportMenu).to.equal(true);
    });

    it('is false if dataLensEnableExportMenu is false', function() {
      ServerConfig.override('enableDataLensExportMenu', false);
      expect(makeController().$scope.shouldShowExportMenu).to.equal(false);
    });
  });

  describe('layout modes', function() {

    it('loads single-card-layout if the page has a display type of data_lens_*', function() {
      var context = makeContext(null, {
        displayType: 'data_lens_chart',
        cards: [Mockumentary.createCardMetadata()]
      });
      var view = renderCardsView({layout: null, context: context});

      expect(view.element.find('.single-card').length).to.equal(1);
      expect(view.element.find('.multiple-cards').length).to.equal(0);
    });

    it('loads multi-card-layout if the page does not have a display type of data_lens_*', function() {
      var context = makeContext(null, {
        displayType: 'data_lens',
        cards: [Mockumentary.createCardMetadata()]
      });
      var view = renderCardsView({layout: null, context: context});

      expect(view.element.find('.single-card').length).to.equal(0);
      expect(view.element.find('.multiple-cards').length).to.equal(1);
    });
  });
});
