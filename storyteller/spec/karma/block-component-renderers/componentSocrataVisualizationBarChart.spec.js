import $ from 'jquery';
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

  var getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: validComponentData,
      componentIndex: null,
      theme: null
    }, props);
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
        $component.componentSocrataVisualizationBarChart(getProps({ componentData: badData }));
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataBarChartStub;

    beforeEach(function() {
      socrataBarChartStub = sinon.stub($.fn, 'socrataSvgBarChart');
      $component = $component.componentSocrataVisualizationBarChart(getProps({
        componentData: validComponentData
      }));
    });

    afterEach(function() {
      socrataBarChartStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataSvgBarChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataBarChartStub,
        validComponentData.value.vif,
        sinon.match.any
      );
    });

    describe('when updating', function() {
      it('should call into socrataSvgBarChart with the correct arguments if changed', function() {
        socrataBarChartStub.reset();

        var changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationBarChart(getProps({ componentData: changedData }));

        sinon.assert.calledWithExactly(
          socrataBarChartStub,
          changedData.value.vif,
          sinon.match.any
        );
      });

      it('should do nothing if unchanged', function() {
        socrataBarChartStub.reset();

        $component.componentSocrataVisualizationBarChart(getProps());

        sinon.assert.notCalled(socrataBarChartStub);
      });
    });
  });
});
