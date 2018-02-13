import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { $transient } from '../TransientElement';
import 'editor/block-component-renderers/componentSocrataVisualizationFeatureMap';
import { updateFeatureMapVifWithDefaults, updateVifWithDefaults, updateVifWithFederatedFromDomain } from 'VifUtils';

describe('componentSocrataVisualizationFeatureMap jQuery plugin', function() {

  var $component;
  var validComponentData = {
    type: 'socrata.visualization.featureMap',
    value: {
      layout: {
        height: 300
      },
      vif: {
        columnName: 'test',
        configuration: {},
        datasetUid: 'test-test',
        domain: 'example.com',
        filters: []
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
    assert.throws(function() { $component.componentSocrataVisualizationFeatureMap(); });
    assert.throws(function() { $component.componentSocrataVisualizationFeatureMap(1); });
    assert.throws(function() { $component.componentSocrataVisualizationFeatureMap(null); });
    assert.throws(function() { $component.componentSocrataVisualizationFeatureMap(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationFeatureMap({}); });
    assert.throws(function() { $component.componentSocrataVisualizationFeatureMap([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notFeatureMap';
      assert.throws(function() {
        $component.componentSocrataVisualizationFeatureMap(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('when component data contains `federatedFromDomain`', function() {
    var socrataSvgFeatureMapStub;

    beforeEach(function() {
      socrataSvgFeatureMapStub = sinon.stub($.fn, 'socrataSvgFeatureMap');

      const componentData = _.merge(_.cloneDeep(validComponentData), {
        value: {
          dataset: {
            federatedFromDomain: 'example.com'
          }
        }
      });
      $component = $component.componentSocrataVisualizationFeatureMap(getProps({ componentData }));
    });

    afterEach(function() {
      socrataSvgFeatureMapStub.restore();
    });

    it('should call into socrataSvgFeatureMap with the correct arguments', function() {
      const expectedVif = updateVifWithDefaults(updateVifWithFederatedFromDomain(_.cloneDeep(validComponentData).value.vif, 'example.com'));
      sinon.assert.calledWithExactly(
        socrataSvgFeatureMapStub,
        expectedVif,
        sinon.match.any
      );
    });
  });

  describe('given a valid component type and value', function() {
    var socrataSvgFeatureMapStub;

    beforeEach(function() {
      socrataSvgFeatureMapStub = sinon.stub($.fn, 'socrataSvgFeatureMap');
      $component = $component.componentSocrataVisualizationFeatureMap(getProps());
    });

    afterEach(function() {
      socrataSvgFeatureMapStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataSvgFeatureMap with the correct arguments', function() {
      const expectedVif = updateFeatureMapVifWithDefaults(updateVifWithDefaults(validComponentData.value.vif));
      sinon.assert.calledWithExactly(
        socrataSvgFeatureMapStub,
        expectedVif,
        sinon.match.any
      );
    });

    describe('when updating', function() {
      it('should call into socrataSvgFeatureMap with the correct arguments if changed', function() {
        socrataSvgFeatureMapStub.reset();

        var changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationFeatureMap(getProps({ componentData: changedData }));

        const expectedVif = updateFeatureMapVifWithDefaults(updateVifWithDefaults(changedData.value.vif));
        sinon.assert.calledWithExactly(
          socrataSvgFeatureMapStub,
          expectedVif,
          sinon.match.any
        );
      });

      it('should do nothing if unchanged', function() {
        socrataSvgFeatureMapStub.reset();

        $component.componentSocrataVisualizationFeatureMap(getProps());

        sinon.assert.notCalled(socrataSvgFeatureMapStub);
      });
    });
  });

  describe('when in edit mode', function() {
    let socrataSvgFeatureMapStub;
    let componentWithMapBoundsStub;

    beforeEach(function() {
      socrataSvgFeatureMapStub = sinon.stub($.fn, 'socrataSvgFeatureMap');
      componentWithMapBoundsStub = sinon.stub($.fn, 'componentWithMapBounds');

      $component = $component.componentSocrataVisualizationFeatureMap(getProps({
        editMode: true
      }));
    });

    afterEach(function() {
      socrataSvgFeatureMapStub.restore();
      componentWithMapBoundsStub.restore();
    });

    it('invokes componentWithMapBounds', function() {
      sinon.assert.called(componentWithMapBoundsStub);
    });
  });
});
