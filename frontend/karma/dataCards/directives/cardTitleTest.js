import { expect, assert } from 'chai';
const angular = require('angular');

describe('cardTitle', function() {
  'use strict';

  var CARD_TITLE_HTML = '<card-title model="cardModel"></card-title>';

  var $rootScope;
  var testHelpers;
  var Card;
  var Mockumentary;
  var ServerConfig;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));
  require('app/styles/dataCards/cards.scss');
  require('app/styles/dataCards/card.scss');

  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    testHelpers = $injector.get('testHelpers');
    Card = $injector.get('Card');
    Mockumentary = $injector.get('Mockumentary');
    ServerConfig = $injector.get('ServerConfig');
  }));

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

    var cardModel = new Card(pageModel, options.fieldName, options);

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
      aggregationField: null,
      aggregationFunction: null,
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

  describe('card title', function() {
    it('should display the title', function() {
      var element = createDirective().element;
      assert.include(element.find('.card-title').text(), 'some title text');
    });
  });

  describe('dynamic card title', function() {
    it('should display the "count" dynamic title when "count" aggregation is selected', function() {
      var element = createDirective({
        rowDisplayUnit: 'my row unit',
        aggregationFunction: 'count'
      }).element;
      assert.include(element.find('.dynamic-title').text(), 'Number of my row units by');
    });

    it('should display the "sum" dynamic title when "sum" aggregation is selected', function() {
      var element = createDirective({
        aggregationFunction: 'sum',
        aggregationField: 'myAggregationField'
      }).element;
      assert.include(element.find('.dynamic-title').text(), 'Sum of My Version 1 Aggregation Fields by');
    });

    it('should display the "mean" dynamic title when "mean" aggregation is selected', function() {
      var element = createDirective({
        aggregationFunction: 'mean',
        aggregationField: 'myAggregationField'
      }).element;
      assert.include(element.find('.dynamic-title').text(), 'Average My Version 1 Aggregation Field by');
    });

    it('should not display the dynamic title for a table card', function() {
      var element = createDirective({
        fieldName: '*'
      }).element;
      assert.isFalse(element.find('.dynamic-title').is(':visible'));
    });

    it('should not display the dynamic title for a search card', function() {
      var element = createDirective({
        columns: {
          myFieldName: {
            name: 'name',
            description: 'search card',
            physicalDatatype: 'text',
            availableCardTypes: ['search'],
            defaultCardType: 'search'
          }
        },
        fieldName: 'myFieldName',
        cardType: 'search'
      }).element;
      assert.isFalse(element.find('.dynamic-title').is(':visible'));
    });

    it('should not display the dynamic title for a feature/point-map card', function() {
      var element = createDirective({
        columns: {
          myFieldName: {
            name: 'name',
            description: 'feature',
            physicalDatatype: 'point',
            availableCardTypes: ['feature'],
            defaultCardType: 'feature'
          }
        },
        fieldName: 'myFieldName',
        cardType: 'feature'
      }).element;
      assert.isFalse(element.find('.dynamic-title').is(':visible'));
    });

  });

  describe('custom title', function() {
    it('should display the customTitle when present on the card model', function() {
      var directive = createDirective({
        fieldName: '*'
      });

      directive.cardModel.set('customTitle', 'This is a custom title');

      assert.include(directive.element.find('.custom-title').text(), 'This is a custom title');
    });

    it('should allow html formatting', function() {
      var directive = createDirective({
        fieldName: '*'
      });

      directive.cardModel.set('customTitle', 'This is a <span>formatted</span> custom title');

      assert.include(directive.element.find('.custom-title').html(), 'This is a <span>formatted</span> custom title');
    });

    it('should not display the customTitle when not present on the card model', function() {
      var directive = createDirective({
        fieldName: '*'
      });

      assert.isFalse(directive.element.find('.custom-title').is(':visible'));
    });
  });

});
