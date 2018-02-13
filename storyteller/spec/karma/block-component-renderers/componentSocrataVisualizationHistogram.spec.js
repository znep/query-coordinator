import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationHistogram
  from 'editor/block-component-renderers/componentSocrataVisualizationHistogram';
/* eslint-enable no-unused-vars */
import { updateVifWithDefaults, updateVifWithFederatedFromDomain } from 'VifUtils';

describe('componentSocrataVisualizationHistogram jQuery plugin', function() {
  var $component;
  var validComponentData = {
    type: 'socrata.visualization.histogram',
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
        type: 'histogram'
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
    assert.throws(function() { $component.componentSocrataVisualizationHistogram(); });
    assert.throws(function() { $component.componentSocrataVisualizationHistogram(1); });
    assert.throws(function() { $component.componentSocrataVisualizationHistogram(null); });
    assert.throws(function() { $component.componentSocrataVisualizationHistogram(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationHistogram({}); });
    assert.throws(function() { $component.componentSocrataVisualizationHistogram([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notHistogram';
      assert.throws(function() {
        $component.componentSocrataVisualizationHistogram(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('when component data contains `federatedFromDomain`', function() {
    var socrataHistogramStub;

    beforeEach(function() {
      socrataHistogramStub = sinon.stub($.fn, 'socrataSvgHistogram');

      const componentData = _.merge(_.cloneDeep(validComponentData), {
        value: {
          dataset: {
            federatedFromDomain: 'example.com'
          }
        }
      });
      $component = $component.componentSocrataVisualizationHistogram(getProps({ componentData }));
    });

    afterEach(function() {
      socrataHistogramStub.restore();
    });

    it('should call into socrataSvgHistogram with the correct arguments', function() {
      const expectedVif = updateVifWithDefaults(updateVifWithFederatedFromDomain(_.cloneDeep(validComponentData).value.vif, 'example.com'));
      sinon.assert.calledWithExactly(
        socrataHistogramStub,
        expectedVif,
        sinon.match.any
      );
    });
  });

  describe('given a valid component type and value', function() {
    var socrataHistogramStub;

    beforeEach(function() {
      socrataHistogramStub = sinon.stub($.fn, 'socrataSvgHistogram');
      $component = $component.componentSocrataVisualizationHistogram(getProps());
    });

    afterEach(function() {
      socrataHistogramStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataSvgHistogram with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataHistogramStub,
        updateVifWithDefaults(validComponentData.value.vif),
        sinon.match.any
      );
    });

    describe('when updating', function() {
      it('should call into socrataSvgHistogram with the correct arguments if changed', function() {
        socrataHistogramStub.reset();

        var changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationHistogram(getProps({ componentData: _.cloneDeep(changedData) }));

        sinon.assert.calledWithExactly(
          socrataHistogramStub,
          updateVifWithDefaults(changedData.value.vif),
          sinon.match.any
        );
      });

      it('should do nothing if unchanged', function() {
        socrataHistogramStub.reset();

        $component.componentSocrataVisualizationHistogram(getProps());

        sinon.assert.notCalled(socrataHistogramStub);
      });
    });
  });
});
