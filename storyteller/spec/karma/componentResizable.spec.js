import $ from 'jquery';
import Unidragger from 'unidragger';
import sinon from 'sinon';
import { assert } from 'chai';

import { $transient } from './TransientElement';
import {__RewireAPI__ as componentResizableAPI} from '../../app/assets/javascripts/editor/componentResizable';

describe('componentResizable jQuery plugin', function() {

  var $component;
  var bindHandlesStub;

  beforeEach(function() {
    bindHandlesStub = sinon.spy(Unidragger.prototype, 'bindHandles');

    $transient.append('<div>');
    $component = $transient.children('div');

    componentResizableAPI.__Rewire__('Unidragger', Unidragger);
  });

  afterEach(function() {
    bindHandlesStub.restore();
    componentResizableAPI.__ResetDependency__('Unidragger');
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
    $component.componentResizable();
    $component.componentResizable();

    sinon.assert.calledOnce(bindHandlesStub);
  });
});
