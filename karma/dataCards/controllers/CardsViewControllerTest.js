describe('CardsViewController', function() {
  'use strict';

  var TEST_PAGE_ID = 'boom-poww';
  var DEFAULT_PAGE_NAME = 'Name';
  var DEFAULT_PAGE_DESCRIPTION = 'page description';

  var Card;
  var Page;
  var Domain;
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

  beforeEach(module('dataCards'));
  beforeEach(module('socrataCommon.filters'));
  beforeEach(module('socrataCommon.directives'));
  beforeEach(module('socrataCommon.services'));
  beforeEach(module('/angular_templates/dataCards/pages/cards-view.html'));
  beforeEach(module('/angular_templates/dataCards/multiCardLayout.html'));
  beforeEach(module('/angular_templates/dataCards/singleCardLayout.html'));
  beforeEach(module('/angular_templates/dataCards/saveVisualizationAsDialog.html'));
  beforeEach(module('/angular_templates/dataCards/saveAs.html'));
  beforeEach(module('/angular_templates/dataCards/saveButton.html'));
  beforeEach(module('/angular_templates/dataCards/revertButton.html'));
  beforeEach(module('/angular_templates/dataCards/selectionLabel.html'));
  beforeEach(module('/angular_templates/dataCards/spinner.html'));
  beforeEach(module('/angular_templates/dataCards/addCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/columnAndVisualizationSelector.html'));
  beforeEach(module('/angular_templates/dataCards/manageLensDialog.html'));
  beforeEach(module('/angular_templates/dataCards/manageLensDialogV2.html'));
  beforeEach(module('/angular_templates/dataCards/modalDialog.html'));
  beforeEach(module('/angular_templates/dataCards/customizeCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/mobileWarningDialog.html'));
  beforeEach(module('/angular_templates/dataCards/socSelect.html'));
  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/visualizationTypeSelector.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualization.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationChoropleth.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationColumnChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationFeatureMap.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationSearch.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTimelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationHistogram.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationInvalid.html'));
  beforeEach(module('/angular_templates/dataCards/featureMap.html'));
  beforeEach(module('/angular_templates/dataCards/clearableInput.html'));
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/feedbackPanel.html'));
  beforeEach(module('/angular_templates/dataCards/customizeBar.html'));
  beforeEach(module('/angular_templates/dataCards/removeAllCards.html'));
  beforeEach(module('/angular_templates/dataCards/relatedViews.html'));
  beforeEach(module('/angular_templates/dataCards/exportMenu.html'));
  beforeEach(module('/angular_templates/dataCards/lensType.html'));

  beforeEach(function() {
    module(function($provide) {
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
    context.$scope.dataLensVersion = 1;
    testHelpers.mockDirective(_$provide, 'modalDialog');
    testHelpers.mockDirective(_$provide, 'addCardDialog');
    testHelpers.mockDirective(_$provide, 'manageLensDialog');
    testHelpers.mockDirective(_$provide, 'manageLensDialogV2');
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
    $httpBackend.when('GET', '/api/migrations/asdf-fdsa').
      respond({
        'controlMapping': '{"destinationDomain":"steve-copy-1.test-socrata.com"}',
        'nbeId': 'fake-fbfr',
        'obeId': 'sooo-oold',
        'syncedAt': 1415907664
      });

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
      ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});
      var context = renderCardsView();
      var pageHeader = context.element.find('page-header');
      var metadata = context.element.find('.cards-metadata');
      expect(pageHeader).to.have.class('ng-hide');
      expect(metadata).to.not.have.class('page-header-enabled');
    });
  });

  describe('source dataset link', function() {
    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('grabs the obe 4x4 from the migrations endpoint', function() {
      ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});
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
      ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});
      $httpBackend.when('GET', '/api/migrations/nach-oids').respond(404);

      var controllerHarness = makeController({ id: 'nach-oids' });
      var $scope = controllerHarness.$scope;

      expect($scope.sourceDatasetURL).not.to.be.ok;
      $httpBackend.flush();
      $rootScope.$digest();
      expect($scope.sourceDatasetURL).not.to.be.ok;
    });
  });

  describe('related views', function() {
    it('shows the related views area if feature flag enable_data_lens_other_views is true and currentUserHasSaveRight is true', function() {
      ServerConfig.override('enableDataLensOtherViews', true);
      ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});
      var context = renderCardsView();
      $scope = context.element.scope();
      $scope.currentUserHasSaveRight = true;
      $scope.$digest();
      var relatedViews = context.element.find('related-views');
      expect(relatedViews).to.not.have.class('ng-hide');
    });

    it('does not show related views area if feature flag enable_data_lens_other_views is false', function() {
      ServerConfig.override('enableDataLensOtherViews', false);
      ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});
      var context = renderCardsView();
      var relatedViews = context.element.find('related-views');
      expect(relatedViews).to.have.class('ng-hide');
    });

    it('does not show related views area if currentUserHasSaveRight is false', function() {
      ServerConfig.override('enableDataLensOtherViews', true);
      ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});
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

    function makeMinimalController() {
      var controllerHarness = makeController();

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
  });

  describe('manage lens dialog initialization', function() {

    function mockUser(hasEditOthersDatasetsRight) {
      return {
        rights: hasEditOthersDatasetsRight ? ['edit_others_datasets'] : []
      };
    }

    describe("when the dataLensTransitionState feature flag is set to 'pre_beta'", function() {

      beforeEach(function() {
        ServerConfig.override('dataLensTransitionState', 'pre_beta');
      });

      it('should not occur if no user is logged in', function() {
        window.currentUser = null;
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        expect($scope.manageLensState).to.equal(undefined);
        expect($scope.shouldShowManageLens).to.equal(false);
      });

      it("should not occur if the current user does not have the 'edit_others_datasets' right", function() {
        window.currentUser = mockUser(false);
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        expect($scope.manageLensState).to.equal(undefined);
        expect($scope.shouldShowManageLens).to.equal(false);
      });

      it("should not occur if the current user has the 'edit_others_datasets' right", function() {
        window.currentUser = mockUser(true);
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        expect($scope.manageLensState).to.equal(undefined);
        expect($scope.shouldShowManageLens).to.equal(false);
      });
    });

    describe("when the dataLensTransitionState feature flag is set to 'beta'", function() {

      beforeEach(function() {
        ServerConfig.override('dataLensTransitionState', 'beta');
      });

      it('should not occur if no user is logged in', function() {
        window.currentUser = null;
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        expect($scope.manageLensState).to.equal(undefined);
        expect($scope.shouldShowManageLens).to.equal(false);
      });

      it("should not occur if the current user does not have the 'edit_others_datasets' right", function() {
        window.currentUser = mockUser(false);
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        expect($scope.manageLensState).to.equal(undefined);
        expect($scope.shouldShowManageLens).to.equal(false);
      });

      it("should not occur if the current user has the 'edit_others_datasets' right", function() {
        window.currentUser = mockUser(true);
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        expect($scope.manageLensState).to.equal(undefined);
        expect($scope.shouldShowManageLens).to.equal(false);
      });
    });

    describe("when the dataLensTransitionState feature flag is set to 'post_beta'", function() {

      beforeEach(function() {
        ServerConfig.override('dataLensTransitionState', 'post_beta');
      });

      it('should not occur if no user is logged in', function() {
        window.currentUser = null;
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        expect($scope.manageLensState).to.equal(undefined);
        expect($scope.shouldShowManageLens).to.equal(false);
      });

      it("should not occur if the current user does not have the 'edit_others_datasets' right", function() {
        window.currentUser = mockUser(false);
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        expect($scope.manageLensState).to.equal(undefined);
        expect($scope.shouldShowManageLens).to.equal(false);
      });

      it("should occur if the current user has the 'edit_others_datasets' right", function() {
        window.currentUser = mockUser(true);
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        expect($scope.manageLensState.hasOwnProperty('show')).to.equal(true);
        expect($scope.manageLensState.show).to.equal(false);
        expect($scope.shouldShowManageLens).to.equal(true);
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
        window.currentUser = mockUser(
          isAdmin,
          isOwner ? datasetOwnerId : 'xnot-ownr',
          userRole
        );
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

        $scope.$digest();

        return {
          expect: function(expectation) {
            expect($scope.currentUserHasSaveRight).to.equal(expectation);
          }
        };
      }

      it('should be false if no user is logged in', function() {
        window.currentUser = null;
        var controllerHarness = makeController();
        var $scope = controllerHarness.$scope;

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
        ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});

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
    beforeEach(function() {
      ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});
    });

    it('should provide a default download link for the CSV', function() {
      var controllerHarness = makeController();

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
        ServerConfig.override('standaloneLensChart', false);
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

  describe('layout modes', function() {

    it('loads single-card-layout if the page has a display type of data_lens_*', function() {
      ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});

      var context = makeContext(null, {
        displayType: 'data_lens_chart',
        cards: [Mockumentary.createCardMetadata()]
      });
      var view = renderCardsView({layout: null, context: context});

      expect(view.element.find('.single-card').length).to.equal(1);
      expect(view.element.find('.multiple-cards').length).to.equal(0);
    });

    it('loads multi-card-layout if the page does not have a display type of data_lens_*', function() {
      ServerConfig.override('locales', {defaultLocale: 'en', currentLocale: 'en'});

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
