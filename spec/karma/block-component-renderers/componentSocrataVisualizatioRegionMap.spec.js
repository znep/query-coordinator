import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
import 'editor/block-component-renderers/componentSocrataVisualizationRegionMap';

describe('componentSocrataVisualizationRegionMap jQuery plugin', function() {

  var $component;
  var validComponentData = {
    type: 'socrata.visualization.regionMap',
    value: {
      vif: {
        configuration: {}
      }
    }
  };

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentSocrataVisualizationRegionMap(); });
    assert.throws(function() { $component.componentSocrataVisualizationRegionMap(1); });
    assert.throws(function() { $component.componentSocrataVisualizationRegionMap(null); });
    assert.throws(function() { $component.componentSocrataVisualizationRegionMap(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationRegionMap({}); });
    assert.throws(function() { $component.componentSocrataVisualizationRegionMap([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notRegionMap';
      assert.throws(function() {
        $component.componentSocrataVisualizationRegionMap(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataSvgRegionMapStub;

    beforeEach(function() {
      socrataSvgRegionMapStub = sinon.stub($.fn, 'socrataSvgRegionMap', function() { return this; });
      $component = $component.componentSocrataVisualizationRegionMap(validComponentData);
    });

    afterEach(function() {
      socrataSvgRegionMapStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataSvgRegionMap with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataSvgRegionMapStub,
        validComponentData.value.vif
      );
    });
  });

  describe('legacy choropleth', function() {
    var validChoroplethComponentData = {
      type: 'socrata.visualization.choroplethMap',
      value: {
        vif: {
          configuration: {}
        }
      }
    };

    describe('given a valid component type and value', function() {
      var socrataSvgRegionMapStub;

      beforeEach(function() {
        socrataSvgRegionMapStub = sinon.stub($.fn, 'socrataSvgRegionMap', function() { return this; });
        $component = $component.componentSocrataVisualizationRegionMap(validChoroplethComponentData);
      });

      afterEach(function() {
        socrataSvgRegionMapStub.restore();
      });

      it('should return a jQuery object for chaining', function() {
        assert.instanceOf($component, $);
      });

      it('should call into socrataSvgRegionMap with the correct arguments', function() {
        sinon.assert.calledWithExactly(
          socrataSvgRegionMapStub,
          validChoroplethComponentData.value.vif
        );
      });
    });
  });
});
