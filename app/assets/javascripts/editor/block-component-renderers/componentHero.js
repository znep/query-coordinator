(function(window, $) {

  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  var DEFAULT_HEIGHT_PX = 300;

  function templateUnconfiguredHero() {
    return [
      '<div class="hero hero-unconfigured">',
        '<div class="hero-text"></div>',
        '<div class="hero-add-controls">',
          '<img src="{coverImageUrl}" alt="Add Cover Image">',
          '<button class="btn-primary">{coverImage}</button>',
        '</div>',
      '</div>'
    ].join('');
  }

  function templateHero() {
    return [
      '<div class="hero" data-url="{image}"><div class="hero-text"></div></div>'
    ].join('');
  }

  function renderUnconfiguredHero($element) {
    var text = I18n.t('editor.components.hero.set_cover_image');
    var formatters = {
      coverImage: text,
      coverImageUrl: storyteller.assetFinder.getImageAssetPath('cover-image')
    };
    var $template = $(templateUnconfiguredHero().format(formatters));

    $template.
      click(launchImageSelection);

    $element.find('.hero-text').triggerHandler('destroy');
    $element.
      find('.hero').
      remove();
    $element.
      addClass(typeClass()).
      append($template);
  }

  function renderHero($element, componentData) {
    assertComponentDataStructure(componentData);

    var url = componentData.value.url;
    var formatters = {image: url};
    var $template = $(templateHero().format(formatters));

    $element.
      find('.hero-text').
      triggerHandler('destroy');

    $element.
      find('.hero').
      remove();
    $element.
      attr('data-url', url).
      addClass(typeClass()).
      append($template);

    $template.css(
      'background-image',
      'url({0}), {1}'.format(url, $template.css('background-image'))
    );
  }

  function updateHero($element, componentData) {
    assertComponentDataStructure(componentData);

    var $hero = $element.find('.hero');
    var url = $hero.attr('data-url');

    if (changedImage(url, componentData)) {

      // Preserve background-images, such as linear gradients.
      var backgroundImage = 'url({0}), {1}'.format(
        componentData.value.url,
        $hero.
          css('background-image').
          replace(/url\([^)]+\)\s*,/, '').
          trim()
      );

      $hero.
        attr('data-url', componentData.value.url).
        css('background-image', backgroundImage);
    }
  }

  function contentChanged(event) {
    event.stopPropagation(); // Otherwise StoryRenderer will attempt to treat this as an HTML component.

    var html = event.originalEvent.detail.content;

    var blockId = utils.findClosestAttribute(event.target, 'data-block-id');
    var componentIndex = parseInt(utils.findClosestAttribute(event.target, 'data-component-index'), 10);

    var value = storyteller.storyStore.getBlockComponentAtIndex(blockId, componentIndex).value;
    _.set(value, 'html', html);

    storyteller.dispatcher.dispatch({
      action: Actions.BLOCK_UPDATE_COMPONENT,
      blockId: blockId,
      componentIndex: componentIndex,
      type: 'hero',
      value: value
    });
  }

  function assertComponentDataStructure(componentData) {
    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'documentId');
    utils.assertHasProperty(componentData.value, 'url');
  }

  function typeClass() {
    return utils.typeToClassNameForComponentType('hero');
  }

  function getComponentMetadata($element) {
    var blockId = utils.findClosestAttribute($element, 'data-block-id');
    var componentIndexString = utils.findClosestAttribute($element, 'data-component-index');
    var componentIndex = parseInt(componentIndexString, 10);

    return {
      blockId: blockId,
      componentIndex: componentIndex
    };
  }

  function launchImageSelection() {
    var dispatcher = storyteller.dispatcher;
    var componentMetadata = getComponentMetadata(this);
    var componentProperties = storyteller.storyStore.
      getBlockComponentAtIndex(componentMetadata.blockId, componentMetadata.componentIndex).
      value;

    dispatcher.dispatch({
      action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
      blockId: componentMetadata.blockId,
      componentIndex: componentMetadata.componentIndex,
      initialComponentProperties: componentProperties
    });

    dispatcher.dispatch({
      action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
      provider: 'HERO'
    });
  }

  function empty(componentData) {
    return _.isEmpty(componentData.value) || _.isEmpty(componentData.value.url);
  }

  function notEmpty(componentData) {
    return !empty(componentData);
  }

  function rendered($element) {
    return $element.find('.hero:not(.hero-unconfigured)').length === 1;
  }

  function notRendered($element) {
    return $element.find('.hero').length === 0;
  }

  function changedImage(url, componentData) {
    return url !== componentData.value.url;
  }

  function synthesizeRichTextEditorData(componentData) {
    return {
      type: 'html',
      value: _.get(componentData, 'value.html', '')
    };
  }

  function getEditorOrNull() {
    var editorId = $(this).find('[data-editor-id]').attr('data-editor-id');
    return editorId ? storyteller.richTextEditorManager.getEditor(editorId) : null;
  }

  function componentHero(componentData, theme, options) {
    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'hero',
      'componentHero: Unsupported component type {0}'.format(
        componentData.type
      )
    );

    var $this = $(this);

    function getOptions(currentComponentData) {
      var editor = getEditorOrNull.call($this);
      var defaultOptions = {
        resizeSupported: notEmpty(currentComponentData),
        editButtonSupported: notEmpty(currentComponentData),
        resizeOptions: {
          minHeight: editor && editor.getContentHeight() || 150
        },
        defaultHeight: DEFAULT_HEIGHT_PX
      };

      return _.extend({}, options, defaultOptions);
    }


    function onDataChanged(newComponentData) {
      updateHeight.call(this);

      if (!getOptions(newComponentData).editMode) { return; }

      if (empty(newComponentData) && notRendered($this)) {
        renderUnconfiguredHero($this, newComponentData);
      } else if (rendered($this)) {
        updateHero($this, newComponentData);
      } else if (notEmpty(newComponentData)) {
        renderHero($this, newComponentData);
      }
    }

    function onFirstRender() {
      this.on('rich-text-editor::content-change', contentChanged);
      this.on('rich-text-editor::height-change component::height-change', updateHeight);

      this.one('destroy', function() {
        $(this).find('.hero-text').triggerHandler('destroy');
        $(this).off('rich-text-editor::content-change', contentChanged);
        $(this).off('rich-text-editor::height-change component::height-change', updateHeight);
      });
    }

    function computeHeight() {
      var editorHeight = 0;
      var editorIframe = $this.find('iframe');
      var buttonHeight = $this.find('.hero-add-controls').outerHeight(true) || 0;

      var editor = getEditorOrNull.call($this);
      if (editor) {
        editorHeight = $this.find('.component-html').outerHeight(true);
      } else {
        editorHeight = $this.find('.typeset').outerHeight();
      }

      return Math.max(
        editorHeight + buttonHeight,
        _.get($this.data('component-rendered-data'), 'value.layout.height', DEFAULT_HEIGHT_PX)
      );
    }

    function updateEditorIframeHeight() {
      var editor = getEditorOrNull.call($this);
      if (editor) {
        $this.find('.component-html iframe').height(editor.getContentHeight());
      }
    }

    function updateHeight() {
      updateEditorIframeHeight();

      var augmentedComponentData = _.cloneDeep($this.data('component-rendered-data'));
      _.set(augmentedComponentData, 'value.layout.height', computeHeight());
      $this.withLayoutHeightFromComponentData(augmentedComponentData, getOptions(augmentedComponentData).defaultHeight);
    }

    $this.componentBase(
      componentData,
      theme,
      getOptions(componentData),
      onFirstRender,
      onDataChanged
    );

    updateHeight();

    // Delegate to child components.
    if (getOptions(componentData).editMode && this.find('.hero-text').length > 0) {
      this.find('.hero-text').componentHTML(
        synthesizeRichTextEditorData(componentData),
        theme,
        _.extend({}, options, { extraContentClasses: [ 'hero-body', 'remove-top-margin' ] })
      );
    }

    return $this;
  }

  $.fn.componentHero = componentHero;
})(window, jQuery);
