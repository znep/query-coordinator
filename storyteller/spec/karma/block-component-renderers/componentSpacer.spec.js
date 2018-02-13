import $ from 'jquery';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import 'editor/block-component-renderers/componentSpacer';

describe('componentSpacer jQuery plugin', function() {

  var $component;
  var validComponentData = { type: 'spacer' };

  var getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: validComponentData,
      componentIndex: null,
      theme: null
    }, props);
  };

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentSpacer(); });
    assert.throws(function() { $component.componentSpacer(1); });
    assert.throws(function() { $component.componentSpacer(null); });
    assert.throws(function() { $component.componentSpacer(undefined); });
    assert.throws(function() { $component.componentSpacer({}); });
    assert.throws(function() { $component.componentSpacer([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      assert.throws(function() {
        $component.componentSpacer(getProps({
          componentData: { type: 'notSpacer' }
        }));
      });
    });
  });

  describe('given a valid component type', function() {
    beforeEach(function() {
      $component = $component.componentSpacer(getProps());
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should render a <div class="component-spacer"> DOM element', function() {
      assert.lengthOf($component.find('div.component-spacer'), 1);
    });
  });
});
