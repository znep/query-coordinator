import $ from 'jQuery';

import I18n from '../I18n';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import Environment from '../../StorytellerEnvironment';
import { dispatcher } from '../Dispatcher';
import { coreSavingStore } from '../stores/CoreSavingStore';
import { shareAndEmbedStore } from '../stores/ShareAndEmbedStore';
import { storyStore } from '../stores/StoryStore';

function t(str) {
  return I18n.t('editor.share_and_embed.modal.' + str);
}

function format() {
  return StorytellerUtils.format.apply(this, arguments);
}

/**
 * @class ShareAndEmbedRenderer
 * Renders a modal that contains the list of collaborators for the current story.
 * The user is provided several editing actions, such as additions, removals, and changes.
 */
export default function ShareAndEmbedRenderer() {
  var $shareAndEmbed;
  var $navTabs;
  var $panes;
  var $saveButton;
  var $errorNotice;
  var $titleInput;
  var $descriptionInput;

  var events = {
    'focus': [
      ['.share-and-embed-story-url, .share-and-embed-embed-code', highlightInput]
    ],
    'keyup': [
      ['.share-and-embed-title', validateFields]
    ],
    'click': [
      ['.nav-tabs .tab-link', changeTab],
      ['.btn-primary', saveModal],
      ['.btn-default', handleModalDismissed]
    ],
    'modal-dismissed': [
      [handleModalDismissed]
    ]
  };

  compileDOM();
  render();
  StorytellerUtils.bindEvents($shareAndEmbed, events);
  shareAndEmbedStore.addChangeListener(render);
  coreSavingStore.addChangeListener(render);

  /**
   * Public Methods
   */

  /**
   * @function destroy
   * @description
   * Removes all attached events to this instance of ShareAndEmbedRenderer
   */
  this.destroy = function() {
    StorytellerUtils.unbindEvents($shareAndEmbed, events);
    $shareAndEmbed.remove();
  };

  /**
   * Private Methods
   */

  function template() {
    /* eslint-disable indent */
    return [
      '<div class="modal-error alert error"></div>',

      format('<h2 class="modal-input-label input-label">{0}</h2>', t('story_url_label')),
      '<input class="share-and-embed-story-url" type="text" readonly>',
      '<hr>',

      '<ul class="nav-tabs">',
        format('<li class="tab-link current"><a href="#">{0}</a></li>', t('embed_and_preview.tab_title')),
        format('<li class="tab-link"><a href="#">{0}</a></li>', t('options.tab_title')),
      '</ul>',

      '<div class="share-and-embed-pane-container">',
        '<div class="share-and-embed-pane current">',
          '<textarea class="share-and-embed-embed-code" readonly></textarea>',
          format('<h2 class="modal-input-label input-label">{0}</h2>', t('embed_and_preview.preview_label')),
          '<iframe src="about:blank" class="share-and-embed-preview-iframe"></iframe>',
        '</div>',

        '<div class="share-and-embed-pane">',
          format('<div class="alert info options-notice">{0}</div>', t('options.notice')),
          format('<h2 class="modal-input-label input-label">{0}</h2>', t('options.title_label')),
          '<input class="share-and-embed-title" type="text">',
          format('<h2 class="modal-input-label input-label">{0}</h2>', t('options.description_label')),
          '<textarea class="share-and-embed-description"></textarea>',
        '</div>',
      '</div>',

      '<div class="modal-button-group r-to-l">',
        format(
          '<button class="btn btn-default">{0}</button>',
          I18n.t('editor.modal.buttons.cancel')
        ),
        format(
          '<button class="btn btn-primary"><span>{0}</span></button>',
          I18n.t('editor.modal.buttons.save_and_close')
        ),
      '</div>'
    ].join('');
    /* eslint-enable indent */
  }

  function compileDOM() {
    $shareAndEmbed = $('<div>', { id: 'share-and-embed-modal' }).modal({
      title: t('heading'),
      content: $(template())
    });

    $(document.body).append($shareAndEmbed);

    $navTabs = $shareAndEmbed.find('.nav-tabs');
    $panes = $shareAndEmbed.find('.share-and-embed-pane-container');
    $saveButton = $shareAndEmbed.find('.btn-primary');
    $errorNotice = $shareAndEmbed.find('.modal-error');
    $titleInput = $shareAndEmbed.find('.share-and-embed-title');
    $descriptionInput = $shareAndEmbed.find('.share-and-embed-description');
  }

  function highlightInput() {
    $(this).select();
  }

  function changeTab(event) {
    var $tab = $(event.target).closest('.tab-link');

    $navTabs.children().removeClass('current');
    $tab.addClass('current');

    $panes.children().removeClass('current');
    $panes.children().eq($tab.index()).addClass('current');

    return false;
  }

  function validateFields() {
    var title = $titleInput.val().trim();
    var hasEmptyTitle = _.isEmpty(title);
    $titleInput.toggleClass('alert error', hasEmptyTitle);
    $saveButton.prop('disabled', hasEmptyTitle);
  }

  function saveModal() {
    dispatcher.dispatch({
      action: Actions.STORY_SET_TILE_CONFIG,
      storyUid: Environment.STORY_UID,
      tileConfig: {
        title: $titleInput.val(),
        description: $descriptionInput.val()
      }
    });

    dispatcher.dispatch({
      action: Actions.STORY_SAVE_METADATA,
      storyUid: Environment.STORY_UID
    });
  }

  function handleModalDismissed() {
    dispatcher.dispatch({
      action: Actions.SHARE_AND_EMBED_MODAL_CLOSE
    });
  }

  function render() {
    var modalIsOpen = shareAndEmbedStore.isOpen();
    var saveInProgress = coreSavingStore.isSaveInProgress();
    var lastSaveError = coreSavingStore.lastRequestSaveErrorForStory(
      Environment.STORY_UID
    );
    var isInteractive = !$titleInput.prop('disabled');

    if (modalIsOpen && !saveInProgress) {
      $shareAndEmbed.find('.share-and-embed-preview-iframe').
        attr(
          'src',
          shareAndEmbedStore.getStoryTileUrl()
        );
      $shareAndEmbed.find('.share-and-embed-story-url').val(shareAndEmbedStore.getStoryUrl());
      $shareAndEmbed.find('.share-and-embed-embed-code').val(shareAndEmbedStore.getStoryEmbedCode());

      $titleInput.val(storyStore.getStoryTileTitle(Environment.STORY_UID));
      $descriptionInput.val(storyStore.getStoryTileDescription(Environment.STORY_UID));
      validateFields();

      if (isInteractive) {
        $errorNotice.text(lastSaveError).toggle(!!lastSaveError);
      } else {
        $shareAndEmbed.find('.alert.info').hide();
      }
    }

    $saveButton.toggleClass('btn-busy', saveInProgress);

    toggleModal(modalIsOpen);
  }

  function toggleModal(show) {
    if (!show) {
      // Reset to the initial tab on close.
      $navTabs.children().removeClass('current').first().addClass('current');
      $panes.children().removeClass('current').first().addClass('current');
    }

    $shareAndEmbed.trigger(
      show ? 'modal-open' : 'modal-close'
    );
  }
}
