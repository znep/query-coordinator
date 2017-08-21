import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');
const Rx = require('rx');

describe('cardLayout', function() {
  'use strict';

  var NUM_CARDS_IN_DEFAULT_LAYOUT = 6;
  var QUICK_FILTER_BAR_HEIGHT = 74;
  var CUSTOMIZE_BAR_HEIGHT = 40;

  var Card;
  var mockWindowStateService = null;
  var mockPolaroidService;
  var Model;
  var Page;
  var _$provide;
  var $q;
  var $timeout;
  var rootScope;
  var testHelpers;
  var Constants;
  var I18n;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));
  require('app/styles/dataCards/theme/default.scss');
  require('app/styles/dataCards/cards.scss');
  require('app/styles/dataCards/card.scss');
  require('app/styles/dataCards/flyout.scss');

  beforeEach(function() {
    angular.mock.module(function($provide) {
      _$provide = $provide;

      var mockCardDataService = {
        getData: function(){ return $q.when([]);},
        getChoroplethRegions: function() { return {then: _.noop}; },
        getRowCount: function() { return {then: _.noop}; },
        getTimelineDomain: function() { return {then: _.noop}; }
      };
      $provide.value('CardDataService', mockCardDataService);

      mockWindowStateService = {};
      mockWindowStateService.scrollPosition$ = new Rx.Subject();
      mockWindowStateService.windowSize$ = new Rx.Subject();
      mockWindowStateService.mouseLeftButtonPressed$ = new Rx.Subject();
      mockWindowStateService.mousePosition$ = new Rx.Subject();
      mockWindowStateService.closeDialogEvent$ = new Rx.Subject();
      mockWindowStateService.escapeKey$ = new Rx.Subject();

      $provide.value('WindowState', mockWindowStateService);

      mockPolaroidService = {
        download: function() {
          mockPolaroidService.calledWith = arguments;
          return $q.when(undefined);
        }
      };

      $provide.value('PolaroidService', mockPolaroidService);
    });
  });

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    Card = $injector.get('Card');
    Page = $injector.get('Page');
    $q = $injector.get('$q');
    $timeout = $injector.get('$timeout');
    Constants = $injector.get('Constants');
    I18n = $injector.get('I18n');

    testHelpers.overrideTransitions(true);
    testHelpers.mockDirective(_$provide, 'aggregationChooser');
    testHelpers.mockDirective(_$provide, 'clearableInput');
    testHelpers.mockDirective(_$provide, 'addCardDialog');
    testHelpers.mockDirective(_$provide, 'spinner');
    testHelpers.mockDirective(_$provide, 'customizeCardDialog');
    testHelpers.mockDirective(_$provide, 'suggestionToolPanel');
    testHelpers.mockDirective(_$provide, 'choropleth');
    testHelpers.mockDirective(_$provide, 'columnChart');
    testHelpers.mockDirective(_$provide, 'featureMap');
    testHelpers.mockDirective(_$provide, 'histogram');
    testHelpers.mockDirective(_$provide, 'invalidCard');
    testHelpers.mockDirective(_$provide, 'searchCard');
    testHelpers.mockDirective(_$provide, 'tableCard');
    testHelpers.mockDirective(_$provide, 'timelineChart');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
    testHelpers.overrideTransitions(false);
  });

  var timeoutScheduler;
  var testScheduler;

  beforeEach(function() {
    testScheduler = new Rx.TestScheduler();
    timeoutScheduler = Rx.Scheduler.timeout;
    Rx.Scheduler.timeout = testScheduler;
  });

  afterEach(function() {
    Rx.Scheduler.timeout = timeoutScheduler;
  });

  /**
   * Generates and compiles the html with a card-layout directive.
   *
   * @param {Object} options An object with any of the keys:
   *   cards: A function that takes the Page Model as an argument, and returns an array of
   *     Card Models to attach to the Page Model.
   * @returns {Object} with the generated models scopes and other useful stuff.
   */
  function createCardLayout(options) {
    options = _.defaults(options || {}, {
      cards: _.constant([]),
      rowCount: 10
    });

    var datasetModel = new Model();
    datasetModel.version = '1';
    datasetModel.id = 'bana-nas1';
    datasetModel.fieldName = 'ward';
    datasetModel.defineObservableProperty('domain', 'example.com');
    datasetModel.defineObservableProperty('rowDisplayUnit', 'row');
    datasetModel.defineObservableProperty('rowCount', options.rowCount);
    datasetModel.defineObservableProperty('columns', {
      // Define some columns of different types, so we can create different types of cards
      statBar_column: {
        name: 'statBar_column',
        title: 'test column title',
        description: 'test column description',
        physicalDatatype: 'number',
        dataset: datasetModel,
        availableCardTypes: ['column', 'search'],
        defaultCardType: 'column',
        cardTypeWeWillAssignForThisTest: 'histogram'
      },
      pointMap_column: {
        name: 'pointMap_column',
        physicalDatatype: 'point',
        dataset: datasetModel,
        computationStrategy: {
          parameters: {
            region: '_mash-apes'
          }
        },
        availableCardTypes: ['feature'],
        defaultCardType: 'feature',
        cardTypeWeWillAssignForThisTest: 'feature'
      },
      choropleth_column: {
        name: 'choropleth_column',
        physicalDatatype: 'number',
        shapefile: 'fake-shap',
        dataset: datasetModel,
        computationStrategy: {
          parameters: {
            region: '_mash-apes'
          }
        },
        availableCardTypes: ['choropleth'],
        defaultCardType: 'choropleth',
        cardTypeWeWillAssignForThisTest: 'choropleth'
      },
      timeline_column: {
        name: 'timeline_column',
        physicalDatatype: 'number',
        dataset: datasetModel,
        availableCardTypes: ['timeline'],
        defaultCardType: 'timeline',
        cardTypeWeWillAssignForThisTest: 'timeline'
      },
      search_column: {
        name: 'search_column',
        physicalDatatype: 'text',
        dataset: datasetModel,
        availableCardTypes: ['search'],
        defaultCardType: 'search',
        cardTypeWeWillAssignForThisTest: 'search'
      },
      invalid_column: {
        name: 'invalid_column',
        physicalDatatype: 'text',
        dataset: datasetModel,
        availableCardTypes: ['invalid'],
        defaultCardType: 'invalid',
        cardTypeWeWillAssignForThisTest: 'invalid'
      },
      '*': {
        physicalDatatype: '*',
        dataset: datasetModel,
        availableCardTypes: ['table'],
        defaultCardType: 'table',
        cardTypeWeWillAssignForThisTest: 'table'
      }
    });

    var minimalPageMetadata = {
      cards: [],
      catalogViewId: 'abcd-1234',
      datasetId: 'asdf-fdsa',
      description: 'Description',
      name: 'Name',
      pageId: 'asdf-fdsa',
      primaryAmountField: null,
      primaryAggregation: null,
      version: 4
    };
    var pageModel = new Page(minimalPageMetadata, datasetModel);
    pageModel.set('dataset', datasetModel);
    pageModel.set('cards', options.cards(pageModel, datasetModel));

    var outerScope = rootScope.$new();
    outerScope.page = pageModel;
    outerScope.where = '';
    outerScope.editMode = false;
    outerScope.chooserMode = { show: false };

    var html = [
      '<div class="customize-bar" style="height:{0}px"></div>',
      '<div class="cards-content">',
        '<div class="cards-metadata"></div>',
        '<div id="quick-filter-bar-container" style="height:{1}px;display:block;">',
          '<div class="quick-filter-bar" style="height:{1}px;display:block;"></div>',
        '</div>',
        '<card-layout id="card-container" ',
          'class="cards"',
          'ng-class="{\'edit-mode\': editMode}" ',
          'page="page"',
          'global-where-clause-fragment="where"',
          'edit-mode="editMode"',
          'chooser-mode="chooserMode"',
          'allow-add-card="!allVisualizableColumnsVisualized"',
          'expanded-card="expandedCard"></card-layout>',
      '</div>'
    ].join('').format(CUSTOMIZE_BAR_HEIGHT, QUICK_FILTER_BAR_HEIGHT);
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    function findCardForModel(model) {
      return $(_.find(element.find('card'), function(cardElement) {
        return $(cardElement).scope().cardState.model === model;
      }));
    }

    function findDragOverlayForModel(model) {
      return findCardForModel(model).children('.card-drag-overlay');
    }

    // The css styles are scoped to the body class
    $('body').addClass('state-view-cards');

    // Trigger some rx events once, so that subscribeLatest will run
    var jqWindow = $(window);
    var jqWindowDimensions = { width: jqWindow.width(), height: jqWindow.height() };
    mockWindowStateService.windowSize$.onNext(jqWindowDimensions);
    Rx.Scheduler.timeout.advanceBy(Constants.LAYOUT_WINDOW_SIZE_DEBOUNCE);

    mockWindowStateService.scrollPosition$.onNext($(window).scrollTop());
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
   * @param {object=} options Additional options to be passed on to `createCardLayout`
   * @property {string=} fieldName The name of the column this card is for. Set to '*' for dataCard,
   * or like 'timeline_column' for a timeline card.
   * @property {boolean=} expanded Whether the card is expanded. Only ever expand one card.
   */
  function createLayoutWithCards(cards, options) {
    if (!cards) {
      cards = _.chain().range(NUM_CARDS_IN_DEFAULT_LAYOUT).map(function() {
        return {
          fieldName: 'invalid_column'
        };
      }).value();
      // Need a datacard in order to render
      cards[0].fieldName = '*';
    }

    var cardGenerator = function(pageModel, datasetModel) {
      return _.map(cards, function(card, i) {
        var c = new Card(pageModel, card.fieldName || 'fieldname' + i, card);
        c.set('expanded', !!card.expanded);
        // Add required fields so this will validate
        c.set('cardSize', 1);
        var correspondingColumn = datasetModel.getCurrentValue('columns')[card.fieldName];
        c.set('cardType', correspondingColumn ? correspondingColumn.cardTypeWeWillAssignForThisTest : 'invalid');
        return c;
      });
    };
    return createCardLayout(_.extend({ cards: cardGenerator }, options));
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
    }

    it('should be updated to reflect scroll position', function() {

      var cl = createCardLayout();
      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      var card4 = new Card(cl.pageModel, '*');

      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      var elHeight = cl.cardsMetadataElement.outerHeight();

      mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

      var cardsMetadataOffsetTop = cl.cardsMetadataElement.offset().top;

      mockWindowStateService.scrollPosition$.onNext(
        (elHeight - 1) + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

      mockWindowStateService.scrollPosition$.onNext(
        100000 + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.satisfy(hasStuckClass);

      mockWindowStateService.scrollPosition$.onNext(
        elHeight + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.satisfy(hasStuckClass);

      mockWindowStateService.scrollPosition$.onNext(0);
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

      mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

      var cardsMetadataOffsetTop = cl.cardsMetadataElement.offset().top;

      mockWindowStateService.scrollPosition$.onNext(99 + cardsMetadataOffsetTop);
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

    it('should move cards over to the right', function() {

      var cl = createCardLayout();
      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, '*');

      var cards = [ card1, card2 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 1);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPosition$.onNext(0);

      // Before customizing
      cl.element.find('.card-spot').each(function() {
        expect(parseInt($(this).css('left'), 10)).to.be.below(20);
      });

      // Enter customize mode
      cl.outerScope.$safeApply(function() {
        cl.outerScope.editMode = true;
      });

      // After customizing
      cl.element.find('.card-spot').each(function() {
        expect(parseInt($(this).css('left'), 10)).to.be.above(100);
      });
    });

    it('should show three card group customize hints', function() {

      var cl = createCardLayout();
      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, '*');

      var cards = [ card1, card2 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 1);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPosition$.onNext(0);

      // Before customizing
      expect(cl.element.find('.card-group-customize-hint')).to.have.length(0);

      // Enter customize mode
      cl.outerScope.$safeApply(function() {
        cl.outerScope.editMode = true;
      });

      // After customizing
      expect(cl.element.find('.card-group-customize-hint')).to.have.length(3);
    });

    it('should show card group customize hint cards', function() {

      var cl = createCardLayout();
      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, '*');

      var cards = [ card1, card2 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 1);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPosition$.onNext(0);

      // Before customizing
      expect(cl.element.find('.card-group-customize-hint-cards')).to.have.length(0);

      // Enter customize mode
      cl.outerScope.$safeApply(function() {
        cl.outerScope.editMode = true;
      });

      // After customizing
      var rows = cl.element.find('.card-group-customize-hint-cards[ng-show="true"]');
      expect(rows).to.have.length(3);
      expect(rows.eq(0).find('.card-group-customize-hint-card.span6')).to.have.length(2);
      expect(rows.eq(1).find('.card-group-customize-hint-card.span4')).to.have.length(3);
      expect(rows.eq(2).find('.card-group-customize-hint-card.span3')).to.have.length(4);
    });

    // This is hard to test as we can't do a hittest from the browser to simulate a real
    // mouse click.
    // Best we can do is see if the interaction catcher comes up in edit mode.
    it('should pop up card-drag-overlay', function() {

      var cl = createCardLayout();
      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      var card4 = new Card(cl.pageModel, '*');

      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPosition$.onNext(0);
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
      var card4 = new Card(cl.pageModel, '*');

      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPosition$.onNext(0);

      cl.pageModel.set('cards', cards);
      cl.outerScope.editMode = true;
      cl.outerScope.$apply();

      expect(cl.element.find('.card-control.icon-close:visible').length).to.equal(3);

    });

    it('should display a flyout when hovering on a delete card button', function() {
      var cl = createCardLayout();
      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      var card4 = new Card(cl.pageModel, '*');

      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPosition$.onNext(0);

      cl.outerScope.editMode = true;
      cl.outerScope.$apply();
      cl.scope.$digest();

      var thirdDeleteButton = $(cl.element.find('.card-control.icon-close')[2]);

      var clientX = thirdDeleteButton.offset().left +
         Math.floor(thirdDeleteButton.width() / 2);
      var clientY = thirdDeleteButton.offset().top;

      mockWindowStateService.mousePosition$.onNext({
        clientX: clientX,
        clientY: clientY,
        target: thirdDeleteButton.get(0)
      });

      var hint = $('#uber-flyout .hint');
      var hintOffset = hint.offset();

      expect(hintOffset.left + hint.width()).to.be.closeTo(clientX, 5);
      expect(hintOffset.top + hint.height() + Constants.FLYOUT_BOTTOM_PADDING).to.be.closeTo(clientY, 5);
      expect($('#uber-flyout').text()).to.equal(I18n.cardControls.removeCard);
    });

    it('should remove a card when the delete button is clicked', function(done) {

      var cl = createCardLayout();
      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      var card4 = new Card(cl.pageModel, '*');

      var cards = [ card1, card2, card3, card4 ];

      card1.set('cardSize', 1);
      card2.set('cardSize', 2);
      card3.set('cardSize', 2);
      card4.set('cardSize', 3);

      cl.pageModel.set('cards', cards);

      mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPosition$.onNext(0);

      cl.outerScope.editMode = true;
      cl.outerScope.$apply();

      expect(cl.pageModel.getCurrentValue('cards').length).to.equal(cards.length);

      cl.outerScope.$on('delete-card-with-model', function(e, cardModel) {
        expect(cardModel).to.deep.equal(cards[2]);
        done();
      });

      var thirdDeleteButton = $(cl.element.find('.card-control.icon-close')[2]);
      thirdDeleteButton.trigger('click');

    });

    describe('add card behavior', function() {

      it('should display "Add card here" buttons in edit mode', function() {
        var cl = createLayoutWithCards();

        expect($('.add-card-button').length).to.equal(0);

        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        expect($('.add-card-button:visible').length).not.to.equal(1);
      });

      it('should emit an "add-card-with-size" event when an enabled "Add card here" button is clicked', function(done) {
        var cl = createLayoutWithCards();
        var hasBeenCalled = false;

        cl.outerScope.allVisualizableColumnsVisualized = false;
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        cl.outerScope.$on('add-card-with-size', function(e, cardSize) {
          hasBeenCalled = true;
          expect(hasBeenCalled).to.equal(true);
          done();
        });

        testHelpers.fireEvent($('.add-card-button')[0], 'click');
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
        mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
        mockWindowStateService.scrollPosition$.onNext(0);

        // Find the second card's drag overlay.
        var card2Overlay = cl.findDragOverlayForModel(card2);

        // Click it.
        card2Overlay.trigger(jQuery.Event( 'mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100
        }));

        // Drag it 2 pixels (not enough).
        // NOTE: the target component of mousePosition$ must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePosition$.onNext({
          clientX: 102,
          clientY: 100,
          target: card2Overlay[0]
        });
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);

        // Drag it a total of 2.8 pixels (still not enough).
        // NOTE: the target component of mousePosition$ must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePosition$.onNext({
          clientX: 102,
          clientY: 102,
          target: card2Overlay[0]
        });
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);

        // Drag it a total of 4 pixels (enough).
        // NOTE: the target component of mousePosition$ must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePosition$.onNext({
          clientX: 96,
          clientY: 100,
          target: card2Overlay[0]
        });

        // The line below used to expect that the number of .card-drag-overlay
        // elements was equal to cards.length - 2 after the drag had 'started'.
        // I'm believe that this is a result of the way that the DOM was structured
        // when the .card-drag-overlay was part of card-layout, not card. Now that
        // the .card-drag-overlay lives inside the card directive it does not
        // disappear on drag and I have therefore changed the expectation to
        // assert that the number of .card-drag-overlay elements is equal to
        // the number of cards less the table card, which cannot be dragged.
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(1);
        expect(cl.element.find('.card-drop-placeholder').scope().cardState.model).to.equal(card2);

        // Release it.
        mockWindowStateService.mouseLeftButtonPressed$.onNext(false);
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

        mockWindowStateService.windowSize$.onNext({width: 1000, height: 1000});
        mockWindowStateService.scrollPosition$.onNext(0);

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

        // NOTE: the target component of mousePosition$ must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePosition$.onNext({
          clientX: card2Dom.parent().offset().left - 5,
          clientY: card2Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay[0]
        });

        // Drag it above card 1.
        // NOTE: the target component of mousePosition$ must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePosition$.onNext({
          clientX: card1Dom.parent().offset().left,
          clientY: card1Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay[0]
        });
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card2, card1, card3, card4 ]);

        // Drag it back above card 1 - this should restore the original order.
        // NOTE: the target component of mousePosition$ must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePosition$.onNext({
          clientX: card1Dom.parent().offset().left,
          clientY: card1Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay[0]
        });
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card1, card2, card3, card4 ]);

        // Drag it down to the next card size (card3).
        // NOTE: the target component of mousePosition$ must be a raw DOM node,
        // not a jQuery object (hence the [0]).
        mockWindowStateService.mousePosition$.onNext({
          clientX: card3Dom.parent().offset().left,
          clientY: card3Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay[0]
        });
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card1, card3, card2, card4 ]);
        expect(card2.getCurrentValue('cardSize')).equals(2);

        // Finally, release the card.
        // This should have no effect on the card order.
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card1, card3, card2, card4 ]);
        mockWindowStateService.mouseLeftButtonPressed$.onNext(false);
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
        var startPos = card1Dom.offset();
        card1Overlay.trigger(jQuery.Event( 'mousedown', {
          button: 0,
          clientX: startPos.left + card1Dom.width() / 2,
          clientY: startPos.top + card1Dom.height() / 2
        }));

        // We only start tracking the movement of the card after it's grabbed. We only
        // grab the card after we move the mouse a bit on the overlay. So do a move.
        mockWindowStateService.mousePosition$.onNext({
          // Move enough so we start tracking it
          clientX: startPos.left + 100,
          clientY: startPos.top + 100,
          // NOTE: the target component of mousePosition$ must be a raw DOM node,
          // not a jQuery object (hence the [0]).
          target: card1Overlay[0]
        });

        // Drag to group 1
        mockWindowStateService.mousePosition$.onNext({
          clientX: placeholder1.offset().left + placeholder1.width() / 2,
          clientY: placeholder1.offset().top + placeholder1.height() / 2,
          target: placeholder1[0]
        });
        expect(card1.getCurrentValue('cardSize')).to.equal(1);

        // Drag to group 2
        placeholder1 = cl.element.find('[data-group-id=1]');
        placeholder2 = cl.element.find('[data-group-id=2]');
        mockWindowStateService.mousePosition$.onNext({
          clientX: placeholder2.offset().left + placeholder2.width() / 2,
          clientY: placeholder2.offset().top + placeholder2.height() / 2,
          target: card1Overlay[0]
        });
        expect(card1.getCurrentValue('cardSize')).to.equal(2);

        // Finally, release the card.
        mockWindowStateService.mouseLeftButtonPressed$.onNext(false);
        expect(cl.element.find('.card-drag-overlay').length).to.
          // No overlay for the datacard
          equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);
      });
    });

    it('should set the card height when dragging the card', function() {
      var cl = createLayoutWithCards([{}, {fieldName: '*'}]);
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        var cards = cl.pageModel.getCurrentValue('cards');
        var card1 = cards[0];

        // Find DOM nodes for various bits we need.
        var card1Dom = cl.findCardForModel(card1);
        var card1Overlay = cl.findDragOverlayForModel(card1);
        var placeholder1 = cl.element.find('[data-group-id=1]');
        var placeholder2 = cl.element.find('[data-group-id=2]');

        // Drag card 1.
        var startPos = card1Dom.offset();
        card1Overlay.trigger(jQuery.Event( 'mousedown', {
          button: 0,
          clientX: startPos.left + card1Dom.width() / 2,
          clientY: startPos.top + card1Dom.height() / 2
        }));

        // We only start tracking the movement of the card after it's grabbed. We only
        // grab the card after we move the mouse a bit on the overlay. So do a move.
        mockWindowStateService.mousePosition$.onNext({
          // Move enough so we start tracking it
          clientX: startPos.left + 100,
          clientY: startPos.top + 100,
          // NOTE: the target component of mousePosition$ must be a raw DOM node,
          // not a jQuery object (hence the [0]).
          target: card1Overlay[0]
        });

        // Release the card.
        mockWindowStateService.mouseLeftButtonPressed$.onNext(false);

        // Check that the card now has a height
        expect(card1Dom.height(), 'card1Dom height should be greater than zero').to.be.above(0);
      });

  });

  describe('expanded card', function() {
    it("should not expand any cards if the page model's 'cards' array doesn't contain any cards with the expanded property set", function() {
      var cl = createLayoutWithCards();

      expect(cl.element.find('card').length).to.equal(NUM_CARDS_IN_DEFAULT_LAYOUT);
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

      cl.element.find('.card-control.icon-expand').eq(3).click();
      assert.isTrue(cl.element.find('card').eq(3).hasClass('expanded'));
    });

    it('should unexpand when clicking unexpand button of an expanded card', function() {
      var cl = createLayoutWithCards([{fieldName: '*'}, {expanded: true}, {}]);

      var expanded = cl.element.find('.expanded');
      expect(expanded.length).to.equal(1);
      expanded.find('.card-control.icon-collapse').click();
      expect(cl.element.find('.expanded').length).to.equal(0);
    });

    it("sets the scope's expandedCard state if there are any expanded cards", function() {
      var cl = createLayoutWithCards([{fieldName: '*'}, {expanded: true}]);

      expect(!!cl.outerScope.expandedCard).to.equal(true);
    });

    it("doesn't set the expandedCard state if there aren't any expanded cards", function() {
      var cl = createLayoutWithCards();

      assert.isNotOk(cl.scope.expandedCard);
    });

    it('sets the expandedCard state when you expand a card', function() {
      var cl = createLayoutWithCards();
      assert.isNotOk(cl.scope.expandedCard);

      cl.element.find('.card-control.icon-expand').eq(0).click();
      cl.scope.$digest();
      assert.isTrue(!!cl.scope.expandedCard);
    });

    it('emit a "customize-card-with-model" event when clicking the customize button', function(done) {
      var cl = createLayoutWithCards([{fieldName: '*'}, {fieldName: 'choropleth_column'}]);
      var eventEmitted = false;

      cl.outerScope.editMode = true;
      cl.outerScope.$apply();

      var choropleth = cl.element.find('choropleth').closest('.card-spot');
      var customize = choropleth.find('.card-control.icon-settings');

      expect(eventEmitted).to.equal(false);

      cl.outerScope.$on('customize-card-with-model', function(e, cardModel) {
        eventEmitted = true;
        expect(eventEmitted).to.equal(true);
        done();
      });

      customize.click();
    });

    describe('height adjustment', function() {

      function getAvailableExpandedCardHeight(windowHeight) {
        // Note that the actual cardLayout directive will get the offsetHeight of the customize bar
        // since it includes a border. Therefore, we need to also get the offsetHeight here in order
        // for the test to behave as expected.
        return windowHeight -
          (QUICK_FILTER_BAR_HEIGHT + $('.customize-bar')[0].offsetHeight + Constants.LAYOUT_CARD_MARGIN);
      }

      var cl;
      var expandedCard
      var winDimensions = {
        width: 1024,
        height: 768
      };

      beforeEach(function() {

        // We need to create a bunch of cards so the page is scrollable.
        cl = createLayoutWithCards([
          {expanded: true},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {fieldName: '*'}
        ]);

        // Start at the top of the page
        mockWindowStateService.scrollPosition$.onNext(0);
        mockWindowStateService.windowSize$.onNext(winDimensions);
        cl.scope.$digest();

        expandedCard = cl.element.find('.expanded').parent();
        // Assert an assumption we're making, which makes the tests meaningful
        expect(expandedCard.css('position')).to.equal('fixed');
      });

      it('should align the top of the card with rest of the container', function() {
        var container = cl.element.find('#card-container');
        expect(expandedCard.offset().top).to.be.closeTo(container.offset().top, 1);
      });

      it('should adjust the top of the card when the QFB sticks', function() {
        var qfb = cl.quickFilterBarElement;
        mockWindowStateService.scrollPosition$.onNext(
          cl.cardsMetadataElement.offset().top + cl.cardsMetadataElement.outerHeight() + 10);
        expect(qfb.css('position')).to.equal('fixed');
        expect(expandedCard.offset().top).to.be.closeTo(qfb.offset().top + qfb.height(), 1);
      });

      it('should maintain the maximum possible card height if the QFB is not stuck', function() {
        expect(expandedCard.height()).to.be.closeTo(getAvailableExpandedCardHeight(winDimensions.height), 1);
      });

      it('should stick to top of the datacard if the datacard is visible', function() {
        var dataTable = cl.pageModel.getCurrentValue('cards')[9];
        expect(dataTable.fieldName).to.equal('*');
        var dataTableElement = cl.findCardForModel(dataTable);
        // Scroll to close enough to the dataTable that it interferes with the expanded card
        var scrollTop = dataTableElement.offset().top - (winDimensions.height - 100);

        mockWindowStateService.scrollPosition$.onNext(scrollTop);
        // The bottom should still align with the datacard
        expect(expandedCard.offset().top + expandedCard.height()).
          to.be.closeTo(dataTableElement.offset().top - scrollTop, 10);
      });

      describe('with small window sizes', function() {

        it('should not protrude into the info pane if the window is short', function() {
          mockWindowStateService.windowSize$.onNext({width: 768, height: 300});
          expect(expandedCard.offset().top).to.be.closeTo($('#card-container').offset().top, 1);
        });

        it('sticks to the top of #card-container if the window is not scrolled and the window height is small',
          inject(function(Constants) {
            mockWindowStateService.windowSize$.onNext({width: 768, height: 300});
            var container = cl.element.find('#card-container');

            expect(expandedCard.offset().top).to.be.closeTo(container.offset().top, 1);
            // The 300 is the value to which we have just set the height of the window.
            expect(expandedCard.height()).to.be.closeTo(getAvailableExpandedCardHeight(300), 1);
          }));

        it('sticks to the top of the datacard if the datacard is visible',
          inject(function(Constants) {
            var dataTable = cl.pageModel.getCurrentValue('cards')[9];
            expect(dataTable.fieldName).to.equal('*');
            var dataTableElement = cl.findCardForModel(dataTable);
            mockWindowStateService.windowSize$.onNext({width: 768, height: 300});
            // Scroll to too-close to the dataTable
            var scrollTop = dataTableElement.offset().top - 50;
            mockWindowStateService.scrollPosition$.onNext(scrollTop);

            expect(expandedCard.offset().top + expandedCard.height()).
              to.be.closeTo(dataTableElement.offset().top - scrollTop, 10);
            // The 300 is the value to which we have just set the height of the window.
            expect(expandedCard.height()).to.be.closeTo(getAvailableExpandedCardHeight(300), 1);
           }));
      });
    });

    describe('animation', function() {
      it('collapses an expanded element (and all others) smoothly', function(done) {
        var cl = createLayoutWithCards([{fieldName: '*'}, {}, {expanded: true}]);
        testHelpers.overrideTransitions(.1);
        var card = cl.element.find('card.expanded').parent();
        card.find('.card-control.icon-collapse').click();
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
        card.find('.card-control.icon-expand').click();
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

    describe('flyout', function() {
      var TOLERANCE = 5;

      // A helper function to test the accuracy of the flyout's position.
      function expectFlyoutPosition(target, flyout) {
        var hint = flyout.find('.hint');
        var hintOffset = hint.offset();
        var targetOffset = target.offset();
        var verticalDelta;
        var horizontalDelta;

        // Test positioning.
        // A north flyout aligns the top edge of the hint to the top edge of the target.
        // A south flyout aligns the bottom edge of the hint to the bottom edge of the target.
        // An east flyout aligns the right edge of hint to the middle of the target.
        // A west flyout aligns the left edge of hint to the middle of the target.
        if (flyout.hasClass('southwest')) {
          verticalDelta = targetOffset.top - (hintOffset.top + hint.height() + Constants.FLYOUT_BOTTOM_PADDING);
          horizontalDelta = (targetOffset.left + target.width() / 2) - hintOffset.left;
        } else if (flyout.hasClass('northwest')) {
          verticalDelta = hintOffset.top - Constants.FLYOUT_TOP_PADDING - (targetOffset.top + target.height());
          horizontalDelta = (targetOffset.left + target.width() / 2) - hintOffset.left;
        } else if (flyout.hasClass('southeast')) {
          verticalDelta = targetOffset.top - (hintOffset.top + hint.height() + Constants.FLYOUT_BOTTOM_PADDING);
          horizontalDelta = (targetOffset.left + target.width() / 2) - (hintOffset.left + hint.width());
        } else if (flyout.hasClass('northeast')) {
          verticalDelta = hintOffset.top - Constants.FLYOUT_TOP_PADDING - (targetOffset.top + target.height());
          horizontalDelta = (targetOffset.left + target.width() / 2) - (hintOffset.left + hint.width());
        } else {
          throw new Error('Flyout should have a class based on cardinal directions');
        }

        expect(verticalDelta).to.be.within(-TOLERANCE, TOLERANCE);
        expect(horizontalDelta).to.be.within(-TOLERANCE, TOLERANCE);
      }
      afterEach(function() {
        $('#uber-flyout').remove();
      });

      it('should display "Expand" over the expand button', function() {
        var cl = createLayoutWithCards();
        var flyout = $('#uber-flyout');
        assert.isFalse(flyout.is(':visible'));

        var expand = cl.element.find('.card-control.icon-expand').eq(0);
        mockWindowStateService.mousePosition$.onNext({
          clientX: 0,
          clientY: 0,
          target: expand[0]
        });

        expectFlyoutPosition(expand, flyout);
        assert.isTrue(flyout.is(':visible'));
        expect(flyout.text()).to.equal(I18n.cardControls.expandCard);
      });

      it('should display "Collapse" over the collapse button', function() {
        var cl = createLayoutWithCards();
        var flyout = $('#uber-flyout');
        assert.isFalse(flyout.is(':visible'));

        var card = cl.element.find('card').eq(1);
        var expandButton = card.find('.card-control.icon-expand');

        expandButton.click();
        mockWindowStateService.mousePosition$.onNext({
          clientX: 0,
          clientY: 0,
          // Re-find the expand button, because expanding re-draws it
          target: card.find('.card-control.icon-collapse').get(0)
        });

        expectFlyoutPosition(card.find('.card-control.icon-collapse'), flyout);
        assert.isTrue(flyout.is(':visible'));
        expect(flyout.text()).to.equal(I18n.cardControls.collapseCard);
      });

      it('should display "Customize this card" over the customize button', function() {
        var cl = createLayoutWithCards([{fieldName: '*'}, {fieldName: 'choropleth_column'}]);

        cl.outerScope.interactive = true;
        cl.outerScope.$apply();

        var flyout = $('#uber-flyout');
        assert.isFalse(flyout.is(':visible'));

        var choropleth = cl.element.find('choropleth').closest('.card-spot');
        expect(choropleth.length).to.equal(1);
        var customize = choropleth.find('.card-control.icon-settings:visible');

        // Shouldn't show up unless you're in edit mode
        expect(customize.length).to.equal(0);

        cl.outerScope.editMode = true;
        cl.outerScope.$apply();

        customize = choropleth.find('.card-control.icon-settings:visible');
        expect(customize.length).to.equal(choropleth.length);

        mockWindowStateService.mousePosition$.onNext({
          clientX: 0,
          clientY: 0,
          target: customize[0]
        });

        expectFlyoutPosition(customize.eq(0), flyout);
        assert.isTrue(flyout.is(':visible'));
        expect(flyout.text()).to.equal(I18n.cardControls.customizeEnabled);
      });
    });
  });

  describe('download chooser mode', function() {
    var cl;

    beforeEach(function() {
      _.each(['ColumnChart', 'TimelineChart', 'Choropleth', 'Table', 'Search'], function(type) {
        testHelpers.mockDirective(_$provide, 'cardVisualization' + type);
      });
      cl = createLayoutWithCards([
        {fieldName: '*'},
        {fieldName: 'timeline_column'},
        {fieldName: 'search_column'},
        {fieldName: 'choropleth_column', computedColumn: 'some_column'}
      ]);
    });

    it('displays overlays when chooserMode is activated', function() {
      expect(cl.element.find('.card-chooser:visible').length).to.equal(0);

      cl.scope.chooserMode.show = true;
      cl.scope.$digest();

      expect(cl.element.find('.card-chooser:visible').length).to.be.above(0);
    });

    it('disables download button for table and search cards', function() {
      cl.scope.chooserMode.show = true;
      cl.scope.$digest();

      var tableButton = cl.element.find('table-card').
          closest('card').children('.card-chooser').find('.action-png-export');
      var timelineButton = cl.element.find('timeline-chart').
          closest('card').children('.card-chooser').find('.action-png-export');
      var searchButton = cl.element.find('search-card').
          closest('card').children('.card-chooser').find('.action-png-export');
      var choroplethButton = cl.element.find('card-visualization-choropleth').
          closest('card').children('.card-chooser').find('.action-png-export');

      expect(tableButton.hasClass('disabled')).to.equal(true);
      expect(timelineButton.hasClass('disabled')).to.equal(false);
      expect(searchButton.hasClass('disabled')).to.equal(true);
      expect(choroplethButton.hasClass('disabled')).to.equal(false);
    });

    it('downloads the png url when clicking the download button and exits export mode', function() {
      var exitExportModeSpy = sinon.spy();
      cl.outerScope.$on('exit-export-card-visualization-mode', exitExportModeSpy);

      cl.scope.chooserMode = { show: true };
      cl.scope.$digest();

      var button = cl.element.find('.card-chooser .action-png-export:not(.disabled)').eq(1);
      button.click();

      $timeout.flush();

      expect(mockPolaroidService.calledWith[0]).to.equal('/view/vif.png');
      expect(exitExportModeSpy.callCount).to.equal(1);
    });
  });

  it('should show the table card if no other cards are present', function() {
    testHelpers.mockDirective(_$provide, 'TableCardController');
    var cl = createLayoutWithCards([
      {fieldName: '*'}
    ]);

    expect(cl.element.find('card')).to.have.length(1);
    assert.lengthOf(cl.element.find('table-card'), 1);
  });

  it('should show the table card if no table card is present', function() {
    testHelpers.mockDirective(_$provide, 'TableCardController');
    var cl = createLayoutWithCards([]);

    expect(cl.element.find('card')).to.have.length(1);
    assert.lengthOf(cl.element.find('table-card'), 1);
  });
});
