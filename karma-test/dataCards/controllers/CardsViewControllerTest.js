describe('CardsViewController', function() {
  var Page;
  var Dataset;
  var Card;
  var testHelpers;
  var serverMocks;
  var $q;
  var $rootScope;
  var $controller;


  // Define a mock window service and surface writes to location.href.
  var mockWindowService = {
    location: {},
    scrollTo: _.noop
  };

  var mockWindowServiceLocationSeq = new Rx.BehaviorSubject(undefined);
  Object.defineProperty(
    mockWindowService.location,
    'href',
    {
      get: function() { return mockWindowServiceLocationSeq.value; },
      set: function(value) { mockWindowServiceLocationSeq.onNext(value); }
    }
  );

  var TEST_PAGE_ID = 'boom-poww';

  var mockPageDataService = {
    save: function() {
      return Promise.resolve(
        {
          data: {
            pageId: TEST_PAGE_ID
          }
        }
      );
    }
  };
  var mockDatasetDataService = {
    getBaseInfo: function() {
      return $q.when({
        id: 'asdf-fdsa',
        name: 'test dataset name',
        defaultAggregateColumn: 'foo',
        rowDisplayUnit: 'bar',
        ownerId: 'fdsa-asdf',
        updatedAt: '2004-05-20T17:42:55+00:00',
        columns: [
          {
            'title': 'nonCustomizableFieldName',
            'name': 'nonCustomizableFieldName',
            'physicalDatatype': 'text',
            'logicalDatatype': 'text',
            'description': 'non-customizable test field',
            'importance': 1
          },
          {
            'title': 'customizableFieldName',
            'name': 'customizableFieldName',
            'physicalDatatype': 'point',
            'logicalDatatype': 'location',
            'description': 'customizable test field',
            'importance': 1
          }
        ]
      });
    },
    getPagesForDataset: function() {
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

  var mockPageSerializationData = {
    ping: 'pong'
  };

  var mockServerConfig = {
    get: function(key) {
      if (key === 'oduxCardTypeMapping') {
        return serverMocks.CARD_TYPE_MAPPING;
      } else {
        return true;
      }
    }
  };

  beforeEach(module('dataCards'));
  beforeEach(module('socrataCommon.filters'));
  beforeEach(module('/angular_templates/dataCards/pages/cards-view.html'));
  beforeEach(module('/angular_templates/dataCards/saveAs.html'));
  beforeEach(module('/angular_templates/dataCards/saveButton.html'));
  beforeEach(module('/angular_templates/dataCards/selectionLabel.html'));
  beforeEach(module('/angular_templates/dataCards/spinner.html'));
  beforeEach(module('/angular_templates/dataCards/addCardDialog.html'));
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
  beforeEach(module('/angular_templates/dataCards/featureMap.html'));
  beforeEach(module('/angular_templates/dataCards/clearableInput.html'));
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/tableHeader.html'));

  var _$provide;
  beforeEach(function() {
    module(function($provide) {
      _$provide = $provide;
      $provide.value('PageDataService', mockPageDataService);
      $provide.value('DatasetDataService', mockDatasetDataService);
      $provide.value('UserSession', mockUserSessionService);
      $provide.value('$window', mockWindowService);
      $provide.constant('ServerConfig', mockServerConfig);
    });
  });
  beforeEach(inject([
    '$q', 'Card', 'Page', 'Dataset', '$rootScope', '$controller', '$window', 'testHelpers',
    'serverMocks', function(_$q, _Card, _Page, _Dataset, _$rootScope, _$controller, _$window,
                            _testHelpers, _serverMocks) {
      Card = _Card;
      Page = _Page;
      Dataset = _Dataset;
      $q = _$q;
      $rootScope = _$rootScope;
      $controller = _$controller;
      $window = _$window;
      testHelpers = _testHelpers;
      serverMocks = _serverMocks;
  }]));

  function makeContext() {
    var $scope = $rootScope.$new();
    var fakePageId = 'fooo-baar';

    var baseInfoPromise = $q.defer();

    mockPageDataService.getBaseInfo = function() { return baseInfoPromise.promise; };

    var page = new Page(fakePageId);
    page.serialize = function() { return mockPageSerializationData; };

    return {
      baseInfoPromise: baseInfoPromise,
      $scope: $scope,
      page: page
    };
  }

  function makeController() {
    var context = makeContext();
    var controller = $controller('CardsViewController', context);
    testHelpers.mockDirective(_$provide, 'modalDialog');
    testHelpers.mockDirective(_$provide, 'addCardDialog');
    context.$scope.$apply();
    expect(context.$scope.page).to.be.instanceof(Page);

    return $.extend(context, {
      controller: controller
    });
  };

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
      var $scope = controllerHarness.$scope;

      var nameOne = _.uniqueId('name');
      var nameTwo = _.uniqueId('name');
      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        name: nameOne
      });
      $rootScope.$digest();

      expect($scope.pageName).to.equal(nameOne);

      $scope.page.set('name', nameTwo);
      expect($scope.pageName).to.equal(nameTwo);
    });

    it('should default to "Untitled"', function() {
      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var $scope = controllerHarness.$scope;

      var nameOne = undefined;
      var nameTwo = _.uniqueId('name');
      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        name: undefined
      });
      $rootScope.$digest();

      expect($scope.pageName).to.equal("Untitled");

      $scope.page.set('name', nameTwo);
      expect($scope.pageName).to.equal(nameTwo);
    });
  });

  describe('page description', function() {
    it('should update on the scope when the property changes on the model', function() {
      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var $scope = controllerHarness.$scope;

      var descriptionOne = _.uniqueId('description');
      var descriptionTwo = _.uniqueId('description');
      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        description: descriptionOne
      });
      $rootScope.$digest();

      expect($scope.pageDescription).to.equal(descriptionOne);

      $scope.page.set('description', descriptionTwo);
      expect($scope.pageDescription).to.equal(descriptionTwo);
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
            "{0} AND {1}".format(
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(thirdCard.fieldName)
              ));

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          thirdCard.set('activeFilters', []);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            "{0} AND {1}".format(
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(firstCard.fieldName)
              ));
        }));
        it("should yield the filtered column names on appliedFiltersForDisplay", inject(function(Filter) {
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
            "{0} AND {1}".format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName))
            );

          // Two filtered cards
          thirdCard.set('activeFilters', [filterTwo]);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
            "{0} AND {1} AND {2}".format(
              fakeBaseFilter,
              filterOne.generateSoqlWhereFragment(firstCard.fieldName),
              filterTwo.generateSoqlWhereFragment(thirdCard.fieldName)
              ));

          // One filtered card, with two filters.
          firstCard.set('activeFilters', [filterOne, filterTwo]);
          thirdCard.set('activeFilters', []);
          expect(harness.$scope.globalWhereClauseFragment).to.equal(
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
      var $scope = controllerHarness.$scope;

      expect($scope.hasChanges).to.be.falsy;

      $scope.page.set('name', 'name2');
      expect($scope.hasChanges).to.be.true;
    });

    it('should call PageDataService.save when savePage is called with hasChanges = true', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      $scope.page.set('name', 'name2'); // Cause a change.

      var spy = sinon.spy(mockPageDataService, 'save');
      $scope.savePage();
      expect(spy.calledOnce).to.be.true;
      mockPageDataService.save.restore();
    });

    it('should not call PageDataService.save when savePage is called with hasChanges = false', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      var spy = sinon.spy(mockPageDataService, 'save');
      $scope.savePage();
      expect(spy.called).to.be.false;
      mockPageDataService.save.restore();
    });

    it('should set hasChanges to false after successfully saving', function(done) {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      $scope.page.set('name', 'name2');
      $scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.

      // Due to our save debouncing, this change is intentionally delayed.
      $scope.$watch('hasChanges', function(hasChanges) {
        if (!hasChanges) { done(); }
      });
    });

    it('should NOT set hasChanges to false after failing to save', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      $scope.page.set('name', 'name2');

      var origSave = mockPageDataService.save;

      // Hack the mock to always fail the save.
      mockPageDataService.save = _.constant($q.reject());

      $scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.

      mockPageDataService.save = origSave;

      expect($scope.hasChanges).to.be.true;
    });

    it('should set hasChanges to true after making a change after saving', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      $scope.page.set('name', 'name2');
      $scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.
      $scope.page.set('name', 'name3');
      expect($scope.hasChanges).to.be.true;
    });

    it('should set editMode to false after saving', function() {
      var controllerHarness = makeController();
      var $scope = controllerHarness.$scope;

      $scope.editMode = true;
      $scope.page.set('name', 'name2');
      $scope.savePage();
      $rootScope.$apply(); // Must call $apply, as savePage uses a $q promise internally. Grah.
      expect($scope.editMode).to.be.false;
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

      expect($scope.addCardState.show).to.equal(false);

      $scope.$on('add-card-with-size', function(e, cardSize) {

        $scope.$apply();

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

    it('should not become visible when a "customize-card-with-model" event is received which includes a model of a non-customizable card type', function(done) {

      var serializedCard;
      var cardModel;

      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        name: 'some name'
      });
      controllerHarness.$scope.$digest();

      expect($scope.customizeState.show).to.equal(false);

      $scope.$on('customize-card-with-model', function(e, model) {

        $scope.$apply();

        // NOTE: In order for this to work the physical and logical
        // datatypes of the column referenced by the fieldName of the
        // newly-created card must map to a card type which is actually
        // customizable. In this case we want to ensure that we do
        // not actually display the dialog for a non-customizable
        // card type mapping.
        expect($scope.customizeState.show).to.equal(false);
        done();
      });

      serializedCard = {
        'cardCustomStyle': {},
        'cardSize': 1,
        'displayMode': 'visualization',
        'expanded': false,
        'expandedCustomStyle': {},
        'fieldName': 'nonCustomizableFieldName'
      };

      cardModel = Card.deserialize($scope.page, serializedCard);

      $rootScope.$broadcast('customize-card-with-model', cardModel);

    });

    it('should become visible when a "customize-card-with-model" event is received which includes a model of a customizable card type', function(done) {

      var serializedCard;
      var cardModel;

      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        name: 'some name'
      });
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
        'cardCustomStyle': {},
        'cardSize': 1,
        'displayMode': 'visualization',
        'expanded': false,
        'expandedCustomStyle': {},
        'fieldName': 'customizableFieldName'
      };

      cardModel = Card.deserialize($scope.page, serializedCard);

      $rootScope.$broadcast('customize-card-with-model', cardModel);

    });

  });

  describe('customize', function() {
    var controllerHarness;
    var testHelpers;
    var container;

    beforeEach(inject(['testHelpers', function(_testHelpers) {
      testHelpers = _testHelpers;
      controllerHarness = makeController();
    }]));

    afterEach(function() {
      testHelpers.TestDom.clear();
      testHelpers.fireMouseEvent(document.body, 'mousemove');
    });

    it('should show a flyout when hovering over a disabled customize button', function() {
      var jqEl = testHelpers.TestDom.append('<button class="cards-edit-disabled" />');
      expect($('.flyout-title').length).to.equal(0);

      testHelpers.fireMouseEvent(jqEl[0], 'mousemove');

      var flyout = $('.flyout-title');
      expect(flyout.length).to.equal(1);
      expect(flyout.text().indexOf('Customizing while a card is')).to.be.greaterThan(-1);
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

    it('should call save on PageDataService with no ID and updated data', function(done) {
      var expectedPageSerializationData = {
        ping: 'pong',
        name: NEW_PAGE_NAME,
        description: NEW_PAGE_DESCRIPTION
      };
      var saveSpy = sinon.spy(mockPageDataService, 'save');
      var saveEvents = $scope.savePageAs(NEW_PAGE_NAME, NEW_PAGE_DESCRIPTION);
      saveEvents.subscribe(function(event) {
        if (event.status === 'saved') {
          expect(saveSpy.calledOnce).to.be.true;
          var saveCall = saveSpy.getCall(0);
          expect(saveCall.calledWithExactly(expectedPageSerializationData)).to.be.true;
          mockPageDataService.save.restore();
          done();
        }
      });
    });

    it('should redirect to the new page URL on success', function(done) {
      mockWindowServiceLocationSeq.onNext(undefined);
      var saveEvents = $scope.savePageAs(NEW_PAGE_NAME, NEW_PAGE_DESCRIPTION);
      mockWindowServiceLocationSeq.subscribe(function(href) {
        if (href) {
          expect(href).to.equal('/view/{0}'.format(TEST_PAGE_ID));
          done();
        }
      });
    });

  });

  describe('download button', function() {
    beforeEach(function() {
    });

    afterEach(function() {
      testHelpers.TestDom.clear();
    });

    it('should provide a (correct) csv download link', function() {
      var controllerHarness = makeController();

      expect(controllerHarness.$scope.datasetCSVDownloadURL).to.equal('#');

      controllerHarness.baseInfoPromise.resolve({
        datasetId: 'fake-fbfr',
        name: 'some name'
      });
      controllerHarness.$scope.$digest();

      expect(controllerHarness.$scope.datasetCSVDownloadURL).
        to.equal('/api/views/fake-fbfr/rows.csv?accessType=DOWNLOAD');
    });

    it('closes the dialog when clicking (or hitting esc) outside it', function() {
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
      var context = renderCardsView();
      var downloadButton = context.element.find('.download-menu');
      testHelpers.fireMouseEvent(downloadButton[0], 'click');
      var menuItem = downloadButton.find('a:contains("Visualization")');
      expect(menuItem.hasClass('download-menu-item-disabled')).to.equal(false);

      context.$scope.hasChanges = true;
      context.$scope.$digest();

      expect(menuItem.hasClass('download-menu-item-disabled')).to.equal(true);

      // Now check the flyout
      testHelpers.fireMouseEvent(menuItem[0], 'mousemove');
      var flyout = $('#uber-flyout');
      expect(flyout.text()).to.match(/Please save the page/);
    });

    it('triggers chooser mode when selecting png download', function() {
      var context = renderCardsView();
      var downloadButton = context.element.find('.download-menu');
      testHelpers.fireMouseEvent(downloadButton[0], 'click');
      testHelpers.fireMouseEvent(downloadButton.find('a:contains("Visualization")')[0], 'click');
      expect(context.cardLayout.$scope.chooserMode.show).to.equal(true);
    });

    it('turns into a cancel button in chooser mode, which cancels chooser mode', function() {
      var context = renderCardsView();
      var downloadButton = context.element.find('.download-menu');
      testHelpers.fireMouseEvent(downloadButton[0], 'click');
      testHelpers.fireMouseEvent(downloadButton.find('a:contains("Visualization")')[0], 'click');
      expect(downloadButton.text()).to.match(/Cancel/);

      expect(context.cardLayout.$scope.chooserMode.show).to.equal(true);

      testHelpers.fireMouseEvent(downloadButton[0], 'click');

      expect(context.cardLayout.$scope.chooserMode.show).to.equal(false);
    });
  });

});
