(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;

  /**
   * @class ShareAndEmbedRenderer
   * Renders a modal that contains the list of collaborators for the current story.
   * The user is provided several editing actions, such as additions, removals, and changes.
   */
  function ShareAndEmbedRenderer() {
    var t = I18n.t;
    var $shareAndEmbed;

    compileDOM();
    attachEvents();
    storyteller.shareAndEmbedStore.addChangeListener(render);

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
      var storyUrl = storyteller.shareAndEmbedStore.getStoryUrl();
      var storyWidgetEmbedCode = storyteller.shareAndEmbedStore.getStoryEmbedCode();

      return (
          '<div>' +
            '<h2 class="modal-input-label input-label">{0}</h2>'.format(t('editor.share_and_embed.modal.story_url_label')) +
            '<input class="share-and-embed-story-url" type="text" readonly value="{0}">'.format(storyUrl) +
            '<hr>' +
            '<h2 class="modal-input-label input-label">{0}</h2>'.format(t('editor.share_and_embed.modal.embed_code_label')) +
            '<textarea class="share-and-embed-embed-code" readonly>{0}</textarea>'.format(storyWidgetEmbedCode) +
            '<h2 class="modal-input-label input-label">{0}</h2>'.format(t('editor.share_and_embed.modal.preview_label')) +
            '<iframe src="about:blank" class="share-and-embed-preview-iframe"></iframe>' +
            '<div class="modal-button-group r-to-l">' +
              '<button class="btn-default btn-inverse" data-action="{0}">{1}</button>'.format(Actions.SHARE_AND_EMBED_MODAL_CLOSE, t('editor.modal.buttons.done')) +
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
      storyteller.dispatcher.dispatch({
        action: Actions.SHARE_AND_EMBED_MODAL_CLOSE
      });
    }

    function render() {
      var modalIsOpen = storyteller.shareAndEmbedStore.isOpen();

      if (modalIsOpen) {

        $shareAndEmbed.find('.share-and-embed-preview-iframe').
          attr(
            'src',
            storyteller.shareAndEmbedStore.getStoryWidgetUrl()
          );
      }

      toggleModal(modalIsOpen);
    }

    function toggleModal(show) {
      $shareAndEmbed.trigger(
        show ? 'modal-open' : 'modal-close'
      );
    }
  }

  storyteller.ShareAndEmbedRenderer = ShareAndEmbedRenderer;
})();
