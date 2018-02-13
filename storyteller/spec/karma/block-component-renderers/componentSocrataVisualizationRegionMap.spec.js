import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import 'editor/block-component-renderers/componentSocrataVisualizationRegionMap';
import { updateVifWithDefaults, updateVifWithFederatedFromDomain } from 'VifUtils';

describe('componentSocrataVisualizationRegionMap jQuery plugin', function() {

  var $component;
  var validComponentData = {
    type: 'socrata.visualization.regionMap',
    value: {
      vif: {
        configuration: {},
        unit: { one: 'record', other: 'records' }
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
        $component.componentSocrataVisualizationRegionMap(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('when component data contains `federatedFromDomain`', function() {
    var socrataSvgRegionMapStub;

    beforeEach(function() {
      socrataSvgRegionMapStub = sinon.stub($.fn, 'socrataSvgRegionMap');

      const componentData = _.merge(_.cloneDeep(validComponentData), {
        value: {
          dataset: {
            federatedFromDomain: 'example.com'
          }
        }
      });
      $component = $component.componentSocrataVisualizationRegionMap(getProps({ componentData }));
    });

    afterEach(function() {
      socrataSvgRegionMapStub.restore();
    });

    it('should call into socrataSvgRegionMap with the correct arguments', function() {
      const expectedVif = updateVifWithDefaults(updateVifWithFederatedFromDomain(_.cloneDeep(validComponentData).value.vif, 'example.com'));
      sinon.assert.calledWithExactly(
        socrataSvgRegionMapStub,
        expectedVif,
        sinon.match.any
      );
    });
  });

  describe('given a valid component type and value', function() {
    var socrataSvgRegionMapStub;

    beforeEach(function() {
      socrataSvgRegionMapStub = sinon.stub($.fn, 'socrataSvgRegionMap').callsFake(function() { return this; });
      $component = $component.componentSocrataVisualizationRegionMap(getProps());
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
        validComponentData.value.vif,
        sinon.match.any
      );
    });

    describe('when updating', function() {
      it('should call into socrataSvgRegionMap with the correct arguments if changed', function() {
        socrataSvgRegionMapStub.reset();

        var changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationRegionMap(getProps({ componentData: changedData }));

        sinon.assert.calledWithExactly(
          socrataSvgRegionMapStub,
          changedData.value.vif,
          sinon.match.any
        );
      });

      it('should do nothing if unchanged', function() {
        socrataSvgRegionMapStub.reset();

        $component.componentSocrataVisualizationRegionMap(getProps());

        sinon.assert.notCalled(socrataSvgRegionMapStub);
      });
    });
  });

  describe('legacy choropleth', function() {
    var validChoroplethComponentData = {
      type: 'socrata.visualization.choroplethMap',
      value: {
        vif: {
          configuration: {},
          unit: { one: 'record', other: 'records' }
        }
      }
    };

    describe('given a valid component type and value', function() {
      var socrataSvgRegionMapStub;

      beforeEach(function() {
        socrataSvgRegionMapStub = sinon.stub($.fn, 'socrataSvgRegionMap').callsFake(function() { return this; });
        $component = $component.componentSocrataVisualizationRegionMap(getProps());
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
          validChoroplethComponentData.value.vif,
          sinon.match.any
        );
      });

      describe('when updating', function() {
        it('should call into socrataSvgRegionMap with the correct arguments if changed', function() {
          socrataSvgRegionMapStub.reset();

          var changedData = _.cloneDeep(validComponentData);
          _.set(changedData, 'value.vif.columnName', 'test2');
          $component.componentSocrataVisualizationRegionMap(getProps({ componentData: changedData }));

          sinon.assert.calledWithExactly(
            socrataSvgRegionMapStub,
            changedData.value.vif,
            sinon.match.any
          );
        });

        it('should do nothing if unchanged', function() {
          socrataSvgRegionMapStub.reset();

          $component.componentSocrataVisualizationRegionMap(getProps());

          sinon.assert.notCalled(socrataSvgRegionMapStub);
        });
      });
    });
  });

  describe('when in edit mode', function() {
    let socrataSvgRegionMapStub;
    let componentWithMapBoundsStub;

    beforeEach(function() {
      socrataSvgRegionMapStub = sinon.stub($.fn, 'socrataSvgRegionMap');
      componentWithMapBoundsStub = sinon.stub($.fn, 'componentWithMapBounds');

      $component = $component.componentSocrataVisualizationRegionMap(getProps({
        editMode: true
      }));
    });

    afterEach(function() {
      socrataSvgRegionMapStub.restore();
      componentWithMapBoundsStub.restore();
    });

    it('invokes componentWithMapBounds', function() {
      sinon.assert.called(componentWithMapBoundsStub);
    });
  });
});
