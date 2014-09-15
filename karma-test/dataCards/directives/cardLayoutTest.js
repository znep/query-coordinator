describe('CardLayout directive test', function() {
  var testHelpers, rootScope, Model, Card, Page, AngularRxExtensions, testHelpers;
  var mockWindowStateService = null;

  beforeEach(module('/angular_templates/dataCards/card-layout.html'));
  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationColumnChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTimelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationChoropleth.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/tableHeader.html'));

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(function() {
    module(function($provide) {
      var mockCardDataService = {
        getData: function(){ return q.when([]);}
      };
      $provide.value('CardDataService', mockCardDataService);

      mockWindowStateService = {};
      mockWindowStateService.scrollPositionSubject = new Rx.Subject();
      mockWindowStateService.windowSizeSubject = new Rx.Subject();
      mockWindowStateService.mouseLeftButtonPressedSubject = new Rx.Subject();
      mockWindowStateService.mousePositionSubject = new Rx.Subject();

      $provide.value('WindowState', mockWindowStateService);
    });
  });
  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
    Card = $injector.get('Card');
    Page = $injector.get('Page');
    AngularRxExtensions = $injector.get('AngularRxExtensions');
    testHelpers = $injector.get('testHelpers');
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  var createCardLayout = function() {
    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('expanded', false);

    var datasetModel = new Model();
    datasetModel.id = "bana-nas!";
    datasetModel.fieldName = 'ward';
    datasetModel.defineObservableProperty('rowDisplayUnit', 'row');
    datasetModel.defineObservableProperty('columns', {
      'test_column': {
        "name": "test_column",
        "title": "test column title",
        "description": "test column description",
        "logicalDatatype": "amount",
        "physicalDatatype": "number",
        "importance": 2
      }
    });

    var pageModel = new Page('asdf-fdsa');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    pageModel.set('cards', []);
    model.page = pageModel;

    var outerScope = rootScope.$new();
    AngularRxExtensions.install(outerScope);
    outerScope.page = pageModel;
    outerScope.where = '';
    outerScope.editMode = false;
    outerScope.bindObservable('cardModels', pageModel.observe('cards'));

    var html = [
        '<div>',
          '<div class="quick-filter-bar"></div>',
          '<div class="cards-metadata"></div>',
          '<card-layout id="card-container" page="page" card-models="cardModels" global-where-clause-fragment="where" edit-mode="editMode"></card-layout>',
        '</div>'
          ].join('');
    var element = testHelpers.TestDom.compileAndAppend(html, outerScope);

    function findCardForModel(model) {
      return $(_.find(element.find('card'), function(cardElement) {
        return $(cardElement).scope().cardModel === model;
      }));
    };

    function findDragOverlayForModel(model) {
      return findCardForModel(model).siblings('.card-drag-overlay');
    };

    return {
      pageModel: pageModel,
      datasetModel: datasetModel,
      model: model,
      element: element,
      outerScope: outerScope,
      scope: element.find('div[column-chart]').scope(),
      cardsMetadataElement: element.find('.cards-metadata'),
      quickFilterBarElement: element.find('.quick-filter-bar'),
      findCardForModel: findCardForModel,
      findDragOverlayForModel: findDragOverlayForModel
    };
  }
  describe('DOM requirements', function() {
    it('should require the correct id', function() {
      var html = '<card-layout id="test-id"></card-layout>';
      expect(function() { testHelpers.TestDom.compileAndAppend(html, rootScope.$new())}).to.throw(/card-container/);

      html = '<card-layout id="card-container"></card-layout>';
      expect(function() { testHelpers.TestDom.compileAndAppend(html, rootScope.$new())}).to.not.throw(/card-container/);
    });

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

  describe('QFB stickyness', function() {
    function hasStuckClass(e) { return e.hasClass('stuck'); };

    it('should be updated to reflect scroll position', function() {
      var cl = createCardLayout();
      cl.cardsMetadataElement.height(100);

      mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

      var cardsMetadataOffsetTop = cl.cardsMetadataElement.offset().top;

      mockWindowStateService.scrollPositionSubject.onNext(99 + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);

      mockWindowStateService.scrollPositionSubject.onNext(100000 + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.satisfy(hasStuckClass);

      mockWindowStateService.scrollPositionSubject.onNext(100 + cardsMetadataOffsetTop);
      expect(cl.quickFilterBarElement).to.satisfy(hasStuckClass);

      mockWindowStateService.scrollPositionSubject.onNext(0);
      expect(cl.quickFilterBarElement).to.not.satisfy(hasStuckClass);
    });

    it('should be updated to reflect cardsMetadata height', function(done) {
      var cl = createCardLayout();
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
      var cards = [ card1, card2, card3 ];

      card1.set('cardSize', '1');
      card2.set('cardSize', '2');
      card3.set('cardSize', '3');

      cl.pageModel.set('cards', cards);
      mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
      mockWindowStateService.scrollPositionSubject.onNext(0);
      expect(cl.element.find('.card-drag-overlay').length).to.equal(0);

      cl.outerScope.editMode = true;
      cl.outerScope.$apply();
      expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length);
    });

    it('should show the correct drop placeholders', function() {
      var cl = createCardLayout();

      var card1 = new Card(cl.pageModel, 'testField1');
      var card2 = new Card(cl.pageModel, 'testField2');
      var card3 = new Card(cl.pageModel, 'testField3');
      var cards = [ card1, card2, card3 ];

      card1.set('cardSize', '1');
      card2.set('cardSize', '2');
      card3.set('cardSize', '3');

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
          placeholder1.css('display') !== 'none',
          placeholder2.css('display') !== 'none',
          placeholder3.css('display') !== 'none'
        ];
      };

      card1.set('cardSize', '1');
      card2.set('cardSize', '2');
      card3.set('cardSize', '3');
      expect(visibilities()).to.deep.equal([false, false, false]);

      card1.set('cardSize', '2');
      card2.set('cardSize', '2');
      card3.set('cardSize', '3');
      expect(visibilities()).to.deep.equal([true, false, false]);

      card1.set('cardSize', '1');
      card2.set('cardSize', '2');
      card3.set('cardSize', '2');
      expect(visibilities()).to.deep.equal([false, false, true]);

      card1.set('cardSize', '1');
      card2.set('cardSize', '1');
      card3.set('cardSize', '1');
      expect(visibilities()).to.deep.equal([false, true, true]);

      card1.set('cardSize', '2');
      card2.set('cardSize', '2');
      card3.set('cardSize', '2');
      expect(visibilities()).to.deep.equal([true, false, true]);

      card1.set('cardSize', '3');
      card2.set('cardSize', '3');
      card3.set('cardSize', '3');
      expect(visibilities()).to.deep.equal([true, true, false]);

      card1.set('cardSize', '1');
      card2.set('cardSize', '3');
      card3.set('cardSize', '3');
      expect(visibilities()).to.deep.equal([false, true, false]);
    });

    describe('drag and drop', function() {
      it('should show the drop placeholder for the dragged card when the mouse is moved 4 pixels from mouse down location, until mouse up', function() {
        var cl = createCardLayout();

        var card1 = new Card(cl.pageModel, 'testField1');
        var card2 = new Card(cl.pageModel, 'testField2');
        var card3 = new Card(cl.pageModel, 'testField3');
        var cards = [ card1, card2, card3 ];

        card1.set('cardSize', '1');
        card2.set('cardSize', '2');
        card3.set('cardSize', '3');

        cl.pageModel.set('cards', cards);
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();
        mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
        mockWindowStateService.scrollPositionSubject.onNext(0);

        // Find the second card's drag overlay.
        var card2Overlay = cl.findDragOverlayForModel(card2);

        // Click it.
        card2Overlay.trigger(jQuery.Event( "mousedown", {
          button: 0,
          clientX: 100,
          clientY: 100
        }));

        // Drag it 2 pixels (not enough).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 102,
          clientY: 100,
          target: card2Overlay
        });
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);

        // Drag it a total of 2.8 pixels (still not enough).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 102,
          clientY: 102,
          target: card2Overlay
        });
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);

        // Drag it a total of 4 pixels (enough).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: 96,
          clientY: 100,
          target: card2Overlay
        });

        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length - 1);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(1);
        expect(cl.element.find('.card-drop-placeholder').scope().cardModel).to.equal(card2);

        // Release it.
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);
      });

      it('should trade positions when dragged over another card.', function() {
        var cl = createCardLayout();

        var card1 = new Card(cl.pageModel, 'testField1');
        var card2 = new Card(cl.pageModel, 'testField2');
        var card3 = new Card(cl.pageModel, 'testField3');
        var cards = [ card1, card2, card3 ];

        card1.set('cardSize', '1');
        card2.set('cardSize', '1');
        card3.set('cardSize', '2');

        cl.pageModel.set('cards', cards);
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();
        cl.element.find('card-layout').css('display', 'block').width(900).height(300);
        cl.element.append('<style>.card-spot { position: absolute; } .card-drag-overlay { position: absolute; left: 0; right: 0; top: 0; bottom: 0 }</style>');
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
        card2Overlay.trigger(jQuery.Event( "mousedown", {
          button: 0,
          clientX: card2Dom.parent().offset().left,
          clientY: card2Dom.parent().offset().top + cardContainerOffset
        }));
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card2Dom.parent().offset().left - 5,
          clientY: card2Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay
        });

        // Drag it above card 1.
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card1Dom.parent().offset().left,
          clientY: card1Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay
        });
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card2, card1, card3 ]);

        // Drag it back above card 1 - this should restore the original order.
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card1Dom.parent().offset().left,
          clientY: card1Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay
        });
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card1, card2, card3 ]);

        // Drag it down to the next card size (card3).
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card3Dom.parent().offset().left,
          clientY: card3Dom.parent().offset().top + cardContainerOffset,
          target: card2Overlay
        });
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card1, card3, card2 ]);
        expect(card2.getCurrentValue('cardSize')).equals('2');

        // Finally, release the card.
        // This should have no effect on the card order.
        expect(cl.pageModel.getCurrentValue('cards')).to.deep.equal([ card1, card3, card2 ]);
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);
      });

      it('should assign the correct card size when dragged over a placeholder', function() {
        var cl = createCardLayout();

        var card1 = new Card(cl.pageModel, 'testField1');
        var cards = [ card1 ];

        card1.set('cardSize', '1');

        cl.pageModel.set('cards', cards);
        cl.outerScope.editMode = true;
        cl.outerScope.$apply();
        cl.element.find('card-layout').css('display', 'block').width(900).height(300);
        cl.element.append('<style>.card-spot { position: absolute; } .card-group-drop-placeholder { position: absolute; height: 100px; } .card-drag-overlay { position: absolute; left: 0; right: 0; top: 0; bottom: 0 }</style>');
        mockWindowStateService.windowSizeSubject.onNext({width: 1000, height: 1000});
        mockWindowStateService.scrollPositionSubject.onNext(0);

        // Find DOM nodes for various bits we need.
        var card1Dom = cl.findCardForModel(card1);
        var card1Overlay = cl.findDragOverlayForModel(card1);
        var placeholder1 = cl.element.find('#card-group-1-drop-placeholder');
        var placeholder2 = cl.element.find('#card-group-2-drop-placeholder');

        // Drag card 1.
        var cardContainerOffset = cl.element.find('card-layout').offset().top;
        card1Overlay.trigger(jQuery.Event( "mousedown", {
          button: 0,
          clientX: card1Dom.offset().left,
          clientY: card1Dom.offset().top + cardContainerOffset
        }));
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card1Dom.offset().left - 5,
          clientY: card1Dom.offset().top + cardContainerOffset,
          target: card1Overlay
        });

        // Drag it to the overlay.
        mockWindowStateService.mousePositionSubject.onNext({
          clientX: card1Dom.offset().left,
          clientY: card1Dom.offset().top + cardContainerOffset + placeholder2.offset().top + cardContainerOffset,
          target: card1Overlay
        });
        expect(card1.getCurrentValue('cardSize')).to.equal('2');

        // Finally, release the card.
        mockWindowStateService.mouseLeftButtonPressedSubject.onNext(false);
        expect(cl.element.find('.card-drag-overlay').length).to.equal(cards.length);
        expect(cl.element.find('.card-drop-placeholder').length).to.equal(0);
      });
    });

  });

});

