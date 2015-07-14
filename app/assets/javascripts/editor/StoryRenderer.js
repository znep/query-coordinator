;var StoryRenderer = (function() {

  'use strict';

  function StoryRenderer(options) {

    var storyUid = options.storyUid || null;
    var container = options.storyContainerElement || null;
    var editable = options.editable || false;
    var insertionHint = options.insertionHintElement || false;
    var insertionHintIndex = -1;
    var onRenderError = options.onRenderError || function() {};
    var componentTemplateRenderers = {
      'text': _renderTextComponentTemplate,
      'image': _renderImageComponentTemplate,
      'visualization': _renderVisualizationComponentTemplate
    };
    var componentDataRenderers = {
      'text': _renderTextComponentData,
      'image': _renderImageComponentData,
      'visualization': _renderVisualizationComponentData
    };
    var elementCache = new StoryRendererElementCache();
    var warningMessageElement = options.warningMessageElement || null;

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

    if (editable && !(window.richTextEditorManager instanceof RichTextEditorManager)) {

      onRenderError();
      throw new Error(
        'editable stories must have a reference to a valid RichTextEditorManager'
      );
    }

    container.addClass('story');
    container.attr('data-story-uid', storyUid);

    _listenForChanges();
    _attachEvents();
    _renderStory();

    /**
     * Private methods
     */

    function _listenForChanges() {

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
    }

    function _attachEvents() {

      container.on(
        'click',
        '[data-block-move-action]',
        function(e) {

          var payload = {
            action: e.target.getAttribute('data-block-move-action'),
            storyUid: storyUid,
            blockId: e.target.getAttribute('data-block-id')
          };

          dispatcher.dispatch(payload);
        }
      );

      container.on(
        'click',
        '[data-block-delete-action]',
        function(e) {
          var blockId = e.target.getAttribute('data-block-id');
          var shouldDelete = true;

          if (window.blockRemovalConfirmationStore.needsConfirmation(blockId)) {
            shouldDelete = confirm(I18n.t('editor.remove_block_confirmation'));
          }

          if (shouldDelete) {
            var payload = {
              action: e.target.getAttribute('data-block-delete-action'),
              storyUid: storyUid,
              blockId: e.target.getAttribute('data-block-id')
            };

            dispatcher.dispatch(payload);
          }
        }
      );

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

      container.on('rich-text-editor::format-change', function(event) {

        window.dispatcher.dispatch({
          action: Constants.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
          activeFormats: event.originalEvent.detail.content
        });
      });

      // Handle updates to block content.
      container.on('rich-text-editor::content-change', function(event) {

        var editorIdComponents = event.originalEvent.detail.id.split('-');
        var editorIdComponentCount = editorIdComponents.length - 1;
        var componentIndex = editorIdComponents[editorIdComponentCount];

        // Remove the last (component index) element
        editorIdComponents.length = editorIdComponentCount;
        var blockId = editorIdComponents.join('-');

        var blockContent = event.originalEvent.detail.content;

        var existingComponentValue = window.
          storyStore.
          getBlockComponentAtIndex(blockId, componentIndex).
          value.
          replace(/<br>/g, '');

        var newComponentValue = blockContent.
          replace(/<br>/g, '');

        var contentIsDifferent = (
          existingComponentValue !==
          newComponentValue
        );

        if (contentIsDifferent) {

          window.dispatcher.dispatch({
            action: Constants.BLOCK_UPDATE_COMPONENT,
            blockId: blockId,
            index: componentIndex,
            type: 'text',
            value: blockContent
          });
        }
      });

      container.on('rich-text-editor::height-change', function() {
        _renderStory();
      });
    }

    /**
     * Story-level rendering operations
     */

    function _renderStory() {

      var blockIds = window.storyStore.getStoryBlockIds(storyUid);
      var blockIdsToRemove = elementCache.getUnusedBlockIds(blockIds);
      var blockCount = blockIds.length;
      var layoutHeight = 0;

      blockIdsToRemove.forEach(function(blockId) {

        window.
          storyStore.
          getBlockComponents(blockId).
          forEach(function(component, i) {
            if (component.type === 'text') {
              var editorId = blockId + '-' + i;
              window.richTextEditorManager.deleteEditor(editorId);
            }
          });

        elementCache.getBlock(blockId).remove();
        elementCache.flushBlock(blockId);
      });

      // Display a message if there are no blocks in the story
      _handleEmptyStoryMessage();

      blockIds.forEach(function(blockId, i) {

        var blockElement = elementCache.getBlock(blockId);
        var translation;

        if (blockElement === null) {
          blockElement = _renderBlock(blockId);
          container.append(blockElement);
        }

        _renderBlockComponentsData(blockId);

        if (editable) {
          // Disable or enable buttons depending on the index of this block
          // relative to the total number of blocks.
          // E.g. disable the 'move up' button for the first block and the
          // 'move down' button for the last block.
          _updateBlockEditControls(blockElement, i, blockCount);

          // Update the height of the containing iframes to be equal to the
          // height of the iframe document's body.
          _updateEditorHeights(blockId, blockElement);
        }

        // If we are supposed to display the insertion hint at this
        // block index, first position the insertion hint and adjust
        // the overall layout height.
        if (insertionHint && insertionHintIndex === i) {
          layoutHeight += _layoutInsertionHint(layoutHeight);
        }

        layoutHeight += _layoutBlock(blockElement, layoutHeight);
      });

      // If we are attempting to insert a new block at the end of the story
      // position the insertion hint after the last rendered block.
      if (insertionHint && insertionHintIndex === blockIds.length) {
        layoutHeight += _layoutInsertionHint(layoutHeight);
      }

      container.height(layoutHeight);
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

    function _handleEmptyStoryMessage() {
      if (!_.isEmpty(warningMessageElement))  {
        var blockCount = window.storyStore.getStoryBlockIds(storyUid).length;

        if (blockCount === 0) {
          warningMessageElement.addClass('message-empty-story');
          warningMessageElement.text(I18n.t('editor.empty_story_warning'));
        } else {
          warningMessageElement.removeClass('message-empty-story');
          warningMessageElement.text('');
        }
      }
    }

    /**
     * Block-level rendering operations
     */

    function _renderBlock(blockId) {

      if (typeof blockId !== 'string') {
        onRenderError();
        throw new Error(
          '`blockId` must be a string (is of type ' +
          (typeof blockId) +
          ').'
        );
      }

      var layout = window.storyStore.getBlockLayout(blockId);
      var componentWidths = layout.split('-');
      var componentTemplates;
      var blockElement;

      componentTemplates = _renderBlockComponentsTemplates(blockId);

      componentTemplates.forEach(function(componentTemplate, i) {
        elementCache.setComponent(blockId, i, componentTemplate);
      });

      blockElement = $('<div>', { class: 'block', 'data-block-id': blockId }).append(componentTemplates);

      if (editable) {
        blockElement = $('<div>', { class: 'block-edit', 'data-block-id': blockId }).append([
          _renderBlockEditControls(blockId),
          blockElement
        ]);
      }

      elementCache.setBlock(blockId, blockElement);

      return blockElement;
    }

    function _renderBlockEditControls(blockId) {
      return $('<div>', { class: 'block-edit-controls' }).append([
        $('<button>',
          { class: 'block-edit-controls-move-up-btn',
            'data-block-id': blockId,
            'data-block-move-action': Constants.STORY_MOVE_BLOCK_UP
          }
          ).append('&#9650;'),
        $('<button>',
          { class: 'block-edit-controls-move-down-btn',
            'data-block-id': blockId,
            'data-block-move-action': Constants.STORY_MOVE_BLOCK_DOWN
          }
          ).append('&#9660;'),
        $('<button>',
          { class: 'block-edit-controls-delete-btn',
            'data-block-id': blockId,
            'data-block-delete-action': Constants.STORY_DELETE_BLOCK
          }
        ).append('&#9587;')
      ]);
    }

    function _updateBlockEditControls(blockElement, blockIndex, blockCount) {

      var moveUpButton = blockElement.find('.block-edit-controls-move-up-btn');
      var moveDownButton = blockElement.find('.block-edit-controls-move-down-btn');

      moveUpButton.prop('disabled', blockIndex === 0);
      moveDownButton.prop('disabled', blockIndex === (blockCount - 1));
    }

    function _updateEditorHeights(blockId, blockElement) {

      var components = window.storyStore.getBlockComponents(blockId);
      var componentCount = components.length;
      var editorId;
      var maxEditorHeight = 0;

      for (var i = 0; i < componentCount; i++) {

        if (components[i].type === 'text') {

          editorId = blockId + '-' + i;
          maxEditorHeight = Math.max(
            maxEditorHeight,
            window.
              richTextEditorManager.
              getEditor(editorId).
              getContentHeight()
          );
        }
      }

      blockElement.
        find('.text-editor > iframe').
        height(maxEditorHeight);
    }

    /**
     * Component template renderers render template skeletons into
     * block elements.
     */

    function _renderBlockComponentsTemplates(blockId, componentData) {

      var componentWidths = window.storyStore.getBlockLayout(blockId).split('-');
      var componentData = window.storyStore.getBlockComponents(blockId);

      return componentData.
        map(function(component, i) {

          return _renderBlockComponentTemplate({
            blockId: blockId,
            componentIndex: i,
            componentWidth: componentWidths[i],
            componentType: component.type,
            componentValue: component.value
          });
        });
    }

    function _renderBlockComponentTemplate(componentOptions) {

      componentOptions.classes = [
        'component',
        componentOptions.componentType,
        ('col' + componentOptions.componentWidth)
      ].join(' ');

      return componentTemplateRenderers[componentOptions.componentType](componentOptions);
    }

    function _renderTextComponentTemplate(componentOptions) {

      var editorId;
      var component;
      var editor;

      if (editable) {

        editorId = componentOptions.blockId + '-' + componentOptions.componentIndex;

        component = $(
          '<div>',
          { class: componentOptions.classes + ' text-editor', 'data-editor-id': editorId }
        );

        editor = window.richTextEditorManager.createEditor(
          component,
          editorId,
          componentOptions.componentValue
        );

      } else {
        component = $('<div>', { class: componentOptions.classes }).append(componentOptions.componentValue);
      }

      return component;
    }

    function _renderImageComponentTemplate(componentOptions) {
      return $('<div>', { class: componentOptions.classes }).append('<img>');
    }

    function _renderVisualizationComponentTemplate(componentOptions) {
      return $('<div>', { class: componentOptions.classes }).append('<img>');
    }

    /**
     * Component data renderers bind component data to existing
     * component templates.
     */

    function _renderBlockComponentsData(blockId) {

      var components = window.storyStore.getBlockComponents(blockId);

      components.forEach(function(component, i) {

        var element = elementCache.getComponent(blockId, i);

        componentDataRenderers[component.type](element, component.value)
      });
    }

    function _renderTextComponentData(element, data) {

      if (editable) {

        var editorId = element.attr('data-editor-id');
        var editor = richTextEditorManager.getEditor(editorId);

        editor.setContent(data);
      } else {
        element.html(data);
      }
    }

    function _renderImageComponentData(element, data) {

      var imageElement = element.find('img');
      var imageSource = '/stories/' + data;

      imageElement[0].onload = function(e) {
        _renderStory();
      };

      if (imageElement.attr('src') !== imageSource) {
        imageElement.attr('src', imageSource);
      }
    }

    function _renderVisualizationComponentData(element, data) {

      var imageElement = element.find('img');
      var imageSource = '/stories/' + data;

      imageElement[0].onload = function(e) {
        _renderStory();
      };

      if (imageElement.attr('src') !== imageSource) {
        imageElement.attr('src', imageSource);
      }
    }

    /**
     * Layout occurs after blocks have been rendered to the DOM.
     */

    function _layoutInsertionHint(layoutHeight) {

      var translation = 'translate(0,' + layoutHeight + 'px)';

      insertionHint.css('transform', translation).removeClass('hidden');

      return (
        insertionHint.outerHeight(true) +
        parseInt(insertionHint.css('margin-bottom'), 10)
      );
    }

    function _layoutBlock(blockElement, layoutHeight) {

      var translation = 'translate(0,' + layoutHeight + 'px)';

      blockElement.attr('data-translate-y', layoutHeight);
      blockElement.css('transform', translation);

      return (
        blockElement.outerHeight(true) +
        parseInt(blockElement.css('margin-bottom'), 10)
      );
    }
  }

  return StoryRenderer;
})();
