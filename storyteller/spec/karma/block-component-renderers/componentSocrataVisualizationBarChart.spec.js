import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationBarChart from 'editor/block-component-renderers/componentSocrataVisualizationBarChart';
/* eslint-enable no-unused-vars */
import { updateVifWithDefaults, updateVifWithFederatedFromDomain } from 'VifUtils';

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

  describe('when component data contains `federatedFromDomain`', function() {
    var socrataBarChartStub;

    beforeEach(function() {
      socrataBarChartStub = sinon.stub($.fn, 'socrataSvgBarChart');

      const componentData = _.merge(_.cloneDeep(validComponentData), {
        value: {
          dataset: {
            federatedFromDomain: 'example.com'
          }
        }
      });
      $component = $component.componentSocrataVisualizationBarChart(getProps({ componentData }));
    });

    afterEach(function() {
      socrataBarChartStub.restore();
    });

    it('should call into socrataSvgBarChart with the correct arguments', function() {
      const expectedVif = updateVifWithDefaults(updateVifWithFederatedFromDomain(_.cloneDeep(validComponentData).value.vif, 'example.com'));
      sinon.assert.calledWithExactly(
        socrataBarChartStub,
        expectedVif,
        sinon.match.any
      );
    });
  });

  describe('given a valid component type and value', function() {
    var socrataBarChartStub;

    beforeEach(function() {
      socrataBarChartStub = sinon.stub($.fn, 'socrataSvgBarChart');
      $component = $component.componentSocrataVisualizationBarChart(getProps());
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
        updateVifWithDefaults(validComponentData.value.vif),
        sinon.match.any
      );
    });

    describe('when updating', function() {
      it('should call into socrataSvgBarChart with the correct arguments if changed', function() {
        socrataBarChartStub.reset();

        var changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationBarChart(getProps({ componentData: _.cloneDeep(changedData) }));

        sinon.assert.calledWithExactly(
          socrataBarChartStub,
          updateVifWithDefaults(changedData.value.vif),
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
