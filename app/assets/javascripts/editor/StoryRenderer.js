;var StoryRenderer = (function() {

  'use strict';

  function StoryRenderer(options) {

    var BLOCK_VERTICAL_PADDING = 20;

    var story = options.story || null;
    var container = options.storyContainerElement || null;
    var scaleFactor = options.scaleFactor || 1;
    var editable = options.editable || false;
    var insertionHint = options.insertionHintElement || false;
    var insertionHintIndex = -1;
    var textEditorManager = options.textEditorManager || null;
    var onRenderError = options.onRenderError || function() {};
    var componentRenderers = {
      'text': _renderTextComponent,
      'image': _renderImageComponent,
      'visualization': _renderVisualizationComponent
    };
    var blockCache = {};

    if (options.hasOwnProperty('onRenderError') &&
      ((typeof options.onRenderError) !== 'function')) {

      throw new Error(
        '`options.onRenderError` must be a function (is of type ' +
        (typeof onRenderError) +
        ').'
      );
    }

    if (!(story instanceof Story)) {

      onRenderError();
      throw new Error(
        '`options.story` must be a Story (is of type ' +
        (typeof story) +
        ').'
      );
    }

    if (!(container instanceof jQuery)) {

      onRenderError();
      throw new Error(
        '`options.storyContainerElement` must be a jQuery element (is of type ' +
        (typeof container) +
        ').'
      );
    }

    if (options.hasOwnProperty('insertionHintElement') &&
      !(options.insertionHintElement instanceof jQuery)) {

      onRenderError();
      throw new Error(
        '`options.insertionHintElement` must be a jQuery object (is of type ' +
        (typeof options.insertionHintElement) +
        ').'
      );
    }

    if (editable && !(textEditorManager instanceof TextEditorManager)) {

      onRenderError();
      throw new Error(
        'editable stories must have a reference to a valid TextEditorManager'
      );
    }

    /**
     * Public methods
     */

    this.render = function() {
      _renderStory();
    };

    this.showInsertionHintAtIndex = function(index) {
      insertionHintIndex = index;
    };

    this.hideInsertionHint = function() {
      insertionHint.addClass('hidden');
      insertionHintIndex = -1;
    };

    /**
     * Private methods
     */

    function _cacheBlockElement(block, blockElement) {

      var blockId = block.getId();

      blockCache[blockId] = blockElement;
    }

    function _removeCachedBlockElement(blockId) {

      if (!blockCache.hasOwnProperty(blockId)) {
        throw new Error('block is not present in cache');
      }

      delete blockCache[blockId];
    };

    function _blockElementIsCached(block) {
      return blockCache.hasOwnProperty(block.getId());
    }

    function _getCachedBlockElement(block) {

      var blockId = block.getId();

      if (!blockCache.hasOwnProperty(blockId)) {
        throw new Error('block is not present in cache');
      }

      return blockCache[blockId];
    }

    function _removeAbsentBlocks(blocks) {

      var currentBlockIds = blocks.map(function(block) {
        return block.getId();
      });

      var blockIdsToRemove = Object.
        keys(blockCache).
        filter(function(blockId) {
          return currentBlockIds.indexOf(blockId) === -1;
        });

      blockIdsToRemove.forEach(function(blockId) {
        blockCache[blockId].remove();
        _removeCachedBlockElement(blockId);
      });
    }

    function _renderStory() {

      var blocks = story.getBlocks();
      var renderedBlocks;
      var layoutHeight;

      _removeAbsentBlocks(blocks);

      // Render each block.
      renderedBlocks = blocks.
        map(function(block) {

          if (!_blockElementIsCached(block)) {
            var newBlock = _renderBlock(block);
            _cacheBlockElement(block, newBlock);
            container.append(newBlock);
            return newBlock;
          } else {
            return _getCachedBlockElement(block);
          }
        });

      // Perform the layout calculations and update the top offset of each
      // block.
      layoutHeight = 0;

      blocks.forEach(function(block, i) {

        var blockElement = _getCachedBlockElement(block);

        var translation;

        // If we are supposed to display the insertion hint at this
        // block index, first position the insertion hint and adjust
        // the overall layout height.
        if (insertionHint && insertionHintIndex === i) {

          translation = 'translate(0,' + layoutHeight + 'px)';
          insertionHint.css('transform', translation).removeClass('hidden');
          layoutHeight += insertionHint.outerHeight(true) + BLOCK_VERTICAL_PADDING;
        }

        // Render the current block according to the current layout height.
        translation = 'translate(0,' + layoutHeight + 'px)';
        blockElement.css('transform', translation);
        layoutHeight += blockElement.outerHeight(true) + BLOCK_VERTICAL_PADDING;
      });

      container.height(layoutHeight * scaleFactor);
    }

    function _renderBlock(block) {

      if (!(block instanceof Block)) {
        onRenderError();
        throw new Error(
          '`block` is must be a Block (is of type ' +
          (typeof block) +
          ').' 
        );
      }

      var id = block.getId();
      var layout = block.getLayout();
      var componentWidths = layout.split('-');
      var componentOptions;
      var componentData = block.getComponents();
      var components;
      var blockElement;

      if (componentWidths.length !== componentData.length) {
        onRenderError();
        throw new Error(
          'number of layout components does not equal number of components'
        );
      }

      componentOptions = {
        block: block
      };

      components = componentData.
        map(function(component, i) {

          componentOptions.componentIndex = i;
          componentOptions.componentWidth = componentWidths[i];
          componentOptions.componentType = component.type;
          componentOptions.componentValue = component.value;

          return _renderComponent(componentOptions);
        });

      blockElement = $('<div>', { class: 'block', 'data-block-id': id }).append(components);

      if (editable) {
        blockElement = $('<div>', { class: 'block-edit' }).append([
          _renderBlockEditControls(),
          blockElement
        ]);
      }

      return blockElement;
    }

    function _renderBlockEditControls() {
      return $('<div>', { class: 'block-edit-controls' }).append([
        $('<button>', { class: 'block-edit-controls-move-up-btn' }),
        $('<button>', { class: 'block-edit-controls-move-down-btn' }),
        $('<button>', { class: 'block-edit-controls-delete-btn' })
      ]);
    }

    function _renderComponent(options) {

      var classes = [
        'component',
        options.componentType,
        ('col' + options.componentWidth)
      ].join(' ');

      var component = $('<div>', { class: classes }).
        append(
          componentRenderers[options.componentType](options)
        );

      return component;
    }

    function _renderTextComponent(options) {

      var editorId;
      var component = options.componentValue;

      if (editable) {

        editorId = options.block.getId() + '-' + options.componentIndex;
        component = textEditorManager.getEditor(editorId);

        if (component === null) {
          component = textEditorManager.createEditor(editorId, options.componentValue);
        }
      }

      return component;
    }

    function _renderImageComponent(options) {

      var component = $('<img>', { src: '/stories/' + options.componentValue });

      component[0].onload = function(e) {
        _renderStory();
      };

      return component;
    }

    function _renderVisualizationComponent(options) {
      return $('<img>', { src: '/stories/' + options.componentValue });
    }
  }

  return StoryRenderer;
})();
