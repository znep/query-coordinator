import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { $transient } from '../TransientElement';
import 'editor/block-component-renderers/componentSocrataVisualizationTimelineChart';
import { updateVifWithDefaults, updateVifWithFederatedFromDomain } from 'VifUtils';

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
        type: 'pieChart'
      }
    }
  };

  var getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: _.cloneDeep(validComponentData),
      componentIndex: null,
      theme: null
    }, props);
  };

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
        $component.componentSocrataVisualizationTimelineChart(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('when component data contains `federatedFromDomain`', function() {
    var socrataTimelineChartStub;

    beforeEach(function() {
      socrataTimelineChartStub = sinon.stub($.fn, 'socrataSvgTimelineChart');

      const componentData = _.merge(_.cloneDeep(validComponentData), {
        value: {
          dataset: {
            federatedFromDomain: 'example.com'
          }
        }
      });
      $component = $component.componentSocrataVisualizationTimelineChart(getProps({ componentData }));
    });

    afterEach(function() {
      socrataTimelineChartStub.restore();
    });

    it('should call into socrataSvgTimelineChart with the correct arguments', function() {
      const expectedVif = updateVifWithDefaults(updateVifWithFederatedFromDomain(_.cloneDeep(validComponentData).value.vif, 'example.com'));
      sinon.assert.calledWithExactly(
        socrataTimelineChartStub,
        expectedVif,
        sinon.match.any
      );
    });
  });

  describe('given a valid component type and value', function() {
    var socrataTimelineChartStub;

    beforeEach(function() {
      socrataTimelineChartStub = sinon.stub($.fn, 'socrataSvgTimelineChart').callsFake(function() { return this; });
      $component = $component.componentSocrataVisualizationTimelineChart(_.cloneDeep(getProps()));
    });

    afterEach(function() {
      socrataTimelineChartStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataSvgTimelineChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataTimelineChartStub,
        updateVifWithDefaults(validComponentData.value.vif),
        sinon.match.any
      );
    });

    describe('when updating', function() {
      it('should call into socrataSvgTimelineChart with the correct arguments if changed', function() {
        socrataTimelineChartStub.reset();

        var changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationTimelineChart(getProps({ componentData: _.cloneDeep(changedData) }));

        sinon.assert.calledWithExactly(
          socrataTimelineChartStub,
          updateVifWithDefaults(changedData.value.vif),
          sinon.match.any
        );
      });

      it('should do nothing if unchanged', function() {
        socrataTimelineChartStub.reset();

        $component.componentSocrataVisualizationTimelineChart(getProps());

        sinon.assert.notCalled(socrataTimelineChartStub);
      });
    });
  });
});
