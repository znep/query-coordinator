import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import { $transient } from './TransientElement';
import '../../app/assets/javascripts/editor/withLayoutHeightFromComponentData';

describe('withLayoutHeightFromComponentData jQuery plugin', function() {

  var $component;

  beforeEach(function() {
    $transient.append('<div><div class="component-content"></div><div class="not-component-content"></div></div>');
    $component = $transient.children('div');
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

      heightFunctionSpy = sinon.spy($component, 'outerHeight');
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

    it('should call self.outerHeight() with correct args only if the height changed', function() {
      assert.deepEqual(
        _.map(heightFunctionSpy.getCalls(), 'args'),
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

      heightFunctionSpy = sinon.spy($component, 'outerHeight');
      invalidateSizeStubOnComponentContent = sinon.stub();
      invalidateSizeStubOnNotComponentContent = sinon.stub();

      $componentContent.on('invalidateSize', invalidateSizeStubOnComponentContent);
      $notComponentContent.on('invalidateSize', invalidateSizeStubOnNotComponentContent);

      $component.withLayoutHeightFromComponentData({ value: {} }, defaultHeight);
      $component.withLayoutHeightFromComponentData({ value: { layout: { height: 123 } } }, defaultHeight);
    });

    it('should call self.height() with correct args only if the height changed', function() {
      assert.deepEqual(
        _.map(heightFunctionSpy.getCalls(), 'args'),
        [ [defaultHeight], [123] ]
      );
    });
  });
});
