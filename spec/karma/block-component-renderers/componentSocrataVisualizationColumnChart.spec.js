import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationColumnChart, {__RewireAPI__ as componentSocrataVisualizationColumnChartAPI}
  from 'editor/block-component-renderers/componentSocrataVisualizationColumnChart';
/* eslint-enable no-unused-vars */

describe('componentSocrataVisualizationColumnChart jQuery plugin', function() {
  var $component;
  var validComponentData = {
    type: 'socrata.visualization.columnChart',
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

  function useSvgVisualizations(useSvg) {
    componentSocrataVisualizationColumnChartAPI.__Rewire__('Environment', {ENABLE_SVG_VISUALIZATIONS: useSvg});
  }

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart(); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart(1); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart(null); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart({}); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notColumnChart';
      assert.throws(function() {
        $component.componentSocrataVisualizationColumnChart(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataColumnChartStub;

    describe('when using the old (Data Lens) column chart', function() {

      beforeEach(function() {
        useSvgVisualizations(false);
        socrataColumnChartStub = sinon.stub($.fn, 'socrataColumnChart');
        $component = $component.componentSocrataVisualizationColumnChart(validComponentData);
      });

      afterEach(function() {
        socrataColumnChartStub.restore();
      });

      it('should return a jQuery object for chaining', function() {
        assert.instanceOf($component, $);
      });

      it('should call into socrataColumnChart with the correct arguments', function() {
        sinon.assert.calledWithExactly(
          socrataColumnChartStub,
          validComponentData.value.vif
        );
      });
    });

    describe('when using the new (05/2016) column chart', function() {

      beforeEach(function() {
        useSvgVisualizations(true);
        socrataColumnChartStub = sinon.stub($.fn, 'socrataSvgColumnChart');
        $component = $component.componentSocrataVisualizationColumnChart(validComponentData);
      });

      afterEach(function() {
        socrataColumnChartStub.restore();
      });

      it('should return a jQuery object for chaining', function() {
        assert.instanceOf($component, $);
      });

      it('should call into socrataColumnChart with the correct arguments', function() {
        sinon.assert.calledWithExactly(
          socrataColumnChartStub,
          validComponentData.value.vif
        );
      });
    });
  });
});
