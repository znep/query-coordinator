describe('componentSocrataVisualizationFeatureMap jQuery plugin', function() {

  'use strict';

  var $component;

  var validComponentData = {
    type: 'socrata.visualization.featureMap',
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
        $component.componentSocrataVisualizationFeatureMap(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataFeatureMapStub;

    beforeEach(function() {
      socrataFeatureMapStub = sinon.stub($.fn, 'socrataFeatureMap');
      $component = $component.componentSocrataVisualizationFeatureMap(validComponentData);
    });

    afterEach(function() {
      socrataFeatureMapStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataFeatureMap with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataFeatureMapStub,
        validComponentData.value.vif
      );
    });
  });
});
