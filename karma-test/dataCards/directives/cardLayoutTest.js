describe('CardLayout directive', function() {
  'use strict';

  var NUM_CARDS = 10;

  var AngularRxExtensions;
  var Card;
  var mockWindowStateService = null;
  var Model;
  var Page;
  var $q;
  var rootScope;
  var testHelpers;
  var $templateCache;

  beforeEach(module('/angular_templates/dataCards/addCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/card-layout.html'));
  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationColumnChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTimelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationChoropleth.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationSearch.html'));
  beforeEach(module('/angular_templates/dataCards/clearableInput.html'));
  beforeEach(module('/angular_templates/dataCards/customizeCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/modalDialog.html'));
  beforeEach(module('/angular_templates/dataCards/socSelect.html'));
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/tableHeader.html'));
  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));
  beforeEach(module('dataCards/cards.sass'));
  beforeEach(module('dataCards/card.sass'));
  beforeEach(module('dataCards/flyout.sass'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(function() {
    module(function($provide) {
      var mockCardDataService = {
        getData: function(){ return $q.when([]);},
        getChoroplethRegions: function() { return {then: _.noop}; },
        getTimelineDomain: function() { return {then: _.noop}; }
      };
      $provide.value('CardDataService', mockCardDataService);

      mockWindowStateService = {};
      mockWindowStateService.scrollPositionSubject = new Rx.Subject();
      mockWindowStateService.windowSizeSubject = new Rx.Subject();
      mockWindowStateService.mouseLeftButtonPressedSubject = new Rx.Subject();
      mockWindowStateService.mousePositionSubject = new Rx.Subject();
      mockWindowStateService.closeDialogEventObservable = new Rx.Subject();
      mockWindowStateService.escapeKeyObservable = new Rx.Subject();

      $provide.value('WindowState', mockWindowStateService);
    });
  });
  beforeEach(inject(function($injector) {
    $templateCache = $injector.get('$templateCache');
    $templateCache.put('/angular_templates/dataCards/customizeCardDialog.html', '');
  }));
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    Card = $injector.get('Card');
    Page = $injector.get('Page');
    AngularRxExtensions = $injector.get('AngularRxExtensions');
    $q = $injector.get('$q');

    testHelpers.overrideTransitions(true);
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
    testHelpers.overrideTransitions(false);
  });

  /**
   * Generates and compiles the html with a card-layout directive.
   *
   * @param {Object=} options An object with any of the keys:
   *   cards: A function that takes the Page Model as an argument, and returns an array of
   *     Card Models to attach to the Page Model.
   * @returns {Object} with the generated models scopes and other useful stuff.
   */
  function createCardLayout(options) {
    options = _.defaults(options || {}, {
      cards: _.constant([])
    });

    var datasetModel = new Model();
    datasetModel.id = 'bana-nas!';
    datasetModel.fieldName = 'ward';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'row');
    datasetModel.defineObservableProperty('columns', {
      // Define some columns of different types, so we can create different types of cards
      statBar_column: {
        name: 'statBar_column',
        title: 'test column title',
        description: 'test column description',
        logicalDatatype: 'amount',
        physicalDatatype: 'number',
        importance: 2
      },
      pointMap_column: {
        name: 'pointMap_column',
        logicalDatatype: 'location',
        physicalDatatype: 'point'
      },
      choropleth_column: {
        name: 'choropleth_column',
        logicalDatatype: 'location',
        physicalDatatype: 'number',
        shapefile: 'fake-shap'
      },
      timeline_column: {
        name: 'timeline_column',
        logicalDatatype: 'time',
        physicalDatatype: 'number'
      },
      search_column: {
        name: 'search_column',
        logicalDatatype: 'text',
        physicalDatatype: 'text'
      }
    });

    var pageModel = new Page('asdf-fdsa');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    pageModel.set('cards', options.cards(pageModel));

    var outerScope = rootScope.$new();
    AngularRxExtensions.install(outerScope);
    outerScope.page = pageModel;
    outerScope.where = '';
    outerScope.editMode = false;
    outerScope.bindObservable('cardModels', pageModel.observe('cards'));

    var html = [
        '<div class="cards-content">',
          '<div id="quick-filter-bar-container">',
            '<div class="quick-filter-bar"></div>',
          '</div>',
          '<div class="cards-metadata"></div>',
          '<card-layout id="card-container" ',
          ' class="cards"',
          ' ng-class="{\'edit-mode\': editMode}" ',
          ' page="page"',
          ' card-models="cardModels"',
          ' global-where-clause-fragment="where"',
          ' edit-mode="editMode"',
          ' allow-add-card="!hasAllCards"',
          ' expanded-card="expandedCard"></card-layout>',
        '</div>'
          ].join('');
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    function findCardForModel(model) {
      return $(_.find(element.find('card'), function(cardElement) {
        return $(cardElement).scope().cardPosition.model === model;
      }));
    };

    function findDragOverlayForModel(model) {
      return findCardForModel(model).siblings('.card-drag-overlay');
    };

    // The css styles are scoped to the body class
    $('body').addClass('state-view-cards');

    // Trigger some rx events once, so that subscribeLatest will run
    var jqWindow = $(window);
    mockWindowStateService.windowSizeSubject.onNext({
      width: jqWindow.width(), height: jqWindow.height()});
    mockWindowStateService.scrollPositionSubject.onNext($(window).scrollTop());
    var scope = element.find('card-layout').scope().$$childHead;
    scope.$digest();

    return {
      pageModel: pageModel,
      datasetModel: datasetModel,
      element: element,
      outerScope: outerScope,
      scope: scope,
      cardsMetadataElement: element.find('.cards-metadata'),
      quickFilterBarElement: element.find('.quick-filter-bar'),
      findCardForModel: findCardForModel,
      findDragOverlayForModel: findDragOverlayForModel
    };
  }

  /**
   * Create a layout that includes cards on init.
   *
   * @param {object[]=} cards An array of card hashes to create, each of which sets card properties:
   * @property {string=} fieldName The name of the column this card is for. Set to '*' for dataCard,
   * or like 'timeline_column' for a timeline card.
   * @property {boolean=} expanded Whether the card is expanded. Only ever expand one card.
   */
  function createLayoutWithCards(cards) {
    if (!cards) {
      cards = _.map(_.range(NUM_CARDS), function(i) {
        return {};
      });
      // Need a datacard in order to render
      cards[0].fieldName = '*';
    }

    var cardGenerator = function(pageModel) {
      return _.map(cards, function(card, i) {
        var c = new Card(pageModel, card.fieldName || 'fieldname' + i);
        c.set('expanded', !!card.expanded);
        // Add required fields so this will validate
        c.set('cardSize', 1);
        c.set('cardCustomStyle', {});
        c.set('expandedCustomStyle', {});
        c.set('displayMode', 'figures');
        return c;
      });
    };
    return createCardLayout({cards: cardGenerator});
  }


  describe('DOM requirements', function() {
    it('should require a node anywhere in the dom with class cards-metadata', function() {
      var html = '<card-layout id="card-container"></card-layout>';
      expect(function() { testHelpers.TestDom.compileAndAppend(html, rootScope.$new())}).to.throw(/cards-metadata/);

      html = '<div class="cards-metadata"></div><card-layout id="card-container"></card-layout>';
      expect(function() { testHelpers.TestDom.compileAndAppend(html, rootScope.$new())}).to.not.throw(/cards-metadata/);
    });

    it('should require a node anywhere in the dom with class quick-filter-bar', function() {
      var html = '<div class="cards-metadata"></div><card-layout id="card-container"></card-layout>';
      expect(function() { testHelpers.TestDom.compileAndAppend(html, rootScope.$new())}).to.throw(/quick-filter-bar/);

      html = '<div class="quick-filter-bar"></div><div class="cards-metadata"></div><card-layout id="card-container"></card-layout>';
      expect(function() { testHelpers.TestDom.compileAndAppend(html, rootScope.$new())}).to.not.throw(/quick-filter-bar/);
    });
  });

  // QFB == "quick filter/fajita bar"
  describe('QFB stickyness', function() {

    function hasStuckClass(e) {
      return e.hasClass('stuck');
    };

    it('should be updated to reflect scroll position', function() {

      var cl = createCardLayout();

      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      // Note that the data card (fieldName === '*') is required for layout to happen.
      // If we do not include it in the cardModels, the layout function will terminate
      // early and the tests will fail.
      var card4 = new Card(cl.pageModel, '*');
      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      var elHeight = cl.cardsMetadataElement.outerHeight();

      mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

      var cardsMetadataOffsetTop = cl.cardsMetadataElement.offset().top;

      mockWindowStateService.scrollPositionSubject.onNext(
        (elHeight - 1) + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

      mockWindowStateService.scrollPositionSubject.onNext(
        100000 + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.satisfy(hasStuckClass);

      mockWindowStateService.scrollPositionSubject.onNext(
        elHeight + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.satisfy(hasStuckClass);

      mockWindowStateService.scrollPositionSubject.onNext(0);
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

    });

    it('should be updated to reflect cardsMetadata height', function(done) {

      var cl = createCardLayout();

      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      // Note that the data card (fieldName === '*') is required for layout to happen.
      // If we do not include it in the cardModels, the layout function will terminate
      // early and the tests will fail.
      var card4 = new Card(cl.pageModel, '*');
      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      cl.cardsMetadataElement.height(100);

      mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

      var cardsMetadataOffsetTop = cl.cardsMetadataElement.offset().top;

      mockWindowStateService.scrollPositionSubject.onNext(99 + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

      cl.cardsMetadataElement.height(50);
      testHelpers.waitForSatisfy(_.partial(hasStuckClass, cl.quickFilterBarElement)).then(function() {
        cl.cardsMetadataElement.height(150);
        testHelpers.waitForSatisfy(function() {
          return !hasStuckClass(cl.quickFilterBarElement);
        }).then(function() {
          done();
        });
      });
    });
  });

  describe('in edit mode', function() {

    // This is hard to test as we can't do a hittest from the browser to simulate a real
    // mouse click.
    // Best we can do is see if the interaction catcher comes up in edit mode.
    it('should pop up card-drag-overlay', function() {

      var cl = createCardLayout();

      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      // Note that the data card (fieldName === '*') is required for layout to happen.
      // If we do not include it in the cardModels, the layout function will terminate
      // early and the tests will fail.
      var card4 = new Card(cl.pageModel, '*');
      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPositionSubject.onNext(0);
      expect(cl.element.find('.card-drag-overlay').length).to.equal(0);

      cl.outerScope.editMode = true;
      cl.outerScope.$apply();
      // The data card (fieldname === '*') does not have a '.card-drag-overlay' element.
      expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 1);
    });

    it('should display a delete card button', function() {

      var cl = createCardLayout();

      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      // Note that the data card (fieldName === '*') is required for layout to happen.
      // If we do not include it in the cardModels, the layout function will terminate
      // early and the tests will fail.
      var card4 = new Card(cl.pageModel, '*');
      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPositionSubject.onNext(0);

      cl.pageModel.set('cards', cards);
      cl.outerScope.editMode = true;
      cl.outerScope.$apply();

      expect(cl.element.find('.card-control[title^="Remove"]').length).to.equal(3);

    });

    it('should display a flyout when hovering on a delete card button', function() {
      var cl = createCardLayout();

      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      // Note that the data card (fieldName === '*') is required for layout to happen.
      // If we do not include it in the cardModels, the layout function will terminate
      // early and the tests will fail.
      var card4 = new Card(cl.pageModel, '*');
      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPositionSubject.onNext(0);

      cl.outerScope.editMode = true;
      cl.outerScope.$apply();
      cl.scope.$digest();

      var thirdDeleteButtonPosition = $(cl.element.find('.card-control[title^="Remove"]')[2]).offset();

      var clientX = thirdDeleteButtonPosition.left;
      var clientY = thirdDeleteButtonPosition.top;
      var hintHeight = 20;

      mockWindowStateService.mousePositionSubject.onNext({
        clientX: clientX,
        clientY: clientY,
        target: cl.element.find('.card-control[title^="Remove"]')[2]
      });

      var hint = $('#uber-flyout .hint');
      var hintOffset = hint.offset();
      // The flyout could bind towards the left or right depending on the edge of the
      // screen, so just make sure the hint (ie the triangle attached to the flyout) is
      // close enough.
      expect(hintOffset.left + hint[0].clientWidth / 2).to.be.closeTo(clientX, 5);

      // NOTE: The flyout should be positioned along the Y axis at
      // (clientY - flyoutHeight - hintHeight * 0.75).
      expect(hintOffset.top + hint.height() / 2).to.be.closeTo(clientY, 3);

      expect($('#uber-flyout').text()).to.equal('Remove this card');
    });

    it('should remove a card when the delete button is clicked', function() {

      var cl = createCardLayout();

      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      // Note that the data card (fieldName === '*') is required for layout to happen.
      // If we do not include it in the cardModels, the layout function will terminate
      // early and the tests will fail.
      var card4 = new Card(cl.pageModel, '*');
      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPositionSubject.onNext(0);

      cl.outerScope.editMode = true;
      cl.outerScope.$apply();

      expect(cl.pageModel.getCurrentValue('cards').length).to.equal(cards.length);

      var thirdDeleteButton = $(cl.element.find('.card-control[title^="Remove"]')[2]);
      thirdDeleteButton.trigger('click');

      var foundCards = cl.pageModel.getCurrentValue('cards');
      var card3Found = false;
      for (var i = 0; i < foundCards.length; i++) {
        if (foundCards[i].fieldName === 'testField3') {
          card3Found = true;
        }
      }

      expect(card3Found).to.be.false;
    });

    it('should show the correct drop placeholders', function() {
      var cl = createCardLayout();

      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      // Note that the data card (fieldName === '*') is required for layout to happen.
      // If we do not include it in the cardModels, the layout function will terminate
      // early and the tests will fail.
      var card4 = new Card(cl.pageModel, '*');
      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);
      cl.outerScope.editMode = true;
      cl.outerScope.$apply();
      mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPositionSubject.onNext(0);

      var placeholder1 = cl.element.find('.card-group-drop-placeholder[data-group-id=1]');
      var placeholder2 = cl.element.find('.card-group-drop-placeholder[data-group-id=2]');
      var placeholder3 = cl.element.find('.card-group-drop-placeholder[data-group-id=3]');

      function visibilities() {
        return [
          cl.element.find('.card-group-drop-placeholder[data-group-id=1]').css('display') !== 'none',
          cl.element.find('.card-group-drop-placeholder[data-group-id=2]').css('display') !== 'none',
          cl.element.find('.card-group-drop-placeholder[data-group-id=3]').css('display') !== 'none'
        ];
      };

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 3);
      expect(visibilities()).to.deep.equal([false, false, false]);

      card1.set('cardSize', 2);
      card2.set('cardSize', 2);
      card3.set('cardSize', 3);
      expect(visibilities()).to.deep.equal([true, false, false]);

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      expect(visibilities()).to.deep.equal([false, false, true]);

      card1.set('cardSize', 1);
      card2.set('cardSize', 1);
      card3.set('cardSize', 1);
      expect(visibilities()).to.deep.equal([false, true, true]);

      card1.set('cardSize', 2);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      expect(visibilities()).to.deep.equal([true, false, true]);

      card1.set('cardSize', 3);
      card2.set('cardSize', 3);
      card3.set('cardSize', 3);
      expect(visibilities()).to.deep.equal([true, true, false]);

      card1.set('cardSize', 1);
      card2.set('cardSize', 3);
      card3.set('cardSize', 3);
      expect(visibilities()).to.deep.equal([false, true, false]);
    });

    describe('add card behavior', function() {

      it('should display "Add card here" buttons in edit mode', function() {
        var cl = createLayoutWithCards();

        expect($('.add-card-button').length).to.equal(0);

        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        expect($('.add-card-button:visible').length).not.to.equal(1);
      });

      it('should enable or disable "Add card here" buttons as the controller indicates', function() {
        var cl = createLayoutWithCards();

        cl.outerScope.hasAllCards = false;
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        expect($('.add-card-button').first().hasClass('disabled')).to.be.false;

        cl.outerScope.hasAllCards = true;
        cl.outerScope.$apply();

        expect($('.add-card-button').first().hasClass('disabled')).to.be.true;
      });

      it('should show a flyout with the text "All cards are present" when a disabled "Add card here" button is mousemoved', function() {
        var cl = createLayoutWithCards();

        cl.outerScope.hasAllCards = true;
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 0,
          clientY: 0,
          target: $('.add-card-button')[0]
        });

        expect($('#uber-flyout .content').text()).to.equal('All available cards are already on the page');

        // Reset flyout
        $('#uber-flyout .content').text('');
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      });

      it('should not show a flyout with the text "All cards are present" when an enabled "Add card here" button is mousemoved', function() {
        var cl = createLayoutWithCards();

        cl.outerScope.hasAllCards = false;
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 0,
          clientY: 0,
          target: $('.add-card-button')[0]
        });

        expect($('#uber-flyout').css('display')).to.equal('none');

        // Reset flyout
        $('#uber-flyout .content').text('');
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(true);
      });

      it('should not show the "Add a card" modal dialog when a disabled "Add card here" button is clicked', function() {
        var cl = createLayoutWithCards();

        cl.outerScope.hasAllCards = true;
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        expect(cl.element.find('add-card-dialog:visible').length).to.equal(0);

        testHelpers.fireEvent($('.add-card-button')[0], 'click');

        expect(cl.element.find('add-card-dialog:visible').length).to.equal(0);
      });

      it('should show the "Add a card" modal dialog when an enabled "Add card here" button is clicked', function() {
        var cl = createLayoutWithCards();

        cl.outerScope.hasAllCards = false;
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        expect(cl.element.find('add-card-dialog:visible').length).to.equal(0);

        testHelpers.fireEvent($('.add-card-button')[0], 'click');

        expect(cl.element.find('add-card-dialog:visible').length).to.equal(1);
      });

    });

    describe('drag and drop', function() {

      it('should show the drop placeholder for the dragged card when the mouse is moved 4 pixels from mouse down location, until mouse up', function() {
        var cl = createCardLayout();

        var card1 = new Card(cl.pageModel, 'testField1');
        var card2 = new Card(cl.pageModel, 'testField2');
        var card3 = new Card(cl.pageModel, 'testField3');
        var card4 = new Card(cl.pageModel, '*');
        var cards = [ card1, card2, card3, card4 ];

        card1.set('cardSize', 1);
        card2.set('cardSize', 2);
        card3.set('cardSize', 3);

        cl.pageModel.set('cards', cards);
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();
        cl.scope.$digest();
        mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
        mockWindowStateService.scrollPositionSubject.onNext(0);

        // Find the second card's drag overlay.
        var card2Overlay = cl.findDragOverlayForModel(card2);

        // Click it.
        card2Overlay.trigger(jQuery.Event( 'mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100
        }));

        // Drag it 2 pixels (not enough).
        // NOTE: the target component of mousePositionSubject must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 102,
          clientY: 100,
          target: card2Overlay[0]
        });
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);

        // Drag it a total of 2.8 pixels (still not enough).
        // NOTE: the target component of mousePositionSubject must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 102,
          clientY: 102,
          target: card2Overlay[0]
        });
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);

        // Drag it a total of 4 pixels (enough).
        // NOTE: the target component of mousePositionSubject must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 96,
          clientY: 100,
          target: card2Overlay[0]
        });

        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 2);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(1);
        expect(cl.element.find('.card-drop-placeholder').scope().cardPosition.model).to.equal(card2);

        // Release it.
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);
      });

      it('should trade positions when dragged over another card.', function() {
        var cl = createCardLayout();

        var card1 = new Card(cl.pageModel, 'testField1');
        var card2 = new Card(cl.pageModel, 'testField2');
        var card3 = new Card(cl.pageModel, 'testField3');
        var card4 = new Card(cl.pageModel, '*');
        var cards = [ card1, card2, card3, card4 ];

        card1.set('cardSize', 1);
        card2.set('cardSize', 1);
        card3.set('cardSize', 2);
        card4.set('cardSize', 3);

        cl.pageModel.set('cards', cards);
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();
        cl.element.find('card-layout').css('display', 'block').width(900).height(300);

        mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
        mockWindowStateService.scrollPositionSubject.onNext(0);

        // Find DOM nodes for various bits we need.
        var card1Dom = cl.findCardForModel(card1);
        var card2Dom = cl.findCardForModel(card2);
        var card2Overlay = cl.findDragOverlayForModel(card2);
        var card3Dom = cl.findCardForModel(card3);

        // Checking test assumptions - we need card 1 to be left of card 2, and card 3 to be below card 2.
        expect(card1Dom.offset().left).to.be.below(card2Dom.offset().left);
        expect(card3Dom.offset().top).to.be.above(card2Dom.offset().top);

        // Drag card 2.
        var cardContainerOffset = cl.element.find('card-layout').offset().top;
        card2Overlay.trigger(jQuery.Event( 'mousedown', {
          button: 0,
          clientX: card2Dom.parent().offset().left,
          clientY: card2Dom.parent().offset().top + cardContainerOffset
        }));

        // NOTE: the target component of mousePositionSubject must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card2Dom.parent().offset().left - 5,
          clientY: card2Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay[0]
        });

        // Drag it above card 1.
        // NOTE: the target component of mousePositionSubject must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card1Dom.parent().offset().left,
          clientY: card1Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay[0]
        });
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card2, card1, card3, card4 ]);

        // Drag it back above card 1 - this should restore the original order.
        // NOTE: the target component of mousePositionSubject must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card1Dom.parent().offset().left,
          clientY: card1Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay[0]
        });
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card1, card2, card3, card4 ]);

        // Drag it down to the next card size (card3).
        // NOTE: the target component of mousePositionSubject must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card3Dom.parent().offset().left,
          clientY: card3Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay[0]
        });
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card1, card3, card2, card4 ]);
        expect(card2.getCurrentValue('cardSize')).equals(2);

        // Finally, release the card.
        // This should have no effect on the card order.
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card1, card3, card2, card4 ]);
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);
      });

      it('should assign the correct card size when dragged over a placeholder', function() {
        var cl = createLayoutWithCards([{}, {fieldName: '*'}]);
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        var cards = cl.pageModel.getCurrentValue('cards');
        var card1 = cards[0];

        expect(cl.element.find('.card-drag-overlay').length).to.be.above(0);

        // Find DOM nodes for various bits we need.
        var card1Dom = cl.findCardForModel(card1);
        var card1Overlay = cl.findDragOverlayForModel(card1);
        var placeholder1 = cl.element.find('[data-group-id=1]');
        var placeholder2 = cl.element.find('[data-group-id=2]');

        // Drag card 1.
        var cardContainerOffset = cl.element.find('card-layout').offset().top;
        var startPos = card1Dom.offset();
        card1Overlay.trigger(jQuery.Event( 'mousedown', {
          button: 0,
          clientX: startPos.left + card1Dom.width() / 2,
          clientY: startPos.top + card1Dom.height() / 2
        }));

        // We only start tracking the movement of the card after it's grabbed. We only
        // grab the card after we move the mouse a bit on the overlay. So do a move.
        mockWindowStateService.mousePositionSubject.onNext({
          // Move enough so we start tracking it
          clientX: startPos.left + 100,
          clientY: startPos.top + 100,
          // NOTE: the target component of mousePositionSubject must be a raw DOM node,
          // not a jQuery object (hence the [0]).
          target: card1Overlay[0]
        });

        // Drag to group 1
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: placeholder1.offset().left + placeholder1.width() / 2,
          clientY: placeholder1.offset().top + placeholder1.height() / 2,
          target: placeholder1[0]
        });
        expect(card1.getCurrentValue('cardSize')).to.equal(1);

        // Drag to group 2
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: placeholder2.offset().left + placeholder2.width() / 2,
          clientY: placeholder2.offset().top + placeholder2.height() / 2,
          target: card1Overlay[0]
        });
        expect(card1.getCurrentValue('cardSize')).to.equal(2);

        // Finally, release the card.
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        expect(cl.element.find('.card-drag-overlay').length).to.
          // No overlay for the datacard
          equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);
      });
    });

  });

  describe('expanded card', function() {
    it("should not expand any cards if the page model's 'cards' array doesn't contain any cards with the expanded property set", function() {
      var cl = createLayoutWithCards();

      expect(cl.element.find('card').length).to.equal(NUM_CARDS);
      expect(cl.element.find('.expanded').length).to.equal(0);
    });

    it('should show an expanded card if there is one in the model', function() {
      var cl = createLayoutWithCards([{fieldName: '*'}, {}, {expanded: true}, {}]);

      var cards = cl.element.find('card');
      expect(cards.length).to.equal(4);
      expect(cl.element.find('.expanded').length).to.equal(1);
    });

    it('should expand a card when clicking the expand-card button', function() {
      var cl = createLayoutWithCards();

      cl.element.find('.card-control[title^="Expand"]').eq(3).click();
      expect(cl.element.find('card').eq(3).hasClass('expanded')).to.be.true;
    });

    it('should unexpand when clicking unexpand button of an expanded card', function() {
      var cl = createLayoutWithCards([{fieldName: '*'}, {expanded: true}, {}]);

      var expanded = cl.element.find('.expanded');
      expect(expanded.length).to.equal(1);
      expanded.find('.card-control[title^="Collapse"]').click();
      expect(cl.element.find('.expanded').length).to.equal(0);
    });

    it("sets the scope's expandedCard state if there are any expanded cards", function() {
      var cl = createLayoutWithCards([{fieldName: '*'}, {expanded: true}]);

      expect(!!cl.outerScope.expandedCard).to.be.true;
    });

    it("doesn't set the expandedCard state if there aren't any expanded cards", function() {
      var cl = createLayoutWithCards();

      expect(!!cl.scope.expandedCard).not.to.be.ok;
    });

    it('sets the expandedCard state when you expand a card', function() {
      var cl = createLayoutWithCards();
      expect(!!cl.scope.expandedCard).not.to.be.ok;

      cl.element.find('.card-control[title^="Expand"]').eq(0).click();
      cl.scope.$digest();
      expect(!!cl.scope.expandedCard).to.be.true;
    });

    it('opens a modal when clicking the customize button', function() {
      var cl = createLayoutWithCards([{fieldName: '*'}, {fieldName: 'choropleth_column'}]);
      cl.outerScope.editMode = true;
      cl.outerScope.$apply();

      var choropleth = cl.element.find('card-visualization-choropleth').closest('.card-spot');
      var customize = choropleth.find('.card-control[title^="Customize"]');

      expect(cl.element.find('customize-card-dialog').length).to.equal(0);
      customize.click();
      expect(cl.element.find('customize-card-dialog').length).to.equal(1);
    });

    describe('height adjustment', function() {
      var cl;
      var expandedCard
      var winDimensions = {
        width: 1024,
        height: 768
      };
      beforeEach(function() {
        cl = createLayoutWithCards([
          {fieldName: '*'}, {},
          // Need a bunch of cards so it's scrollable
          {expanded: true}, {}, {}, {}, {}, {}, {}, {}]);
        // Start at the top of the page
        mockWindowStateService.scrollPositionSubject.onNext(0);
        mockWindowStateService.windowSizeSubject.onNext(winDimensions);

        expandedCard = cl.element.find('.expanded').parent();
        // Assert an assumption we're making, which makes the tests meaningful
        expect(expandedCard.css('position')).to.equal('fixed');
      });

      it('should align the top of the card with rest of the container', function() {
        var container = cl.element.find('#card-container');
        expect(expandedCard.offset().top).to.equal(container.offset().top);
      });

      it('should adjust the top of the card when the QFB sticks', function() {
        var qfb = cl.quickFilterBarElement;
        mockWindowStateService.scrollPositionSubject.onNext(
          cl.cardsMetadataElement.offset().top + cl.cardsMetadataElement.outerHeight() + 10);
        expect(qfb.css('position')).to.equal('fixed');
        expect(expandedCard.offset().top).to.equal(qfb.offset().top + qfb.height());
      });

      it('should align the bottom of the card with the viewport bottom', function() {
        expect(expandedCard.offset().top + expandedCard.height()).
          to.be.closeTo(winDimensions.height, 10);
      });

      it('should adjust the bottom of the card when it butts into the datacard', function() {
        var dataTable = cl.pageModel.getCurrentValue('cards')[0];
        expect(dataTable.fieldName).to.equal('*');
        var dataTableElement = cl.findCardForModel(dataTable);
        // Scroll to close enough to the dataTable that it interferes with the expanded card
        var scrollTop = dataTableElement.offset().top - (winDimensions.height - 100);

        var originalHeight = expandedCard.height();
        mockWindowStateService.scrollPositionSubject.onNext(scrollTop);

        // The presence of the dataCard should shrink the height of the expanded card
        expect(originalHeight).to.be.greaterThan(expandedCard.height());
        // The bottom should still align with the datacard
        expect(expandedCard.offset().top + expandedCard.height()).
          to.be.closeTo(dataTableElement.offset().top - scrollTop, 10);
      });

      describe('minimum height', function() {
        it('sticks to the top if we\'re up top and the window height is small',
           inject(function(Constants) {
             mockWindowStateService.windowSizeSubject.onNext({width: 768, height: 100});

             var container = cl.element.find('#card-container');
             expect(expandedCard.offset().top).to.equal(container.offset().top);
             expect(expandedCard.height()).to.equal(Constants.LAYOUT_MIN_EXPANDED_CARD_HEIGHT);
           }));

        it('sticks on bottom if we butt into the datacard down below',
           inject(function(Constants) {
             var dataTable = cl.pageModel.getCurrentValue('cards')[0];
             expect(dataTable.fieldName).to.equal('*');
             var dataTableElement = cl.findCardForModel(dataTable);
             mockWindowStateService.windowSizeSubject.onNext({width: 768, height: 100});
             // Scroll to too-close to the dataTable
             var scrollTop = dataTableElement.offset().top - 50;
             mockWindowStateService.scrollPositionSubject.onNext(scrollTop);

             expect(expandedCard.offset().top + expandedCard.height()).
               to.be.closeTo(dataTableElement.offset().top - scrollTop, 10);
             expect(expandedCard.height()).to.equal(Constants.LAYOUT_MIN_EXPANDED_CARD_HEIGHT);
           }));
      });
    });

    if (Modernizr.csstransitions) {
      describe('animation', function() {
        it('collapses an expanded element (and all others) smoothly', function(done) {
          var cl = createLayoutWithCards([{fieldName: '*'}, {}, {expanded: true}]);
          testHelpers.overrideTransitions(.1);
          var card = cl.element.find('card.expanded').parent();
          card.find('.card-control[title^="Collapse"]').click();
          cl.scope.$digest();

          // The expanded card should start fixed position, and end absolute positioned
          expect(card.css('position')).to.equal('fixed');
          // normal cards should start and end absolutely, but at different positions
          var normalCard = card.next();
          expect(normalCard.css('position')).to.equal('absolute');
          var normalCardPos = normalCard.position();

          testHelpers.waitForSatisfy(function() {
            var normalCardNewPos = normalCard.position();
            return card.css('position') === 'absolute' &&
              normalCard.css('position') === 'absolute' &&
              (normalCardPos.top != normalCardNewPos.top ||
               normalCardPos.left != normalCardNewPos.left);
          }).then(done);
        });

        it('expands a collapsed element (and all others) smoothly', function(done) {
          var cl = createLayoutWithCards();
          testHelpers.overrideTransitions(.1);
          var card = cl.element.find('card').eq(3).parent();
          card.find('.card-control[title^="Expand"]').click();
          cl.scope.$digest();

          // The expanding card should start absolute position, and end fixed positioned
          expect(card.css('position')).to.equal('absolute');
          var normalCard = card.next();
          expect(normalCard.css('position')).to.equal('absolute');
          var normalCardPos = normalCard.position();

          testHelpers.waitForSatisfy(function() {
            var normalCardNewPos = normalCard.position();
            return card.css('position') === 'fixed' &&
              normalCard.css('position') === 'absolute' &&
              (normalCardPos.top != normalCardNewPos.top ||
               normalCardPos.left != normalCardNewPos.left);
          }).then(done);
        });
      });
    } else {
      // Test the different behavior (ie no transitions) in IE9
      describe('(lack of) animation', function() {
        it('collapses an expanded element (and all others) immediately', function() {
          var cl = createLayoutWithCards([{fieldName: '*'}, {}, {expanded: true}]);
          testHelpers.overrideTransitions(.1);
          var expandedCard = cl.element.find('card.expanded').parent();
          var normalCard = expandedCard.next();

          var expandedOriginalPosition = expandedCard.position();
          var normalCardOriginalPosition = normalCard.position();

          expandedCard.find('.card-control[title^="Collapse"]').click();
          cl.scope.$digest();

          expect(expandedCard.css('position')).to.equal('absolute');
          expect(normalCard.css('position')).to.equal('absolute');

          // Should move
          expect(expandedCard.position()).not.to.deep.equal(expandedOriginalPosition);
          expect(normalCard.position()).not.to.deep.equal(normalCardOriginalPosition);
        });

        it('expands a collapsed element (and all others) immediately', function() {
          var cl = createLayoutWithCards();
          testHelpers.overrideTransitions(.1);
          var expandingCard = cl.element.find('card').eq(3).parent();
          var normalCard = expandingCard.next();

          var expandingOriginalPosition = expandingCard.position();
          var normalCardOriginalPosition = normalCard.position();

          expandingCard.find('.card-control[title^="Expand"]').click();
          cl.scope.$digest();

          // The expanding card should immediately be fixed-position
          expect(expandingCard.css('position')).to.equal('fixed');
          expect(normalCard.css('position')).to.equal('absolute');

          // Should move
          expect(expandingCard.position()).not.to.deep.equal(expandingOriginalPosition);
          expect(normalCard.position()).not.to.deep.equal(normalCardOriginalPosition);
        });
      });
    }

    describe('flyout', function() {
      // For some reason, a tolerance of 20 fails ONLY in jenkins+PhantomJS. Can't figure
      // out why, so just up the tolerance and leave it to integration tests to make more
      // sane tests.
      var TOLERANCE = 100;
      function expectFlyoutPosition(target, flyout) {
        var hint = flyout.find('.hint');
        var hintOffset = hint.offset();
        var targetOffset = target.offset();
        if (flyout.hasClass('left')) {
          if ((targetOffset.top - flyout.height()) < 0) {
            expect(hintOffset.top).to.be.within(-TOLERANCE, TOLERANCE);
          } else {
            expect(targetOffset.top - (hintOffset.top + hint.outerHeight())).
              to.be.within(-TOLERANCE, TOLERANCE);
          }
          // A 'left' flyout aligns its left edge to the middle of the target
          expect((targetOffset.left + target.width() / 2) - hintOffset.left).
            to.be.within(-2, 2);
        } else {
          expect(targetOffset.top - (hintOffset.top + hint.outerHeight())).
            to.be.within(-TOLERANCE, TOLERANCE);
          // A 'right' flyout aligns its right edge to the middle of the target
          expect((targetOffset.left + target.width() / 2)
                 // Turns out the right edge of the hint actually happens in the center of
                 // the element -_-;
                 - (hintOffset.left + hint.width() / 2)).
            to.be.within(-2, 2);
        }
      }
      afterEach(function() {
        // Get rid of the flyout
        $('#uber-flyout').remove();
      });

      it('should display "Expand" over the expand button', function() {
        var cl = createLayoutWithCards();
        var flyout = $('#uber-flyout');
        expect(flyout.is(':visible')).to.be.false;

        var expand = cl.element.find('.card-control[title^="Expand"]').eq(0);
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 0,
          clientY: 0,
          target: expand[0]
        });

        // Verify position
        // mostly we care about the arrow position
        expectFlyoutPosition(expand, flyout);

        expect(flyout.is(':visible')).to.be.true;
        expect(flyout.text()).to.equal('Expand this card');
      });

      it('should display "Collapse" over the collapse button', function() {
        var cl = createLayoutWithCards();
        var flyout = $('#uber-flyout');
        expect(flyout.is(':visible')).to.be.false;

        var card = cl.element.find('card').eq(5);
        card.find('.card-control[title^="Expand"]').click();
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 0,
          clientY: 0,
          // Re-find the expand button, because expanding re-draws it
          target: card.find('.card-control[title^="Collapse"]')[0]
        });

        // Verify position
        // mostly we care about the arrow position
        expectFlyoutPosition(card.find('.card-control[title^="Collapse"]'), flyout);

        expect(flyout.is(':visible')).to.be.true;
        expect(flyout.text()).to.equal('Collapse this card');
      });

      it('should display "Customize" only over the customize button on the choropleth', function() {
        var cl = createLayoutWithCards([{fieldName: '*'}, {fieldName: 'choropleth_column'}]);
        var flyout = $('#uber-flyout');
        expect(flyout.is(':visible')).to.be.false;

        var choropleth = cl.element.find('card-visualization-choropleth').closest('.card-spot');
        expect(choropleth.length).to.equal(1);
        var customize = choropleth.find('.card-control[title^="Customize"]');
        // Shouldn't show up unless you're in edit mode
        expect(customize.length).to.equal(0);

        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        customize = choropleth.find('.card-control[title^="Customize"]');
        expect(customize.length).to.equal(choropleth.length);

        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 0,
          clientY: 0,
          target: customize[0]
        });

        expectFlyoutPosition(customize.eq(0), flyout);
        expect(flyout.is(':visible')).to.be.true;
        expect(flyout.text()).to.match(/customize this card/i);
      });

      it('should display a different message over the customize button of non-choropleths', function() {
        var cl = createLayoutWithCards([
          {fieldName: '*'},
          {fieldName: 'timeline_column'}
        ]);
        var flyout = $('#uber-flyout');
        expect(flyout.is(':visible')).to.be.false;

        var visualizations = cl.element.find('.card-visualization').
            children('card-visualization-timeline-chart').
            closest('.card-spot');
        expect(visualizations.length).to.equal(1);
        expect(visualizations.find('.card-control[title^="Customize"]').length).to.equal(0);

        var disabled = visualizations.find('.card-control.disabled');
        // Shouldn't show up unless you're in edit mode
        expect(disabled.length).to.equal(0);

        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        disabled = visualizations.find('.card-control.disabled');
        expect(disabled.length).to.equal(visualizations.length);

        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 0,
          clientY: 0,
          target: disabled[0]
        });

        expectFlyoutPosition(disabled.eq(0), flyout);
        expect(flyout.is(':visible')).to.be.true;
        expect(flyout.text()).to.match(/no customization options/i);
      });
    });
  });

});

