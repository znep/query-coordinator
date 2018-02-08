import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { $transient } from '../TransientElement';
import 'editor/block-component-renderers/componentSocrataVisualizationMap';

describe('componentSocrataVisualizationMap jQuery plugin', () => {

  let $component;
  const validComponentData = {
    type: 'socrata.visualization.map',
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
        type: 'map'
      }
    }
  };

  let getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: validComponentData,
      componentIndex: null,
      theme: null
    }, props);
  };

  beforeEach(() => {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', () => {
    assert.throws(() => { $component.componentSocrataVisualizationMap(); });
    assert.throws(() => { $component.componentSocrataVisualizationMap(1); });
    assert.throws(() => { $component.componentSocrataVisualizationMap(null); });
    assert.throws(() => { $component.componentSocrataVisualizationMap(undefined); });
    assert.throws(() => { $component.componentSocrataVisualizationMap({}); });
    assert.throws(() => { $component.componentSocrataVisualizationMap([]); });
  });

  describe('given a type that is not supported', () => {
    it('should throw when instantiated', () => {
      let badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notMap';
      assert.throws(() => {
        $component.componentSocrataVisualizationMap(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('given a valid component type and value', () => {
    let socrataUnifiedMapStub;

    beforeEach(() => {
      socrataUnifiedMapStub = sinon.stub($.fn, 'socrataUnifiedMap');
      $component = $component.componentSocrataVisualizationMap(getProps());
    });

    afterEach(() => {
      socrataUnifiedMapStub.restore();
    });

    it('should return a jQuery object for chaining', () => {
      assert.instanceOf($component, $);
    });

    it('should call into socrataUnifiedMap with the correct arguments', () => {
      sinon.assert.calledWithExactly(
        socrataUnifiedMapStub,
        validComponentData.value.vif,
        sinon.match.any
        );
    });

    describe('when updating', () => {
      it('should call into socrataUnifiedMap with the correct arguments if changed', () => {
        socrataUnifiedMapStub.reset();

        let changedData = _.cloneDeep(validComponentData);
        _.set(changedData, 'value.vif.columnName', 'test2');
        $component.componentSocrataVisualizationMap(getProps({ componentData: changedData }));

        sinon.assert.calledWithExactly(
          socrataUnifiedMapStub,
          changedData.value.vif,
          sinon.match.any
          );
      });

      it('should do nothing if unchanged', () => {
        socrataUnifiedMapStub.reset();

        $component.componentSocrataVisualizationMap(getProps());

        sinon.assert.notCalled(socrataUnifiedMapStub);
      });
    });
  });

  describe('when in edit mode', () => {
    let socrataUnifiedMapStub;
    let componentWithMapBoundsStub;

    beforeEach(() => {
      socrataUnifiedMapStub = sinon.stub($.fn, 'socrataUnifiedMap');
      componentWithMapBoundsStub = sinon.stub($.fn, 'componentWithMapBounds');

      $component = $component.componentSocrataVisualizationMap(getProps({
        editMode: true
      }));
    });

    afterEach(() => {
      socrataUnifiedMapStub.restore();
      componentWithMapBoundsStub.restore();
    });

    it('invokes componentWithMapBounds', () => {
      sinon.assert.called(componentWithMapBoundsStub);
    });
  });
});
