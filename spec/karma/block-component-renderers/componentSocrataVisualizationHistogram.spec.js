import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationHistogram
  from 'editor/block-component-renderers/componentSocrataVisualizationHistogram';
/* eslint-enable no-unused-vars */

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
        $component.componentSocrataVisualizationHistogram(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataHistogramStub;

    beforeEach(function() {
      socrataHistogramStub = sinon.stub($.fn, 'socrataSvgHistogram');
      $component = $component.componentSocrataVisualizationHistogram(validComponentData);
    });

    afterEach(function() {
      socrataHistogramStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataHistogram with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataHistogramStub,
        validComponentData.value.vif
      );
    });
  });
});
