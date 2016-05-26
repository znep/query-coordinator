import $ from 'jQuery';

import I18n from '../I18n';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { shareAndEmbedStore } from '../stores/ShareAndEmbedStore';

/**
 * @class ShareAndEmbedRenderer
 * Renders a modal that contains the list of collaborators for the current story.
 * The user is provided several editing actions, such as additions, removals, and changes.
 */
export default function ShareAndEmbedRenderer() {
  var t = I18n.t;
  var $shareAndEmbed;

  compileDOM();
  render();
  attachEvents();
  shareAndEmbedStore.addChangeListener(render);

  /**
   * Public Methods
   */

  /**
   * @function destroy
   * @description
   * Removes all attached events to this instance of ShareAndEmbedRenderer
   */
  this.destroy = function() {
    detachEvents();
    $shareAndEmbed.remove();
  };

  /**
   * Private Methods
   */

  function template() {

    return (
        '<div>' +
          StorytellerUtils.format('<h2 class="modal-input-label input-label">{0}</h2>', t('editor.share_and_embed.modal.story_url_label')) +
          '<input class="share-and-embed-story-url" type="text" readonly>' +
          '<hr>' +
          StorytellerUtils.format('<h2 class="modal-input-label input-label">{0}</h2>', t('editor.share_and_embed.modal.embed_code_label')) +
          '<textarea class="share-and-embed-embed-code" readonly></textarea>' +
          StorytellerUtils.format('<h2 class="modal-input-label input-label">{0}</h2>', t('editor.share_and_embed.modal.preview_label')) +
          '<iframe src="about:blank" class="share-and-embed-preview-iframe"></iframe>' +
          '<div class="modal-button-group r-to-l">' +
            StorytellerUtils.format('<button class="btn-default" data-action="{0}">{1}</button>', Actions.SHARE_AND_EMBED_MODAL_CLOSE, t('editor.modal.buttons.done')) +
          '</div>' +
        '</div>'
    );
  }

  function compileDOM() {
    $shareAndEmbed = $('<div>', { id: 'share-and-embed-modal' }).modal({
      title: t('editor.share_and_embed.modal.heading'),
      content: $(template())
    });

    $(document.body).append($shareAndEmbed);
  }

  function attachEvents() {
    $shareAndEmbed.on('click', '[data-action="SHARE_AND_EMBED_MODAL_CLOSE"]', handleModalDismissed);
    $shareAndEmbed.on('modal-dismissed', handleModalDismissed);
    $shareAndEmbed.on('focus', '.share-and-embed-story-url', function() { $(this).select(); });
    $shareAndEmbed.on('focus', '.share-and-embed-embed-code', function() { $(this).select(); });
  }

  function detachEvents() {
    $shareAndEmbed.off('click', '[data-action="SHARE_AND_EMBED_MODAL_CLOSE"]', handleModalDismissed);
    $shareAndEmbed.off('modal-dismissed', handleModalDismissed);
  }

  function handleModalDismissed() {
    dispatcher.dispatch({
      action: Actions.SHARE_AND_EMBED_MODAL_CLOSE
    });
  }

  function render() {
    var modalIsOpen = shareAndEmbedStore.isOpen();

    if (modalIsOpen) {

      $shareAndEmbed.find('.share-and-embed-preview-iframe').
        attr(
          'src',
          shareAndEmbedStore.getStoryTileUrl()
        );
      $shareAndEmbed.find('.share-and-embed-story-url').val(shareAndEmbedStore.getStoryUrl());
      $shareAndEmbed.find('.share-and-embed-embed-code').val(shareAndEmbedStore.getStoryEmbedCode());
    }

    toggleModal(modalIsOpen);
  }

  function toggleModal(show) {
    $shareAndEmbed.trigger(
      show ? 'modal-open' : 'modal-close'
    );
  }
}
