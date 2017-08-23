import { expect, assert } from 'chai';
const angular = require('angular');

describe('cardAggregationSelector', function() {
  'use strict';

  var testHelpers;
  var $rootScope;
  var Mockumentary;
  var $compile;
  var Constants;

  var DEFAULT_ROW_DISPLAY_UNIT = 'unicorn hair';
  var DEFAULT_COLUMNS = {
    column1_number: {
      name: 'test column title',
      description: 'test column description',
      physicalDatatype: 'number',
      defaultCardType: 'column',
      availableCardTypes: ['column', 'search']
    },
    column2_number: {
      name: 'second test column title',
      description: 'second test column description',
      physicalDatatype: 'number',
      defaultCardType: 'column',
      availableCardTypes: ['column', 'search']
    },
    column3_money: {
      name: 'third test column title',
      description: 'third test column description',
      physicalDatatype: 'money',
      defaultCardType: 'column',
      availableCardTypes: ['column', 'search']
    },
    column4_text: {
      name: 'fourth test column title',
      description: 'fourth test column description',
      physicalDatatype: 'text',
      defaultCardType: 'column',
      availableCardTypes: ['column', 'search']
    }
  };
  var ELEMENT_HTML = '<card-aggregation-selector page="page" card-model="cardModel"></card-aggregation-selector>';

  function createModels(options) {
    options = options || {};

    _.defaults(options, {
      aggregationField: null,
      aggregationFunction: null,
      fieldName: 'column1_number',
      columns: DEFAULT_COLUMNS,
      rowDisplayUnit: DEFAULT_ROW_DISPLAY_UNIT
    });

    var pageOptions = {};
    var datasetOptions = {
      columns: options.columns,
      rowDisplayUnit: options.rowDisplayUnit
    };

    var cardOptions = {
      aggregationField: options.aggregationField,
      aggregationFunction: options.aggregationFunction
    };

    var pageModel = Mockumentary.createPage(pageOptions, datasetOptions);
    var cardModel = Mockumentary.createCard(pageModel, options.fieldName, cardOptions);

    return {
      page: pageModel,
      cardModel: cardModel
    };
  }

  function createElement(baseScope) {
    var scope = $rootScope.$new();
    _.extend(scope, baseScope);

    var element = angular.element(ELEMENT_HTML);
    var directive = $compile(element)(scope);

    scope.$digest();
    return directive;
  }

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      $rootScope = $injector.get('$rootScope');
      Mockumentary = $injector.get('Mockumentary');
      $compile = $injector.get('$compile');
      Constants = $injector.get('Constants');
    });
  });

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  it('should exist when created', function() {
    var models = createModels();
    var element = createElement(models);

    assert.isTrue(element.is('card-aggregation-selector'));
    expect(element.find('select').text().toLowerCase()).to.contain(DEFAULT_ROW_DISPLAY_UNIT);
  });

  describe('value dropdown', function() {
    it('should populate aggregation columns dropdown', function() {
      var models = createModels();
      var element = createElement(models);

      assert.lengthOf(element.find('option:not([value=null])'), 4);
      assert.lengthOf(element.find('option[value="*"]'), 1);
      assert.lengthOf(element.find('option[value="column2_number"]'), 1);
      assert.lengthOf(element.find('option[value="column3_money"]'), 1);
    });

    it('should populate with column selected for card', function() {
      var models = createModels({ fieldName: 'column2_number' });
      var element = createElement(models);

      assert.lengthOf(element.find('option[value="column2_number"]'), 1);
    });

    it('should default to rows label', function() {
      var models = createModels();
      var element = createElement(models);

      expect(element.find('option:checked').val()).to.equal('*');
      expect(element.find('option:checked').text()).to.contain('unicorn hairs');
    });

    it('should be disabled if there are no aggregable columns', function() {
      var models = createModels({
        columns: {
          unicornName: {
            name: 'unicorn name',
            description: 'the name of this mythical beast',
            physicalDatatype: 'text',
            defaultCardType: 'search',
            availableCardTypes: ['column', 'search']
          }
        }
      });

      var element = createElement(models);

      assert.isTrue(element.find('select').prop('disabled'));
    });

    it('should select the saved aggregation', function() {
      var models = createModels({
        aggregationField: 'column2_number',
        aggregationFunction: 'sum'
      });

      var element = createElement(models);

      expect(element.find('option:checked').text()).to.equal('second test column title');
    });
  });

  describe('function field', function() {
    it('should show COUNT if selected value is COUNT column', function() {
      var models = createModels();
      var element = createElement(models);

      expect(element.find('#aggregation-function').val()).to.equal('count');
    });

    it('should show SUM if selected value is a SUM column', function() {
      var models = createModels({
        aggregationField: 'column2_number',
        aggregationFunction: 'sum'
      });

      var element = createElement(models);

      expect(element.find('#aggregation-function').val()).to.equal('sum');
    });
  });

  it('should update card metadata when selection changes', function() {
    var models = createModels();
    var element = createElement(models);

    expect(models.cardModel.getCurrentValue('aggregationFunction')).to.equal('count');
    expect(models.cardModel.getCurrentValue('aggregationField')).to.equal(null);

    element.find('select').val('column2_number').trigger('change');

    expect(models.cardModel.getCurrentValue('aggregationFunction')).to.equal('sum');
    expect(models.cardModel.getCurrentValue('aggregationField')).to.equal('column2_number');
  });
});
