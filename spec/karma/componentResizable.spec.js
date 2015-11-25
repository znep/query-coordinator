describe('componentResizable jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;
  var componentData;
  var bindHandlesStub;

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
    bindHandlesStub = sinon.spy(Unidragger.prototype, 'bindHandles');
  });

  afterEach(function() {
    bindHandlesStub.restore();
  });

  it('should return a jQuery object for chaining', function() {
    assert.instanceOf(
      $component.componentResizable(),
      $,
      'Returned value is not a jQuery collection');
  });

  it('should add a resize handle', function() {
    $component.componentResizable();
    $component.componentResizable(); // Intentional, verifying handle added just once.
    assert.lengthOf($component.find('.component-resize-handle'), 1);
  });

  it('on multiple calls should only bind handles once', function() {
    var $handle;
    $component.componentResizable();
    $component.componentResizable();

    sinon.assert.calledOnce(bindHandlesStub);
  });
});
