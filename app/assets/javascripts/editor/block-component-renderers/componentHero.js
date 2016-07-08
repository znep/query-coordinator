import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import '../withLayoutHeightFromComponentData';
import './componentHTML';
import I18n from '../I18n';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import Actions from '../Actions';
import { storyStore } from '../stores/StoryStore';
import { richTextEditorManager } from '../RichTextEditorManager';
import { dispatcher } from '../Dispatcher';

var DEFAULT_HEIGHT_PX = 300;

$.fn.componentHero = componentHero;

export default function componentHero(componentData, theme, options) {
  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'hero',
    StorytellerUtils.format(
      'componentHero: Unsupported component type {0}',
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

    updateHeight();
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

function templateHeroText() {
  return '<div class="hero-text"></div>';
}

function templateUnconfiguredHero() {
  /* eslint-disable indent */
  return [
    '<div class="hero hero-unconfigured" data-url="" data-crop="{}">',
      templateHeroText(),
      '<div class="hero-add-controls">',
        '<img src="{coverImageUrl}" alt="Add Cover Image">',
        '<button class="btn btn-primary">{coverImage}</button>',
      '</div>',
    '</div>'
  ].join('');
  /* eslint-enable indent */
}

function templateHero() {
  /* eslint-disable indent */
  return [
    '<div class="hero">',
      templateHeroText(),
    '</div>'
  ].join('');
  /* eslint-enable indent */
}

function renderUnconfiguredHero($element) {
  var text = I18n.t('editor.components.hero.set_cover_image');
  var formatters = {
    coverImage: text,
    coverImageUrl: Environment.IMAGES.COVER_IMAGE_ICON
  };
  var $template = $(
    StorytellerUtils.format(
      templateUnconfiguredHero(),
      formatters
    )
  );

  $template.
    click(launchImageSelection);

  $element.find('.hero-text').triggerHandler('destroy');

  $element.
    find('.hero').
    remove();
  $element.
    find('.hero').
    attr('data-url', '').
    attr('data-crop', '{}');

  $element.
    addClass(typeClass()).
    append($template);
}

function renderHero($element, componentData) {
  assertComponentDataStructure(componentData);

  var url = componentData.value.url;
  var crop = JSON.stringify(_.get(componentData, 'value.crop', {}));
  var formatters = {image: url};
  var $template = $(StorytellerUtils.format(templateHero(), formatters));

  $element.
    find('.hero-text').
    triggerHandler('destroy');

  $element.
    find('.hero').
    remove();

  $element.
    addClass(typeClass()).
    append($template);

  $element.
    find('.hero').
    attr('data-crop', crop).
    attr('data-url', url);

  $template.css(
    'background-image',
    StorytellerUtils.format(
      'url({0}), {1}',
      url,
      $template.css('background-image')
    )
  );
}

function updateHero($element, componentData) {
  assertComponentDataStructure(componentData);

  var $hero = $element.find('.hero');
  var url = $hero.attr('data-url');
  var crop = JSON.parse($hero.attr('data-crop'));
  var componentDataCrop = JSON.stringify(_.get(componentData, 'value.crop', {}));

  if (changedImage(url, componentData) || changedCrop(crop, componentData)) {

    // Preserve background-images, such as linear gradients.
    var backgroundImage = StorytellerUtils.format(
      'url({0}), {1}',
      appendSaltToSource(componentData.value.url),
      $hero.
        css('background-image').
        replace(/url\([^)]+\)\s*,/, '').
        trim()
    );

    $hero.
      attr('data-url', componentData.value.url).
      attr('data-crop', componentDataCrop).
      css('background-image', backgroundImage);
  }
}

function contentChanged(event) {
  event.stopPropagation(); // Otherwise StoryRenderer will attempt to treat this as an HTML component.

  var html = event.originalEvent.detail.content;

  var blockId = StorytellerUtils.findClosestAttribute(event.target, 'data-block-id');
  var componentIndex = parseInt(StorytellerUtils.findClosestAttribute(event.target, 'data-component-index'), 10);

  var value = storyStore.getBlockComponentAtIndex(blockId, componentIndex).value;
  _.set(value, 'html', html);

  dispatcher.dispatch({
    action: Actions.BLOCK_UPDATE_COMPONENT,
    blockId: blockId,
    componentIndex: componentIndex,
    type: 'hero',
    value: value
  });
}

function assertComponentDataStructure(componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'value');
  StorytellerUtils.assertHasProperty(componentData.value, 'documentId');
  StorytellerUtils.assertHasProperty(componentData.value, 'url');
}

function typeClass() {
  return StorytellerUtils.typeToClassNameForComponentType('hero');
}

function getComponentMetadata($element) {
  var blockId = StorytellerUtils.findClosestAttribute($element, 'data-block-id');
  var componentIndexString = StorytellerUtils.findClosestAttribute($element, 'data-component-index');
  var componentIndex = parseInt(componentIndexString, 10);

  return {
    blockId: blockId,
    componentIndex: componentIndex
  };
}

function launchImageSelection() {
  var componentMetadata = getComponentMetadata(this);
  var componentProperties = storyStore.
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

function changedCrop(crop, componentData) {
  return !_.isEqual(crop, _.get(componentData, 'value.crop', {}));
}

function synthesizeRichTextEditorData(componentData) {
  return {
    type: 'html',
    value: _.get(componentData, 'value.html', '')
  };
}

function getEditorOrNull() {
  var editorId = $(this).find('[data-editor-id]').attr('data-editor-id');
  return editorId ? richTextEditorManager.getEditor(editorId) : null;
}

function appendSaltToSource(src) {
  var now = Date.now();
  return _.includes(src, '?') ?
    src + '&salt=' + now :
    src + '?' + now;
}
