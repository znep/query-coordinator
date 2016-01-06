describe('componentSpacer jQuery plugin', function() {
  'use strict';

  var $component;

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
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
      assert.throws(function() { $component.componentSpacer({type: 'notSpacer'}); });
    });
  });

  describe('given a valid component type', function() {
    var componentData = {type: 'spacer'};

    beforeEach(function() {
      $component = $component.componentSpacer(componentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should render a <div class="component-spacer"> DOM element', function() {
      assert.lengthOf($component.find('div.component-spacer'), 1);
    });
  });
});
