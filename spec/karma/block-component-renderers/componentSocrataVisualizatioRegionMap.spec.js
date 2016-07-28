import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
/* eslint-disable no-unused-vars */
import componentSocrataVisualizationRegionMap, {__RewireAPI__ as componentSocrataVisualizationRegionMapApi}
  from 'editor/block-component-renderers/componentSocrataVisualizationRegionMap';
/* eslint-enable no-unused-vars */

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

  function useSvgVisualizations(useSvg) {
    componentSocrataVisualizationRegionMapApi.__Rewire__('Environment', {ENABLE_SVG_VISUALIZATIONS: useSvg});
  }

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  describe('with SVG visualizations enabled', function() {
    beforeEach(function() {
      useSvgVisualizations(true);
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

  describe('with SVG visualizations disabled', function() {
    beforeEach(function() {
      useSvgVisualizations(false);
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
        var socrataChoroplethMapStub;

        beforeEach(function() {
          socrataChoroplethMapStub = sinon.stub($.fn, 'socrataChoroplethMap', function() { return this; });
          $component = $component.componentSocrataVisualizationRegionMap(validChoroplethComponentData);
        });

        afterEach(function() {
          socrataChoroplethMapStub.restore();
        });

        it('should return a jQuery object for chaining', function() {
          assert.instanceOf($component, $);
        });

        it('should call into socrataChoroplethMapwith the correct arguments', function() {
          sinon.assert.calledWithExactly(
            socrataChoroplethMapStub,
            validChoroplethComponentData.value.vif
          );
        });
      });
    });
  });
});
