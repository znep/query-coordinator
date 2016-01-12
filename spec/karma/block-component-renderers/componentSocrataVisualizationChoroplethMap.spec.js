describe('componentSocrataVisualizationChoroplethMap jQuery plugin', function() {

  'use strict';

  var $component;

  var validComponentData = {
    type: 'socrata.visualization.choroplethMap',
    value: {
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
    assert.throws(function() { $component.componentSocrataVisualizationChoroplethMap(); });
    assert.throws(function() { $component.componentSocrataVisualizationChoroplethMap(1); });
    assert.throws(function() { $component.componentSocrataVisualizationChoroplethMap(null); });
    assert.throws(function() { $component.componentSocrataVisualizationChoroplethMap(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationChoroplethMap({}); });
    assert.throws(function() { $component.componentSocrataVisualizationChoroplethMap([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notChoroplethMap';
      assert.throws(function() {
        $component.componentSocrataVisualizationChoroplethMap(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataChoroplethMapStub;

    beforeEach(function() {
      socrataChoroplethMapStub = sinon.stub($.fn, 'socrataChoroplethMap', function() { return this; });
      $component = $component.componentSocrataVisualizationChoroplethMap(validComponentData);
    });

    afterEach(function() {
      socrataChoroplethMapStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataChoroplethMap with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataChoroplethMapStub,
        validComponentData.value.vif
      );
    });
  });
});
