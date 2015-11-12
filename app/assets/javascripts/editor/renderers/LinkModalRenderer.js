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

      $text.on('input', _.debounce(update, wait));
      $link.on('input', _.debounce(update, wait));
      $openInNewWindow.on('change', _.debounce(update, wait));
      $testLink.on('click', testLink);

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
              link: $link.val()
            });
            dispatcher.dispatch({
              action: Actions.LINK_MODAL_CLOSE
            });
            break;
        }
      });
    }

    function attachStoreListeners() {
      storyteller.linkStore.addChangeListener(function() {
        var visibility = storyteller.linkStore.getVisibility();
        var inputs = storyteller.linkStore.getInputs();
        var valid = storyteller.linkStore.getValidity();
        var urlValidity = storyteller.linkStore.getURLValidity();

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
      $modal.find('.btn-primary').prop('disabled', !predicate);
    }

    function testLink(event) {
      event.preventDefault();

      var inputs = storyteller.linkStore.getInputs();
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
