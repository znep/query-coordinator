;var StoryRenderer = (function() {

  'use strict';

  function StoryRenderer(options) {

    var storyUid = options.storyUid || null;
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

    if (typeof storyUid !== 'string') {

      onRenderError();
      throw new Error(
        '`options.storyUid` must be a string (is of type ' +
        (typeof storyUid) +
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

    container.on(
      'click',
      '[data-block-edit-action]',
      function(e) {

        var payload = {
          action: e.target.getAttribute('data-block-edit-action'),
          storyUid: storyUid,
          blockId: e.target.getAttribute('data-block-id')
        };

        dispatcher.dispatch(payload);
      }
    );

    window.storyStore.addChangeListener(function() {
      _renderStory();
    });

    window.dragDropStore.addChangeListener(function() {
      var hintPosition = window.dragDropStore.getReorderHintPosition();

      if (hintPosition && hintPosition.storyUid === storyUid) {
        _showInsertionHintAtIndex(hintPosition.dropIndex);
      } else {
        _hideInsertionHint();
      }
    });

    _renderStory();

    /**
     * Public methods
     */

    this.render = function() {
      _renderStory();
    };

    _attachEvents();

    /**
     * Private methods
     */

    function _attachEvents() {
      container.on('mouseenter', function() {
        window.dispatcher.dispatch({
          action: Constants.STORY_MOUSE_ENTER,
          storyUid: storyUid
        });
      });

      container.on('mouseleave', function() {
        window.dispatcher.dispatch({
          action: Constants.STORY_MOUSE_LEAVE,
          storyUid: storyUid
        });
      });

      container.on('mousemove', '.block', function(e) {
        var blockId = e.currentTarget.getAttribute('data-block-id');

        if (blockId) {
          window.dispatcher.dispatch({
            action: Constants.BLOCK_MOUSE_MOVE,
            storyUid: storyUid,
            blockId: blockId
          });
        }
      });

      container.on('dblclick', '.block', function(e) {
        var blockId = e.currentTarget.getAttribute('data-block-id');

        if (blockId) {
          window.dispatcher.dispatch({
            action: Constants.BLOCK_DOUBLE_CLICK,
            storyUid: storyUid,
            blockId: blockId
          });
        }

      });
    }

    function _showInsertionHintAtIndex(index) {
      if (index !== insertionHintIndex) {
        insertionHintIndex = index;
        _renderStory();
      }
    }

    function _hideInsertionHint() {
      if (insertionHintIndex !== -1 && insertionHint) {
        insertionHint.addClass('hidden');
        insertionHintIndex = -1;
        _renderStory();
      }
    }


    function _cacheBlockElement(blockId, blockElement) {

      blockCache[blockId] = blockElement;
    }

    function _removeCachedBlockElement(blockId) {

      if (!blockCache.hasOwnProperty(blockId)) {
        throw new Error('block is not present in cache');
      }

      delete blockCache[blockId];
    }

    function _blockElementIsCached(blockId) {
      return blockCache.hasOwnProperty(blockId);
    }

    function _getCachedBlockElement(blockId) {

      if (!blockCache.hasOwnProperty(blockId)) {
        throw new Error(
          'block with id "' + blockId + '" is not present in cache'
        );
      }

      return blockCache[blockId];
    }

    function _removeAbsentBlocks(currentBlockIds) {

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

      var blockIds = storyStore.getBlockIds(storyUid);
      var blockCount = blockIds.length;
      var layoutHeight = 0;

      container.addClass('story');
      container.attr('data-story-uid', storyUid);

      _removeAbsentBlocks(blockIds);

      blockIds.forEach(function(blockId, i) {

        var blockElement;
        var translation;

        if (!_blockElementIsCached(blockId)) {

          blockElement = _renderBlock(blockId);

          _cacheBlockElement(blockId, blockElement);
          container.append(blockElement);

        } else {
          blockElement = _getCachedBlockElement(blockId);
        }

        // Disable or enable buttons depending on the index of this block
        // relative to the total number of blocks.
        // E.g. disable the 'move up' button for the first block and the
        // 'move down' button for the last block.
        if (editable) {
          _updateBlockEditControls(blockElement, i, blockCount);
          _updateEditorHeights(blockId, blockElement);
        }

        // If we are supposed to display the insertion hint at this
        // block index, first position the insertion hint and adjust
        // the overall layout height.
        if (insertionHint && insertionHintIndex === i) {
          layoutHeight += _layoutInsertionHint(layoutHeight);
        }

        // Render the current block according to the current layout height.
        translation = 'translate(0,' + layoutHeight + 'px)';

        blockElement.attr('data-translate-y', layoutHeight);
        blockElement.css('transform', translation);

        layoutHeight += blockElement.outerHeight(true);
        layoutHeight += parseInt(blockElement.css('margin-bottom'), 10);
      });

      if (insertionHint && insertionHintIndex === blockIds.length) {
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

    function _updateEditorHeights(blockId, blockElement) {

      var components = window.blockStore.getComponents(blockId);
      var componentCount = components.length;
      var editorId;
      var editor;
      var editorHeight;

      for (var i = 0; i < componentCount; i++) {

        if (components[i].type === 'text') {

          editorId = blockId + '-' + i;
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

    function _renderBlock(blockId) {

      if (typeof blockId !== 'string') {
        onRenderError();
        throw new Error(
          '`blockId` must be a string (is of type ' +
          (typeof blockId) +
          ').'
        );
      }

      var layout = blockStore.getLayout(blockId);
      var componentWidths = layout.split('-');
      var componentOptions;
      var componentData = blockStore.getComponents(blockId);
      var components;
      var blockElement;

      if (componentWidths.length !== componentData.length) {
        onRenderError();
        throw new Error(
          'number of layout components does not equal number of components'
        );
      }

      componentOptions = {
        blockId: blockId
      };

      components = componentData.
        map(function(component, i) {

          componentOptions.componentIndex = i;
          componentOptions.componentWidth = componentWidths[i];
          componentOptions.componentType = component.type;
          componentOptions.componentValue = component.value;

          return _renderComponent(componentOptions);
        });

      blockElement = $('<div>', { class: 'block', 'data-block-id': blockId }).append(components);

      if (editable) {
        blockElement = $('<div>', { class: 'block-edit', 'data-block-id': blockId }).append([
          _renderBlockEditControls(blockId),
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
            'data-block-edit-action': Constants.STORY_MOVE_BLOCK_UP
          }
          ).append('&#9650;'),
        $('<button>',
          { class: 'block-edit-controls-move-down-btn',
            'data-block-id': blockId,
            'data-block-edit-action': Constants.STORY_MOVE_BLOCK_DOWN
          }
          ).append('&#9660;'),
        $('<button>',
          { class: 'block-edit-controls-delete-btn',
            'data-block-id': blockId,
            'data-block-edit-action': Constants.STORY_DELETE_BLOCK
          }
        ).append('&#9587;')
      ]);
    }

    function _renderComponent(componentOptions) {

      var classes = [
        'component',
        componentOptions.componentType,
        ('col' + componentOptions.componentWidth)
      ].join(' ');

      var component = $('<div>', { class: classes }).
        append(
          componentRenderers[componentOptions.componentType](componentOptions)
        );

      return component;
    }

    function _renderTextComponent(componentOptions) {

      var editorId;
      var component = componentOptions.componentValue;

      if (editable) {

        editorId = componentOptions.blockId + '-' + componentOptions.componentIndex;
        component = richTextEditorManager.getEditor(editorId);

        if (component === null) {
          component = richTextEditorManager.createEditor(editorId, componentOptions.componentValue);
        }
      }

      return component;
    }

    function _renderImageComponent(componentOptions) {

      var component = $('<img>', { src: '/stories/' + componentOptions.componentValue });

      component[0].onload = function(e) {
        _renderStory();
      };

      return component;
    }

    function _renderVisualizationComponent(componentOptions) {
      return $('<img>', { src: '/stories/' + componentOptions.componentValue });
    }
  }

  return StoryRenderer;
})();
