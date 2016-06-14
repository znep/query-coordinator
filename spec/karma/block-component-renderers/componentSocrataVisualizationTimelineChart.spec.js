import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationTimelineChart, {__RewireAPI__ as componentSocrataVisualizationTimelineChartAPI}
  from 'editor/block-component-renderers/componentSocrataVisualizationTimelineChart';
/* eslint-enable no-unused-vars */

describe('componentSocrataVisualizationTimelineChart jQuery plugin', function() {
  var $component;
  var validComponentData = {
    type: 'socrata.visualization.timelineChart',
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
        type: 'timelineChart'
      }
    }
  };

  function useSvgVisualizations(useSvg) {
    componentSocrataVisualizationTimelineChartAPI.__Rewire__('Environment', {ENABLE_SVG_VISUALIZATIONS: useSvg});
  }

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart(); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart(1); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart(null); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart({}); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notTimelineChart';
      assert.throws(function() {
        $component.componentSocrataVisualizationTimelineChart(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataTimelineChartStub;

    describe('when using the old (Data Lens) timeline chart', function() {

      beforeEach(function() {
        useSvgVisualizations(false);
        socrataTimelineChartStub = sinon.stub($.fn, 'socrataTimelineChart', function() { return this; });
        $component = $component.componentSocrataVisualizationTimelineChart(validComponentData);
      });

      afterEach(function() {
        socrataTimelineChartStub.restore();
      });

      it('should return a jQuery object for chaining', function() {
        assert.instanceOf($component, $);
      });

      it('should call into socrataTimelineChart with the correct arguments', function() {
        sinon.assert.calledWithExactly(
          socrataTimelineChartStub,
          validComponentData.value.vif
        );
      });
    });

    describe('when using the new (05/2016) timeline chart', function() {

      beforeEach(function() {
        useSvgVisualizations(true);
        socrataTimelineChartStub = sinon.stub($.fn, 'socrataSvgTimelineChart', function() { return this; });
        $component = $component.componentSocrataVisualizationTimelineChart(validComponentData);
      });

      afterEach(function() {
        socrataTimelineChartStub.restore();
      });

      it('should return a jQuery object for chaining', function() {
        assert.instanceOf($component, $);
      });

      it('should call into socrataTimelineChart with the correct arguments', function() {
        sinon.assert.calledWithExactly(
          socrataTimelineChartStub,
          validComponentData.value.vif
        );
      });
    });
  });
});
