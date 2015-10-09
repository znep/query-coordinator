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
    var _warnAboutInsecureHTML = false;

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
              action: Actions.ASSET_SELECTOR_CLOSE
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
          action: Actions.ASSET_SELECTOR_CLOSE
        });
      });

      _dialog.on(
        'change',
        '[data-asset-selector-validate-field="imageUpload"]',
        function(event) {
          if (event.target.files && event.target.files.length > 0) {

            if (storyteller.fileUploader !== undefined && storyteller.fileUploader !== null) {
              storyteller.fileUploader.destroy();
            }

            storyteller.fileUploader = new storyteller.FileUploader();
            storyteller.fileUploader.upload(event.target.files[0]);
          }
        }
      );

      _dialog.on(
        'keyup',
        '[data-asset-selector-validate-field="youtubeId"]',
        function(event) {

          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
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
                action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
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
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            datasetUid: datasetObj.id,
            isNewBackend: datasetObj.newBackend
          });
        }
      );

      _dialog.on(
        'visualizationSelected',
        function(event, selectedVisualization) {
          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
            vif: selectedVisualization
          });
        }
      );

      var currentHtmlFragment = '';
      var debounceForOneSecondThenUploadHtmlFragment = _.debounce(function(event) {
        if (storyteller.fileUploader !== undefined && storyteller.fileUploader !== null) {
          storyteller.fileUploader.destroy();
        }

        var htmlFragment = $(event.target).val();
        _warnAboutInsecureHTML = /src=("|')http:\/\//.test(htmlFragment);
        if (htmlFragment.length === 0 || htmlFragment === currentHtmlFragment) {
          return;
        }

        var simulatedFileForUpload = {
          name: 'embedded_fragment.html',
          size: htmlFragment.length,
          type: 'text/html',
          body: htmlFragment
        };

        storyteller.fileUploader = new storyteller.FileUploader();
        storyteller.fileUploader.upload(simulatedFileForUpload, {
          progressAction: Actions.EMBED_CODE_UPLOAD_PROGRESS,
          errorAction: Actions.EMBED_CODE_UPLOAD_ERROR,
          doneAction: Actions.EMBED_CODE_UPLOAD_DONE
        });

        currentHtmlFragment = htmlFragment;
      }, Constants.EMBED_CODE_DEBOUNCE_DELAY);

      _dialog.on(
        'keyup',
        '[data-asset-selector-field="embedHtml"]',
        debounceForOneSecondThenUploadHtmlFragment
      );

      _dialog.on('click', '[data-action]', function() {

        var action = this.getAttribute('data-action');

        switch (action) {

          case Actions.ASSET_SELECTOR_CHOOSE_PROVIDER:
            storyteller.dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_CHOOSE_PROVIDER,
              blockId: storyteller.assetSelectorStore.getCurrentBlockId(),
              componentIndex: storyteller.assetSelectorStore.getCurrentComponentIndex()
            });
            break;

          case Actions.ASSET_SELECTOR_CHOOSE_YOUTUBE:
            storyteller.dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_CHOOSE_YOUTUBE
            });
            break;

          case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION:
            storyteller.dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION
            });
            break;

          case Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD:
            storyteller.dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD
            });
            break;

          case Actions.ASSET_SELECTOR_CHOOSE_EMBED_CODE:
            storyteller.dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_CHOOSE_EMBED_CODE
            });
            break;

          case Actions.ASSET_SELECTOR_APPLY:
            storyteller.dispatcher.dispatch({
              action: Actions.BLOCK_UPDATE_COMPONENT,
              blockId: storyteller.assetSelectorStore.getCurrentBlockId(),
              componentIndex: storyteller.assetSelectorStore.getCurrentComponentIndex(),
              type: storyteller.assetSelectorStore.getCurrentComponentType(),
              value: storyteller.assetSelectorStore.getCurrentComponentValue()
            });
            storyteller.dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_CLOSE
            });
            break;

          case Actions.ASSET_SELECTOR_CLOSE:
            storyteller.dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_CLOSE
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

          case Actions.ASSET_SELECTOR_CHOOSE_PROVIDER:
            selectorContent = _renderChooseProvider();
            break;

          case Actions.ASSET_SELECTOR_CHOOSE_YOUTUBE:
            selectorContent = _renderChooseYoutubeTemplate(componentValue);
            break;

          case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION:
            selectorContent = _renderChooseDatasetTemplate();
            break;

          case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET:
            selectorContent = _renderConfigureVisualizationTemplate();
            break;

          case Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD:
            selectorContent = _renderChooseImageUploadTemplate();
            break;

          case Actions.FILE_UPLOAD_PROGRESS:
          case Actions.FILE_UPLOAD_ERROR:
            selectorContent = _renderFileUploadProgressTemplate();
            break;

          case Actions.FILE_UPLOAD_DONE:
            selectorContent = _renderImagePreviewTemplate();
            break;

          case Actions.ASSET_SELECTOR_CHOOSE_EMBED_CODE:
            selectorContent = _renderChooseEmbedCodeTemplate(componentValue);
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

        case Actions.ASSET_SELECTOR_CHOOSE_YOUTUBE:
          _renderChooseYoutubeData(componentValue);
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET:
          _renderConfigureVisualizationData(componentValue);
          break;

        case Actions.FILE_UPLOAD_DONE:
          _renderImagePreviewData(componentValue);
          break;

        case Actions.FILE_UPLOAD_ERROR:
          _renderImageUploadErrorData(componentValue);
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_EMBED_CODE:
          _renderPreviewEmbedCodeData(componentValue);
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

      var youtubeHeader = $('<h3>').
        text(I18n.t('editor.asset_selector.youtube.name'));
      var youtubeDescription = $('<p>').
        text(I18n.t('editor.asset_selector.youtube.description'));

      var visualizationHeader = $('<h3>').
        text(I18n.t('editor.asset_selector.visualization.name'));
      var visualizationDescription = $('<p>').
        text(I18n.t('editor.asset_selector.visualization.description'));

      var imageUploadHeader = $('<h3>').
        text(I18n.t('editor.asset_selector.image_upload.name'));
      var imageUploadDescription = $('<p>').
        text(I18n.t('editor.asset_selector.image_upload.description'));

      var embedCodeHeader = $('<h3>').
        text(I18n.t('editor.asset_selector.embed_code.name'));
      var embedCodeDescription = $('<p>').
        text(I18n.t('editor.asset_selector.embed_code.description'));

      var providers = $('<ul>', {'class': 'button-list'}).append([
        $('<li>', {
          'data-action': Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION
        }).append(visualizationHeader, visualizationDescription),
        $('<li>', {
          'data-action': Actions.ASSET_SELECTOR_CHOOSE_YOUTUBE
        }).append(youtubeHeader, youtubeDescription),
        $('<li>', {
          'data-action': Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD
        }).append(imageUploadHeader, imageUploadDescription),
        $('<li>', {
          'data-action': Actions.ASSET_SELECTOR_CHOOSE_EMBED_CODE
        }).append(embedCodeHeader, embedCodeDescription)
      ]);

      var content = $('<div>', { 'class': 'modal-content' }).append(providers);

      return [ heading, closeButton, content ];
    }

    function _renderChooseImageUploadTemplate() {

      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.image_upload.name')
      );

      var closeButton = _renderModalCloseButton();

      var inputSubtext = $('<h3>', {
        'class': 'asset-selector-input-subtext'
      }).text(I18n.t('editor.asset_selector.image_upload.input_subtext'));

      var inputLabel = $(
        '<h2>',
        { 'class': 'asset-selector-input-label asset-selector-input-label-centered input-label' }
      ).text(I18n.t('editor.asset_selector.image_upload.input_label'));

      var inputButton = $('<button>', {
        'class': 'btn-primary'
      }).text(I18n.t('editor.asset_selector.image_upload.input_button_text'));

      var inputControl = $(
        '<input>',
        {
          'class': 'asset-selector-text-input hidden',
          'data-asset-selector-validate-field': 'imageUpload',
          'type': 'file'
        }
      );

      var backButton = _renderModalBackButton(Actions.ASSET_SELECTOR_CHOOSE_PROVIDER);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn btn-primary',
          'data-action': Actions.ASSET_SELECTOR_APPLY,
          'disabled': 'disabled'
        }
      ).text(I18n.t('editor.asset_selector.insert_button_text'));

      var content = $(
        '<div>',
        { 'class': 'asset-selector-input-group asset-selector-input-group-fixed-height' }
      ).append([
        inputSubtext,
        inputButton,
        inputLabel,
        inputControl
      ]);

      var buttonGroup = $(
        '<div>',
        { 'class': 'asset-selector-button-group r-to-l' }
      ).append([
        backButton,
        insertButton
      ]);

      // Indirection for styling's sake.
      // The <button> clicks triggers an <input type=file> click.
      inputButton.click(function(event) {
        event.preventDefault();
        inputControl.click();
      });

      return [ heading, closeButton, content, buttonGroup ];
    }

    function _renderFileUploadProgressTemplate() {
      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.image_upload.name')
      );

      var closeButton = _renderModalCloseButton();

      var progress = $(
        '<div>',
        { 'class': 'asset-selector-image-upload-progress' }
      );

      var progressSpinner = $('<button>', {
        'class': 'btn btn-transparent btn-busy',
        'disabled': true
      }).append($('<span>'));

      var uploadProgressMessage = $(
        '<h3>',
        { 'class': 'asset-selector-input-subtext' }
      ).text(I18n.t('editor.asset_selector.image_upload.uploading_message'));

      var uploadCancelButton = $(
        '<button>',
        {
          'class': 'btn-default btn-inverse asset-selector-cancel-upload',
          'data-action': Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD
        }
      ).text(I18n.t('editor.asset_selector.cancel_button_text'));

      var tryAgainButton = $(
        '<button>',
        {
          'class': 'hidden btn-default btn-inverse asset-selector-try-again',
          'data-action': Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD
        }
      ).text(I18n.t('editor.asset_selector.try_again_button_text'));

      progress.append([
        uploadProgressMessage,
        progressSpinner,
        uploadCancelButton,
        tryAgainButton
      ]);

      var backButton = _renderModalBackButton(Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn-primary',
          'data-action': Actions.ASSET_SELECTOR_APPLY,
          'disabled': 'disabled'
        }
      ).text(I18n.t('editor.asset_selector.insert_button_text'));

      var content = $(
        '<div>',
        { 'class': 'asset-selector-input-group' }
      ).append([
        progress
      ]);

      var buttonGroup = $(
        '<div>',
        { 'class': 'asset-selector-button-group r-to-l' }
      ).append([
        backButton,
        insertButton
      ]);

      return [ heading, closeButton, content, buttonGroup ];
    }


    function _renderImageUploadErrorData(componentProperties) {
      var progressContainer = _dialog.find('.asset-selector-image-upload-progress');
      var progressSpinner = progressContainer.find('.btn-busy');
      var progressMessage = progressContainer.find('.asset-selector-uploading-message');
      var cancelButton = progressContainer.find('.asset-selector-cancel-upload');
      var tryAgainButton = progressContainer.find('.asset-selector-try-again');
      var errorStep = componentProperties.step;
      var messageTranslationKey;

      if (componentProperties.step) {
        cancelButton.remove();
        progressSpinner.addClass('hidden');
        tryAgainButton.removeClass('hidden');

        if (/^validation.*/.test(errorStep)) {
          messageTranslationKey = 'editor.asset_selector.image_upload.errors.{0}'.format(errorStep);
        } else {
          messageTranslationKey = 'editor.asset_selector.image_upload.errors.exception';
        }

        progressMessage.html(I18n.t(messageTranslationKey));
      }
    }

    function _renderImagePreviewTemplate() {

      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.image_upload.name')
      );

      var closeButton = _renderModalCloseButton();

      var previewImage = $(
        '<img>',
        { 'class': 'asset-selector-preview-image' }
      );

      var previewContainer = $(
        '<div>',
        { 'class': 'asset-selector-preview-image-container bg-loading-spinner' }
      ).append([
        previewImage
      ]);

      var backButton = _renderModalBackButton(Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn-primary',
          'data-action': Actions.ASSET_SELECTOR_APPLY
        }
      ).text(I18n.t('editor.asset_selector.insert_button_text'));

      var buttonGroup = $(
        '<div>',
        { 'class': 'asset-selector-button-group r-to-l' }
      ).append([
        backButton,
        insertButton
      ]);

      var content = $(
        '<div>',
        { 'class': 'asset-selector-input-group' }
      ).append([
        previewContainer
      ]);

      return [ heading, closeButton, content, buttonGroup ];
    }

    function _renderImagePreviewData(componentProperties) {

      var documentId = null;
      var imageUrl = null;
      var imageContainer = _dialog.find('.asset-selector-preview-image-container');
      var imageElement = imageContainer.find('.asset-selector-preview-image');
      var imageSrc = imageElement.attr('src');
      var insertButton = _dialog.find(
        '[data-action="' + Actions.ASSET_SELECTOR_APPLY + '"]'
      );

      if (componentProperties !== null &&
        _.has(componentProperties, 'documentId') &&
        _.has(componentProperties, 'url')) {

        documentId = componentProperties.documentId;
        imageUrl = componentProperties.url;
      }

      if (!_.isNull(documentId) && !_.isNull(imageUrl)) {

        if (imageSrc !== imageUrl) {
          imageElement.attr('src', imageUrl);
        }

        imageContainer.removeClass('bg-loading-spinner');
        insertButton.prop('disabled', false);
      } else {
        insertButton.prop('disabled', true);
      }
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

      var backButton = _renderModalBackButton(Actions.ASSET_SELECTOR_CHOOSE_PROVIDER);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn btn-primary',
          'data-action': Actions.ASSET_SELECTOR_APPLY
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
        '[data-action="' + Actions.ASSET_SELECTOR_APPLY + '"]'
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

    /**
     * componentProperties is of the following form:
     *
     * {
     *   type: 'embeddedHtml',
     *   value: {
     *     url: '<html fragment url>'
     *     layout: {
     *       height: 300
     *     }
     *   }
     * }
     */
    function _renderPreviewEmbedCodeData(componentProperties) {

      var htmlFragmentUrl = null;
      var percentLoaded = null;
      var errorStep = null;
      var messageTranslationKey;
      var iframeContainer = _dialog.find('.asset-selector-preview-container');
      var iframeElement = _dialog.find('.asset-selector-preview-iframe');
      var invalidMessageContainer = _dialog.find('.asset-selector-invalid-message');
      var invalidMessageElement = _dialog.find('.asset-selector-invalid-description');
      var iframeSrc = iframeElement.attr('src');
      var loadingButton = _dialog.find('.btn-busy');
      var insertButton = _dialog.find('[data-action="{0}"]'.format(Actions.ASSET_SELECTOR_APPLY));
      var insecureHtmlWarning = _dialog.find('.asset-selector-insecure-html-warning');

      if (_.has(componentProperties, 'url')) {
        htmlFragmentUrl = componentProperties.url;
      }

      if (_.has(componentProperties, 'percentLoaded')) {
        percentLoaded = componentProperties.percentLoaded;
      }

      if (_.has(componentProperties, 'step')) {
        errorStep = componentProperties.step;
      }

      insecureHtmlWarning.toggle(_warnAboutInsecureHTML);

      if (!_.isNull(htmlFragmentUrl)) {

        if (iframeSrc !== htmlFragmentUrl) {
          iframeElement.attr('src', htmlFragmentUrl);
        }

        iframeContainer.
          removeClass('placeholder').
          removeClass('invalid');

        loadingButton.addClass('hidden');
        invalidMessageContainer.hide();
        insertButton.prop('disabled', false);
      } else if (!_.isNull(errorStep)) {

        if (/^validation.*/.test(errorStep)) {
          messageTranslationKey = 'editor.asset_selector.embed_code.errors.{0}'.format(errorStep);
        } else {
          messageTranslationKey = 'editor.asset_selector.embed_code.errors.exception';
        }

        iframeElement.attr('src', '');
        invalidMessageContainer.show();
        invalidMessageElement.html(I18n.t(messageTranslationKey));

        iframeContainer.
          removeClass('placeholder').
          addClass('invalid');

        loadingButton.addClass('hidden');
        insertButton.prop('disabled', true);
      } else if (!_.isNull(percentLoaded)) {

        invalidMessageContainer.hide();

        iframeContainer.
          removeClass('placeholder').
          removeClass('invalid');

        loadingButton.removeClass('hidden');
        insertButton.prop('disabled', true);
      } else {
        invalidMessageContainer.hide();
        loadingButton.addClass('hidden');
        insertButton.prop('disabled', true);
      }
    }

    function _renderChooseDatasetTemplate() {
      _addModalDialogClass('modal-dialog-wide');

      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.visualization.choose_dataset_heading')
      );
      var closeButton = _renderModalCloseButton();
      var backButton = _renderModalBackButton(Actions.ASSET_SELECTOR_CHOOSE_PROVIDER);

      var datasetChooserIframe = $(
        '<iframe>',
        {
          'class': 'asset-selector-dataset-chooser-iframe asset-selector-full-width-iframe',
          'src': _datasetChooserUrl()
        }
      );

      var loadingButton = $('<button>', {
        'class': 'btn btn-transparent btn-busy',
        'disabled': true
      }).append($('<span>'));

      heading.append(loadingButton);

      var buttonGroup = $('<div>', {
        'class': 'asset-selector-button-group r-to-l'
      }).append([ backButton ]);

      datasetChooserIframe[0].onDatasetSelected = function(datasetObj) {
        $(this).trigger('datasetSelected', datasetObj);
      };

      datasetChooserIframe.one('load', function() {
        loadingButton.addClass('hidden');
      });

      return [ heading, closeButton, datasetChooserIframe, buttonGroup ];
    }

    function _renderConfigureVisualizationTemplate() {

      _addModalDialogClass('modal-dialog-wide');

      var configureVisualizationIframe = $(
        '<iframe>',
        {
          'class': 'asset-selector-configure-visualization-iframe asset-selector-full-width-iframe',
          'src': ''
        }
      );

      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.visualization.configure_vizualization_heading')
      );
      var closeButton = _renderModalCloseButton();
      var backButton = _renderModalBackButton(Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION);

      // TODO: Map insert button to APPLY instead of CLOSE, and share insert button
      // into shared function
      var insertButton = $(
        '<button>',
        {
          'class': 'btn-primary',
          'data-action': Actions.ASSET_SELECTOR_APPLY,
          'disabled': 'disabled'
        }
      ).text(I18n.t('editor.asset_selector.insert_button_text'));

      var loadingButton = $('<button>', {
        'class': 'btn-transparent btn-busy',
        'disabled': true
      }).append($('<span>'));

      heading.append(loadingButton);

      var buttonGroup = $('<div>', {
        'class': 'asset-selector-button-group r-to-l'
      }).append([ backButton, insertButton ]);

      configureVisualizationIframe[0].onVisualizationSelected = function(datasetObj) {
        // This function is called by the visualization chooser when:
        //   - The user makes or clears a selection (argument is either null or a visualization).
        //   - The page finishes loading (argument is null).
        // In either case, we should consider the iframe loaded.
        configureVisualizationIframe.
          trigger('visualizationSelected', datasetObj);
      };

      return [ heading, closeButton, configureVisualizationIframe, buttonGroup ];
    }

    function _renderConfigureVisualizationData(componentProperties) {
      var iframeElement = _dialog.find('.asset-selector-configure-visualization-iframe');
      var currentIframeSrc = iframeElement.attr('src');
      var newIframeSrc = _visualizationChooserUrl(componentProperties.vif.datasetUid);
      var insertButton = _dialog.find(
        '[data-action="' + Actions.ASSET_SELECTOR_APPLY + '"]'
      );

      if (currentIframeSrc !== newIframeSrc) {
        iframeElement.
          attr('src', newIframeSrc).
          one('load', function() {
            $('#asset-selector-container .btn-transparent.btn-busy').addClass('hidden');
          });
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
      // columnName will only be added once a valid column is selected.
      return componentProperties.hasOwnProperty('vif') && componentProperties.vif.hasOwnProperty('columnName');
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

    function _renderChooseEmbedCodeTemplate() {

      var heading = _renderModalTitle(
        I18n.t('editor.asset_selector.embed_code.heading')
      );

      var closeButton = _renderModalCloseButton();

      var loadingButton = $('<button>', {
        'class': 'btn-transparent btn-busy hidden',
        disabled: true
      }).append($('<span>'));

      var inputLabel = $('<h2>', { 'class': 'asset-selector-input-label input-label' }).
        text(I18n.t('editor.asset_selector.embed_code.input_label'));

      var inputControl = $(
        '<textarea>',
        {
          'class': 'asset-selector-text-input',
          'data-asset-selector-field': 'embedHtml',
          'type': 'text'
        }
      );

      var previewLabel = $('<h3>', { 'class': 'asset-selector-input-label input-label' }).
        text(I18n.t('editor.asset_selector.embed_code.preview_label'));

      var previewInsecureMessage = $(
        '<div>',
        { 'class': 'asset-selector-insecure-html-warning warning-bar' }
      ).append(
        $('<p>').append($('<span>', {'class': 'icon-warning'})),
        $('<p>').text(I18n.t('editor.asset_selector.embed_code.insecure_html_warning'))
      );

      var previewInvalidMessageTitle = $(
        '<div>',
        { 'class': 'asset-selector-invalid-title' }
      ).html(
        [
          I18n.t('editor.asset_selector.embed_code.invalid_message_title_1'),
          '<br />',
          I18n.t('editor.asset_selector.embed_code.invalid_message_title_2')
        ].join('')
      );

      var previewInvalidMessageDescription = $(
        '<div>',
        { 'class': 'asset-selector-invalid-description' }
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
          'class': 'asset-selector-preview-container placeholder'
        }
      ).append([
        loadingButton,
        previewInsecureMessage,
        previewInvalidMessage,
        previewIframe
      ]);

      var backButton = _renderModalBackButton(Actions.ASSET_SELECTOR_CHOOSE_PROVIDER);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn-primary',
          'data-action': Actions.ASSET_SELECTOR_APPLY
        }
      ).text(I18n.t('editor.asset_selector.insert_button_text'));

      var content = $('<div>', { 'class': 'asset-selector-input-group' }).append([
        inputLabel,
        inputControl,
        previewLabel,
        previewContainer
      ]);

      var buttonGroup = $(
        '<div>',
        {
          'class': 'asset-selector-button-group r-to-l'
        }).append([ backButton, insertButton ]);

      return [ heading, closeButton, content, buttonGroup ];
    }

    function _renderModalTitle(titleText) {
      return $('<h1>', { 'class': 'modal-title' }).text(titleText);
    }

    function _renderModalCloseButton() {

      return $(
        '<button>',
        {
          'class': 'modal-close-btn',
          'data-action': Actions.ASSET_SELECTOR_CLOSE
        }
      ).append(
        $(
          '<span>',
          {
            'class': 'icon-cross2',
            'data-action': Actions.ASSET_SELECTOR_CLOSE
          }
        )
      );
    }

    function _renderModalBackButton(backAction) {
      return $(
        '<button>',
        {
          'class': 'btn-default btn-inverse back-btn',
          'data-action': backAction
        }
      ).text(
        I18n.t('editor.asset_selector.back_button_text')
      );
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
