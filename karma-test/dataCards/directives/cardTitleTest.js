describe('<card-title />', function() {
  'use strict';

  var CARD_TITLE_HTML = '<card-title model="cardModel"></card-title>';

  var $rootScope;
  var testHelpers;
  var Card;
  var Mockumentary;

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
      rowDisplayUnit: options.rowDisplayUnit
    };
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);

    var scope = $rootScope.$new();
    scope.cardModel = createCardModel(pageModel, options);

    return {
      element: testHelpers.TestDom.compileAndAppend(CARD_TITLE_HTML, scope),
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
  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    testHelpers = $injector.get('testHelpers');
    Card = $injector.get('Card');
    Mockumentary = $injector.get('Mockumentary');
  }));

  describe('card title', function() {
    it('should display the title', function() {
      var element = createDirective().element;
      expect(element.find('.card-title')).to.have.text('some title text');
    });
  });

  describe('dynamic card title', function() {
    it('should display the "count" dynamic title when "count" aggregation is selected', function() {
      var element = createDirective({
        rowDisplayUnit: 'my row unit',
        primaryAggregation: 'count'
      }).element;
      expect(element.find('.dynamic-title')).to.have.text('Number of my row units by');
    });

    it('should default to "rows" for the rowDisplayUnit if none is specified', function() {
      var element = createDirective({}).element;
      expect(element.find('.dynamic-title')).to.have.text('Number of rows by');
    });

    it('should display the "sum" dynamic title when "sum" aggregation is selected', function() {
      var element = createDirective({
        primaryAggregation: 'sum',
        primaryAmountField: 'myAggregationField'
      }).element;
      expect(element.find('.dynamic-title')).to.have.text('Sum of My Version 1 Aggregation Fields by');
    });

    it('should display the "mean" dynamic title when "mean" aggregation is selected', function() {
      var element = createDirective({
        primaryAggregation: 'mean',
        primaryAmountField: 'myAggregationField'
      }).element;
      expect(element.find('.dynamic-title')).to.have.text('Average My Version 1 Aggregation Field by');
    });

    it('should not display the dynamic title for a table card', function() {
      var element = createDirective({
        fieldName: '*'
      }).element;
      expect(element.find('.dynamic-title')).to.not.be.visible;
    });

    it('should not display the dynamic title for a search card', function() {
      var element = createDirective({
        columns: {
          myFieldName: {
            name: 'name',
            description: 'search card',
            fred: 'text',
            physicalDatatype: 'text',
            availableCardTypes: ['search'],
            defaultCardType: 'search'
          }
        },
        fieldName: 'myFieldName',
        cardType: 'search'
      }).element;
      expect(element.find('.dynamic-title')).to.not.be.visible;
    });

    it('should not display the dynamic title for a feature/point-map card', function() {
      var element = createDirective({
        columns: {
          myFieldName: {
            name: 'name',
            description: 'feature',
            fred: 'location',
            physicalDatatype: 'point',
            availableCardTypes: ['feature'],
            defaultCardType: 'feature'
          }
        },
        fieldName: 'myFieldName',
        cardType: 'feature'
      }).element;
      expect(element.find('.dynamic-title')).to.not.be.visible;
    });

  });

});
