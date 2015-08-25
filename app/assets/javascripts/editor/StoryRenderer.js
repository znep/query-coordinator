(function(root) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;
  var storyteller = socrata.storyteller;

  // Component renderers are implemented as jQuery plugins.
  // This function maps component data (type, value) to
  // a jQuery plugin name ('storytellerComponentText').
  function _findAppropriateComponentRenderer(componentData) {

    utils.assertHasProperties(componentData, 'type');

    switch (componentData.type) {
      case 'html':
        return 'componentHTML';
      case 'spacer':
        return 'componentSpacer';
      case 'horizontalRule':
        return 'componentHorizontalRule';
      case 'assetSelector':
        return 'componentAssetSelector';
      case 'youtube.video':
        return 'componentYoutubeVideo';
      case 'socrata.visualization.columnChart':
        return 'componentSocrataVisualizationColumnChart';
      default:
        throw new Error(
          'No component renderer found for component: {0}'.
            format(JSON.stringify(componentData))
        );
    }
  }

  function StoryRenderer(options) {

    var dispatcher = storyteller.dispatcher;

    var storyUid = options.storyUid || null;
    var container = options.storyContainerElement || null;
    var insertionHint = options.insertionHintElement;
    var insertionHintIndex = -1;
    var onRenderError = options.onRenderError || function() {};
    var elementCache = new storyteller.StoryRendererElementCache();
    var warningMessageElement = options.warningMessageElement || null;
    var resizeRerenderTimeout;

    if (options.hasOwnProperty('onRenderError') &&
      ((typeof options.onRenderError) !== 'function')) {

      throw new Error(
        '`options.onRenderError` must be a function(is of type ' +
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

    if (!(insertionHint instanceof jQuery)) {

      onRenderError();
      throw new Error(
        '`options.insertionHintElement` must be a jQuery element (is of type ' +
        (typeof insertionHint) +
        ').'
      );
    }

    if (!options.hasOwnProperty('insertionHintElement')) {

      onRenderError();
      throw new Error(
        '`options.insertionHintElement` must be provided'
      );
    }

    if (!(storyteller.richTextEditorManager instanceof storyteller.RichTextEditorManager)) {

      onRenderError();
      throw new Error(
        'stories must have a reference to a valid RichTextEditorManager'
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
            shouldDelete = confirm(I18n.t('editor.remove_block_confirmation')); //eslint-disable-line no-alert
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

        var blockId = utils.findClosestAttribute(event.target, 'data-block-id');
        var componentIndex = utils.findClosestAttribute(event.target, 'data-component-index');

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
            type: 'html',
            value: blockContent
          });
        }
      });

      container.on('rich-text-editor::height-change', function() {
        _renderStory();
      });

      container.on('click', '[data-action]', function(event) {
        var action = event.target.getAttribute('data-action');

        switch (action) {

          case Constants.ASSET_SELECTOR_CHOOSE_PROVIDER:
            dispatcher.dispatch({
              action: Constants.ASSET_SELECTOR_CHOOSE_PROVIDER,
              blockId: utils.findClosestAttribute(event.target, 'data-block-id'),
              componentIndex: utils.findClosestAttribute(event.target, 'data-component-index')
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
          });

        elementCache.getBlock(blockId).remove();
        elementCache.flushBlock(blockId);
      });

      // Display a message if there are no blocks in the story
      _handleEmptyStoryMessage();

      blockIds.forEach(function(blockId, i) {

        var $blockElement = elementCache.getBlock(blockId);

        if ($blockElement === null) {
          $blockElement = _renderBlock(blockId);
          container.append($blockElement);
        }

        _renderBlockComponents(blockId);

        // Disable or enable buttons depending on the index of this block
        // relative to the total number of blocks.
        // E.g. disable the 'move up' button for the first block and the
        // 'move down' button for the last block.
        _updateBlockEditControls($blockElement, i, blockCount);

        // Update the height of the containing iframes to be equal to the
        // height of the iframe document's body.
        _updateEditorHeights(blockId, $blockElement);

        // If we are supposed to display the insertion hint at this
        // block index, first position the insertion hint and adjust
        // the overall layout height.
        if (insertionHint && insertionHintIndex === i) {
          layoutHeight += _layoutInsertionHint(layoutHeight);
        }

        layoutHeight += _layoutBlock($blockElement, layoutHeight);
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
      if (!_.isEmpty(warningMessageElement)) {
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

      var $blockElement = $(
        '<div>',
        {
          'class': 'block-edit',
          'data-block-id': blockId
        }
      ).append(
        [
          _renderBlockEditControls(blockId),
          $(
            '<div>',
            {
              'class': 'block',
              'data-block-id': blockId
            }
          ).append(componentContainers)
        ]
      );

      elementCache.setBlock(blockId, componentWidths.length, $blockElement);

      return $blockElement;
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

    function _updateEditorHeights(blockId, $blockElement) {

      var componentData = storyteller.storyStore.getBlockComponents(blockId);
      var editorId;
      var contentHeight;
      var maxEditorHeight = 0;

      componentData.forEach(function(componentDatum, i) {

        // Ideally, we'd have some sort of API to ask each renderer what its
        // size is. For now, we deal with it here.
        if (componentDatum.type === 'html') {

          // In order to size text renderers, we must call into RichTextEditorManager.
          // Doing so requires the editorId, which can be found in a data attribute
          // generated by the text renderer.
          editorId = $blockElement.
            find('.component-container').
            eq(i).
            children(':first').
            attr('data-editor-id');

          contentHeight = storyteller.richTextEditorManager.
            getEditor(editorId).
            getContentHeight();

        } else {

          contentHeight = $blockElement.
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

      $blockElement.
        find('.component-html > iframe').
        height(maxEditorHeight);
    }

    /**
     * Invokes the given component renderer with the given data.
     * If another component renderer is already present, the other renderer
     * will be torn down via the 'destroy' event.
     *
     * @param {string} componentRenderer - The name of the renderer to use.
     * @param {jQuery} $componentContainer - The DOM subtree to render into.
     * @param {object} componentData - The component's data from the database.
     */
    function _runComponentRenderer(componentRenderer, $componentContainer, componentData) {
      var $componentContent = $componentContainer.children().eq(0);

      var needToChangeRenderer =
        componentRenderer !== $componentContainer.attr('data-component-renderer-name');

      if (needToChangeRenderer) {
        $componentContainer.attr('data-component-renderer-name', componentRenderer);

        $componentContent = $('<div>', { 'class': 'component' });

        $componentContainer.
          trigger('destroy').
          empty().
          append($componentContent);
      }

      // Provide the initial or updated data to the renderer.
      $componentContent[componentRenderer](componentData);
    }

    /**
     * Finds an appropriate container for a
     * given block's component.
     *
     * @param {string} blockId
     * @param {number} componentIndex
     * @return {jQuery}
     */
    function _getComponentContainer(blockId, componentIndex) {
      var $block = elementCache.getBlock(blockId);
      var $componentContainer = elementCache.getComponent(blockId, componentIndex);

      if (!$componentContainer) {

        // If the container is not in the cache, we must grab it from the DOM. All component containers
        // have already been created in one step in _renderBlock.
        $componentContainer = $block.find('.component-container[data-component-index="' + componentIndex + '"]');
        utils.assert(
          $componentContainer.length > 0,
          'Could not find component container for blockId: {0}, componentIndex: {1}'.
            format(blockId, componentIndex)
        );
        elementCache.setComponent(blockId, componentIndex, $componentContainer);
      }

      utils.assertInstanceOf($componentContainer, $);

      return $componentContainer;
    }

    function _renderBlockComponents(blockId) {
      var components = storyteller.storyStore.getBlockComponents(blockId);

      components.forEach(function(componentData, componentIndex) {

        var componentRenderer = _findAppropriateComponentRenderer(componentData);
        var $componentContainer = _getComponentContainer(blockId, componentIndex);

        _runComponentRenderer(componentRenderer, $componentContainer, componentData);
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

  root.socrata.storyteller.StoryRenderer = StoryRenderer;
})(window);
