(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function LinkModalRenderer() {
    var $modal = $('#link-modal');
    var $text = $('#display-text');
    var $link = $('#link-text');

    attachEvents();
    attachStoreListeners();

    function attachEvents() {
      $modal.on('click', '[data-action]', function() {
        var dispatcher = storyteller.dispatcher;
        var action = event.target.getAttribute('data-action');

        switch(action) {
          case Actions.LINK_MODAL_OPEN:
            dispatcher.dispatch({
              action: Actions.LINK_MODAL_OPEN
            });
            break;
          case Actions.LINK_MODAL_CLOSE:
            dispatcher.dispatch({
              action: Actions.LINK_MODAL_CLOSE
            });
            break;
          case Actions.LINK_MODAL_FORMAT:
            dispatcher.dispatch({
              action: Actions.LINK_MODAL_FORMAT,
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

        if (visibility) {
          openModal();
        } else {
          closeModal();
        }

        if (inputs) {
          setInputs(inputs.text, inputs.link);
        }
      });
    }

    function setInputs(text, link) {
      $('#display-text').val(text);
      $('#link-text').val(link);
    };

    function openModal() {
      $modal.removeClass('hidden');
    };

    function closeModal() {
      $modal.addClass('hidden');
    };
  }

  storyteller.LinkModalRenderer = LinkModalRenderer;
})();
