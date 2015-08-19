describe('storytellerComponentLayout jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.storytellerComponentLayout(); });
    assert.throws(function() { $component.storytellerComponentLayout(1); });
    assert.throws(function() { $component.storytellerComponentLayout(null); });
    assert.throws(function() { $component.storytellerComponentLayout(undefined); });
    assert.throws(function() { $component.storytellerComponentLayout({}); });
    assert.throws(function() { $component.storytellerComponentLayout([]); });
  });

  describe('given a value that is not supported', function () {
    it('should throw when instantiated', function () {
      assert.throws(function() { $component.storytellerComponentLayout({type: 'layout', value: 'notspacer'}); });
    });
  });

  describe('given a valid component type and value', function() {
    var componentData = {type: 'layout', value: 'spacer'};

    beforeEach(function() {
      $component = $component.storytellerComponentLayout(componentData);
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });
  });

  describe('given a horizontal rule component', function () {
    var componentData = {type: 'layout', value: 'horizontalRule'};

    beforeEach(function() {
      $component = $component.storytellerComponentLayout(componentData);
    });

    it('should render an <hr> DOM element', function () {
      assert.lengthOf($component.find('hr'), 1);
    });
  });

  describe('given a spacer component', function () {
    var componentData = {type: 'layout', value: 'spacer'};

    beforeEach(function() {
      $component = $component.storytellerComponentLayout(componentData);
    });

    it('should render a <div class="spacer"> DOM element', function () {
      assert.lengthOf($component.find('div.spacer'), 1);
    });
  });
});
