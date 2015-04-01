describe('CardsViewController', function() {
  'use strict';

  var TEST_PAGE_ID = 'boom-poww';
  var DEFAULT_PAGE_NAME = 'Name';
  var DEFAULT_PAGE_DESCRIPTION = 'page description';

  var CardV1;
  var Page;
  var Mockumentary;
  var testHelpers;
  var serverMocks;
  var $q;
  var $rootScope;
  var $controller;
  var _$provide;
  var $httpBackend;
  var $window;
  var $document;
  var ServerConfig;
  var PageDataService;
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

  beforeEach(module('dataCards'));
  beforeEach(module('socrataCommon.filters'));
  beforeEach(module('socrataCommon.directives'));
  beforeEach(module('socrataCommon.services'));
  beforeEach(module('/angular_templates/dataCards/pages/cards-view.html'));
  beforeEach(module('/angular_templates/common/pageHeader.html'));
  beforeEach(module('/angular_templates/dataCards/saveAs.html'));
  beforeEach(module('/angular_templates/dataCards/saveButton.html'));
  beforeEach(module('/angular_templates/dataCards/revertButton.html'));
  beforeEach(module('/angular_templates/dataCards/selectionLabel.html'));
  beforeEach(module('/angular_templates/dataCards/spinner.html'));
  beforeEach(module('/angular_templates/dataCards/addCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/manageLensDialog.html'));
  beforeEach(module('/angular_templates/dataCards/modalDialog.html'));
  beforeEach(module('/angular_templates/dataCards/customizeCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/socSelect.html'));
  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualization.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationChoropleth.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationColumnChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationFeatureMap.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationSearch.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTimelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationInvalid.html'));
  beforeEach(module('/angular_templates/dataCards/featureMap.html'));
  beforeEach(module('/angular_templates/dataCards/clearableInput.html'));
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/feedbackPanel.html'));
  beforeEach(module('/angular_templates/dataCards/customizeBar.html'));
  beforeEach(module('/angular_templates/dataCards/relatedViews.html'));

  beforeEach(function() {
    module(function($provide) {
      _$provide = $provide;
      $provide.value('UserSessionService', mockUserSessionService);
      $provide.value('WindowOperations', mockWindowOperations);
      $provide.value('ConfigurationsService', {
        getThemeConfigurationsObservable: function() {
          return Rx.Observable.returnValue([]);
        },
        getConfigurationValue: _.noop
      });
    });
  });

  beforeEach(
    inject(
      [
        '$q',
        'CardV1',
        'Page',
        'Mockumentary',
        '$rootScope',
        '$controller',
        '$document',
        '$window',
        'testHelpers',
        'serverMocks',
        '$httpBackend',
        'ServerConfig',
        'PageDataService',
        function(
          _$q,
          _CardV1,
          _Page,
          _Mockumentary,
          _$rootScope,
          _$controller,
          _$document,
          _$window,
          _testHelpers,
          _serverMocks,
          _$httpBackend,
          _ServerConfig,
          _PageDataService) {

      CardV1 = _CardV1;
      Page = _Page;
      Mockumentary = _Mockumentary;
      $q = _$q;
      $rootScope = _$rootScope;
      $controller = _$controller;
      $window = _$window;
      $document = _$document;
      testHelpers = _testHelpers;
      serverMocks = _serverMocks;
      $httpBackend = _$httpBackend;
      ServerConfig = _ServerConfig;
      PageDataService = _PageDataService;
      testHelpers.mockDirective(_$provide, 'suggestionToolPanel');
  }]));

  function makeContext(datasetId) {
    var pageOverrides = {name: DEFAULT_PAGE_NAME, description: DEFAULT_PAGE_DESCRIPTION};
    var datasetOverrides = {};
    if (typeof datasetId === 'string') {
      pageOverrides.datasetId = datasetId;
      datasetOverrides.id = datasetId;
    }
    var page = Mockumentary.createPage(pageOverrides, datasetOverrides);

    var currentUserDefer = $q.defer();
    var promise = currentUserDefer.promise;

    mockUserSessionService.getCurrentUser = _.constant(promise);
    mockUserSessionService.getCurrentUserObservable = _.constant(Rx.Observable.fromPromise(promise).catch(Rx.Observable.returnValue(null)));

    var $scope = $rootScope.$new();

    return {
      $scope: $scope,
      page: page,
      currentUserDefer: currentUserDefer
    };
  }

  function makeController(datasetId) {
    var context = makeContext(datasetId);
    var controller = $controller('CardsViewController', context);
    testHelpers.mockDirective(_$provide, 'modalDialog');
    testHelpers.mockDirective(_$provide, 'addCardDialog');
    testHelpers.mockDirective(_$provide, 'manageLensDialog');
    context.$scope.$apply();
    expect(context.$scope.page).to.be.instanceof(Page);

    return $.extend(context, {
      controller: controller
    });
  }

  function renderCardsView() {
    var context = makeContext();
    var cardLayout = {};
    testHelpers.mockDirective(_$provide, 'apiExplorer');
    testHelpers.mockDirective(_$provide, 'cardLayout', function() {
      return {
        link: function($scope) {
          cardLayout.$scope = $scope;
        }
      };
    });
    testHelpers.mockDirective(_$provide, 'lastUpdated');
    testHelpers.mockDirective(_$provide, 'multilineEllipsis');
    testHelpers.mockDirective(_$provide, 'notifyResize');
    testHelpers.mockDirective(_$provide, 'aggregationChooser');
    _$provide.value('page', context.page);
    var html = '<ng-include ng-controller="CardsViewController"' +
        'src="\'/angular_templates/dataCards/pages/cards-view.html\'"></ng-include>';
    var element = testHelpers.TestDom.compileAndAppend(html, context.$scope);
    return $.extend({
      cardLayout: cardLayout,
      element: element.parent().children()
    }, context);
  }

  function testCard() {
    return {
      'description': '',
      'fieldName': _.uniqueId('testFieldName'),
      'cardSize': 1,
      'cardType': 'column',
      'expanded': false,
      'activeFilters': []
    };
  }

  beforeEach(function() {
    $httpBackend.when('GET', '/api/migrations/asdf-fdsa').
      respond({
        'controlMapping': '{"destinationDomain":"steve-copy-1.test-socrata.com"}',
        'nbeId': 'fake-fbfr',
        'obeId': 'sooo-oold',
        'syncedAt': 1415907664
      });

    mockWindowServiceLocationSeq = new Rx.BehaviorSubject(undefined);
    ServerConfig.override('useCatalogLensPermissions', true);
  });

  describe('page name', function() {

    it('should be used for the document title', function() {
      var controllerHarness = makeController();
      var nameOne = _.uniqueId('name');

      $rootScope.$digest();
      expect(mockWindowOperations.currentTitle).to.equal('{0} | Socrata'.format(DEFAULT_PAGE_NAME));
    });

    it('should be used for the document title even if we are not using catalog lens permissions', function() {
      ServerConfig.override('useCatalogLensPermissions', false);

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
      $scope.safeApply(function() {
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
      var jqEl = testHelpers.TestDom.append(
        '<div class="edit-page-warning">');

      testHelpers.fireMouseEvent(jqEl[0], 'mousemove');
      expect($('#uber-flyout').text()).to.equal('');

      $scope.page.set('name', _.map(_.range(255 / 5), _.constant('badger')).join(' '));
      testHelpers.fireMouseEvent(jqEl[0], 'mousemove');
      expect($('#uber-flyout').text()).to.equal('Your title is too long');

      $scope.page.set('name', 'fireflower fireflower');
      testHelpers.fireMouseEvent(jqEl[0], 'mousemove');
      expect($('#uber-flyout').text()).to.equal('');
    });
  });

  describe('source dataset link', function() {
    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('grabs the obe 4x4 from the migrations endpoint', function() {
      $httpBackend.expectGET('/api/migrations/asdf-fdsa');

      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      expect($scope.sourceDatasetURL).not.to.be.ok;
      $httpBackend.flush();
      $rootScope.$digest();
      expect($scope.sourceDatasetURL).to.equal('/d/sooo-oold');

      $httpBackend.when('GET', '/api/migrations/four-four').
        respond({
          'controlMapping': '{"destinationDomain":"steve-copy-1.test-socrata.com"}',
          'nbeId': 'four-four',
          'obeId': 'sooo-old2',
          'syncedAt': 1415907664
        });
      $httpBackend.expectGET('/api/migrations/four-four');
      $scope.page.set('datasetId', 'four-four');

      expect($scope.sourceDatasetURL).to.equal('/d/sooo-oold');
      $httpBackend.flush();
      expect($scope.sourceDatasetURL).to.equal('/d/sooo-old2');
    });

    it("doesn't set the sourceDatasetURL if the migration endpoint returns non-200", function() {
      $httpBackend.when('GET', '/api/migrations/nach-oids').respond(404);

      var controllerHarness = makeController('nach-oids');
      var $scope = controllerHarness.$scope;

      expect($scope.sourceDatasetURL).not.to.be.ok;
      $httpBackend.flush();
      $rootScope.$digest();
      expect($scope.sourceDatasetURL).not.to.be.ok;
    });
  });

  describe('related views', function() {
    it('shows the related views area if feature flag enable_data_lens_other_views is true', function() {
      ServerConfig.override('enableDataLensOtherViews', true);
      var context = renderCardsView();
      var relatedViews = context.element.find('related-views');
      expect(relatedViews).to.not.have.class('ng-hide');
    })

    it('does not show related views area if feature flag enable_data_lens_other_views is false', function() {
      ServerConfig.override('enableDataLensOtherViews', false);
      var context = renderCardsView();
      var relatedViews = context.element.find('related-views');
      expect(relatedViews).to.have.class('ng-hide');
    })
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

  describe('filtering', function() {

    function makeMinimalController() {
      var controllerHarness = makeController();
      var cardBlobs = _.times(3, testCard).
        map(
          function(cardBlob) {
            return new CardV1(controllerHarness.page, cardBlob.fieldName, cardBlob);
          }
        );
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

      beforeEach(function() {
        harness = makeMinimalController();
      });

      afterEach(function() {
        testHelpers.TestDom.clear();
        testHelpers.fireMouseEvent(document.body, 'mousemove');
      });

      it('should be clear-all-able', inject(function(Filter) {
        var filters = [
          new Filter.IsNullFilter(true),
          new Filter.BinaryOperatorFilter('=', 'test'),
        ];
        var cards = harness.page.getCurrentValue('cards');
        cards[0].set('activeFilters', [filters[0]]);
        cards[2].set('activeFilters', [filters[1]]);

        harness.$scope.clearAllFilters();

        expect(cards[0].getCurrentValue('activeFilters')).to.be.empty;
        expect(cards[1].getCurrentValue('activeFilters')).to.be.empty;
        expect(cards[2].getCurrentValue('activeFilters')).to.be.empty;
      }));

      it('should register a flyout for a clear-all-filters button', function() {
        var jqEl = testHelpers.TestDom.append(
          '<button class="clear-all-filters-button" />');
        expect($('.flyout-title').length).to.equal(0);

        testHelpers.fireMouseEvent(jqEl[0], 'mousemove');

        var flyout = $('.flyout-title');
        expect(flyout.length).to.equal(1);
        expect(flyout.text().indexOf('Click to reset all filters')).to.be.greaterThan(-1);
      });

      describe('with no base filter', function() {
        it("should yield just the filtered card's WHERE", inject(function(Filter) {
          var filterOne = new Filter.IsNullFilter(true);
          var filterTwo = new Filter.BinaryOperatorFilter('=', 'test');

          var firstCard = harness.page.getCurrentValue('cards')[0];
          var thirdCard = harness.page.getCurrentValue('cards')[2];

          // Just one card
          firstCard.set('activeFilters', [filterOne]);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(filterOne.generateSoqlWhereFragment(firstCard.fieldName));

          // Two filtered cards
          thirdCard.set('activeFilters', [filterTwo]);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1}'.format(
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(thirdCard.fieldName)
              ));

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          thirdCard.set('activeFilters', []);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1}'.format(
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(firstCard.fieldName)
              ));
        }));
        it('should yield the filtered column names on appliedFiltersForDisplay', inject(function(Filter) {
          var filterOne = new Filter.IsNullFilter(false);
          var filterTwo = new Filter.BinaryOperatorFilter('=', 'test');

          var firstCard = harness.page.getCurrentValue('cards')[0];
          var thirdCard = harness.page.getCurrentValue('cards')[2];

          // Just one card
          firstCard.set('activeFilters', [filterOne]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' ]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank' ]);

          // Two filtered cards
          thirdCard.set('activeFilters', [filterTwo]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' , 'is' ]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank', filterTwo.operand ]);

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          thirdCard.set('activeFilters', []);
          // NOTE: for MVP, only the first filter is honored for a particular card. See todo in production code.
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operator')).to.deep.equal([ 'is not' ]);
          expect(_.pluck(harness.$scope.appliedFiltersForDisplay, 'operand')).to.deep.equal([ 'blank' ]);
        }));
      });

      describe('with a base filter', function() {
        it('should reflect the base filterSoql', inject(function(Filter) {
          var fakeBaseFilter = "fakeField='fakeValueForBase'";
          harness.page.set('baseSoqlFilter', fakeBaseFilter);

          var filterOne = new Filter.IsNullFilter(false);
          var filterTwo = new Filter.BinaryOperatorFilter('=', 'test2');
          var firstCard = harness.page.getCurrentValue('cards')[0];
          var thirdCard = harness.page.getCurrentValue('cards')[2];

          // Just one card
          firstCard.set('activeFilters', [filterOne]);
          harness.$scope.$digest();

          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1}'.format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName))
            );

          // Two filtered cards
          thirdCard.set('activeFilters', [filterTwo]);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1} AND {2}'.format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(thirdCard.fieldName)
              ));

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          thirdCard.set('activeFilters', []);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            '{0} AND {1} AND {2}'.format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(firstCard.fieldName)
              ));
        }));
      });
    });
  });

  describe('user save rights', function() {
    describe('currentUserHasSaveRight on scope', function() {
      function mockUser(isAdmin, id, roleName) {
        return {
          flags: isAdmin ? [ 'admin' ] : [],
          roleName: roleName,
          id: id
        };
      }

      function runCase(isAdmin, isOwner, userRole) {
        // false, true, 'editor'
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        controllerHarness.currentUserDefer.resolve(
          mockUser(
            isAdmin,
            isOwner ? datasetOwnerId : 'xnot-ownr',
            userRole
          )
        );

        $scope.$digest();

        return {
          expect: function(expectation) {
            expect($scope.currentUserHasSaveRight).to.equal(expectation);
          }
        };
      }

      it('should be false if no user is logged in', function() {
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        controllerHarness.currentUserDefer.reject({});

        $scope.$digest();
        expect($scope.currentUserHasSaveRight).to.be.false;
      });

      it('should be true if a superadmin is logged in and is not owner', function() {
        runCase(true, false, 'administrator').expect(true);
      });

      it('should be true if a superadmin is logged in and is owner', function() {
        runCase(true, true, 'administrator').expect(true);
      });

      describe('with a dataset owned by somebody else', function() {
        it('should be true if a publisher is logged in', function() {
          runCase(false, false, 'publisher').expect(true);
        });
        it('should be true if an (non-super) administrator is logged in', function() {
          runCase(false, false, 'administrator').expect(true);
        });
        it('should be false if an editor is logged in', function() {
          runCase(false, false, 'editor').expect(false);
        });
      });

      describe('with a dataset owned by the user', function() {
        it('should be true if a publisher is logged in', function() {
          runCase(false, true, 'publisher').expect(true);
        });
        it('should be true if an (non-super) administrator is logged in', function() {
          runCase(false, true, 'administrator').expect(true);
        });
        it('should be true if an editor is logged in', function() {
          runCase(false, true, 'editor').expect(true);
        });
      });
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

    afterEach(function() {
      testHelpers.TestDom.clear();
    });

    it('should become visible when an "add-card-with-size" event is received', function(done) {
      $scope.allVisualizableColumnsVisualized = false

      expect($scope.addCardState.show).to.equal(false);

      $scope.$on('add-card-with-size', function() {
        expect($scope.addCardState.show).to.equal(true);
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

    afterEach(function() {
      testHelpers.TestDom.clear();
    });

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
        done();
      });

      serializedCard = {
        'cardSize': 1,
        'cardType': 'choropleth',
        'expanded': false,
        'fieldName': 'customizableFieldName'
      };

      cardModel = CardV1.deserialize($scope.page, serializedCard);

      $rootScope.$broadcast('customize-card-with-model', cardModel);

    });

  });

  describe('savePageAs', function() {
    var controllerHarness;
    var $scope;
    var NEW_PAGE_NAME = 'my new page name';
    var NEW_PAGE_DESCRIPTION = 'my new page description';

    beforeEach(function() {
      controllerHarness = makeController();
      $scope = controllerHarness.$scope;
    });

    it('should call save on PageDataService with no id and updated data', function(done) {
      var saveStub = sinon.stub(PageDataService, 'save', _.constant(Promise.resolve(
        { data: { pageId: TEST_PAGE_ID } }
      )));
      var saveEvents = $scope.savePageAs(NEW_PAGE_NAME, NEW_PAGE_DESCRIPTION);

      saveEvents.subscribe(function(event) {
        if (event.status === 'saved') {
          expect(saveStub.calledOnce).to.be.true;
          done();
        }
      });
    });

    it('should redirect to the new page URL on success', function(done) {
      mockWindowServiceLocationSeq.onNext(undefined);
      $scope.savePageAs(NEW_PAGE_NAME, NEW_PAGE_DESCRIPTION);
      mockWindowServiceLocationSeq.subscribe(function(href) {
        if (href) {
          expect(href).to.match(new RegExp('/view/{0}$'.format(TEST_PAGE_ID)));
          done();
        }
      });
    });

  });

  describe('download button', function() {
    afterEach(function() {
      testHelpers.TestDom.clear();
    });

    it('should provide a (correct) csv download link', function() {
      var controllerHarness = makeController();

      expect(controllerHarness.$scope.datasetCSVDownloadURL).
        to.match(new RegExp('/api/views/asdf-fdsa/rows\\.csv\\?accessType=DOWNLOAD$'));
    });

    it('uses the obeid for the csv download link if available', function() {
      var controllerHarness = makeController();

      expect(controllerHarness.$scope.datasetCSVDownloadURL).
        to.match(new RegExp('/api/views/asdf-fdsa/rows\\.csv\\?accessType=DOWNLOAD$'));

      $httpBackend.flush();
      controllerHarness.$scope.$digest();

      expect(controllerHarness.$scope.datasetCSVDownloadURL).
        to.match(new RegExp('/api/views/sooo-oold/rows\\.csv\\?accessType=DOWNLOAD&bom=true$'));
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
      var subscription = WindowState.closeDialogEventObservable.subscribe(function() {
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

    it('disables png download (and displays help text) if the page isn\'t saved', function() {
      ServerConfig.override('enablePngDownloadUi', true);
      var context = renderCardsView();
      var downloadButton = context.element.find('.download-menu');
      testHelpers.fireMouseEvent(downloadButton[0], 'click');
      var menuItem = downloadButton.find('a:contains("Visualization")');
      expect(menuItem.hasClass('download-menu-item-disabled')).to.equal(false);

      context.$scope.hasChanges = true;
      context.$scope.$digest();

      expect(menuItem.hasClass('download-menu-item-disabled')).to.equal(true);

      // Now check the flyout
      testHelpers.fireMouseEvent(menuItem.find('.download-menu-item-disabled-text').get(0), 'mousemove');
      var flyout = $('#uber-flyout');
      expect(flyout.text()).to.match(/Please save the page/);
    });

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
        var context = renderCardsView();
        var cardLayout = context.cardLayout;
        var $scope = cardLayout.$scope;
        var $parentScope = $scope.$parent;
        var downloadButton = context.element.find('.download-menu');

        $parentScope.editMode = true;
        $scope.$digest();

        testHelpers.fireMouseEvent(downloadButton[0], 'click');
        expect(downloadButton.find('dropdown-menu').length).to.equal(0);
      });
  });

});
