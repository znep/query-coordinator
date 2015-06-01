describe('card directive', function() {
  'use strict';

  var CARD_HTML = '<card model="cardModel" interactive="true"></card>';

  var $rootScope;
  var testHelpers;
  var Model;
  var Card;
  var Mockumentary;
  var $provide;

  /**
   * Create Card model with options
   * @param {Page} pageModel
   * @param {Object} options
   * @param {String} [options.fieldName='myFieldName']
   * @returns {Card}
   */
  function createCardModel(pageModel, options) {
    options = _.defaults({}, options, {
      fieldName: 'myFieldName',
      cardType: null
    });

    var cardModel = new Card(pageModel, options.fieldName);

    cardModel.set('expanded', false);
    cardModel.set('cardSize', 1);

    if (_.isEmpty(options.cardType)) {
      if (options.fieldName === '*') {
        cardModel.set('cardType', 'table');
      } else {
        cardModel.set('cardType', 'column');
      }
    } else {
      cardModel.set('cardType', options.cardType);
    }
    return cardModel;
  }

  /**
   * Create and inject a card directive with options
   * @param {Object} [options]
   * @param {String} [options.rowDisplayUnit=null]
   * @param {String} [options.primaryAggregation=null]
   * @param {String} [options.primaryAmountField=null]
   * @param {String} [options.fieldName='myFieldName']
   * @returns {Object} {element, scope, datasetModel, pageModel, cardModel}
   */
  function createDirective(options) {
    options = _.defaults({}, options, {
      fieldName: 'myFieldName',
      primaryAggregation: null,
      primaryAmountField: null,
      rowDisplayUnit: 'row',
      columns: {
        'myAggregationField': {
          name: 'My Version 1 Aggregation Field',
          description: 'My Version 0 Aggregation Field',
          physicalDatatype: 'number',
          availableCardTypes: ['column'],
          defaultCardType: 'column'
        },
        'myFieldName': {
          name: 'some title text',
          description: 'some description text',
          physicalDatatype: 'number',
          availableCardTypes: ['column'],
          defaultCardType: 'column'
        },
        '*': {
          name: 'Table Card',
          description: 'Table Card',
          physicalDatatype: '*',
          fred: '*',
          availableCardTypes: ['table'],
          defaultCardType: 'table'
        }
      }
    });

    var pageOverrides = {
      primaryAggregation: options.primaryAggregation,
      primaryAmountField: options.primaryAmountField
    };
    var datasetOverrides = {
      columns: options.columns,
      rowDisplayUnit: options.rowDisplayUnit,
    };
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);

    var scope = $rootScope.$new();
    scope.cardModel = createCardModel(pageModel, options);

    return {
      element: testHelpers.TestDom.compileAndAppend(CARD_HTML, scope),
      scope: scope,
      pageModel: pageModel,
      cardModel : scope.cardModel
    };
  }

  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/spinner.html'));
  beforeEach(module('dataCards/cards.sass'));
  beforeEach(module('dataCards/card.sass'));
  beforeEach(module('test'));
  beforeEach(module('dataCards'));
  beforeEach(module(['$provide', function(_$provide_) {
    $provide = _$provide_;
  }]));

  beforeEach(
    inject([
      '$rootScope',
      '$templateCache',
      'testHelpers',
      'Model',
      'Card',
      'Mockumentary',
      function(_$rootScope, _$templateCache, _testHelpers, _Model, _Card, _Mockumentary) {

        $rootScope = _$rootScope;
        testHelpers = _testHelpers;
        Model = _Model;
        Card = _Card;
        Mockumentary = _Mockumentary;

        // Override the templates of the other directives. We don't need to test them.
        _$templateCache.put('/angular_templates/dataCards/cardVisualizationColumnChart.html', '');
        _$templateCache.put('/angular_templates/dataCards/cardVisualizationChoropleth.html', '');
        _$templateCache.put('/angular_templates/dataCards/cardVisualizationTable.html', '');
        _$templateCache.put('/angular_templates/dataCards/cardVisualizationTimelineChart.html', '');
        _$templateCache.put('/angular_templates/dataCards/cardVisualizationSearch.html', '');
        _$templateCache.put('/angular_templates/dataCards/cardVisualization.html', '');
        _$templateCache.put('/angular_templates/dataCards/cardVisualizationInvalid.html', '');
        _$templateCache.put('/angular_templates/dataCards/clearableInput.html', '');
        testHelpers.mockDirective($provide, 'cardTitle');
        // The css styles are scoped to the body class
        $('body').addClass('state-view-cards');
      }
    ])
  );

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('expansion toggle', function() {
    var el;
    var cardModel;

    beforeEach(function() {
      var directive = createDirective({
        columns: {}
      });

      cardModel = directive.cardModel;
      el = directive.element;
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
    var cardModel;
    beforeEach(function() {
      var directive = createDirective({
        columns: {}
      });
      el = directive.element;
      cardModel = directive.cardModel;
      el.css({
        height: $(window).height(),
        display: 'block'
      });
    });

    it('should be set whenever the description height changes', function(done) {
      var textElement = el.find('.description-truncated-content').text('');
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
    var directive;
    var initialDescriptionText = 'some description text';
    var truncatedDescriptionElement;

    beforeEach(function() {
      directive = createDirective({
        columns: {
          myFieldName: {
            name: 'name',
            description: initialDescriptionText,
            physicalDatatype: 'text',
            availableCardTypes: ['search'],
            defaultCardType: 'search'
          }
        },
        version: 1
      });
      truncatedDescriptionElement = directive.element.
        find('.card-text').find('.description-truncated-content');
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

        directive.pageModel.getCurrentValue('dataset').set('columns', {
          myFieldName: {
            name: 'name',
            description: newDescriptionText,
            fred: 'text',
            physicalDatatype: 'text',
            availableCardTypes: ['search'],
            defaultCardType: 'search',
            dataset: directive.pageModel.getCurrentValue('dataset')
          }
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
