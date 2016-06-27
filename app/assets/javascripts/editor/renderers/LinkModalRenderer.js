import $ from 'jQuery';
import _ from 'lodash';

import I18n from '../I18n';
import Actions from '../Actions';
import { dispatcher } from '../Dispatcher';
import { linkModalStore } from '../stores/LinkModalStore';

export default function LinkModalRenderer() {
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
    $text.on('input', update);
    $link.on('input', update);
    $openInNewWindow.on('change', update);
    $testLink.on('click', testLink);

    $modal.on('modal-dismissed', function() {

      setTimeout(
        function() {

          dispatcher.dispatch({
            action: Actions.LINK_MODAL_CLOSE
          });
        },
        0
      );
    });

    $modal.on('click', '[data-action]', function(event) {
      var action = event.target.getAttribute('data-action');

      switch (action) {
        case Actions.LINK_MODAL_CLOSE:
          dispatcher.dispatch({
            action: Actions.LINK_MODAL_CLOSE
          });
          break;
      }
    });

    $modal.submit(handleSubmission);
  }

  function attachStoreListeners() {
    linkModalStore.addChangeListener(function() {
      var visibility = linkModalStore.getVisibility();
      var inputs = linkModalStore.getInputs();
      var valid = linkModalStore.getValidity();
      var urlValidity = linkModalStore.getURLValidity();

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

  function handleSubmission() {
    var visible = linkModalStore.getVisibility();
    var valid = linkModalStore.getValidity();

    if (valid && visible) {
      dispatcher.dispatch({
        action: Actions.LINK_MODAL_ACCEPT,
        text: $text.val(),
        link: $link.val(),
        openInNewWindow: $openInNewWindow.is(':checked')
      });
      dispatcher.dispatch({
        action: Actions.LINK_MODAL_CLOSE
      });
    } else {
      return false;
    }
  }

  function testLink(event) {
    event.preventDefault();

    var inputs = linkModalStore.getInputs();
    var anchor = document.createElement('a');

    anchor.href = inputs.link;
    anchor.setAttribute('target', '_blank');

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}
