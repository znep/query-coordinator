;var StoryRenderer = (function() {

  'use strict';

  function StoryRenderer(options) {

    var story = options.story || null;
    var container = options.storyContainerElement || null;
    var scaleFactor = options.scaleFactor || 1;
    var editable = options.editable || false;
    var insertionHint = options.insertionHintElement || false;
    var insertionHintIndex = -1;
    var richTextEditorManager = options.richTextEditorManager || null;
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

    if (editable && !(richTextEditorManager instanceof RichTextEditorManager)) {

      onRenderError();
      throw new Error(
        'editable stories must have a reference to a valid RichTextEditorManager'
      );
    }

    /**
     * Public methods
     */

    this.render = function() {
      _renderStory();
    };

    this.showInsertionHintAtIndex = function(index) {
      if (index !== insertionHintIndex) {
        insertionHintIndex = index;
        this.render();
      }
    };

    this.hideInsertionHint = function() {
      if (insertionHintIndex !== -1) {
        insertionHint.addClass('hidden');
        insertionHintIndex = -1;
        this.render();
      }
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
      var blockCount = blocks.length;
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

        // Disable or enable buttons depending on the index of this block
        // relative to the total number of blocks.
        // E.g. disable the 'move up' button for the first block and the
        // 'move down' button for the last block.
        if (editable) {
          _updateBlockEditControls(blockElement, i, blockCount);
          _updateEditorHeights(block, blockElement);
        }

        // If we are supposed to display the insertion hint at this
        // block index, first position the insertion hint and adjust
        // the overall layout height.
        if (insertionHint && insertionHintIndex === i) {
          layoutHeight += _layoutInsertionHint(layoutHeight);
        }

        // Render the current block according to the current layout height.
        translation = 'translate(0,' + layoutHeight + 'px)';

        blockElement.css('transform', translation);

        layoutHeight += blockElement.outerHeight(true);
        layoutHeight += parseInt(blockElement.css('margin-bottom'), 10);
      });

      if (insertionHint && insertionHintIndex === blocks.length) {
        layoutHeight += _layoutInsertionHint(layoutHeight);
      }

      container.height(layoutHeight * scaleFactor);
    }

    function _layoutInsertionHint(layoutHeight) {

      var translation = 'translate(0,' + layoutHeight + 'px)';
      insertionHint.css('transform', translation).removeClass('hidden');

      return (
        insertionHint.outerHeight(true) +
        parseInt(insertionHint.css('margin-bottom'), 10)
      );
    }

    function _updateBlockEditControls(blockElement, blockIndex, blockCount) {

      var moveUpButton = blockElement.find('.block-edit-controls-move-up-btn');
      var moveDownButton = blockElement.find('.block-edit-controls-move-down-btn');

      moveUpButton.prop('disabled', blockIndex === 0);
      moveDownButton.prop('disabled', blockIndex === (blockCount - 1));
    }

    function _updateEditorHeights(block, blockElement) {

      var components = block.getComponents();
      var componentCount = components.length;
      var editorId;
      var editor;
      var editorHeight;

      for (var i = 0; i < componentCount; i++) {

        if (components[i].type === 'text') {

          editorId = block.getId() + '-' + i;
          editor = richTextEditorManager.getEditor(editorId);
          editorHeight = editor.getContentHeight();

          blockElement.
            find('.component').
            eq(i).
            find('iframe').
            height(editorHeight);
        }
      }
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
          _renderBlockEditControls(id),
          blockElement
        ]);
      }

      return blockElement;
    }

    function _renderBlockEditControls(blockId) {
      return $('<div>', { class: 'block-edit-controls' }).append([
        $('<button>',
          { class: 'block-edit-controls-move-up-btn',
            'data-block-id': blockId,
            'data-block-edit-action': 'move-up'
          }
          ).append('&#9650;'),
        $('<button>',
          { class: 'block-edit-controls-move-down-btn',
            'data-block-id': blockId,
            'data-block-edit-action': 'move-down'
          }
          ).append('&#9660;'),
        $('<button>',
          { class: 'block-edit-controls-delete-btn',
            'data-block-id': blockId,
            'data-block-edit-action': 'delete'
          }
        ).append('&#9587;')
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
        component = richTextEditorManager.getEditor(editorId);

        if (component === null) {
          component = richTextEditorManager.createEditor(editorId, options.componentValue);
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
