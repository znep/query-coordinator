import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import sinon from 'sinon';
import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationPieChart
  from 'editor/block-component-renderers/componentSocrataVisualizationPieChart';
/* eslint-enable no-unused-vars */
import { updateVifWithDefaults, updateVifWithFederatedFromDomain } from 'VifUtils';

describe('componentSocrataVisualizationPieChart jQuery plugin', function() {
  var $component;
  var validComponentData = {
    type: 'socrata.visualization.pieChart',
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
    assert.throws(function() { $component.componentSocrataVisualizationPieChart(); });
    assert.throws(function() { $component.componentSocrataVisualizationPieChart(1); });
    assert.throws(function() { $component.componentSocrataVisualizationPieChart(null); });
    assert.throws(function() { $component.componentSocrataVisualizationPieChart(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationPieChart({}); });
    assert.throws(function() { $component.componentSocrataVisualizationPieChart([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notPieChart';
      assert.throws(function() {
        $component.componentSocrataVisualizationPieChart(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('when component data contains `federatedFromDomain`', function() {
    var socrataPieChartStub;

    beforeEach(function() {
      socrataPieChartStub = sinon.stub($.fn, 'socrataSvgPieChart');

      const componentData = _.merge(_.cloneDeep(validComponentData), {
        value: {
          dataset: {
            federatedFromDomain: 'example.com'
          }
        }
      });
      $component = $component.componentSocrataVisualizationPieChart(getProps({ componentData }));
    });

    afterEach(function() {
      socrataPieChartStub.restore();
    });

    it('should call into socrataSvgPieChart with the correct arguments', function() {
      const expectedVif = updateVifWithDefaults(updateVifWithFederatedFromDomain(_.cloneDeep(validComponentData).value.vif, 'example.com'));
      sinon.assert.calledWithExactly(
        socrataPieChartStub,
        expectedVif,
        sinon.match.any
      );
    });
  });

  describe('given a valid component type and value', function() {
    var socrataPieChartStub;

    beforeEach(function() {
      socrataPieChartStub = sinon.stub($.fn, 'socrataSvgPieChart');
      $component = $component.componentSocrataVisualizationPieChart(getProps());
    });

    afterEach(function() {
      socrataPieChartStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataSvgPieChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataPieChartStub,
        updateVifWithDefaults(validComponentData.value.vif),
        sinon.match.any
      );
    });

    describe('when updating', function() {
      it('should call into socrataSvgPieChart with the correct arguments if changed', function() {
        socrataPieChartStub.reset();

        var changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationPieChart(getProps({ componentData: _.cloneDeep(changedData) }));

        sinon.assert.calledWithExactly(
          socrataPieChartStub,
          updateVifWithDefaults(changedData.value.vif),
          sinon.match.any
        );
      });

      it('should do nothing if unchanged', function() {
        socrataPieChartStub.reset();

        $component.componentSocrataVisualizationPieChart(getProps());

        sinon.assert.notCalled(socrataPieChartStub);
      });
    });
  });
});
