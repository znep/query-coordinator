import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import Actions from 'editor/Actions';
import StorytellerUtils from 'StorytellerUtils';
import 'editor/block-component-renderers/componentAssetSelector';

describe('componentAssetSelector jQuery plugin', function() {

  let $component;

  const getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: { type: 'assetSelector' },
      componentIndex: null,
      theme: null
    }, props);
  };

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentAssetSelector(); });
    assert.throws(function() { $component.componentAssetSelector(1); });
    assert.throws(function() { $component.componentAssetSelector(null); });
    assert.throws(function() { $component.componentAssetSelector(undefined); });
    assert.throws(function() { $component.componentAssetSelector({}); });
    assert.throws(function() { $component.componentAssetSelector([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      assert.throws(function() {
        $component.componentAssetSelector(getProps({
          componentData: { type: 'notAssetSelector' }
        }));
      });
    });
  });

  describe('given a valid component type', function() {
    beforeEach(function() {
      $component = $component.componentAssetSelector(getProps());
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should render a media selector', function() {
      assert.isTrue(
        $component.is('.component-asset-selector')
      );
    });

    it('adds the correct data-action attribute to the component', function() {
      assert.equal(
        $component.attr('data-action'),
        Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
        StorytellerUtils.format(
          'Asset Selector component should have the attribute data-action={0}',
          Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT
        )
      );
    });
  });
});
