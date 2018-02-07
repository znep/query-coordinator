import _ from 'lodash';
import $ from 'jquery';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import 'editor/block-component-renderers/componentHorizontalRule';

describe('componentHorizontalRule jQuery plugin', function() {

  var $component;
  var getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: { type: 'horizontalRule' },
      componentIndex: null,
      theme: null
    }, props);
  };

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentHorizontalRule(); });
    assert.throws(function() { $component.componentHorizontalRule(1); });
    assert.throws(function() { $component.componentHorizontalRule(null); });
    assert.throws(function() { $component.componentHorizontalRule(undefined); });
    assert.throws(function() { $component.componentHorizontalRule({}); });
    assert.throws(function() { $component.componentHorizontalRule([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      assert.throws(function() {
        $component.componentHorizontalRule(getProps({
          componentData: { type: 'notHorizontalRule' }
        }));
      });
    });
  });

  describe('given a valid component type', function() {
    beforeEach(function() {
      $component = $component.componentHorizontalRule(getProps());
    });

    it('should return a jQuery object containing an <hr> for chaining', function() {
      assert.instanceOf($component, $);
      assert.lengthOf($component.find('hr'), 1);
    });

  });
});
