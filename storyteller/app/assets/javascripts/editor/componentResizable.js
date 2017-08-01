import $ from 'jquery';
import _ from 'lodash';
import Unidragger from 'unidragger';

import Actions from './Actions';
import StorytellerUtils from '../StorytellerUtils';
import { assert, assertIsOneOfTypes } from 'common/js_utils';
import { dispatcher } from './Dispatcher';
import { storyStore } from './stores/StoryStore';

var RESIZABLE_CLASS_NAME = 'component-resizable';
var MIN_HEIGHT_DATA_ATTR_NAME = 'data-resizable-min-height';

/**
 * Makes the current component resizable, will append a resize handle.
 *
 * On resize, the component's `layout.height` property will be set
 * via Actions.BLOCK_UPDATE_COMPONENT.
 *
 * The block ID and component index are determined by looking for
 * `data-block-id` and `data-component-index` attributes walking up
 * the DOM tree.
 *
 * @param {object} options - Configuration. Optional. Keys:
 *   minHeight: {Number} - Minimum allowed height. Default: 1
 */
$.fn.componentResizable = componentResizable;

export default function componentResizable(options) {
  var $this = $(this);
  var resizer;
  var $resizeHandle;
  options = _.extend({ minHeight: 1 }, options);

  assertIsOneOfTypes(options.minHeight, 'number');

  if (!$this.hasClass(RESIZABLE_CLASS_NAME)) {
    $this.append('<div class="component-resize-handle"><div></div></div>');
    $resizeHandle = $this.find('.component-resize-handle');
    $this.addClass(RESIZABLE_CLASS_NAME);

    resizer = new DragResizer($this, $resizeHandle);
    resizer.bindHandles();

    $this.one('destroy', function() {
      $resizeHandle.remove();
    });
  }

  $this.attr(MIN_HEIGHT_DATA_ATTR_NAME, options.minHeight);

  return $this;
}

export function DragResizer($elementToResize, $resizeHandle) {
  var self = this;
  self.handles = $resizeHandle; // Unidragger's bindHandles reads this.

  self.dragStart = function() {
    $elementToResize.closest('.block-edit').add(document.body).addClass('is-resizing');
    self.heightAtDragStart = $elementToResize.outerHeight();
    self.minHeight = parseInt($elementToResize.attr(MIN_HEIGHT_DATA_ATTR_NAME), 10);
  };

  self.dragMove = function(event, pointer, moveVector) {
    var component;
    var newHeight = Math.max(
      self.minHeight,
      self.heightAtDragStart + moveVector.y
    );

    var blockId = StorytellerUtils.findClosestAttribute($elementToResize, 'data-block-id');
    var componentIndex = StorytellerUtils.findClosestAttribute($elementToResize, 'data-component-index');

    assert(
      !_.isEmpty(blockId),
      'data-block-id attribute must be set on self or a parent'
    );
    assert(
      !_.isEmpty(componentIndex),
      'data-component-index attribute must be set on self or a parent'
    );

    component = storyStore.getBlockComponentAtIndex(blockId, componentIndex);

    _.set(component, 'value.layout.height', newHeight);
    dispatcher.dispatch({
      action: Actions.BLOCK_UPDATE_COMPONENT,
      blockId: blockId,
      componentIndex: componentIndex,
      type: component.type,
      value: component.value
    });
  };

  self.dragEnd = function() {
    $elementToResize.closest('.block-edit').add(document.body).removeClass('is-resizing');
  };
}

DragResizer.prototype = Unidragger.prototype;
