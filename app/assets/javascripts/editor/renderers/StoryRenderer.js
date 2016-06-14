import $ from 'jQuery';
import _ from 'lodash';

import I18n from '../I18n';
import Actions from '../Actions';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import StoryRendererElementCache from '../StoryRendererElementCache';
import '../block-component-renderers';
import { exceptionNotifier } from '../../services/ExceptionNotifier';
import { dispatcher } from '../Dispatcher';
import { storyStore } from '../stores/StoryStore';
import { dropHintStore } from '../stores/DropHintStore';
import { windowSizeBreakpointStore } from '../stores/WindowSizeBreakpointStore';
import { blockRemovalConfirmationStore } from '../stores/BlockRemovalConfirmationStore';
import RichTextEditorManager, { richTextEditorManager } from '../RichTextEditorManager';

export default function StoryRenderer(options) {
  var storyUid = options.storyUid || null;
  var $container = options.storyContainerElement || null;
  var insertionHint = options.insertionHintElement;
  var insertionHintIndex = -1;
  var elementCache = new StoryRendererElementCache();
  var warningMessageElement = options.warningMessageElement || null;
  var destroyed = false;

  var _throttledRender = _.debounce(_renderStory, Constants.WINDOW_RESIZE_RERENDER_DELAY);

  // _renderStory must not cause reentrant renders (rendering while rendering), as this
  // makes writing robust renderers difficult (because another render could come at any point,
  // even in the middle of initialization). This caused the famous "cannot find rich text editor with ID X"
  // series of errors.
  //
  // These two fields allow us to handle reentrant calls to _renderStory by deferring subsequent renders
  // to after the current render has completed.
  var renderNeeded = false;
  var rendering = false;

  StorytellerUtils.assertIsOneOfTypes(storyUid, 'string');
  StorytellerUtils.assertInstanceOf($container, $);
  StorytellerUtils.assertInstanceOf(insertionHint, $);
  StorytellerUtils.assertInstanceOf(richTextEditorManager, RichTextEditorManager);

  $container.addClass('story');
  $container.add(insertionHint).attr('data-story-uid', storyUid);

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
   * in actual usage, that `window.socrata.storyStore` is
   * undefined when the StoryRenderer attempts to query it for data).
   *
   * For lack of a better solution, we now have a `.destroy()` method on
   * renderers that can be called to remove event listeners and do any other
   * cleanup that may become necessary in the future.
   */
  this.destroy = function() {
    destroyed = true;
    _detachEvents();
  };

  /**
   * Private methods
   */

  function _listenForChanges() {

    storyStore.addChangeListener(function() {
      _renderStory();
    });

    dropHintStore.addChangeListener(function() {
      var hintPosition = dropHintStore.getDropHintPosition();

      if (hintPosition && hintPosition.storyUid === storyUid) {
        _showInsertionHintAtIndex(hintPosition.dropIndex);
      } else {
        _hideInsertionHint();
      }
    });

    windowSizeBreakpointStore.addChangeListener(_applyWindowSizeClass);
    _applyWindowSizeClass();
  }

  function _attachEvents() {

    $(window).on('resize', _throttledRender);

    $container.on(
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

    $container.on(
      'click',
      '[data-block-delete-action]',
      function(event) {
        var blockId = event.target.getAttribute('data-block-id');
        var shouldDelete = true;

        if (blockRemovalConfirmationStore.needsConfirmation(blockId)) {
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

    $container.on(
      'click',
      '[data-block-presentation-action]',
      function(event) {
        var blockId = event.target.getAttribute('data-block-id');

        dispatcher.dispatch({
          action: event.target.getAttribute('data-block-presentation-action'),
          blockId: blockId
        });
      }
    );

    $container.on('dblclick', '.block', function(event) {
      var blockId = event.currentTarget.getAttribute('data-block-id');

      if (blockId) {
        dispatcher.dispatch({
          action: Actions.BLOCK_DOUBLE_CLICK,
          storyUid: storyUid,
          blockId: blockId
        });
      }
    });

    // Update the toolbar's formats, but only once things have settled down.
    // Also, since sometimes this event is triggered by action handlers (updating
    // Squire's contents, etc), we need to make sure we defer, as otherwise the Flux
    // dispatcher will complain that we're attempting to dispatch within a dispatch.
    // debounce() will always at least defer.
    var deferredAndDebouncedFormatChangeHandler = _.debounce(function(content) {
      dispatcher.dispatch({
        action: Actions.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS,
        activeFormats: content
      });
    });

    $container.on('rich-text-editor::format-change', function(event) {
      deferredAndDebouncedFormatChangeHandler(event.originalEvent.detail.content);
    });

    // Handle updates to block content.
    $container.on('rich-text-editor::content-change', function(event) {
      var blockId = StorytellerUtils.findClosestAttribute(event.target, 'data-block-id');
      var componentIndex = StorytellerUtils.findClosestAttribute(event.target, 'data-component-index');

      var blockContent = event.originalEvent.detail.content;
      var editor = event.originalEvent.detail.editor;

      var currentContent = _.get(storyStore.getBlockComponentAtIndex(blockId, componentIndex), 'value');

      if (editor.contentDiffersFrom(currentContent)) {
        dispatcher.dispatch({
          action: Actions.BLOCK_UPDATE_COMPONENT,
          blockId: blockId,
          componentIndex: componentIndex,
          type: 'html',
          value: blockContent
        });
      }
    });

    $container.on('rich-text-editor::height-change', _renderStory);
    $container.on('component::height-change', _renderStory);

    $container.on('click', '[data-action]', function() {
      var action = this.getAttribute('data-action');

      switch (action) {

        case Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT:
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
            blockId: StorytellerUtils.findClosestAttribute(this, 'data-block-id'),
            componentIndex: StorytellerUtils.findClosestAttribute(this, 'data-component-index')
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

  function _applyWindowSizeClass() {
    var windowSizeClass = windowSizeBreakpointStore.getWindowSizeClass();
    var unusedWindowSizeClasses = windowSizeBreakpointStore.getUnusedWindowSizeClasses();

    $container.
      removeClass(unusedWindowSizeClasses.join(' ')).
      addClass(windowSizeClass);
  }

  /**
   * Story-level rendering operations
   */

  function _renderStory() {
    if (destroyed) { return; }

    // Reentrant call to _renderStory. Defer this render
    // until the original _renderStory is done.
    if (rendering) {
      renderNeeded = true;
      return;
    }

    rendering = true;

    var blockIds = storyStore.getStoryBlockIds(storyUid);
    var blockIdsToRemove = elementCache.getUnusedBlockIds(blockIds);
    var blockCount = blockIds.length;
    var layoutHeight = 0;

    blockIdsToRemove.forEach(function(blockId) {
      storyStore.
        getBlockComponents(blockId).
        forEach(function(componentDatum, i) {
          var componentElement = elementCache.getComponent(blockId, i);

          componentElement.find('.component').trigger('destroy');
        });

      elementCache.getBlock(blockId).remove();
      elementCache.flushBlock(blockId);
    });

    // Display a message if there are no blocks in the story
    _handleEmptyStoryMessage();

    // Render all the blocks at once, to mitigate DOM thrashing.
    blockIds.forEach(function(blockId, i) {

      var $blockElement = elementCache.getBlock(blockId);

      if ($blockElement === null) {
        $blockElement = _renderBlock(blockId);
        $container.append($blockElement);
        _toggleBlockEditActive($blockElement);
      }

      _renderBlockComponents(blockId);

      // Disable or enable buttons depending on the index of this block
      // relative to the total number of blocks.
      // E.g. disable the 'move up' button for the first block and the
      // 'move down' button for the last block.
      _updateBlockEditControls(blockId, $blockElement, i, blockCount);
    });

    // Now that all blocks are happy, update editor heights. Do this after
    // the blocks have rendered, otherwise the layout ends up being
    // recomputed N(blocks) times during render.
    blockIds.forEach(function(blockId) {

      var $blockElement = elementCache.getBlock(blockId);

      // Update the height of the containing iframes to be equal to the
      // height of the iframe document's body.
      _updateEditorHeights(blockId, $blockElement);
    });

    // We now know the heights of all blocks. Lay out the blocks vertically.
    // We do this in a separate loop to avoid N(blocks) layouts per render.
    blockIds.forEach(function(blockId, i) {

      var $blockElement = elementCache.getBlock(blockId);

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

    var windowHeight = $(window).height();
    var $parent = $container.parent();
    var padding = ($parent.outerHeight() - $parent.height()) / 2;
    var fixedHeight = windowHeight - $container.offset().top - padding;

    if (fixedHeight > layoutHeight) {
      $container.height(fixedHeight);
    } else {
      $container.height(layoutHeight);
    }

    rendering = false;

    // There were reentrant call(s) to _renderStory.
    // Take care of those now.
    if (renderNeeded) {
      renderNeeded = false;
      _renderStory();
    }
  }

  /**
   * @function _toggleBlockEditActive
   * @desc Toggle the opacity of the controls due to a bug in IE11.
   * @param {jQuery} $blockElement
   */
  function _toggleBlockEditActive($blockElement) {
    $blockElement.
      mouseenter(function() {
        $blockElement.addClass('active');
      }).
      mouseleave(function() {
        $blockElement.removeClass('active');
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

  function _handleEmptyStoryMessage() {
    if (!_.isEmpty(warningMessageElement)) {
      var blockCount = storyStore.getStoryBlockIds(storyUid).length;

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
      throw new Error(
        '`blockId` must be a string (is of type ' +
        (typeof blockId) +
        ').'
      );
    }

    var layout = storyStore.getBlockLayout(blockId);
    var componentWidths = layout.split('-');
    var componentContainers = componentWidths.map(function(componentWidth, i) {
      return $(
        '<div>',
        {
          'class': StorytellerUtils.format('component-container col{0}', componentWidth),
          'data-component-layout-width': componentWidth,
          'data-component-index': i
        }
      );
    });

    if (layout === '12-12-12-12') {
      var blockOne = componentContainers.slice(0, 2);
      var blockTwo = componentContainers.slice(2, 4);

      componentContainers = [
        $('<div>', {class: 'col6 text-top-media'}).append(blockOne),
        $('<div>', {class: 'col6 text-top-media'}).append(blockTwo)
      ];
    }

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

  function _templateFlyout(className, content) {
    return $(StorytellerUtils.format('<div class="{0} flyout flyout-hidden">', className)).
      append([
        $('<section class="flyout-content">').append(content)
      ]);
  }

  function _renderBlockEditControls(blockId) {

    var isPresentable = storyStore.isBlockPresentable(blockId);
    var togglePresentationClassNames = StorytellerUtils.format(
      'block-edit-controls-toggle-presentation-btn btn btn-alternate-2 icon-eye-blocked{0}',
      isPresentable ? '' : ' active'
    );

    var $moveUpButton = $(
      '<span>',
      {
        'class': 'block-edit-controls-move-up-btn btn btn-alternate-2 icon-arrow-up',
        'data-block-id': blockId,
        'data-block-move-action': Actions.STORY_MOVE_BLOCK_UP
      }
    );

    var $moveDownButton = $(
      '<span>',
      {
        'class': 'block-edit-controls-move-down-btn btn btn-alternate-2 icon-arrow-down',
        'data-block-id': blockId,
        'data-block-move-action': Actions.STORY_MOVE_BLOCK_DOWN
      }
    );

    var $moveUpFlyout = _templateFlyout(
      'block-edit-controls-move-up-flyout',
      StorytellerUtils.format('<p>{0}</p>', I18n.t('editor.block_edit_controls.move_block_up_flyout'))
    );

    var $moveDownFlyout = _templateFlyout(
      'block-edit-controls-move-down-flyout',
      StorytellerUtils.format('<p>{0}</p>', I18n.t('editor.block_edit_controls.move_block_down_flyout'))
    );

    var $presentationFlyout = _templateFlyout(
      'block-edit-controls-presentation-flyout',
      StorytellerUtils.format('<p>{0}</p>',
        isPresentable ?
          I18n.t('editor.block_edit_controls.presentation_hide_flyout') :
          I18n.t('editor.block_edit_controls.presentation_show_flyout')
       )
    );

    var $presentationToggleButton = $(
      '<span>',
      {
        'class': togglePresentationClassNames,
        'data-block-id': blockId,
        'data-block-presentation-action': Actions.STORY_TOGGLE_BLOCK_PRESENTATION_VISIBILITY,
        'data-flyout': 'block-edit-controls-presentation-flyout'
      }
    );

    $presentationToggleButton.
      on('mouseover', function() {
        $presentationFlyout.removeClass('flyout-hidden');
      }).
      on('mouseout', function() {
        $presentationFlyout.addClass('flyout-hidden');
      });

    $moveUpButton.
      on('mouseover', function() {
        $moveUpFlyout.removeClass('flyout-hidden');
      }).
      on('mouseout', function() {
        $moveUpFlyout.addClass('flyout-hidden');
      });

    $moveDownButton.
      on('mouseover', function() {
        $moveDownFlyout.removeClass('flyout-hidden');
      }).
      on('mouseout', function() {
        $moveDownFlyout.addClass('flyout-hidden');
      });

    var blockEditControls = $(
      '<div>',
      {
        'class': 'block-edit-controls'
      }
    ).append([
      $moveUpButton,
      $moveDownButton,
      $presentationToggleButton,
      $(
        '<span>',
        {
          'class': 'block-edit-controls-delete-btn btn btn-alternate-2 icon-close-2',
          'data-block-id': blockId,
          'data-block-delete-action': Actions.STORY_DELETE_BLOCK
        }
      ),
      $presentationFlyout,
      $moveUpFlyout,
      $moveDownFlyout
    ]);


    return blockEditControls;
  }

  function _updateBlockEditControls(blockId, $blockElement, blockIndex, blockCount) {

    var isPresentable = storyStore.isBlockPresentable(blockId);
    var moveUpButton = $blockElement.find('.block-edit-controls-move-up-btn');
    var moveDownButton = $blockElement.find('.block-edit-controls-move-down-btn');
    var togglePresentationVisibilityButton = $blockElement.find('.block-edit-controls-toggle-presentation-btn');
    var togglePresentationVisibilityFlyout = $blockElement.find('.block-edit-controls-presentation-flyout');

    moveUpButton.prop('disabled', blockIndex === 0);
    moveDownButton.prop('disabled', blockIndex === (blockCount - 1));
    togglePresentationVisibilityButton.toggleClass('active', !storyStore.isBlockPresentable(blockId));
    togglePresentationVisibilityFlyout.find('.flyout-content p').text(
        isPresentable ?
          I18n.t('editor.block_edit_controls.presentation_hide_flyout') :
          I18n.t('editor.block_edit_controls.presentation_show_flyout')
    );
  }

  function getHTMLComponentHeight($component) {
    var editor = richTextEditorManager.getEditor(
      $component.children(':first').attr('data-editor-id')
    );

    return editor ? editor.getContentHeight() : 0;
  }

  function getHeroComponentHeight($component) {
    var heroHeight = $component.height();
    var editor = richTextEditorManager.getEditor(
      $component.attr('data-editor-id')
    );

    return editor ? Math.max(editor.getContentHeight(), heroHeight) : heroHeight;
  }

  function getGenericComponentHeight($component) {
    return $component.outerHeight(true) - 1;
  }

  function setHeightToContentHeight() {
    var editor = richTextEditorManager.getEditor(
      $(this).parent('[data-editor-id]').attr('data-editor-id')
    );

    if (editor) {
      $(this).height(editor.getContentHeight());
    }
  }

  function contentMissingCheck(iframe) {
    var contentDocument = iframe.contentDocument;
    // If we have a height, then we have a loaded Squire instance.
    return !contentDocument ||
      (contentDocument && contentDocument.body && contentDocument.body.clientHeight === 0);
  }

  function _updateEditorHeights(blockId, $blockElement) {
    var contentHeight = 0;
    var maxEditorHeight = 0;
    var componentData = storyStore.getBlockComponents(blockId);
    var $iframes = $blockElement.find('.component-html iframe');
    var isTextTopMediaBlock = $blockElement.find('.text-top-media').length > 0;
    var iframeContentMissing = $iframes.toArray().some(contentMissingCheck);

    if (isTextTopMediaBlock) {
      $iframes.each(setHeightToContentHeight);
    } else {
      componentData.forEach(function(componentDatum, i) {
        var $component = $blockElement.find('.component-container').eq(i);

        if (componentDatum.type === 'html') {
          contentHeight = getHTMLComponentHeight($component);
        } else if (componentDatum.type === 'hero') {
          contentHeight = getHeroComponentHeight($blockElement.find('.component-hero'));
        } else if (!$component.hasClass('col12')) {
          contentHeight = getGenericComponentHeight($component);
        }

        maxEditorHeight = Math.max(
          maxEditorHeight,
          contentHeight
        );
      });

      // If the iframe hasn't rendered, we'll fall on the phantom editor
      // with the greatest height. Phantom editors are generated in componentHtml.
      if (iframeContentMissing) {
        var $elements = $blockElement.find('div.typeset');

        maxEditorHeight = _.chain($elements).
          map($).
          invoke('outerHeight', true).
          concat(maxEditorHeight).
          max().value();
      }

      $blockElement.
        find('.component-container > .component-html > iframe').
        height(maxEditorHeight);
    }
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
  function _runComponentRenderer(componentRenderer, $componentContainer, componentData, theme) {
    var $componentContent = $componentContainer.children().eq(0);

    var needToChangeRenderer =
      componentRenderer !== $componentContainer.attr('data-component-renderer-name');

    if (needToChangeRenderer) {
      $componentContainer.attr('data-component-renderer-name', componentRenderer);

      $componentContent = $('<div>', { 'class': 'component' });

      $componentContainer.find('.component').trigger('destroy');

      $componentContainer.
        empty().
        append($componentContent);
    }

    // Provide the initial or updated data to the renderer.
    $componentContent[componentRenderer](componentData, theme, { editMode: true });
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
      StorytellerUtils.assert(
        $componentContainer.length > 0,
        StorytellerUtils.format(
          'Could not find component container for blockId: {0}, componentIndex: {1}',
          blockId,
          componentIndex
        )
      );
      elementCache.setComponent(blockId, componentIndex, $componentContainer);
    }

    StorytellerUtils.assertInstanceOf($componentContainer, $);

    return $componentContainer;
  }

  function _renderBlockComponents(blockId) {
    var components = storyStore.getBlockComponents(blockId);
    var theme = storyStore.getStoryTheme(storyUid);

    components.forEach(function(componentData, componentIndex) {
      try {
        var componentRenderer = _findAppropriateComponentRenderer(componentData);
        var $componentContainer = _getComponentContainer(blockId, componentIndex);

        _runComponentRenderer(componentRenderer, $componentContainer, componentData, theme);
      } catch (e) {
        if (exceptionNotifier) {
          exceptionNotifier.notify(e);
        } else if (console && console.error) {
          console.error(e);
        }
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

  function _layoutBlock($blockElement, layoutHeight) {

    var translation = 'translate(0,' + layoutHeight + 'px)';

    $blockElement.attr('data-translate-y', layoutHeight);
    $blockElement.css('transform', translation);

    return $blockElement.outerHeight(true);
  }

  // Component renderers are implemented as jQuery plugins.
  // This function maps component data (type, value) to
  // a jQuery plugin name ('storytellerComponentText').
  function _findAppropriateComponentRenderer(componentData) {
    StorytellerUtils.assertHasProperties(componentData, 'type');

    switch (componentData.type) {
      case 'html':
        return 'componentHTML';
      case 'spacer':
        return 'componentSpacer';
      case 'horizontalRule':
        return 'componentHorizontalRule';
      case 'assetSelector':
        return 'componentAssetSelector';
      case 'author':
        return 'componentAuthor';
      case 'image':
        return 'componentImage';
      case 'hero':
        return 'componentHero';
      case 'story.tile':
      case 'story.widget':
        return 'componentStoryTile';
      case 'goal.tile':
        return 'componentGoalTile';
      case 'youtube.video':
        return 'componentYoutubeVideo';
      case 'socrata.visualization.classic':
        return 'componentSocrataVisualizationClassic';
      case 'socrata.visualization.choroplethMap':
        return 'componentSocrataVisualizationChoroplethMap';
      case 'socrata.visualization.columnChart':
        return 'componentSocrataVisualizationColumnChart';
      case 'socrata.visualization.timelineChart':
        return 'componentSocrataVisualizationTimelineChart';
      case 'socrata.visualization.table':
        return 'componentSocrataVisualizationTable';
      case 'socrata.visualization.featureMap':
        return 'componentSocrataVisualizationFeatureMap';
      case 'embeddedHtml':
        return 'componentEmbeddedHtml';
      default:
        throw new Error(
          StorytellerUtils.format(
            'No component renderer found for component: {0}',
            JSON.stringify(componentData)
          )
        );
    }
  }
}
