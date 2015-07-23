;var EmbedWizardRenderer = (function() {

  'use strict';

  function EmbedWizardRenderer(options) {

    var _container = options.embedWizardContainerElement || null;
    var _overlay = $('<div>', { class: 'modal-overlay' });
    var _dialog = $('<div>', { class: 'modal-dialog' });
    var _lastRenderedState = null;

    if (!(_container instanceof jQuery)) {

      throw new Error(
        '`options.embedWizardContainerElement` ' +
        'must be a jQuery element (is of type ' +
        (typeof _container) +
        ').'
      );
    }

    _container.append([ _overlay, _dialog ]);

    _listenForChanges();
    _attachEvents();

    /**
     * Public methods
     */

    /**
     * Private methods
     */

    function _listenForChanges() {

      window.embedWizardStore.addChangeListener(function() {
        _renderWizard();
      });
    }

    function _attachEvents() {

      $(document).on('keyup', function(event) {

        switch (event.keyCode) {

          // ESC
          case 27:
            window.dispatcher.dispatch({
              action: Constants.EMBED_WIZARD_CLOSE
            });
            break;

          default:
            break;
        }
      });

      _overlay.on('click', function(event) {
        window.dispatcher.dispatch({
          action: Constants.EMBED_WIZARD_CLOSE
        });
      });

      _dialog.on(
        'keyup',
        '[data-embed-wizard-validate-field="youTubeId"]',
        function(event) {

        // Do not update the model on characters that are not valid for urls or
        // delete actions.
        if (Util.isUrlCharacter(event.keyCode, event.shiftKey) ||
          Util.isDeleteCharacter(event.keyCode)) {

          window.dispatcher.dispatch({
            action: Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL,
            url: $(event.target).val()
          });
        }
      });

      _dialog.on(
        'cut paste',
        '[data-embed-wizard-validate-field="youTubeId"]',
        function(event) {

        // If no key was down then we can assume that a cut or paste event came
        // from the mouse (keyboard-originated paste events will trigger the
        // 'keyup' handler above).
        //
        // The `setTimeout` is necessary because the 'paste' event will fire
        // before the paste action takes place, so we need to break execution
        // to allow the DOM time to update itself before we query for the
        // value of the input control.
        if (!event.keyCode) {
          setTimeout(function() {
            window.dispatcher.dispatch({
              action: Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL,
              url: $(event.target).val()
            });
          }, 0);
        }
      });

      _dialog.on('click', '[data-embed-action]', function(event) {

        var action = event.target.getAttribute('data-embed-action');

        switch (action) {

          case Constants.EMBED_WIZARD_CHOOSE_PROVIDER:
            window.dispatcher.dispatch({
              action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER
            });
            break;

          case Constants.EMBED_WIZARD_CLOSE:
            window.dispatcher.dispatch({
              action: Constants.EMBED_WIZARD_CLOSE
            });
            break;

          default:
            break;
        }
      });
    }

    function _renderWizard() {

      var state = window.embedWizardStore.getCurrentWizardState();
      var componentValue = window.embedWizardStore.getCurrentComponentValue();
      var wizardContent;

      // Render a wizard state if necessary.
      if (state !== _lastRenderedState) {

        switch (state) {

          case Constants.EMBED_WIZARD_CHOOSE_PROVIDER:
            wizardContent = _renderChooseProvider();
            break;

          default:
            wizardContent = null;
            break;
        }

        if (wizardContent) {
          _dialog.html(wizardContent);
          _showWizard();
        } else {
          _dialog.html('');
          _hideWizard();
        }
      }

      _lastRenderedState = state;
    }

    function _renderChooseProvider() {

      var heading = _renderModalTitle(
        I18n.t('editor.embed_wizard.choose_provider_heading')
      );

      var closeButton = _renderModalCloseButton();

      var youtubeButton = $(
        '<button>',
        {
          class: 'btn accent-btn',
          'data-embed-action': Constants.EMBED_WIZARD_CHOOSE_YOUTUBE
        }
      ).text(I18n.t('editor.embed_wizard.providers.youtube'));

      var providers = $('<ul>').append([
          $('<li>').append(youtubeButton)
        ]);
      var content = $('<div>', { class: 'modal-content' }).append(providers);

      return [ heading, closeButton, content ];
    }

    function _renderModalTitle(titleText) {
      return $('<h1>', { class: 'modal-title' }).text(titleText);
    }

    function _renderModalCloseButton() {

      return $(
        '<button>',
        {
          class: 'modal-close-btn',
          'data-embed-action': Constants.EMBED_WIZARD_CLOSE
        }
      ).append(
        $(
          '<span>',
          {
            class: 'icon-cross2',
            'data-embed-action': Constants.EMBED_WIZARD_CLOSE
          }
        )
      );
    }

    function _showWizard() {
      _container.removeClass('hidden');
    }

    function _hideWizard() {
      _container.addClass('hidden');
    }
  }

  return EmbedWizardRenderer;
})();
