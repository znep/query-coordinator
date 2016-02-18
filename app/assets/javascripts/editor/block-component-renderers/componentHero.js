(function(window, $) {

  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function templateUnconfiguredHero() {
    return [
      '<div class="hero hero-unconfigured">',
        '<img src="{coverImageUrl}" alt="Add Cover Image">',
        '<button class="btn-primary">{coverImage}</button>',
      '</div>'
    ].join('');
  }

  function templateHero() {
    return [
      '<div class="hero" data-url="{image}"></div>'
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
      addClass('hero-height-override').
      click(launchImageSelection);

    $element.
      find('.hero').
      remove();
    $element.
      addClass(typeClass()).
      append($template);
  }

  function renderHero($element, componentData /*, theme */) {
    assertComponentDataStructure(componentData);

    var url = componentData.value.url;
    var formatters = {image: url};
    var $template = $(templateHero().format(formatters));

    /**
     * To be released in another iteration.
    var editorId = _.uniqueId();
    var editor = storyteller.richTextEditorManager.createEditor(
      $template,
      editorId,
      (componentData.value.html = '<h1>Hello, World!</h1>')
    );

    $template.
      find('iframe').
      one('load', applyStyles(editor, theme));
    $template.
      on('rich-text-editor::content-change', contentChanged);
    */

    $element.
      find('.hero').
      remove();
    $element.
      attr('data-url', url).
      // attr('data-editor-id', editorId).
      addClass(typeClass()).
      append($template);

    $template.
      toggleClass(
        'hero-height-override',
        !_.get(componentData, 'value.layout.height')
      ).
      css(
        'background-image',
        'url({0}), {1}'.format(url, $template.css('background-image'))
      );
  }

  function updateHero($element, componentData) {
    assertComponentDataStructure(componentData);

    var $hero = $element.find('.hero');
    var url = $hero.attr('data-url');
    // var html = getEditor().getContent();

    $hero.
      toggleClass(
        'hero-height-override',
        !_.get(componentData, 'value.layout.height')
      );

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

    /**
     * To be released in another iteration.
    if (changedText(html, componentData)) {
      getEditor($element).setContent(html);
    };
    */
  }

  /**
   * To be released in another iteration.
  function contentChanged(event) {
    event.stopPropagation();

    var breakTagRegexp = /<br>/g;
    var blockId = utils.findClosestAttribute(event.target, 'data-block-id');
    var blockContent = event.originalEvent.detail.content;

    var componentIndex = utils.findClosestAttribute(event.target, 'data-component-index');
    var component = storyteller.storyStore.getBlockComponentAtIndex(blockId, componentIndex);

    var existingComponentValue = component.value.html ?
      component.value.html.replace(breakTagRegexp, '') :
      '';
    var newComponentValue = blockContent.replace(breakTagRegexp, '');

    var contentIsDifferent = (
      existingComponentValue !== newComponentValue
    );

    if (contentIsDifferent) {
      component.value.html = blockContent;

      storyteller.dispatcher.dispatch({
        action: Actions.BLOCK_UPDATE_COMPONENT,
        blockId: blockId,
        componentIndex: componentIndex,
        type: 'hero',
        value: component.value
      });
    }
  }

  function applyStyles(editor, theme) {
    return function() {
      editor.applyThemeClass(theme);
      applyThemeFontIfPresent(editor, theme);
      this.contentWindow.document.body.classList.add('hero-body');
    };
  }

  function applyThemeFontIfPresent(editor, theme) {
    var customTheme = _.find(window.customThemes, { 'id': parseInt(theme.replace('custom-', ''), 10) });

    if (_.has(customTheme, 'google_font_code')) {
      editor.applyThemeFont(customTheme.google_font_code);
    }
  }
  */

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

    dispatcher.dispatch({
      action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
      blockId: componentMetadata.blockId,
      componentIndex: componentMetadata.componentIndex
    });

    dispatcher.dispatch({
      action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
      provider: 'HERO'
    });
  }

  function getEditor($element) {
    return storyteller.richTextEditorManager.getEditor(
      $element && $element.attr('data-editor-id')
    );
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

  /**
   * To be released in another iteration.
  function changedText(html, componentData, resolutionTree) {
    return html !== componentData.value.html;
  }
  */

  function componentHero(componentData, theme, options) {
    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'hero',
      'componentHero: Unsupported component type {0}'.format(
        componentData.type
      )
    );

    var $this = $(this);
    var defaultOptions = {
      resizeSupported: true,
      editMode: true,
      editButtonSupported: notEmpty(componentData),
      resizeOptions: {
        minHeight: getEditor() && getEditor().getContentHeight() || 150
      }
    };

    $this.componentBase(
      componentData,
      theme,
      _.extend(defaultOptions, options)
    );

    if (empty(componentData) && notRendered($this)) {
      renderUnconfiguredHero($this, componentData);
    } else if (rendered($this)) {
      updateHero($this, componentData);
    } else if (notEmpty(componentData)) {
      renderHero($this, componentData, theme);
    }

    return $this;
  }

  $.fn.componentHero = componentHero;
})(window, jQuery);
