describe('componentSocrataVisualizationTable jQuery plugin', function() {

  'use strict';

  var $component;

  var validComponentData = {
    type: 'socrata.visualization.table',
    value: {
      layout: {
        height: 300
      },
      vif: {
        configuration: {}
      }
    }
  };

  beforeEach(function() {
    testDom.append('<div>');
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
      $component = $component.componentSocrataVisualizationTable(validComponentData);
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
  });
});
