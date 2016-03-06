import $ from 'jQuery';
import _ from 'lodash';

import '../../app/assets/javascripts/editor/withLayoutHeightFromComponentData';

describe('withLayoutHeightFromComponentData jQuery plugin', function() {

  var testDom;
  var $component;

  beforeEach(function() {
    testDom = $('<div>');
    testDom.append('<div><div class="component-content"></div><div class="not-component-content"></div></div>');
    $component = testDom.children('div');
    $(document.body).append(testDom);
  });

  afterEach(function() {
    testDom.remove();
  });

  it('should return a jQuery object for chaining', function() {
    assert.instanceOf(
      $component.withLayoutHeightFromComponentData(),
      $,
      'Returned value is not a jQuery collection');
  });

  describe('when called with a height that sometimes changes', function() {
    var heightFunctionSpy;
    var invalidateSizeStubOnComponentContent;
    var invalidateSizeStubOnNotComponentContent;
    beforeEach(function() {
      var $componentContent = $component.find('.component-content');
      var $notComponentContent = $component.find('.not-component-content');
      assert.lengthOf($componentContent, 1);
      assert.lengthOf($notComponentContent, 1);

      heightFunctionSpy = sinon.spy($component, 'height');
      invalidateSizeStubOnComponentContent = sinon.stub();
      invalidateSizeStubOnNotComponentContent = sinon.stub();

      $componentContent.on('invalidateSize', invalidateSizeStubOnComponentContent);
      $notComponentContent.on('invalidateSize', invalidateSizeStubOnNotComponentContent);

      $component.withLayoutHeightFromComponentData({ value: { layout: { height: 100 } } });
      $component.withLayoutHeightFromComponentData({ value: { layout: { height: 100 } } });
      $component.withLayoutHeightFromComponentData({ value: { layout: { height: 100 } } });

      $component.withLayoutHeightFromComponentData({ value: { layout: { height: 200 } } });

      $component.withLayoutHeightFromComponentData({ value: { layout: { height: 100 } } });
    });

    it('should call self.height() with correct args only if the height changed', function() {
      assert.deepEqual(
        _.pluck(heightFunctionSpy.getCalls(), 'args'),
        [[100], [200], [100]]
      );
    });

    it('should trigger `invalidateSize` on children with class component-content', function() {

      sinon.assert.notCalled(invalidateSizeStubOnNotComponentContent);
      sinon.assert.calledThrice(invalidateSizeStubOnComponentContent);
    });
  });

  describe('when called with no height', function() {
    var heightFunctionSpy;
    var invalidateSizeStubOnComponentContent;
    var invalidateSizeStubOnNotComponentContent;
    var defaultHeight = 1234;
    beforeEach(function() {
      var $componentContent = $component.find('.component-content');
      var $notComponentContent = $component.find('.not-component-content');
      assert.lengthOf($componentContent, 1);
      assert.lengthOf($notComponentContent, 1);

      heightFunctionSpy = sinon.spy($component, 'height');
      invalidateSizeStubOnComponentContent = sinon.stub();
      invalidateSizeStubOnNotComponentContent = sinon.stub();

      $componentContent.on('invalidateSize', invalidateSizeStubOnComponentContent);
      $notComponentContent.on('invalidateSize', invalidateSizeStubOnNotComponentContent);

      $component.withLayoutHeightFromComponentData({ value: {} }, defaultHeight);
      $component.withLayoutHeightFromComponentData({ value: { layout: { height: 123 } } }, defaultHeight);
    });

    it('should call self.height() with correct args only if the height changed', function() {
      assert.deepEqual(
        _.pluck(heightFunctionSpy.getCalls(), 'args'),
        [ [defaultHeight], [123] ]
      );
    });
  });
});
