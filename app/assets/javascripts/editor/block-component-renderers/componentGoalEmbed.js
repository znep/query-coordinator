import $ from 'jQuery';

import '../componentBase';
import StorytellerUtils from '../../StorytellerUtils';
import I18n from '../I18n';
import { storyStore } from '../stores/StoryStore';
import Actions from '../Actions';
import { dispatcher } from '../Dispatcher';

// Time we wait for the hieght to settle before we cache it for the next
// page load (so the user doesn't see too much of a page layout change when
// they visit the page).
const HEIGHT_SETTLE_TIME = 5000;

// How often we check the height of the iframe content. We expect only
// one instance of this component to be on the page at once, so this
// should not be too onerous.
const HEIGHT_POLL_INTERVAL = 500;

$.fn.componentGoalEmbed = componentGoalEmbed;

export default function componentGoalEmbed(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'goal.embed',
    StorytellerUtils.format(
      'componentGoalEmbed: Unsupported component type {0}',
      componentData.type
    )
  );

  if ($this.children().length === 0) {
    _renderGoal($this, componentData, options || {});
  }

  _updateSrcAndTitle($this, componentData);
  $this.componentBase(componentData, theme, _.extend(
    {
      editButtonSupported: false // we roll our own with special behavior.
    },
    options
  ));

  return $this;
}

const _debouncedUpdateHeightInComponentData = _.debounce(function($iframeElement, height) {
  const blockId = StorytellerUtils.findClosestAttribute($iframeElement, 'data-block-id');
  const componentIndex = parseInt(StorytellerUtils.findClosestAttribute($iframeElement, 'data-component-index'), 10);

  StorytellerUtils.assertIsOneOfTypes(blockId, 'string');
  StorytellerUtils.assert(_.isFinite(componentIndex));

  let component = storyStore.getBlockComponentAtIndex(blockId, componentIndex);

  if (_.get(component, 'value.cachedHeight') !== height) {
    // This is different from layoutHeight, as this is just a height that is used
    // while the component is loading.
    _.set(component, 'value.cachedHeight', height);
    dispatcher.dispatch({
      action: Actions.BLOCK_UPDATE_COMPONENT,
      blockId: blockId,
      componentIndex: componentIndex,
      type: component.type,
      value: component.value
    });
  }
}, HEIGHT_SETTLE_TIME);

function _renderGoal($element, componentData, options) {
  StorytellerUtils.assertHasProperty(componentData, 'type');

  function monitorHeightChanges() {
    setInterval(() => {
      const iframeBody = _.get($iframeElement, '[0].contentWindow.document.body');
      if (!iframeBody) { return; }
      // Query inner wrapper for height. The site body grows to be as big as the iframe,
      // which means the iframe will never shrink. The inner wrapper takes the proper size
      // of the content.
      const siteInnerWrapper = iframeBody.querySelector('.siteInnerWrapper');
      const newHeight = _.get(siteInnerWrapper, 'scrollHeight');
      if (iframeBody && newHeight !== lastHeight) {
        lastHeight = newHeight;
        $iframeElement.height(newHeight);
        $iframeElement[0].dispatchEvent(
          new CustomEvent(
            'component::height-change',
            { detail: {}, bubbles: true }
          )
        );
        if (options.editMode) {
          _debouncedUpdateHeightInComponentData($iframeElement, newHeight);
        }
      }
    }, HEIGHT_POLL_INTERVAL);
  }

  const $iframeElement = $(
    '<iframe>',
    {
      'src': 'about:blank',
      'frameborder': '0'
    }
  );
  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);

  let lastHeight = _.get(componentData, 'value.cachedHeight', 0);
  $iframeElement.height(lastHeight);

  $iframeElement.load(monitorHeightChanges);

  if (options.editMode) {

    $element.append(
      $('<div>', { 'class': 'component-edit-controls' }).
      append(
        $('<button>', { 'class': 'component-edit-controls-edit-btn' }).
        click(_handleEditClick).
        text(I18n.t('editor.components.goal_embed.edit_btn'))
      )
    );
  }

  $element.
    addClass(className).
    append($iframeElement);
}

function _handleEditClick() {
  const $element = $(this).closest('.component');
  const blockId = StorytellerUtils.findClosestAttribute(this, 'data-block-id');
  const componentIndex = parseInt(StorytellerUtils.findClosestAttribute(this, 'data-component-index'), 10);

  StorytellerUtils.assertIsOneOfTypes(blockId, 'string');
  StorytellerUtils.assert(_.isFinite(componentIndex));

  const componentData = storyStore.getBlockComponentAtIndex(blockId, componentIndex);

  const goalEditUrl = StorytellerUtils.generateGoalEditSrc(
    componentData.value.domain,
    componentData.value.dashboard,
    componentData.value.category,
    componentData.value.uid
  );
  const newWindow = window.open(goalEditUrl, '_blank');

  function reloadIframe() {
    const $iframe = $element.find('iframe');
    // Maintain our height while the iframe refreshes.
    $element.height($element.height());
    $iframe.one('load', () => {
      $element.height(''); // Clear fixed height, resume normal reflow.
    });
    $iframe[0].contentWindow.location.reload();
  }

  $(newWindow).on('DOMContentLoaded', () => {
    newWindow.addEventListener('goal-saved', reloadIframe);
  });
}

function _updateSrcAndTitle($element, componentData) {
  StorytellerUtils.assertHasProperties(
    componentData,
    'value',
    'value.domain',
    'value.dashboard',
    'value.category',
    'value.uid'
  );

  const $iframeElement = $element.find('iframe');
  const title = _.get(componentData.value, 'title');
  const goalSource = StorytellerUtils.generateGoalEmbedSrc(
    componentData.value.domain,
    componentData.value.dashboard,
    componentData.value.category,
    componentData.value.uid
  );

  $iframeElement.attr('title', title);

  if ($iframeElement.attr('src') !== goalSource) {
    $iframeElement.attr('src', goalSource);
  }
}
