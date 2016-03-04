import $ from 'jQuery';
import '../../../app/assets/javascripts/editor/block-component-renderers/componentHorizontalRule';

describe('componentHorizontalRule jQuery plugin', function() {

  var testDom;
  var $component;

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
    assert.throws(function() { $component.componentHorizontalRule(); });
    assert.throws(function() { $component.componentHorizontalRule(1); });
    assert.throws(function() { $component.componentHorizontalRule(null); });
    assert.throws(function() { $component.componentHorizontalRule(undefined); });
    assert.throws(function() { $component.componentHorizontalRule({}); });
    assert.throws(function() { $component.componentHorizontalRule([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
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
