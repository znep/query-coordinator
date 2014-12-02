describe("card directive", function() {
  var $rootScope, testHelpers, Model;

  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('dataCards/cards.sass'));
  beforeEach(module('dataCards/card.sass'));
  beforeEach(module('test'));
  beforeEach(module('dataCards'));

  beforeEach(inject(['$rootScope', '$templateCache', 'testHelpers', 'Model', function(_$rootScope, _$templateCache, _testHelpers, _Model) {
    $rootScope = _$rootScope;
    testHelpers = _testHelpers;
    Model = _Model;
    // Override the templates of the other directives. We don't need to test them.
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationColumnChart.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationChoropleth.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationTable.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationTimelineChart.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualizationSearch.html', '');
    _$templateCache.put('/angular_templates/dataCards/cardVisualization.html', '');
    _$templateCache.put('/angular_templates/dataCards/clearableInput.html', '');

    // The css styles are scoped to the body class
    $('body').addClass('state-view-cards');
  }]));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('expansion toggle', function() {
    var el;
    var html = '<card model="model" interactive="true"></card>';
    var model;
    beforeEach(function() {
      var scope = $rootScope.$new();
      model = new Model();
      model.defineObservableProperty('expanded', false);
      model.defineObservableProperty('cardSize', 1);
      model.defineObservableProperty('cardType', 'column');
      scope.model = model;
      el = testHelpers.TestDom.compileAndAppend(html, scope);
    });

    describe('when the card is not expanded', function() {
      it('should contain a link with a title of "Expand this card"', function() {
        model.set('expanded', false);
        expect(el.find('.card-control[title="Collapse this card"]')).
          to.have.length(0);
        expect(el.find('.card-control[title="Expand this card"]')).
          to.have.length(1);
      });
    });

    describe('when the card is expanded', function() {
      it('should contain a link with a title of "Collapse this card"', function() {
        model.set('expanded', true);
        expect(el.find('.card-control[title="Collapse this card"]')).
          to.have.length(1);
        expect(el.find('.card-control[title="Expand this card"]')).
          to.have.length(0);
      });
    });

    describe('click', function() {
      it('should call the toggleExpanded method on the parent Page', function() {
        model.page = new Model();
        model.page.toggleExpanded = sinon.spy();
        el.find('.card-control').click();
        expect(model.page.toggleExpanded.calledOnce).to.equal(true);
        expect(model.page.toggleExpanded.calledWith(model)).to.be.true;
      });
    });
  });

  describe('visualization height', function() {
    var el;
    var html = '<card model="model" interactive="true"></card>';
    var model;
    beforeEach(function() {
      var scope = $rootScope.$new();
      model = new Model();
      model.defineObservableProperty('expanded', false);
      model.defineObservableProperty('cardSize', 1);
      model.defineObservableProperty('cardType', 'column');
      scope.model = model;
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
});
