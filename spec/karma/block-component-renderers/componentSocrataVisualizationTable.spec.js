describe('componentSocrataVisualizationTable jQuery plugin', function() {

  'use strict';

  var storyteller = window.socrata.storyteller;

  var $component;

  var validComponentData = {
    type: 'socrata.visualization.table',
    value: {
      layout: {
        height: 300
      },
      vif: {
        type: 'table',
        dataset: 'fake-fake',
        configuration: {}
      }
    }
  };

  beforeEach(function() {
    testDom.append('<div data-block-id="{0}" data-component-index="0">'.format(standardMocks.validBlockId));
    $component = testDom.children('div');
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
        $component.componentSocrataVisualizationTable(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataTableStub;

    beforeEach(function() {
      socrataTableStub = sinon.stub($.fn, 'socrataTable');
      $component = $component.componentSocrataVisualizationTable(validComponentData, {}, { editMode: true });
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
        it('should reinstantiate the table', function() {
          var newData = _.cloneDeep(validComponentData);
          _.set(newData, 'value.vif.dataset', 'diff-ernt');

          assert.equal(socrataTableStub.callCount, 1);
          $component.componentSocrataVisualizationTable(newData, {}, { editMode: true });
          assert.equal(socrataTableStub.callCount, 2);
        });
      });

      describe('but vif.configuration does not', function() {
        it('should not reinstantiate the table', function() {
          var newData = _.cloneDeep(validComponentData);
          _.set(newData, 'configuration.order', [ { fieldName: 'something', ascending: true } ]);

          assert.equal(socrataTableStub.callCount, 1);
          $component.componentSocrataVisualizationTable(newData, {}, { editMode: true });
          assert.equal(socrataTableStub.callCount, 1);
        });
      });
    });

    describe('on SOCRATA_VISUALIZATION_VIF_UPDATED', function() {
      beforeEach(function() {
        sinon.stub(storyteller.storyStore, 'getBlockComponentAtIndex', function() {
          return {value: {layout: {height: 100}}}
        });
      });

      afterEach(function() {
        storyteller.storyStore.getBlockComponentAtIndex.restore();
      });

      it('should dispatch BLOCK_UPDATE_COMPONENT', function(done) {
        var newVif = { foo: 'bar' };

        storyteller.dispatcher.register(function(payload) {
          if (payload.action === Actions.BLOCK_UPDATE_COMPONENT) {
            assert.equal(payload.blockId, standardMocks.validBlockId);
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
