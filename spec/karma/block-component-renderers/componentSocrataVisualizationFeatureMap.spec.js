import $ from 'jQuery';
import _ from 'lodash';

import '../../../app/assets/javascripts/editor/block-component-renderers/componentSocrataVisualizationFeatureMap';

describe('componentSocrataVisualizationFeatureMap jQuery plugin', function() {

  var testDom;
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
    testDom = $('<div>');
    testDom.append('<div>');
    $component = testDom.children('div');
    $(document.body).append(testDom);
  });

  afterEach(function() {
    testDom.remove();
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
