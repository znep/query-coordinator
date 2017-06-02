import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import '../withLayoutHeightFromComponentData';
import './componentHTML';
import I18n from '../I18n';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertHasProperty, assertHasProperties } from 'common/js_utils';
import Actions from '../Actions';
import { storyStore } from '../stores/StoryStore';
import { richTextEditorManager } from '../RichTextEditorManager';
import { dispatcher } from '../Dispatcher';

var DEFAULT_HEIGHT_PX = 300;

$.fn.componentHero = componentHero;

export default function componentHero(props) {
  const $this = $(this);

  const editor = getEditorOrNull.call($this);
  const hasComponentData = notEmpty(props.componentData);

  props = _.extend(
    {
      resizeSupported: hasComponentData,
      editButtonSupported: hasComponentData,
      resizeOptions: {
        minHeight: editor && editor.getContentHeight() || 150
      },
      defaultHeight: DEFAULT_HEIGHT_PX,
      dataChangedCallback: onDataChanged,
      firstRenderCallback: onFirstRender
    },
    props
  );

  const {
    blockId,
    componentIndex,
    componentData,
    theme,
    editMode,
    defaultHeight
  } = props;

  assertHasProperties(componentData, 'type');
  assert(
    componentData.type === 'hero',
    `componentHero: Unsupported component type ${componentData.type}`
  );

  function onDataChanged(newComponentData) {
    updateHeight.call(this);

    if (!editMode) { return; }

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
    const buttonHeight = $this.find('.hero-add-controls').outerHeight(true) || 0;
    const editorHeight = getEditorOrNull.call($this) ?
      $this.find('.component-html').outerHeight(true) :
      $this.find('.typeset').outerHeight();

    return Math.max(
      editorHeight + buttonHeight,
      _.get($this.data('component-rendered-data'), 'value.layout.height', DEFAULT_HEIGHT_PX)
    );
  }

  function updateEditorIframeHeight() {
    const editorOrNull = getEditorOrNull.call($this);

    if (editorOrNull) {
      $this.find('.component-html iframe').height(editorOrNull.getContentHeight());
    }
  }

  function updateHeight() {
    updateEditorIframeHeight();

    const augmentedComponentData = _.cloneDeep($this.data('component-rendered-data'));
    _.set(augmentedComponentData, 'value.layout.height', computeHeight());

    $this.data('component-rendered-data', augmentedComponentData);
    $this.withLayoutHeightFromComponentData(augmentedComponentData, defaultHeight);
  }

  $this.componentBase(props);

  // Delegate to child components.
  if (editMode && this.find('.hero-text').length > 0) {
    this.find('.hero-text').componentHTML({
      blockId,
      componentIndex,
      theme,
      extraContentClasses: [ 'hero-body', 'remove-top-margin' ],
      componentData: synthesizeRichTextEditorData(componentData)
    });
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
  const text = I18n.t('editor.components.hero.set_cover_image');
  const formatters = {
    coverImage: text,
    coverImageUrl: Environment.IMAGES.COVER_IMAGE_ICON
  };
  const $template = $(
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

  const url = componentData.value.url;
  const crop = JSON.stringify(_.get(componentData, 'value.crop', {}));
  const formatters = {image: url};
  const $template = $(StorytellerUtils.format(templateHero(), formatters));

  $element.
    find('.hero-text').
    triggerHandler('destroy');

  $element.
    find('.hero').
    remove();

  $element.
    addClass(typeClass());

  $template.
    insertBefore($element.find('.component-edit-move-action-overlay'));

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

  const $hero = $element.find('.hero');
  const url = $hero.attr('data-url');
  const crop = JSON.parse($hero.attr('data-crop'));
  const componentDataCrop = JSON.stringify(_.get(componentData, 'value.crop', {}));

  if (changedImage(url, componentData) || changedCrop(crop, componentData)) {

    const saltedUrl = appendSaltToSource(componentData.value.url);
    const backgroundImageStyles = $hero.css('background-image').replace(/url\([^)]+\)\s*,/, '').trim();

    // Preserve background-images, such as linear gradients.
    const backgroundImage = `url(${saltedUrl}), ${backgroundImageStyles}`;

    $hero.
      attr('data-url', componentData.value.url).
      attr('data-crop', componentDataCrop).
      css('background-image', backgroundImage);
  }
}

function contentChanged(event) {
  event.stopPropagation(); // Otherwise StoryRenderer will attempt to treat this as an HTML component.

  const { blockId, componentIndex } = StorytellerUtils.findBlockIdAndComponentIndex(event.target);
  const html = event.originalEvent.detail.content;

  const value = storyStore.getBlockComponentAtIndex(blockId, componentIndex).value;
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
  assertHasProperty(componentData, 'value');
  assertHasProperty(componentData.value, 'documentId');
  assertHasProperty(componentData.value, 'url');
}

function typeClass() {
  return StorytellerUtils.typeToClassNameForComponentType('hero');
}

function launchImageSelection() {
  const { blockId, componentIndex } = StorytellerUtils.findBlockIdAndComponentIndex(this);
  const componentProperties = storyStore.getBlockComponentAtIndex(blockId, componentIndex).value;

  dispatcher.dispatch({
    action: Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT,
    blockId,
    componentIndex,
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
  const editorId = $(this).find('[data-editor-id]').attr('data-editor-id');
  return editorId ? richTextEditorManager.getEditor(editorId) : null;
}

function appendSaltToSource(src) {
  const now = Date.now();
  return _.includes(src, '?') ?
    src + '&salt=' + now :
    src + '?' + now;
}
