import { expect, assert } from 'chai';
const angular = require('angular');

// Some of these tests already exist in frontend-visualizations and should be removed. The rest
// should be moved to columnChartTest. None of these are really testing the functionality of the
// data layer.
xdescribe('ColumnChartController', function() {
  'use strict';

  var testHelpers;
  var rootScope;
  var Model;
  var Mockumentary;
  var q;
  var Filter;
  var $controller;

  beforeEach(angular.mock.module('dataCards'));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  function createChart(whereClause, allowFilterChange) {
    var pageOverrides = {
      pageId: 'asdf-fdsa'
    };
    var datasetOverrides = {
      id: 'bana-nas!',
      rowDisplayUnit: 'row',
      columns: {
        'test_column': {
          name: 'test column name',
          description: 'test column description',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column']
        }
      }
    };
    var pageModel = Mockumentary.createPage(pageOverrides, datasetOverrides);

    var model = new Model();
    model.fieldName = 'ward';
    model.defineObservableProperty('activeFilters', []);
    model.defineObservableProperty('expanded', false);
    model.defineObservableProperty('page', pageModel);

    var outerScope = rootScope.$new();
    outerScope.model = model;
    outerScope.whereClause = whereClause;

    if (typeof allowFilterChange === 'boolean') {
      outerScope.allowFilterChange = allowFilterChange;
    } else {
      outerScope.allowFilterChange = true;
    }

    $controller('ColumnChartController', { $scope: outerScope });

    return {
      model: model,
      $scope: outerScope
    };
  }

  function createMockDataService(fakeData) {
    beforeEach(function() {
      angular.mock.module(function($provide) {
        var mockCardDataService = {
          getData: function(){ return q.when(fakeData);}
        };
        $provide.value('CardDataService', mockCardDataService);
      });
    });
  }

  function initInjector() {
    beforeEach(inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      rootScope = $injector.get('$rootScope');
      Model = $injector.get('Model');
      Mockumentary = $injector.get('Mockumentary');
      q = $injector.get('$q');
      Filter = $injector.get('Filter');
      $controller = $injector.get('$controller');
    }));
  }

  describe('preparing column chart data', function() {

    createMockDataService([{
      name: undefined,
      total: 100,
      filtered: 100,
      special: false
    }]);
    initInjector();

    it('should use empty strings for bars with undefined names', function() {
      var chart = createChart();
      expect(/No value/.test(chart.element[0].innerText));
    });
  });


  describe('filtering via column-chart:datum-clicked event', function() {

    createMockDataService([]);
    initInjector();

    it('should toggle a BinaryOperatorFilter for a non-null value', function() {
      var chart = createChart();

      assert.lengthOf(chart.model.getCurrentValue('activeFilters'), 0);

      testHelpers.fireEvent(
        chart.element.find('card-visualization-column-chart')[0],
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        { detail: { name: 'testname' } }
      );

      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.BinaryOperatorFilter);

      testHelpers.fireEvent(
        chart.element.find('card-visualization-column-chart')[0],
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        { detail: { name: 'testname' } }
      );

      assert.lengthOf(chart.model.getCurrentValue('activeFilters'), 0);
    });

    it('should toggle a BinaryOperatorFilter for a boolean value', function() {
      var chart = createChart();

      assert.lengthOf(chart.model.getCurrentValue('activeFilters'), 0);

      testHelpers.fireEvent(
        chart.element.find('card-visualization-column-chart')[0],
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        { detail: { name: false } }
      );

      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.BinaryOperatorFilter);

      testHelpers.fireEvent(
        chart.element.find('card-visualization-column-chart')[0],
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        { detail: { name: false } }
      );

      assert.lengthOf(chart.model.getCurrentValue('activeFilters'), 0);
    });

    it('should toggle a IsNullFilter for a null value', function() {
      var chart = createChart();

      assert.lengthOf(chart.model.getCurrentValue('activeFilters'), 0);

      testHelpers.fireEvent(
        chart.element.find('card-visualization-column-chart')[0],
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        { detail: { name: null } }
      );

      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.IsNullFilter);

      testHelpers.fireEvent(
        chart.element.find('card-visualization-column-chart')[0],
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        { detail: { name: null } }
      );

      assert.lengthOf(chart.model.getCurrentValue('activeFilters'), 0);
    });

    it('should replace a IsNullFilter with BinaryOperatorFilter and vice versa for appropriate value', function() {
      var chart = createChart();

      assert.lengthOf(chart.model.getCurrentValue('activeFilters'), 0);

      testHelpers.fireEvent(
        chart.element.find('card-visualization-column-chart')[0],
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        { detail: { name: null } }
      );

      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.IsNullFilter);

      testHelpers.fireEvent(
        chart.element.find('card-visualization-column-chart')[0],
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        { detail: { name: 'testname' } }
      );

      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.BinaryOperatorFilter);

      testHelpers.fireEvent(
        chart.element.find('card-visualization-column-chart')[0],
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        { detail: { name: null } }
      );

      expect(chart.model.getCurrentValue('activeFilters')).to.have.length(1);
      expect(chart.model.getCurrentValue('activeFilters')[0]).to.be.instanceof(Filter.IsNullFilter);
    });
  });

  describe('when created with scope.allowFilterChange set to false', function() {

    createMockDataService([]);
    initInjector();

    it('should not add an active filter when a bar is clicked', function() {
      var chart = createChart('', false);

      assert.lengthOf(chart.model.getCurrentValue('activeFilters'), 0);

      $('.bar-group .bar').eq(0).trigger('click');

      assert.lengthOf(chart.model.getCurrentValue('activeFilters'), 0);
    });
  });
});
