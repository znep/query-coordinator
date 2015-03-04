describe('card directive', function() {
  var $rootScope, testHelpers, Model;

  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/spinner.html'));
  beforeEach(module('dataCards/cards.sass'));
  beforeEach(module('dataCards/card.sass'));
  beforeEach(module('test'));
  beforeEach(module('dataCards'));

  beforeEach(inject(['$rootScope', '$templateCache', 'testHelpers', 'Model', 'CardV1', function(_$rootScope, _$templateCache, _testHelpers, _Model, _CardV1) {
    $rootScope = _$rootScope;
    testHelpers = _testHelpers;
    Model = _Model;
    CardV1 = _CardV1;

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

      var datasetModel = new Model();
      datasetModel.defineObservableProperty('rowDisplayUnit', 'cooks');
      datasetModel.defineObservableProperty('columns', {});
      datasetModel.version = '1';

      var pageModel = new Model();
      pageModel.defineObservableProperty('dataset', datasetModel);
      pageModel.defineObservableProperty('primaryAmountField', null);
      pageModel.defineObservableProperty('primaryAggregation', null);
      pageModel.id = 'abcd-efgh';

      cardModel = new Model();
      cardModel.defineObservableProperty('expanded', false);
      cardModel.defineObservableProperty('isCustomizable', false);
      cardModel.defineObservableProperty('isExportable', true);
      cardModel.defineObservableProperty('cardSize', 1);
      cardModel.defineObservableProperty('cardType', 'column');
      cardModel.page = pageModel;

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

      var datasetModel = new Model();
      datasetModel.defineObservableProperty('rowDisplayUnit', 'cooks');
      datasetModel.defineObservableProperty('columns', {});
      datasetModel.version = '1';

      var pageModel = new Model();
      pageModel.defineObservableProperty('dataset', datasetModel);
      pageModel.defineObservableProperty('primaryAmountField', null);
      pageModel.defineObservableProperty('primaryAggregation', null);
      pageModel.id = 'abcd-efgh';

      cardModel = new Model();
      cardModel.defineObservableProperty('expanded', false);
      cardModel.defineObservableProperty('isCustomizable', false);
      cardModel.defineObservableProperty('isExportable', true);
      cardModel.defineObservableProperty('cardSize', 1);
      cardModel.defineObservableProperty('cardType', 'column');
      cardModel.defineObservableProperty('column', null);
      cardModel.page = pageModel;
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
      datasetModel.defineObservableProperty('rowDisplayUnit', null);

      var pageModel = new Model();
      pageModel.defineObservableProperty('dataset', datasetModel);
      pageModel.defineObservableProperty('primaryAggregation', null);
      pageModel.defineObservableProperty('primaryAmountField', null);

      cardModel = new CardV1(pageModel, 'myFieldName');

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

  describe('dynamic card title', function() {
    var html = '<card model="cardModel" interactive="true"></card>';
    var initialTitleText = 'some title text';
    var initialDescriptionText = 'some description text';

    /**
     * Create a card with options
     * @param {Object} [options]
     * @param {string} [options.version='1']
     * @param {string} [options.rowDisplayUnit=null]
     * @param {string} [options.primaryAggregation=null]
     * @param {string} [options.primaryAmountField=null]
     * @returns {element}
     */
    function createElement(options) {
      options = _.defaults({}, options, {
        fieldName: 'myFieldName',
        primaryAggregation: null,
        primaryAmountField: null,
        rowDisplayUnit: null,
        version: '1'
      });
      var scope = $rootScope.$new();

      var datasetModel = new Model();

      datasetModel.defineObservableProperty('columns', {
        myAggregationField: {
          name: 'My Version 1 Aggregation Field',
          title: 'My Version 0 Aggregation Field',
          dataset: datasetModel
        },
        myFieldName: {
          name: initialTitleText,
          description: initialDescriptionText,
          dataset: datasetModel
        },
        '*': {
          name: 'Table Card',
          dataset: datasetModel,
          physicalDatatype: '*',
          logicalDatatype: '*',
          fred: '*'
        }
      });
      datasetModel.version = options.version;
      datasetModel.defineObservableProperty('rowDisplayUnit', options.rowDisplayUnit);

      var pageModel = new Model();
      pageModel.defineObservableProperty('dataset', datasetModel);
      pageModel.defineObservableProperty('primaryAggregation', options.primaryAggregation);
      pageModel.defineObservableProperty('primaryAmountField', options.primaryAmountField);

      scope.cardModel = new CardV1(pageModel, options.fieldName);

      if (options.fieldName === '*') {
        scope.cardModel.set('cardType', 'table')
      } else {
        scope.cardModel.set('cardType', 'column')
      }

      return testHelpers.TestDom.compileAndAppend(html, scope);
    }

    it('should display the "count" dynamic title when "count" aggregation is selected', function() {
      var element = createElement({
        rowDisplayUnit: 'my row unit',
        primaryAggregation: 'count'
      });
      expect(element.find('.dynamic-title')).to.have.text('Number of my row units by');
    });

    it('should default to "rows" for the rowDisplayUnit if none is specified', function() {
      var element = createElement();
      expect(element.find('.dynamic-title')).to.have.text('Number of rows by');
    });

    it('should display the "sum" dynamic title when "sum" aggregation is selected', function() {
      var element = createElement({
        primaryAggregation: 'sum',
        primaryAmountField: 'myAggregationField'
      });
      expect(element.find('.dynamic-title')).to.have.text('Sum of My Version 1 Aggregation Fields by');
    });

    it('should display the "mean" dynamic title when "mean" aggregation is selected', function() {
      var element = createElement({
        primaryAggregation: 'mean',
        primaryAmountField: 'myAggregationField'
      });
      expect(element.find('.dynamic-title')).to.have.text('Average My Version 1 Aggregation Field by');
    });

    it('should handle the dataset version 0 case', function() {
      var element = createElement({
        version: '0',
        primaryAggregation: 'sum',
        primaryAmountField: 'myAggregationField'
      });
      expect(element.find('.dynamic-title')).to.have.text('Sum of My Version 0 Aggregation Fields by');
    });

    it('should not display the dynamic title for a table card', function() {
      var element = createElement({
        fieldName: '*'
      });
      expect(element.find('.dynamic-title')).to.not.be.visible;
    });

  });

});
