import $ from 'jquery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationComboChart from 'editor/block-component-renderers/componentSocrataVisualizationComboChart';
/* eslint-enable no-unused-vars */

describe('componentSocrataVisualizationComboChart jQuery plugin', function() {
  var $component;
  var validComponentData = {
    type: 'socrata.visualization.comboChart',
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
        type: 'comboChart'
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
    assert.throws(function() { $component.componentSocrataVisualizationComboChart(); });
    assert.throws(function() { $component.componentSocrataVisualizationComboChart(1); });
    assert.throws(function() { $component.componentSocrataVisualizationComboChart(null); });
    assert.throws(function() { $component.componentSocrataVisualizationComboChart(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationComboChart({}); });
    assert.throws(function() { $component.componentSocrataVisualizationComboChart([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notComboChart';
      assert.throws(function() {
        $component.componentSocrataVisualizationComboChart(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataComboChartStub;

    beforeEach(function() {
      socrataComboChartStub = sinon.stub($.fn, 'socrataSvgComboChart');
      $component = $component.componentSocrataVisualizationComboChart(getProps());
    });

    afterEach(function() {
      socrataComboChartStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataSvgComboChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataComboChartStub,
        validComponentData.value.vif,
        sinon.match.any
      );
    });

    describe('when updating', function() {
      it('should call into socrataSvgComboChart with the correct arguments if changed', function() {
        socrataComboChartStub.reset();

        var changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationComboChart(getProps({ componentData: changedData }));

        sinon.assert.calledWithExactly(
          socrataComboChartStub,
          changedData.value.vif,
          sinon.match.any
        );
      });

      it('should do nothing if unchanged', function() {
        socrataComboChartStub.reset();

        $component.componentSocrataVisualizationComboChart(getProps());

        sinon.assert.notCalled(socrataComboChartStub);
      });
    });
  });
});
