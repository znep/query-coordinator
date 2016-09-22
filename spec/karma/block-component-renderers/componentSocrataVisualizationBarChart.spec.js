import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationBarChart from 'editor/block-component-renderers/componentSocrataVisualizationBarChart';
/* eslint-enable no-unused-vars */

describe('componentSocrataVisualizationBarChart jQuery plugin', function() {
  var $component;
  var validComponentData = {
    type: 'socrata.visualization.barChart',
    value: {
      layout: {
        height: 300
      },
      vif: {
        columnName: 'test',
        configuration: {},
        datasetUid: 'test-test',
        domain: 'example.com',
        filters: [],
        type: 'columnChart'
      }
    }
  };

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentSocrataVisualizationBarChart(); });
    assert.throws(function() { $component.componentSocrataVisualizationBarChart(1); });
    assert.throws(function() { $component.componentSocrataVisualizationBarChart(null); });
    assert.throws(function() { $component.componentSocrataVisualizationBarChart(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationBarChart({}); });
    assert.throws(function() { $component.componentSocrataVisualizationBarChart([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notBarChart';
      assert.throws(function() {
        $component.componentSocrataVisualizationBarChart(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataBarChartStub;

    beforeEach(function() {
      socrataBarChartStub = sinon.stub($.fn, 'socrataSvgBarChart');
      $component = $component.componentSocrataVisualizationBarChart(validComponentData);
    });

    afterEach(function() {
      socrataBarChartStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataColumnChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataBarChartStub,
        validComponentData.value.vif
      );
    });
  });
});
