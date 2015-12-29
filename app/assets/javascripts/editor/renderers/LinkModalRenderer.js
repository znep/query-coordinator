(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;

  function LinkModalRenderer() {
    var dispatcher = storyteller.dispatcher;
    var $modal = $('#link-modal');
    var $text = $('#display-text');
    var $link = $('#link-text');
    var $openInNewWindow = $('#open-in-new-window');
    var $testLink = $('.link-test-link-action');
    var $warning = $('.link-warning');
    var $submitButton = $modal.find('.btn-primary');

    $modal.modal({
      title: I18n.t('editor.rich_text_toolbar.link_modal.heading'),
      // The LinkModal content is pre-rendered in edit.html.erb, so just
      // grab the existing children.
      content: $modal.children()
    });

    attachEvents();
    attachStoreListeners();

    function update() {
      dispatcher.dispatch({
        action: Actions.LINK_MODAL_UPDATE,
        text: $text.val(),
        link: $link.val(),
        openInNewWindow: $openInNewWindow.is(':checked')
      });
    }

    function attachEvents() {
      var wait = 750;

      $(window).on('keyup', enterToInsert);
      $text.on('input', _.debounce(update, wait));
      $link.on('input', _.debounce(update, wait));
      $openInNewWindow.on('change', _.debounce(update, wait));
      $testLink.on('click', testLink);

      $modal.on('modal-dismissed', function() {
        dispatcher.dispatch({
          action: Actions.LINK_MODAL_CLOSE
        });
      });

      $modal.on('click', '[data-action]', function(event) {
        var action = event.target.getAttribute('data-action');

        switch (action) {
          case Actions.LINK_MODAL_CLOSE:
            dispatcher.dispatch({
              action: Actions.LINK_MODAL_CLOSE
            });
            break;
          case Actions.LINK_MODAL_ACCEPT:
            dispatcher.dispatch({
              action: Actions.LINK_MODAL_ACCEPT,
              text: $text.val(),
              link: $link.val(),
              openInNewWindow: $openInNewWindow.is(':checked')
            });
            dispatcher.dispatch({
              action: Actions.LINK_MODAL_CLOSE
            });
            break;
        }
      });
    }

    function attachStoreListeners() {
      storyteller.linkModalStore.addChangeListener(function() {
        var visibility = storyteller.linkModalStore.getVisibility();
        var inputs = storyteller.linkModalStore.getInputs();
        var valid = storyteller.linkModalStore.getValidity();
        var urlValidity = storyteller.linkModalStore.getURLValidity();

        toggleModal(visibility);
        toggleModalOK(valid);
        toggleWarning(urlValidity);
        setInputs(inputs);
      });
    }

    function setInputs(inputs) {
      if (inputs && !($text.is(':focus') || $link.is(':focus'))) {
        $text.val(inputs.text);
        $link.val(inputs.link);
        $openInNewWindow.prop('checked', inputs.openInNewWindow);
      }
    }

    function toggleWarning(predicate) {
      $warning[predicate ? 'addClass' : 'removeClass']('invisible');
    }

    function toggleModal(predicate) {
      $modal[predicate ? 'removeClass' : 'addClass']('hidden');
    }

    function toggleModalOK(predicate) {
      $submitButton.prop('disabled', !predicate);
    }

    function enterToInsert(event) {
      var visible = storyteller.linkModalStore.getVisibility();
      var valid = storyteller.linkModalStore.getValidity();

      if (event.keyCode === 13 && valid && visible) {
        $submitButton.click();
      }
    }

    function testLink(event) {
      event.preventDefault();

      var inputs = storyteller.linkModalStore.getInputs();
      var anchor = document.createElement('a');

      anchor.href = inputs.link;
      anchor.setAttribute('target', '_blank');

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  }

  storyteller.LinkModalRenderer = LinkModalRenderer;
})();
