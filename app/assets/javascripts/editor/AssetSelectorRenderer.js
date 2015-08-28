(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function AssetSelectorRenderer(options) {

    var _container = options.assetSelectorContainerElement || null;
    var _overlay = $('<div>', { 'class': 'modal-overlay' });
    var _dialog = $('<div>', { 'class': 'modal-dialog' });
    var _lastRenderedState = null;

    if (!(_container instanceof jQuery)) {

      throw new Error(
        '`options.assetSelectorContainerElement` ' +
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

      storyteller.assetSelectorStore.addChangeListener(function() {
        _renderSelector();
      });
    }

    function _attachEvents() {

      $(document).on('keyup', function(event) {

        switch (event.keyCode) {

          // `ESC`
          case 27:
            storyteller.dispatcher.dispatch({
              action: Constants.ASSET_SELECTOR_CLOSE
            });
            break;

          default:
            break;
        }
      });

      // Do not scroll page if the container is scrolled
      _container.on('mousewheel', utils.preventScrolling);

      _overlay.on('click', function() {
        storyteller.dispatcher.dispatch({
          action: Constants.ASSET_SELECTOR_CLOSE
        });
      });

      _dialog.on(
        'keyup',
        '[data-asset-selector-validate-field="youtubeId"]',
        function(event) {

          storyteller.dispatcher.dispatch({
            action: Constants.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
            url: $(event.target).val()
          });
        }
      );

      _dialog.on(
        'cut paste',
        '[data-asset-selector-validate-field="youtubeId"]',
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
              storyteller.dispatcher.dispatch({
                action: Constants.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
                url: $(event.target).val()
              });
            }, 0);
          }
        }
      );

      _dialog.on(
        'datasetSelected',
        function(event, datasetObj) {
          storyteller.dispatcher.dispatch({
            action: Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            datasetUid: datasetObj.id,
            isNewBackend: datasetObj.newBackend
          });
        }
      );

      _dialog.on(
        'visualizationSelected',
        function(event, selectedCard) {
          storyteller.dispatcher.dispatch({
            action: Constants.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
            cardData: selectedCard
          });
        }
      );

      _dialog.on('click', '[data-action]', function() {

        var action = this.getAttribute('data-action');

        switch (action) {

          case Constants.ASSET_SELECTOR_CHOOSE_PROVIDER:
            storyteller.dispatcher.dispatch({
              action: Constants.ASSET_SELECTOR_CHOOSE_PROVIDER,
              blockId: storyteller.assetSelectorStore.getCurrentBlockId(),
              componentIndex: storyteller.assetSelectorStore.getCurrentComponentIndex()
            });
            break;

          case Constants.ASSET_SELECTOR_CHOOSE_YOUTUBE:
            storyteller.dispatcher.dispatch({
              action: Constants.ASSET_SELECTOR_CHOOSE_YOUTUBE
            });
            break;

          case Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION:
            storyteller.dispatcher.dispatch({
              action: Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION
            });
            break;

          case Constants.ASSET_SELECTOR_APPLY:
            storyteller.dispatcher.dispatch({
              action: Constants.BLOCK_UPDATE_COMPONENT,
              blockId: storyteller.assetSelectorStore.getCurrentBlockId(),
              componentIndex: storyteller.assetSelectorStore.getCurrentComponentIndex(),
              type: storyteller.assetSelectorStore.getCurrentComponentType(),
              value: storyteller.assetSelectorStore.getCurrentComponentValue()
            });
            storyteller.dispatcher.dispatch({
              action: Constants.ASSET_SELECTOR_CLOSE
            });
            break;

          case Constants.ASSET_SELECTOR_CLOSE:
            storyteller.dispatcher.dispatch({
              action: Constants.ASSET_SELECTOR_CLOSE
            });
            break;

          default:
            break;
        }
      });
    }

    function _renderSelector() {

      var state = storyteller.assetSelectorStore.getCurrentSelectorState();
      var componentValue = storyteller.assetSelectorStore.getCurrentComponentValue();
      var selectorContent;

      // See if we need to render a new template, then render a media selector state if
      // necessary.
      if (state !== _lastRenderedState) {

        // Remove state-specific modal container classes
        _resetModalDialogClass();

        switch (state) {

          case Constants.ASSET_SELECTOR_CHOOSE_PROVIDER:
            selectorContent = _renderChooseProvider();
            break;

          case Constants.ASSET_SELECTOR_CHOOSE_YOUTUBE:
            selectorContent = _renderChooseYoutubeTemplate(componentValue);
            break;

          case Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION:
            selectorContent = _renderChooseDatasetTemplate();
            break;

          case Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET:
            selectorContent = _renderConfigureVisualizationTemplate();
            break;

          default:
            selectorContent = null;
            break;
        }

        if (selectorContent) {
          _dialog.html(selectorContent);
          _showSelector();
        } else {
          _dialog.html('');
          _hideSelector();
        }
      }

      // Now put the data into the template rendered above
      // This handles updating data when the template does NOT need to be re-rendered
      // Note: Some templates may not have renderData function because they do
      // not update dynamically
      switch (state) {

        case Constants.ASSET_SELECTOR_CHOOSE_YOUTUBE:
          _renderChooseYoutubeData(componentValue);
          break;

        case Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET:
          _renderConfigureVisualizationData(componentValue);
          break;

        default:
          break;
      }

      _lastRenderedState = state;
    }

    function _renderChooseProvider() {

      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.choose_provider_heading')
      );

      var closeButton = _renderModalCloseButton();

      var youtubeButton = $('<button>', {
        'class': 'btn accent-btn',
        'data-action': Constants.ASSET_SELECTOR_CHOOSE_YOUTUBE
      }).text(I18n.t('editor.asset_selector.youtube.button_text'));

      var visualizationButton = $('<button>', {
        'class': 'btn accent-btn',
        'data-action': Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION
      }).text(I18n.t('editor.asset_selector.visualization.button_text'));

      var providers = $('<ul>', {'class': 'button-list'}).append([
        $('<li>').html(youtubeButton),
        $('<li>').html(visualizationButton)
      ]);
      var content = $('<div>', { 'class': 'modal-content' }).append(providers);

      return [ heading, closeButton, content ];
    }

    function _renderChooseYoutubeTemplate() {

      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.youtube.heading')
      );

      var closeButton = _renderModalCloseButton();

      var inputLabel = $('<h2>', { 'class': 'asset-selector-input-label input-label' }).
        text(I18n.t('editor.asset_selector.youtube.input_label'));

      var inputControl = $(
        '<input>',
        {
          'class': 'asset-selector-text-input',
          'data-asset-selector-validate-field': 'youtubeId',
          'placeholder': 'https://www.youtube.com/',
          'type': 'text'
        }
      );

      var previewInvalidMessageTitle = $(
        '<div>',
        { 'class': 'asset-selector-invalid-title' }
      ).html(
        [
          I18n.t('editor.asset_selector.youtube.invalid_message_title_1'),
          '<br />',
          I18n.t('editor.asset_selector.youtube.invalid_message_title_2')
        ].join('')
      );

      var previewInvalidMessageDescription = $(
        '<div>',
        { 'class': 'asset-selector-invalid-description' }
      ).text(
        I18n.t('editor.asset_selector.youtube.invalid_message_description')
      );

      var previewInvalidMessage = $(
        '<div>',
        {
          'class': 'asset-selector-invalid-message'
        }
      ).append([
        previewInvalidMessageTitle,
        previewInvalidMessageDescription
      ]);

      var previewIframe = $(
        '<iframe>',
        {
          'class': 'asset-selector-preview-iframe'
        }
      );

      var previewContainer = $(
        '<div>',
        {
          'class': 'asset-selector-preview-container'
        }
      ).append([
        previewInvalidMessage,
        previewIframe
      ]);

      var backButton = _renderModalBackButton(Constants.ASSET_SELECTOR_CHOOSE_PROVIDER);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn accent-btn',
          'data-action': Constants.ASSET_SELECTOR_APPLY
        }
      ).text(I18n.t('editor.asset_selector.insert_button_text'));

      var content = $('<div>', { 'class': 'asset-selector-input-group' }).append([
        inputLabel,
        inputControl,
        previewContainer
      ]);

      var buttonGroup = $(
        '<div>',
        {
          'class': 'asset-selector-button-group r-to-l'
        }).append([ backButton, insertButton ]);

      return [ heading, closeButton, content, buttonGroup ];
    }

    /**
     * componentValue is of the following form:
     *
     * {
     *   type: 'media',
     *   subtype: 'youtube',
     *   value: {
     *     id: '<Youtube video id>',
     *     url: '<Youtube video url>'
     *   }
     * }
     */
    function _renderChooseYoutubeData(componentProperties) {

      var youtubeId = null;
      var youtubeUrl = null;
      var youtubeEmbedUrl;
      var iframeElement = _dialog.find('.asset-selector-preview-iframe');
      var iframeSrc = iframeElement.attr('src');
      var inputControl = _dialog.find('[data-asset-selector-validate-field="youtubeId"]');
      var iframeContainer;
      var insertButton = _dialog.find(
        '[data-action="' + Constants.ASSET_SELECTOR_APPLY + '"]'
      );

      if (componentProperties !== null &&
        _.has(componentProperties, 'id') &&
        _.has(componentProperties, 'url')) {

        youtubeId = componentProperties.id;
        youtubeUrl = componentProperties.url;
      }

      if (youtubeId !== null && youtubeUrl !== null) {

        inputControl.val(youtubeUrl);

        // If there is a valid Youtube video id and it does not match the
        // current source of the preview iframe, point the preview iframe
        // at the new youtube video.
        youtubeEmbedUrl = utils.generateYoutubeIframeSrc(youtubeId);
        if (iframeSrc !== youtubeEmbedUrl) {
          iframeElement.attr('src', youtubeEmbedUrl);
        }

        insertButton.prop('disabled', false);

      } else {

        iframeContainer = _dialog.find('.asset-selector-preview-container');

        // Do not show the 'invalid url' icon if the user has not input
        // any text, or if they have deleted what text they did input.
        if (_.isEmpty(inputControl.val().replace(/\s/g, ''))) {
          iframeContainer.removeClass('invalid');
        } else {
          iframeContainer.addClass('invalid');
        }

        // If there is no valid Youtube video id but the current source of
        // the iframe is not `about:blank`, then reset it to `about:blank`.
        if (iframeSrc !== 'about:blank') {
          iframeElement.attr('src', 'about:blank');
        }

        insertButton.prop('disabled', true);
      }
    }

    function _renderChooseDatasetTemplate() {
      _addModalDialogClass('modal-dialog-wide');

      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.visualization.choose_dataset_heading')
      );
      var closeButton = _renderModalCloseButton();
      var backButton = _renderModalBackButton(Constants.ASSET_SELECTOR_CHOOSE_PROVIDER);

      var datasetChooserIframe = $(
        '<iframe>',
        {
          'class': 'asset-selector-dataset-chooser-iframe asset-selector-full-width-iframe bg-loading-spinner',
          'src': _datasetChooserUrl()
        }
      );

      datasetChooserIframe[0].onDatasetSelected = function(datasetObj) {
        $(this).trigger('datasetSelected', datasetObj);
      };

      return [ heading, closeButton, datasetChooserIframe, backButton ];
    }

    function _renderConfigureVisualizationTemplate() {

      _addModalDialogClass('modal-dialog-wide');

      var configureVisualizationIframe = $(
        '<iframe>',
        {
          'class': 'asset-selector-configure-visualization-iframe asset-selector-full-width-iframe bg-loading-spinner',
          'src': ''
        }
      );

      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.visualization.configure_vizualization_heading')
      );
      var closeButton = _renderModalCloseButton();
      var backButton = _renderModalBackButton(Constants.ASSET_SELECTOR_CHOOSE_VISUALIZATION);

      // TODO: Map insert button to APPLY instead of CLOSE, and share insert button
      // into shared function
      var insertButton = $(
        '<button>',
        {
          'class': 'btn accent-btn',
          'data-action': Constants.ASSET_SELECTOR_APPLY,
          'disabled': 'disabled'
        }
      ).text(I18n.t('editor.asset_selector.insert_button_text'));

      var buttonGroup = $(
        '<div>',
        {
          'class': 'asset-selector-button-group r-to-l'
        }).append([ backButton, insertButton ]);


      configureVisualizationIframe[0].onVisualizationSelected = function(datasetObj) {
        // This function is called by the visualization chooser when:
        //   - The user makes or clears a selection (argument is either null or a visualization).
        //   - The page finishes loading (argument is null).
        // In either case, we should consider the iframe loaded.
        $(this).
          removeClass('bg-loading-spinner').
          trigger('visualizationSelected', datasetObj);
      };

      return [ heading, closeButton, configureVisualizationIframe, buttonGroup ];
    }

    function _renderConfigureVisualizationData(componentProperties) {
      var iframeElement = _dialog.find('.asset-selector-configure-visualization-iframe');
      var currentIframeSrc = iframeElement.attr('src');
      var newIframeSrc = _visualizationChooserUrl(componentProperties.dataSource.fourByFour);
      var insertButton = _dialog.find(
        '[data-action="' + Constants.ASSET_SELECTOR_APPLY + '"]'
      );

      if (currentIframeSrc !== newIframeSrc) {
        iframeElement.attr('src', newIframeSrc);
      }

      if (_isVisualizationValid(componentProperties)) {
        insertButton.prop('disabled', false);
      } else {
        insertButton.prop('disabled', true);
      }

    }


    /**
     * Small helper functions
     */

    function _isVisualizationValid(componentProperties) {
      // For now, if we have a baseQuery we have a valid configuration
      // TODO: better check here
      return !_.isEmpty(componentProperties.dataSource.baseQuery);
    }

    function _datasetChooserUrl() {
      return encodeURI(
        '{0}/browse/select_dataset?suppressed_facets[]=type&limitTo=datasets'.
          format(window.location.origin)
      );
    }

    function _visualizationChooserUrl(datasetId) {
      return encodeURI(
        '{0}/component/visualization/add?datasetId={1}'.
          format(window.location.origin, datasetId)
      );
    }

    function _renderModalTitle(titleText) {
      return $('<h1>', { 'class': 'modal-title' }).text(titleText);
    }

    function _renderModalCloseButton() {

      return $(
        '<button>',
        {
          'class': 'modal-close-btn',
          'data-action': Constants.ASSET_SELECTOR_CLOSE
        }
      ).append(
        $(
          '<span>',
          {
            'class': 'icon-cross2',
            'data-action': Constants.ASSET_SELECTOR_CLOSE
          }
        )
      );
    }

    function _renderModalBackButton(backAction) {
      return $(
        '<button>',
        {
          'class': 'btn back-btn',
          'data-action': backAction
        }
      ).append([
        $(
          '<span>',
          {
            'class': 'icon-arrow-left2'
          }
        ),
        I18n.t('editor.asset_selector.back_button_text')
      ]);
    }

    function _showSelector() {
      _container.removeClass('hidden');
    }

    function _hideSelector() {
      _container.addClass('hidden');
    }

    function _addModalDialogClass(className) {
      _dialog.addClass(className);
    }

    /**
     * Responsible for:
     *  - Removing all classes starting with `modal-dialog-` from the modal dialog
     * Usage:
     * - Call when state changes to clear out state-specific classes
     */
    function _resetModalDialogClass() {
      var newClassList = _.reject(
        _dialog.attr('class').split(' '),
        function(className) {
          return _.startsWith(className, 'modal-dialog-');
        }
      );

      _dialog.attr('class', newClassList.join(' '));
    }
  }

  root.socrata.storyteller.AssetSelectorRenderer = AssetSelectorRenderer;
})(window);
