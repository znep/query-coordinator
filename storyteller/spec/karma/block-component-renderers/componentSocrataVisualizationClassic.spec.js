import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { $transient } from '../TransientElement';
import socrataVisualizationClassicComponentData from '../fixtures/socrataVisualizationClassicComponentData';
import 'editor/block-component-renderers/componentSocrataVisualizationClassic';

describe('componentSocrataVisualizationClassic jQuery plugin', function() {

  var $component;
  var validComponentData = _.cloneDeep(socrataVisualizationClassicComponentData);

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
        $component.componentSocrataVisualizationClassic(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('when component data contains `federatedFromDomain`', () => {
    beforeEach(() => {
      const componentData = _.merge(_.cloneDeep(validComponentData), {
        value: {
          dataset: {
            federatedFromDomain: 'example.com'
          }
        }
      });
      $component = $component.componentSocrataVisualizationClassic(getProps({ componentData }));
    });

    it('renders source data link with federatedFromDomain', () => {
      const $sourceDataLink = $component.find('.socrata-visualization-view-source-data a');
      assert.match(
        $sourceDataLink.find('span:nth-child(1)').text(),
        /View Source Data/
      );
      assert.equal(
        $sourceDataLink.attr('href'),
        `https://example.com/d/${validComponentData.value.visualization.id}`
      );
    });

  });

  describe('given a valid component type and value', function() {

    beforeEach(function() {
      $component = $component.componentSocrataVisualizationClassic(getProps());
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
        assert.deepEqual(viewObject, validComponentData.value.visualization);
        done();
      };
    });

    it('renders source data link', () => {
      const $sourceDataLink = $component.find('.socrata-visualization-view-source-data a');
      assert.match(
        $sourceDataLink.find('span:nth-child(1)').text(),
        /View Source Data/
      );
      assert.equal(
        $sourceDataLink.attr('href'),
        `https://${window.location.hostname}/d/${validComponentData.value.visualization.id}`
      );
    });

    it('should render a classic visualization once if the visualization doesn\'t change', function() {
      var iframe = $component.find('iframe');
      iframe[0].contentWindow.renderVisualization = sinon.spy();

      // Try to force another render with the same data.
      $component.componentSocrataVisualizationClassic(getProps());
      $component.componentSocrataVisualizationClassic(getProps());

      assert(iframe[0].contentWindow.renderVisualization.calledOnce);
    });
  });
});
