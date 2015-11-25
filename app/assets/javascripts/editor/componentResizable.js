(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;
  var storyteller = socrata.storyteller;

  var RESIZABLE_CLASS_NAME = 'component-resizable';
  var MIN_HEIGHT_DATA_ATTR_NAME = 'data-resizable-min-height';

  function DragResizer($elementToResize, $resizeHandle) {
    var self = this;
    this.handles = $resizeHandle;

    this.dragStart = function() {
      $elementToResize.closest('.block-edit').add(document.body).addClass('is-resizing');
      self.heightAtDragStart = $elementToResize.height();
      self.minHeight = parseInt($elementToResize.attr(MIN_HEIGHT_DATA_ATTR_NAME), 10);
    };

    this.dragMove = function(event, pointer, moveVector) {
      var component;
      var newHeight = Math.max(
        self.minHeight,
        self.heightAtDragStart + moveVector.y
      );

      var blockId = utils.findClosestAttribute($elementToResize, 'data-block-id');
      var componentIndex = utils.findClosestAttribute($elementToResize, 'data-component-index');

      utils.assert(!_.isEmpty(blockId),
        'data-block-id attribute must be set on self or a parent');
      utils.assert(!_.isEmpty(componentIndex),
        'data-component-index attribute must be set on self or a parent');

      component = storyteller.storyStore.getBlockComponentAtIndex(blockId, componentIndex);

      _.set(component, 'value.layout.height', newHeight);
      storyteller.dispatcher.dispatch({
        action: Actions.BLOCK_UPDATE_COMPONENT,
        blockId: blockId,
        componentIndex: componentIndex,
        type: component.type,
        value: component.value
      });
    };

    this.dragEnd = function() {
      $elementToResize.closest('.block-edit').add(document.body).removeClass('is-resizing');
    };
  }

  DragResizer.prototype = Unidragger.prototype;

  function initResizer($this, $resizeHandle) {
    var resizer = new DragResizer($this, $resizeHandle);
    resizer.bindHandles();
  }

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
  function componentResizable(options) {
    var $this = $(this);
    var $resizeHandle;
    options = _.extend({ minHeight: 1 }, options);

    utils.assertIsOneOfTypes(options.minHeight, 'number');

    if (!$this.hasClass(RESIZABLE_CLASS_NAME)) {
      $this.append('<div class="component-resize-handle"></div>');
      $resizeHandle = $this.find('.component-resize-handle');
      $this.addClass(RESIZABLE_CLASS_NAME);
      initResizer($this, $resizeHandle);
      $this.one('destroy', function() {
        $resizeHandle.remove();
      });
    }

    $this.attr(MIN_HEIGHT_DATA_ATTR_NAME, options.minHeight);

    return $this;
  }

  $.fn.componentResizable = componentResizable;
})(window, jQuery);
