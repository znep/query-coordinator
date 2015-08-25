describe('componentHorizontalRule jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentHorizontalRule(); });
    assert.throws(function() { $component.componentHorizontalRule(1); });
    assert.throws(function() { $component.componentHorizontalRule(null); });
    assert.throws(function() { $component.componentHorizontalRule(undefined); });
    assert.throws(function() { $component.componentHorizontalRule({}); });
    assert.throws(function() { $component.componentHorizontalRule([]); });
  });

  describe('given a type that is not supported', function () {
    it('should throw when instantiated', function () {
      assert.throws(function() { $component.componentHorizontalRule({type: 'notHorizontalRule'}); });
    });
  });

  describe('given a valid component type', function() {
    var componentData = {type: 'horizontalRule'};

    beforeEach(function() {
      $component = $component.componentHorizontalRule(componentData);
    });

    it('should return a jQuery object containing an <hr> for chaining', function() {
      assert.instanceOf($component, $);
      assert.lengthOf($component.find('hr'), 1);
    });

  });
});
