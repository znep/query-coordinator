;window.socrata.storyteller.StoryRenderer = (function(storyteller) {

  'use strict';

  function StoryRenderer(options) {

    var dispatcher = storyteller.dispatcher;
    var TextComponentRenderer = storyteller.TextComponentRenderer;
    var MediaComponentRenderer = storyteller.MediaComponentRenderer;
    var SocrataVisualizationComponentRenderer = storyteller.SocrataVisualizationComponentRenderer;
    var LayoutComponentRenderer = storyteller.LayoutComponentRenderer;

    var storyUid = options.storyUid || null;
    var container = options.storyContainerElement || null;
    var editable = options.editable || false;
    var insertionHint = options.insertionHintElement || false;
    var insertionHintIndex = -1;
    var onRenderError = options.onRenderError || function() {};
    var componentTemplateRenderers = {
      'text': 'storytellerComponentText',
      'media': MediaComponentRenderer.renderTemplate,
      'socrataVisualization': SocrataVisualizationComponentRenderer.renderTemplate,
      'layout': 'storytellerComponentLayout'
    };
    var componentTemplateCheckers = {
      'text': _.constant(true),
      'media': MediaComponentRenderer.canReuseTemplate,
      'socrataVisualization': SocrataVisualizationComponentRenderer.canReuseTemplate,
      'layout': _.constant(true)
    };
    var componentDataRenderers = {
      'text': 'storytellerComponentText',
      'media': MediaComponentRenderer.renderData,
      'socrataVisualization': SocrataVisualizationComponentRenderer.renderData,
      'layout': 'storytellerComponentLayout'
    };
    var elementCache = new storyteller.StoryRendererElementCache();
    var warningMessageElement = options.warningMessageElement || null;
    var resizeRerenderTimeout;

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

    if (editable && !(storyteller.richTextEditorManager instanceof storyteller.RichTextEditorManager)) {

      onRenderError();
      throw new Error(
        'editable stories must have a reference to a valid RichTextEditorManager'
      );
    }

    container.addClass('story');
    container.add(insertionHint).attr('data-story-uid', storyUid);

    _listenForChanges();
    _attachEvents();
    _renderStory();

    /**
     * CHART-86
     *
     * In order to respond to changes in the window size we need to watch for
     * the 'resize' event.
     *
     * It doesn't seem right to have a 'resize' event cause a change in the
     * story store, however, so the $(window).on('resize', ...) handler was
     * originally put here.
     *
     * As it turns out, this caused intermittent test failures because some
     * combination of PhantomJS + Karma will trigger resize events as tests
     * are being wound down, which caused the resize re-render handler to be
     * fired at a time when the StoryRenderer's corresponding StoryStore had
     * already been destroyed, which caused an error that should be impossible
     * in actual usage, that `window.socrata.storyteller.storyStore` is
     * undefined when the StoryRenderer attempts to query it for data).
     *
     * For lack of a better solution, we now have a `.destroy()` method on
     * renderers that can be called to remove event listeners and do any other
     * cleanup that may become necessary in the future.
     */
    this.destroy = function() {
      clearTimeout(resizeRerenderTimeout);
      _detachEvents();
    };

    /**
     * Private methods
     */

    function _listenForChanges() {

      storyteller.storyStore.addChangeListener(function() {
        _renderStory();
      });

      storyteller.dragDropStore.addChangeListener(function() {
        var hintPosition = storyteller.dragDropStore.getReorderHintPosition();

        if (hintPosition && hintPosition.storyUid === storyUid) {
          _showInsertionHintAtIndex(hintPosition.dropIndex);
        } else {
          _hideInsertionHint();
        }
      });
    }

    function _attachEvents() {

      $(window).on('resize', _throttledRender);

      container.on(
        'click',
        '[data-block-move-action]',
        function(event) {

          var payload = {
            action: event.target.getAttribute('data-block-move-action'),
            storyUid: storyUid,
            blockId: event.target.getAttribute('data-block-id')
          };

          dispatcher.dispatch(payload);
        }
      );

      container.on(
        'click',
        '[data-block-delete-action]',
        function(event) {
          var blockId = event.target.getAttribute('data-block-id');
          var shouldDelete = true;

          if (storyteller.blockRemovalConfirmationStore.needsConfirmation(blockId)) {
            shouldDelete = confirm(I18n.t('editor.remove_block_confirmation'));
          }

          if (shouldDelete) {
            var payload = {
              action: event.target.getAttribute('data-block-delete-action'),
              storyUid: storyUid,
              blockId: event.target.getAttribute('data-block-id')
            };

            dispatcher.dispatch(payload);
          }
        }
      );

      container.on('mouseenter', function() {
        storyteller.dispatcher.dispatch({
          action: Constants.STORY_MOUSE_ENTER,
          storyUid: storyUid
        });
      });

      container.on('mouseleave', function() {
        dispatcher.dispatch({
          action: Constants.STORY_MOUSE_LEAVE,
          storyUid: storyUid
        });
      });

      container.on('mousemove', '.block', function(event) {
        var blockId = event.currentTarget.getAttribute('data-block-id');

        if (blockId) {
          dispatcher.dispatch({
            action: Constants.BLOCK_MOUSE_MOVE,
            storyUid: storyUid,
            blockId: blockId
          });
        }
      });

      container.on('dblclick', '.block', function(event) {
        var blockId = event.currentTarget.getAttribute('data-block-id');

        if (blockId) {
          storyteller.dispatcher.dispatch({
            action: Constants.BLOCK_DOUBLE_CLICK,
            storyUid: storyUid,
            blockId: blockId
          });
        }
      });

      container.on('rich-text-editor::format-change', function(event) {

        dispatcher.dispatch({
          action: Constants.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
          activeFormats: event.originalEvent.detail.content
        });
      });

      // Handle updates to block content.
      container.on('rich-text-editor::content-change', function(event) {

        var blockId = $(event.target).closest('[data-block-id]').attr('data-block-id');
        var componentIndex = $(event.target).closest('[data-component-index]').attr('data-component-index');

        var blockContent = event.originalEvent.detail.content;

        var existingComponentValue = storyteller.
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

          dispatcher.dispatch({
            action: Constants.BLOCK_UPDATE_COMPONENT,
            blockId: blockId,
            componentIndex: componentIndex,
            type: 'text',
            value: blockContent
          });
        }
      });

      container.on('rich-text-editor::height-change', function() {
        _renderStory();
      });

      container.on('click', '[data-embed-action]', function(event) {

        var action = event.target.getAttribute('data-embed-action');

        switch(action) {

          case Constants.EMBED_WIZARD_CHOOSE_PROVIDER:
            dispatcher.dispatch({
              action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
              blockId: event.target.getAttribute('data-block-id'),
              componentIndex: event.target.getAttribute('data-component-index')
            });
            break;

          default:
            break;
        }
      });
    }

    function _detachEvents() {
      $(window).off('resize', _throttledRender);
    }

    function _throttledRender() {

      clearTimeout(resizeRerenderTimeout);

      resizeRerenderTimeout = setTimeout(
        function() {
          _renderStory();
        },
        Constants.WINDOW_RESIZE_RERENDER_DELAY
      );
    }

    /**
     * Story-level rendering operations
     */

    function _renderStory() {

      var blockIds = storyteller.storyStore.getStoryBlockIds(storyUid);
      var blockIdsToRemove = elementCache.getUnusedBlockIds(blockIds);
      var blockCount = blockIds.length;
      var layoutHeight = 0;

      blockIdsToRemove.forEach(function(blockId) {

        storyteller.
          storyStore.
          getBlockComponents(blockId).
          forEach(function(componentDatum, i) {
            var componentElement = elementCache.getComponent(blockId, i);

            componentElement.trigger('destroy');

            if (componentDatum.type === 'socrataVisualization') {

              var destroyVisualizationEvent = new window.CustomEvent(
                Constants.SOCRATA_VISUALIZATION_DESTROY,
                {
                  detail: {},
                  bubbles: false
                }
              );

              componentElement[0].dispatchEvent(destroyVisualizationEvent);
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

        _renderBlockComponentsTemplates(blockId);
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
        var blockCount = storyteller.storyStore.getStoryBlockIds(storyUid).length;

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

      var layout = storyteller.storyStore.getBlockLayout(blockId);
      var componentWidths = layout.split('-');
      var blockElement;
      var componentContainers = componentWidths.map(function(componentWidth, i) {
        return $(
          '<div>',
          {
            'class': 'component-container col{0}'.format(componentWidth),
            'data-component-layout-width': componentWidth,
            'data-component-index': i
          }
        );
      });

      blockElement = $(
        '<div>',
        {
          'class': 'block',
          'data-block-id': blockId
        }
      ).append(componentContainers);

      if (editable) {
        blockElement = $(
          '<div>',
          {
            'class': 'block-edit',
            'data-block-id': blockId
          }
        ).append([
          _renderBlockEditControls(blockId),
          blockElement
        ]);
      }

      elementCache.setBlock(blockId, componentWidths.length, blockElement);

      return blockElement;
    }

    function _renderBlockEditControls(blockId) {

      return $(
        '<div>',
        {
          'class': 'block-edit-controls'
        }
      ).append([

        $(
          '<button>',
          {
            'class': 'block-edit-controls-move-up-btn',
            'data-block-id': blockId,
            'data-block-move-action': Constants.STORY_MOVE_BLOCK_UP
          }
        ).append('&#9650;'),

        $(
          '<button>',
          {
            'class': 'block-edit-controls-move-down-btn',
            'data-block-id': blockId,
            'data-block-move-action': Constants.STORY_MOVE_BLOCK_DOWN
          }
        ).append('&#9660;'),

        $(
          '<button>',
          {
            'class': 'block-edit-controls-delete-btn',
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

      var componentData = storyteller.storyStore.getBlockComponents(blockId);
      var editorId;
      var contentHeight;
      var maxEditorHeight = 0;

      componentData.forEach(function(componentDatum, i) {

        if (componentDatum.type === 'text') {

          editorId = blockElement
            .find('.component-container')
            .eq(i)
            .children(':first')
            .attr('data-editor-id');

          contentHeight = storyteller.richTextEditorManager.
            getEditor(editorId).
            getContentHeight()

        } else {

          contentHeight = blockElement.
            find('.component-container').
            eq(i).
            // Not sure why subtracting one causes
            // the heights to be evened out visually,
            // but it does.
            outerHeight(true) - 1;

        }

        maxEditorHeight = Math.max(
          maxEditorHeight,
          contentHeight
        );
      });

      blockElement.
        find('.text-editor > iframe').
        height(maxEditorHeight);
    }

    /**
     * Component template renderers render template skeletons into
     * block elements.
     */

    function _renderBlockComponentsTemplates(blockId) {

      var element = elementCache.getBlock(blockId);
      var componentData = storyteller.storyStore.getBlockComponents(blockId);
      var existingComponent;
      var componentContainer;
      var canReuseTemplate = false;
      var componentWidth;
      var componentClasses;
      var componentOptions;
      var newTemplate;

      componentData.forEach(function(componentDatum, i) {

        // We need to find the container for the current component in order to
        // determine whether or not we can reuse the current template.
        //
        // Component containers are not currently cached, so we do a `.find()`
        // against the cached block element.

        existingComponent = elementCache.getComponent(blockId, i);

        if (existingComponent) {

          canReuseTemplate = componentTemplateCheckers[componentDatum.type](
            existingComponent,
            componentDatum.value
          );
        }

        if (!canReuseTemplate) {

          if (existingComponent) {
            existingComponent.remove();
          }

          componentContainer = element.find('.component-container[data-component-index="' + i + '"]');
          componentWidth = componentContainer.attr('data-component-layout-width');
          componentClasses = ['component', componentDatum.type].join(' ');

          componentOptions = {
            classes: componentClasses,
            blockId: blockId,
            componentIndex: i,
            componentWidth: componentWidth,
            componentType: componentDatum.type,
            componentValue: componentDatum.value,
            editable: editable
          };

          var componentTemplateRenderer = componentTemplateRenderers[componentOptions.componentType];

          if (typeof componentTemplateRenderer === 'string') {
            newTemplate = $('<div>')[componentTemplateRenderer](componentDatum);
            newTemplate.addClass('component').addClass(componentDatum.type);
          } else {
            newTemplate = componentTemplateRenderers[componentOptions.componentType](componentOptions);
          }

          newTemplate.attr('data-block-id', blockId);
          newTemplate.attr('data-component-index', i);

          componentContainer.append(newTemplate);

          elementCache.setComponent(blockId, i, newTemplate);
        }
      });
    }

    function _renderBlockComponentsData(blockId) {

      var componentData = storyteller.storyStore.getBlockComponents(blockId);

      componentData.forEach(function(componentDatum, i) {
        var element = elementCache.getComponent(blockId, i);
        var componentDataRenderer = componentDataRenderers[componentDatum.type];

        if (typeof componentDataRenderer === 'string') {
          $(element)[componentDataRenderer](componentDatum);
        } else {
          componentDataRenderers[componentDatum.type](element, componentDatum, editable, _renderStory);
        }
      });
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
})(window.socrata.storyteller);
