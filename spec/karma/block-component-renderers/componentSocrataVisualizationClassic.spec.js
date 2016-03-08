import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
import socrataVisualizationClassicComponentData from '../fixtures/socrataVisualizationClassicComponentData';
import '../../../app/assets/javascripts/editor/block-component-renderers/componentSocrataVisualizationClassic';

describe('componentSocrataVisualizationClassic jQuery plugin', function() {

  var $component;
  var validComponentData;

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
    validComponentData = _.cloneDeep(socrataVisualizationClassicComponentData);
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentSocrataVisualizationClassic(); });
    assert.throws(function() { $component.componentSocrataVisualizationClassic(1); });
    assert.throws(function() { $component.componentSocrataVisualizationClassic(null); });
    assert.throws(function() { $component.componentSocrataVisualizationClassic(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationClassic({}); });
    assert.throws(function() { $component.componentSocrataVisualizationClassic([]); });
  });

  describe('given a value that does not contain a visualization', function() {
    it('should throw when updating the visualization', function() {
      var badData = _.cloneDeep(validComponentData);
      delete badData.value.visualization;

      assert.throws(function() {
        $component.componentSocrataVisualizationClassic(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.componentSocrataVisualizationClassic(validComponentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    describe('iframe src attribute', function() {
      it('should start off correct', function() {
        assert.equal(
          $component.find('iframe').attr('src'),
          '/component/visualization/v0/show'
        );
      });
    });

    it('should render a classic visualization', function(done) {
      var iframe = $component.find('iframe');

      iframe[0].contentWindow.renderVisualization = function(viewObject) {
        assert.equal(viewObject, validComponentData.value.visualization);
        done();
      };
    });

    it('should render a classic visualization once if the visualization doesn\'t change', function() {
      var iframe = $component.find('iframe');
      iframe[0].contentWindow.renderVisualization = sinon.spy();

      // Try to force another render with the same data.
      $component.componentSocrataVisualizationClassic(validComponentData);
      $component.componentSocrataVisualizationClassic(validComponentData);

      assert(iframe[0].contentWindow.renderVisualization.calledOnce);
    });
  });
});
