import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { $transient } from '../TransientElement';
import StandardMocks from '../StandardMocks';
import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import StorytellerUtils from 'StorytellerUtils';
import {__RewireAPI__ as componentSocrataVisualizationTableAPI} from 'editor/block-component-renderers/componentSocrataVisualizationTable';

describe('componentSocrataVisualizationTable jQuery plugin', function() {

  var $component;
  var validComponentData = {
    type: 'socrata.visualization.table',
    value: {
      layout: {
        height: 300
      },
      vif: {
        configuration: {
          order: [
            {
              columnName: 'something',
              ascending: false
            }
          ]
        },
        series: [
          {
            dataSource: {
              datasetUid: 'fake-fake',
              domain: 'example.com'
            },
            type: 'table'
          }
        ],
        format: {
          type: 'visualization_interchange_format',
          version: 2
        }
      }
    }
  };

  var getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: validComponentData,
      componentIndex: null,
      editMode: true,
      theme: null
    }, props);
  };

  beforeEach(function() {
    $transient.append(
      StorytellerUtils.format(
        '<div data-block-id="{0}" data-component-index="0">',
        StandardMocks.validBlockId
      )
    );
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentSocrataVisualizationTable(); });
    assert.throws(function() { $component.componentSocrataVisualizationTable(1); });
    assert.throws(function() { $component.componentSocrataVisualizationTable(null); });
    assert.throws(function() { $component.componentSocrataVisualizationTable(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationTable({}); });
    assert.throws(function() { $component.componentSocrataVisualizationTable([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notTable';
      assert.throws(function() {
        $component.componentSocrataVisualizationTable(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataTableStub;

    beforeEach(function() {
      socrataTableStub = sinon.stub($.fn, 'socrataTable');
      $component = $component.componentSocrataVisualizationTable(getProps());
    });

    afterEach(function() {
      socrataTableStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataTable with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataTableStub,
        validComponentData.value.vif
      );
    });

    describe('when the VIF changes', function() {

      describe('in properties other than vif.configuration', function() {

        it('should not reinstantiate the table', function() {

          var newData = _.cloneDeep(validComponentData);
          _.set(newData, 'value.vif.series[0].dataSource.datasetUid', 'diff-ernt');

          assert.equal(socrataTableStub.callCount, 1);

          $component.componentSocrataVisualizationTable(getProps({
            componentData: newData
          }));

          assert.equal(socrataTableStub.callCount, 1);
        });
      });

      describe('but vif.configuration does not', function() {

        it('should not reinstantiate the table', function() {
          var newData = _.cloneDeep(validComponentData);
          _.set(newData, 'value.vif.series[0].configuration.order', [ { columnName: 'something', ascending: true } ]);

          assert.equal(socrataTableStub.callCount, 1);
          $component.componentSocrataVisualizationTable(getProps({
            componentData: newData
          }));
          assert.equal(socrataTableStub.callCount, 1);
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_VIF_UPDATED', function() {
      var dispatcher;

      beforeEach(function() {
        dispatcher = new Dispatcher();

        componentSocrataVisualizationTableAPI.__Rewire__('dispatcher', dispatcher);
        componentSocrataVisualizationTableAPI.__Rewire__('storyStore', {
          getBlockComponentAtIndex: function() {
            return {value: {layout: {height: 100}}};
          }
        });
      });

      afterEach(function() {
        componentSocrataVisualizationTableAPI.__ResetDependency__('dispatcher');
        componentSocrataVisualizationTableAPI.__ResetDependency__('storyStore');
      });

      it('should dispatch BLOCK_UPDATE_COMPONENT', function(done) {
        var newVif = { foo: 'bar' };

        dispatcher.register(function(payload) {
          if (payload.action === Actions.BLOCK_UPDATE_COMPONENT) {
            assert.equal(payload.blockId, StandardMocks.validBlockId);
            assert.equal(payload.componentIndex, 0);
            assert.equal(payload.value.layout.height, 100);
            assert.equal(payload.type, 'socrata.visualization.table');
            assert.deepEqual(payload.value.vif, newVif);
            done();
          }
        });

        $component[0].dispatchEvent(
          new window.CustomEvent(
            'SOCRATA_VISUALIZATION_VIF_UPDATED',
            { detail: newVif, bubbles: true }
          )
        );
      });
    });
  });
});
