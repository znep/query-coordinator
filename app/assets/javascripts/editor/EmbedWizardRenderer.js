;var EmbedWizardRenderer = (function() {

  'use strict';

  function EmbedWizardRenderer(options) {

    var _container = options.embedWizardContainerElement || null;
    var _overlay = $('<div>', { 'class': 'modal-overlay' });
    var _dialog = $('<div>', { 'class': 'modal-dialog' });
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

          // `ESC`
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

          window.dispatcher.dispatch({
            action: Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL,
            url: $(event.target).val()
          });
        }
      );

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
        }
      );

      _dialog.on('click', '[data-embed-action]', function(event) {

        var action = event.target.getAttribute('data-embed-action');

        switch (action) {

          case Constants.EMBED_WIZARD_CHOOSE_PROVIDER:
            window.dispatcher.dispatch({
              action: Constants.EMBED_WIZARD_CHOOSE_PROVIDER,
              blockId: window.embedWizardStore.getCurrentBlockId(),
              componentIndex: window.embedWizardStore.getCurrentComponentIndex()
            });
            break;

          case Constants.EMBED_WIZARD_CHOOSE_YOUTUBE:
            window.dispatcher.dispatch({
              action: Constants.EMBED_WIZARD_CHOOSE_YOUTUBE
            });
            break;

          case Constants.EMBED_WIZARD_APPLY:
            window.dispatcher.dispatch({
              action: Constants.BLOCK_UPDATE_COMPONENT,
              blockId: window.embedWizardStore.getCurrentBlockId(),
              componentIndex: window.embedWizardStore.getCurrentComponentIndex(),
              type: window.embedWizardStore.getCurrentComponentType(),
              value: window.embedWizardStore.getCurrentComponentValue()
            });
            window.dispatcher.dispatch({
              action: Constants.EMBED_WIZARD_CLOSE
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

          case Constants.EMBED_WIZARD_CHOOSE_YOUTUBE:
            wizardContent = _renderChooseYouTubeTemplate(componentValue);
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

      // Render interactive data where possible.
      switch (state) {

        case Constants.EMBED_WIZARD_CHOOSE_YOUTUBE:
          _renderChooseYouTubeData(componentValue);
          break;

        default:
          break;
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
          'class': 'btn accent-btn',
          'data-embed-action': Constants.EMBED_WIZARD_CHOOSE_YOUTUBE
        }
      ).text(I18n.t('editor.embed_wizard.providers.youtube'));

      var providers = $('<ul>').append([ $('<li>').append(youtubeButton) ]);
      var content = $('<div>', { 'class': 'modal-content' }).append(providers);

      return [ heading, closeButton, content ];
    }

    function _renderChooseYouTubeTemplate() {

      var heading = _renderModalTitle(
        I18n.t('editor.embed_wizard.choose_youtube_heading')
      );

      var closeButton = _renderModalCloseButton();

      var inputLabel = $('<h2>', { 'class': 'wizard-input-label' }).
        text(I18n.t('editor.embed_wizard.choose_youtube_input_label'));

      var inputControl = $(
        '<input>',
        {
          'class': 'wizard-text-input',
          'data-embed-wizard-validate-field': 'youTubeId',
          'placeholder': I18n.t(
            'editor.embed_wizard.choose_youtube_input_placeholder'
          )
        }
      );

      var previewIframe = $(
        '<iframe>',
        {
          'class': 'wizard-media-embed-preview-iframe'
        }
      );

      var previewContainer = $(
        '<div>',
        {
          'class': 'wizard-media-embed-preview-container'
        }
      ).append(previewIframe);

      var backButton = $(
        '<button>',
        {
          'class': 'btn',
          'data-embed-action': Constants.EMBED_WIZARD_CHOOSE_PROVIDER
        }
      ).append([
        $(
          '<span>',
          {
            'class': 'icon-arrow-left2',
            'style': 'font-size: 0.8em',
            'data-embed-action': Constants.EMBED_WIZARD_CHOOSE_PROVIDER
          }
        ),
        I18n.t('editor.embed_wizard.back_button_label')
      ]);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn accent-btn',
          'data-embed-action': Constants.EMBED_WIZARD_APPLY
        }
      ).text(I18n.t('editor.embed_wizard.insert_button_label'));

      var content = $('<div>', { 'class': 'wizard-input-group' }).append([
        inputLabel,
        inputControl,
        previewContainer
      ]);

      var buttonGroup = $(
        '<div>',
        {
          'class': 'wizard-button-group r-to-l'
        }).append([ backButton, insertButton ]);

      return [ heading, closeButton, content, buttonGroup ];
    }

    /**
     * componentValue is of the following form:
     *
     * {
     *   type: 'media',
     *   value: {
     *     type: 'embed',
     *     value: {
     *       provider: 'youtube',
     *       id: '<YouTube video id>',
     *       url: '<YouTube video url>'
     *     }
     *   }
     *  }
     */
    function _renderChooseYouTubeData(componentValue) {

      var componentProperties = _.get(componentValue, 'value');
      var youTubeId = null;
      var youTubeUrl = null;
      var youTubeEmbedUrl;
      var iframeElement = _dialog.find('.wizard-media-embed-preview-iframe');
      var iframeSrc = iframeElement.attr('src');
      var inputControl = _dialog.find('[data-embed-wizard-validate-field="youTubeId"]');
      var iframeContainer;
      var insertButton = _dialog.find(
        '[data-embed-action="' + Constants.EMBED_WIZARD_APPLY + '"]'
      );

      if (componentProperties !== null &&
        _.has(componentProperties, 'id') &&
        _.has(componentProperties, 'url')) {

        youTubeId = componentValue.value.id;
        youTubeUrl = componentValue.value.url;
      }

      if (youTubeId !== null && youTubeUrl !== null) {

        inputControl.val(youTubeUrl);

        // If there is a valid YouTube video id and it does not match the
        // current source of the preview iframe, point the preview iframe
        // at the new youtube video.
        youTubeEmbedUrl = Util.generateYouTubeIframeSrc(youTubeId);
        if (iframeSrc !== youTubeEmbedUrl) {
          iframeElement.attr('src', youTubeEmbedUrl);
        }

        insertButton.prop('disabled', false);

      } else {

        iframeContainer = _dialog.find('.wizard-media-embed-preview-container');

        // Do not show the 'invalid url' icon if the user has not input
        // any text, or if they have deleted what text they did input.
        if (_.isEmpty(inputControl.val().replace(/\s/g, ''))) {
          iframeContainer.removeClass('invalid');
        } else {
          iframeContainer.addClass('invalid');
        }

        // If there is no valid YouTube video id but the current source of
        // the iframe is not `about:blank`, then reset it to `about:blank`.
        if (iframeSrc !== 'about:blank') {
          iframeElement.attr('src', 'about:blank');
        }

        insertButton.prop('disabled', true);
      }
    }

    function _renderModalTitle(titleText) {
      return $('<h1>', { 'class': 'modal-title' }).text(titleText);
    }

    function _renderModalCloseButton() {

      return $(
        '<button>',
        {
          'class': 'modal-close-btn',
          'data-embed-action': Constants.EMBED_WIZARD_CLOSE
        }
      ).append(
        $(
          '<span>',
          {
            'class': 'icon-cross2',
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
