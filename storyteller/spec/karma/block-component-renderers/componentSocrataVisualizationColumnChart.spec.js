import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationColumnChart from 'editor/block-component-renderers/componentSocrataVisualizationColumnChart';
/* eslint-enable no-unused-vars */
import { updateVifWithDefaults, updateVifWithFederatedFromDomain } from 'VifUtils';

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
        $component.componentSocrataVisualizationColumnChart(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('when component data contains `federatedFromDomain`', function() {
    var socrataColumnChartStub;

    beforeEach(function() {
      socrataColumnChartStub = sinon.stub($.fn, 'socrataSvgColumnChart');

      const componentData = _.merge(_.cloneDeep(validComponentData), {
        value: {
          dataset: {
            federatedFromDomain: 'example.com'
          }
        }
      });
      $component = $component.componentSocrataVisualizationColumnChart(getProps({ componentData }));
    });

    afterEach(function() {
      socrataColumnChartStub.restore();
    });

    it('should call into socrataSvgColumnChart with the correct arguments', function() {
      const expectedVif = updateVifWithDefaults(updateVifWithFederatedFromDomain(validComponentData.value.vif, 'example.com'));
      sinon.assert.calledWithExactly(
        socrataColumnChartStub,
        expectedVif,
        sinon.match.any
      );
    });
  });

  describe('given a valid component type and value', function() {
    var socrataColumnChartStub;

    beforeEach(function() {
      socrataColumnChartStub = sinon.stub($.fn, 'socrataSvgColumnChart');
      $component = $component.componentSocrataVisualizationColumnChart(getProps());
    });

    afterEach(function() {
      socrataColumnChartStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataSvgColumnChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataColumnChartStub,
        updateVifWithDefaults(validComponentData.value.vif),
        sinon.match.any
      );
    });

    describe('when updating', function() {
      it('should call into socrataSvgColumnChart with the correct arguments if changed', function() {
        socrataColumnChartStub.reset();

        var changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationColumnChart(getProps({ componentData: _.cloneDeep(changedData) }));

        sinon.assert.calledWithExactly(
          socrataColumnChartStub,
          updateVifWithDefaults(changedData.value.vif),
          sinon.match.any
        );
      });

      it('should do nothing if unchanged', function() {
        socrataColumnChartStub.reset();

        $component.componentSocrataVisualizationColumnChart(getProps());

        sinon.assert.notCalled(socrataColumnChartStub);
      });
    });
  });
});
