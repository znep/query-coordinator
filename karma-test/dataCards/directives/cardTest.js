describe('card directive', function() {
  var $rootScope, testHelpers, Model;

  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('dataCards/cards.sass'));
  beforeEach(module('dataCards/card.sass'));
  beforeEach(module('test'));
  beforeEach(module('dataCards'));

  beforeEach(inject(['$rootScope', '$templateCache', 'testHelpers', 'Model', 'Card', function(_$rootScope, _$templateCache, _testHelpers, _Model, _Card) {
    $rootScope = _$rootScope;
    testHelpers = _testHelpers;
    Model = _Model;
    Card = _Card;

    // Override the templates of the other directives. We don't need to test them.
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationColumnChart.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationChoropleth.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationTable.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationTimelineChart.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationSearch.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualization.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationInvalid.html', '');
    _$templateCache.put('/angular_templates/dataCards/clearableInput.html', '');

    // The css styles are scoped to the body class
    $('body').addClass('state-view-cards');
  }]));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('expansion toggle', function() {
    var el;
    var html = '<card model="cardModel" interactive="true"></card>';
    var cardModel;
    beforeEach(function() {
      var scope = $rootScope.$new();
      cardModel = new Model();
      cardModel.defineObservableProperty('expanded', false);
      cardModel.defineObservableProperty('cardSize', 1);
      cardModel.defineObservableProperty('cardType', 'column');
      cardModel.defineObservableProperty('page', null);
      cardModel.defineObservableProperty('column', null);
      scope.cardModel = cardModel;
      el = testHelpers.TestDom.compileAndAppend(html, scope);
    });

    describe('when the card is not expanded', function() {
      it('should contain a link with a title of "Expand this card"', function() {
        cardModel.set('expanded', false);
        expect(el).to.not.have.descendants('.card-control[title="Collapse this card"]');
        expect(el).to.have.descendants('.card-control[title="Expand this card"]');
      });
    });

    describe('when the card is expanded', function() {
      it('should contain a link with a title of "Collapse this card"', function() {
        cardModel.set('expanded', true);
        expect(el).to.have.descendants('.card-control[title="Collapse this card"]');
        expect(el).to.not.have.descendants('.card-control[title="Expand this card"]');
      });
    });

    describe('click', function() {
      it('should call the toggleExpanded method on the parent Page', function() {
        cardModel.page = new Model();
        cardModel.page.toggleExpanded = sinon.spy();
        el.find('.card-control').click();
        expect(cardModel.page.toggleExpanded.calledOnce).to.equal(true);
        expect(cardModel.page.toggleExpanded.calledWith(cardModel)).to.be.true;
      });
    });
  });

  describe('visualization height', function() {
    var el;
    var html = '<card model="cardModel" interactive="true"></card>';
    var cardModel;
    beforeEach(function() {
      var scope = $rootScope.$new();

      var pageModel = new Model();
      pageModel.defineObservableProperty('dataset', { version: '1' });

      cardModel = new Model();
      cardModel.defineObservableProperty('expanded', false);
      cardModel.defineObservableProperty('cardSize', 1);
      cardModel.defineObservableProperty('cardType', 'column');
      cardModel.defineObservableProperty('page', pageModel);
      cardModel.defineObservableProperty('column', null);
      scope.cardModel = cardModel;
      el = testHelpers.TestDom.compileAndAppend(html, scope);
      el.css({
        height: $(window).height(),
        display: 'block'
      });
    });

    it('should be set whenever the description height changes', function(done) {
      var textElement = el.find('.card-text').find('.title-one-line').text('');
      var visualizationElement = el.find('card-visualization');
      var originalHeight = visualizationElement.height();

      textElement.text(_.range(100).join('text '));

      // Let the resize event handler run
      testHelpers.waitForSatisfy(function() {
        return visualizationElement.height() !== originalHeight;
      }).then(function() {
        var lotsaTextHeight = visualizationElement.height();

        textElement.text('text');

        testHelpers.waitForSatisfy(function() {
          return visualizationElement.height() !== lotsaTextHeight;
        }).then(function() {
          expect(visualizationElement.height()).to.be.greaterThan(lotsaTextHeight);
          done();
        });
      });
    });

    it('should be set whenever the card height changes', function(done) {
      var textElement = el.find('.card-text').find('.title-one-line').text('');
      var visualizationElement = el.find('card-visualization');
      var originalHeight = visualizationElement.height();

      el.height(2 * (el.height() + 1));

      // Let the resize event handler run
      testHelpers.waitForSatisfy(function() {
        return visualizationElement.height() !== originalHeight;
      }).then(function() {
        var biggerContainerHeight = visualizationElement.height();
        expect(biggerContainerHeight).to.be.greaterThan(originalHeight);

        el.height(el.height() / 2);

        testHelpers.waitForSatisfy(function() {
          return visualizationElement.height() < biggerContainerHeight;
        }).then(done);
      });
    });
  });

  describe('card description text', function() {
    var html = '<card model="cardModel" interactive="true"></card>';
    var cardModel;
    var datasetModel;
    var initialDescriptionText = 'some description text';
    var truncatedDescriptionElement;
    beforeEach(function() {
      var scope = $rootScope.$new();

      datasetModel = new Model();
      datasetModel.defineObservableProperty('columns', {
        myFieldName: {
          description: initialDescriptionText,
          dataset: datasetModel
        }
      });
      datasetModel.version = '1';

      var pageModel = new Model();
      pageModel.defineObservableProperty('dataset', datasetModel);

      cardModel = new Card(pageModel, 'myFieldName');

      scope.cardModel = cardModel;

      var el = testHelpers.TestDom.compileAndAppend(html, scope);
      truncatedDescriptionElement = el.find('.card-text').find('.description-truncated-content')
    });

    describe('when collapsed', function() {
      it('should be rendered initially', function(done) {
        // Defer due to the card directive using observeDimensions, which can be async.
        _.defer(function() {
          expect(truncatedDescriptionElement.text()).to.equal(initialDescriptionText);
          done();
        });
      });

      it('should be updated when changed', function(done) {
        var newDescriptionText = 'new description';

        datasetModel.set('columns', {
          myFieldName: { dataset: { version: '1' }, description: newDescriptionText }
        });

        // Defer due to the card directive using observeDimensions, which can be async.
        _.defer(function() {
          expect(truncatedDescriptionElement.text()).to.equal(newDescriptionText);
          done();
        });
      });

    });
  });
});
