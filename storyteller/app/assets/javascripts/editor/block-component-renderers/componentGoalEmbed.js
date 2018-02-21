import $ from 'jquery';
import React from 'react'; //eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import classNames from 'classnames';

//eslint-disable no-unused-vars
import {
  Button,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter
} from 'common/components';
//eslint-enable no-unused-vars

import '../componentBase';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertIsOneOfTypes, assertHasProperty, assertHasProperties } from 'common/js_utils';
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

const ModalState = {
  LOADING: 'LOADING',
  IDLE: 'IDLE',
  SAVING: 'SAVING'
};

$.fn.componentGoalEmbed = componentGoalEmbed;

export default function componentGoalEmbed(props) {
  function onFirstRender() {
    // Generate container for the goal edit modal now, so that we have a clear
    // reference to it for both displaying and destroying the modal.
    const $editModal = $('<div>', { 'class': 'goal-edit-modal' }).appendTo('body');
    $this.data('edit-modal', $editModal);

    $this.one('destroy', () => {
      $this.data('edit-modal', null);
      $editModal.remove();
    });
  }

  props = _.extend({}, props, {
    editButtonSupported: false,
    firstRenderCallback: onFirstRender
  });

  const $this = $(this);
  const { componentData } = props;

  assertHasProperties(componentData, 'type');
  assert(
    componentData.type === 'goal.embed',
    `componentGoalEmbed: Unsupported component type ${componentData.type}`
  );

  if ($this.children().length === 0) {
    renderGoal($this, props);
  }

  updateSrcAndTitle($this, componentData);
  $this.componentBase(props);

  return $this;
}

const debouncedUpdateHeightInComponentData = _.debounce(function($iframeElement, height) {
  const blockId = StorytellerUtils.findClosestAttribute($iframeElement, 'data-block-id');
  const componentIndex = parseInt(StorytellerUtils.findClosestAttribute($iframeElement, 'data-component-index'), 10);

  assertIsOneOfTypes(blockId, 'string');
  assert(_.isFinite(componentIndex));

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

function renderGoal($element, props) {
  const { componentData, editMode } = props;

  assertHasProperty(componentData, 'type');

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
        if (editMode) {
          debouncedUpdateHeightInComponentData($iframeElement, newHeight);
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

  if (editMode) {

    $element.append(`
      <div class="component-edit-controls-container">
        <div class="component-edit-controls">
          <button class="component-edit-controls-edit-btn">
            ${I18n.t('editor.components.goal_embed.edit_btn')}
          </button>
        </div>
      </div>
    `);

    $element.find('.component-edit-controls-edit-btn').click(handleEditClick);
  }

  $element.
    addClass(className).
    append($iframeElement);
}

function handleEditClick() {
  const componentClassName = StorytellerUtils.typeToClassNameForComponentType('goal.embed');
  const $element = $(this).closest(`.${componentClassName}`);
  renderModal($element, ModalState.LOADING);
}

function renderModal($element, state) {
  const { LOADING, IDLE, SAVING } = ModalState;
  const componentData = $element.data('component-rendered-data');

  const goalEditUrl = StorytellerUtils.generateGoalEmbedEditSrc(
    componentData.value.uid
  );

  const $editModal = $element.data('edit-modal');

  function getOdyApi() {
    return _.get(
      $editModal.find('iframe')[0],
      'contentWindow.EmbeddedGoalEditAPI.V1'
    );
  }

  function reloadIframe() {
    const $iframe = $element.find('iframe');
    // Maintain our height while the iframe refreshes.
    $element.height($element.height());
    $iframe.one('load', () => {
      $element.height(''); // Clear fixed height, resume normal reflow.
    });
    $iframe[0].contentWindow.location.reload();
  }

  const onLoad = () => renderModal($element, IDLE);
  const onDismiss = () => {
    const odyApi = getOdyApi();
    if (odyApi && odyApi.isGoalDirty()) {
      const doDismiss = window.confirm(I18n.t('editor.components.goal_embed.unsaved_goal_changes'));
      if (!doDismiss) {
        return;
      }
    }

    _.defer(() => ReactDOM.unmountComponentAtNode($editModal[0]));
  };
  const onSaveMeasure = () => {
    if (state === SAVING) {
      return;
    }

    getOdyApi().saveGoal(() => {
      reloadIframe();
      onDismiss();
    });
    renderModal($element, SAVING);
  };

  const iframeClasses = classNames({
    loaded: state !== LOADING
  });

  const dismissButtonProps = {
    onClick: onDismiss
  };

  const saveButtonProps = {
    busy: state === SAVING,
    disabled: state === LOADING,
    onClick: onSaveMeasure,
    variant: 'primary'
  };

  ReactDOM.render(
    <Modal onDismiss={onDismiss} fullScreen={true}>
      <ModalHeader title={I18n.t('editor.components.goal_embed.edit_title')} onDismiss={onDismiss} />

      <ModalContent>
        <div className="alert alert-full-width-top warning">
          <strong>{I18n.t('editor.components.goal_embed.unsaved_goal_warning.warning')}</strong>
          <span> {I18n.t('editor.components.goal_embed.unsaved_goal_warning.explanation')} </span>
          <a
            href="https://socrata.zendesk.com/knowledge/articles/234470628/en-us?brand_id=3285806"
            target="_blank">
            {I18n.t('editor.components.goal_embed.unsaved_goal_warning.link')}
          </a>
        </div>

        {
          state === LOADING ?
            <span className="spinner-default spinner-large iframe-spinner" /> :
            null
        }

        <iframe
          src={goalEditUrl}
          title={I18n.t('editor.components.goal_embed.edit_title')}
          onLoad={onLoad}
          className={iframeClasses}
          frameBorder="0" />
      </ModalContent>

      <ModalFooter>
        <Button {...dismissButtonProps}>
          <span>{I18n.t('editor.modal.buttons.cancel')}</span>
        </Button>
        <Button {...saveButtonProps}>
          <span>{I18n.t('editor.modal.buttons.save')}</span>
        </Button>
      </ModalFooter>
    </Modal>,
    $editModal[0]
  );
}

function updateSrcAndTitle($element, componentData) {
  assertHasProperties(
    componentData,
    'value',
    'value.uid'
  );

  const $iframeElement = $element.find('iframe');
  const title = _.get(componentData.value, 'title');
  const goalSource = StorytellerUtils.generateGoalEmbedSrc(
    componentData.value.uid
  );

  $iframeElement.attr('title', title);

  if ($iframeElement.attr('src') !== goalSource) {
    $iframeElement.attr('src', goalSource);
  }
}
