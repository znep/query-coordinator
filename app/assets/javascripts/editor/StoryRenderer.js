;var StoryRenderer = (function() {

  'use strict';

  function StoryRenderer(inspirationStory, userStory, textEditorManager) {

    var BLOCK_VERTICAL_PADDING = 20;
    var hasInspirationStory = false;
    var inspirationStoryError = $('.inspiration-story-error');
    var inspirationStoryContainer = $('.inspiration-story');
    var inspirationStoryScaleFactor = 0.5;

    var userStoryContainer = $('.user-story');
    var userStoryScaleFactor = 1;

    var insertionHint = $('.user-story-insertion-hint');
    var insertionHintHeight = insertionHint.outerHeight(true);
    var insertionHintIndex = -1;

    var storyRenderers = {
      'INSPIRATION_STORY': function() {
        _renderStory({
          story: 'INSPIRATION_STORY',
          container: inspirationStoryContainer,
          model: inspirationStory,
          editable: false,
          scaleFactor: inspirationStoryScaleFactor
        });
      },
      'INSPIRATION_STORY_ERROR': function() {
        inspirationStoryError.removeClass('hidden');
      },
      'USER_STORY': function() {
        _renderStory({
          story: 'USER_STORY',
          container: userStoryContainer,
          model: userStory,
          editable: true,
          scaleFactor: userStoryScaleFactor
        });
      }
    };

    var componentRenderers = {
      'text': _renderTextComponent,
      'image': _renderImageComponent,
      'visualization': _renderVisualizationComponent
    };

    var blockCache = {};

    if (inspirationStory instanceof Story) {
      hasInspirationStory = true;
    }

    if (!userStory instanceof Story) {
      throw new Error(
        '`userStory` must be a Story (is a ' +
        (typeof userStory) +
        ').'
      );
    }

    /**
     * Public methods
     */

    this.renderInspirationStory = function() {
      if (hasInspirationStory) {
        storyRenderers['INSPIRATION_STORY']();
      } else {
        storyRenderers['INSPIRATION_STORY_ERROR']();
      }
    };

    this.renderUserStory = function() {
      storyRenderers['USER_STORY']();
    };

    this.showInsertionHintAtIndex = function(index) {
      insertionHintIndex = index;
    };

    this.hideInsertionHint = function() {
      insertionHintIndex = -1;
    };

    /**
     * Private methods
     */

    function _cacheBlockElement(block, blockElement) {

      var blockId = block.getId();

      blockCache[blockId] = blockElement;
    }

    function _removeCachedBlockElement(block) {

      var blockId = block.getId();

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

    function _renderStory(options) {

      var story = options.story;
      var container = options.container;
      var model = options.model;
      var editable = options.editable;
      var scaleFactor = options.scaleFactor;
      var blocks = model.getBlocks();
      var renderedBlocks;
      var layoutHeight;

      // Render each block.
      renderedBlocks = blocks.
        map(function(block) {

          if (!_blockElementIsCached(block)) {
            var newBlock = _renderBlock(story, block, editable);
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
        if (insertionHintIndex === i) {

          translation = 'translate(0,' + layoutHeight + 'px)';
          insertionHint.css('transform', translation).removeClass('hidden');
          layoutHeight += insertionHintHeight + BLOCK_VERTICAL_PADDING;
        }

        // Render the current block according to the current layout height.
        translation = 'translate(0,' + layoutHeight + 'px)';
        blockElement.css('transform', translation);
        layoutHeight += blockElement.outerHeight(true) + BLOCK_VERTICAL_PADDING;
      });

      container.height(layoutHeight * scaleFactor);
    }

    function _renderBlock(story, block, editable) {

      if (!(block instanceof Block)) {
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
        throw new Error(
          'number of layout components does not equal number of components'
        );
      }

      componentOptions = {
        story: story,
        block: block,
        editable: editable
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

      if (options.editable) {

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
        storyRenderers[options.story]();
      };

      return component;
    }

    function _renderVisualizationComponent(options) {
      return $('<img>', { src: '/stories/' + options.componentValue });
    }
  }

  return StoryRenderer;
})();
