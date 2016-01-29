(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function AssetSelectorRenderer(options) {

    var WIZARD_STEP = storyteller.AssetSelectorStore.WIZARD_STEP;
    var _container = options.assetSelectorContainerElement || null;
    var _lastRenderedStep = null;
    var _warnAboutInsecureHTML = false;

    if (!(_container instanceof jQuery)) {

      throw new Error(
        '`options.assetSelectorContainerElement` ' +
        'must be a jQuery element (is of type ' +
        (typeof _container) +
        ').'
      );
    }

    _container.modal();

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

      _container.on('modal-dismissed', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CLOSE
        });
      });

      _container.on(
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

      _container.on(
        'cut paste keyup',
        '.asset-selector-alt-text-input',
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
                action: Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE,
                altAttribute: $(event.target).val()
              });
            }, 0);
          } else {
            storyteller.dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE,
              altAttribute: $(event.target).val()
            });
          }
        }
      );

      _container.on(
        'mouseenter',
        '.asset-selector-image-alt-hint',
        function() {
          storyteller.flyoutRenderer.render({
            element: this,
            content: '<span class="tooltip-text">' +
              I18n.t('editor.asset_selector.image_preview.alt_attribute_tooltip') +
              '</span>',
            rightSideHint: false,
            belowTarget: false
          });
        }
      );

      _container.on(
        'mouseout',
        '.asset-selector-image-alt-hint',
        function() {
          storyteller.flyoutRenderer.clear();
        }
      );

      _container.on(
        'keyup',
        '[data-asset-selector-validate-field="storyUrl"]',
        function(event) {

          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_STORY_URL,
            url: $(event.target).val()
          });
        }
      );

      _container.on(
        'cut paste',
        '[data-asset-selector-validate-field="storyUrl"]',
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
                action: Actions.ASSET_SELECTOR_UPDATE_STORY_URL,
                url: $(event.target).val()
              });
            }, 0);
          }
        }
      );

      _container.on(
        'cut paste keyup',
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
          } else {
            storyteller.dispatcher.dispatch({
              action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
              url: $(event.target).val()
            });
          }
        }
      );

      _container.on(
        'datasetSelected',
        function(event, datasetObj) {
          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            datasetUid: datasetObj.id,
            isNewBackend: datasetObj.newBackend
          });
        }
      );

      _container.on(
        'visualizationSelected',
        function(event, selectedVisualization) {
          storyteller.dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
            visualization: selectedVisualization
          });
        }
      );

      var currentHtmlFragment = '';
      var debounceForOneSecondThenUploadHtmlFragment = _.debounce(function(event) {
        if (storyteller.fileUploader !== undefined && storyteller.fileUploader !== null) {
          storyteller.fileUploader.destroy();
          currentHtmlFragment = undefined;
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

      _container.on(
        'keyup',
        '[data-asset-selector-field="embedHtml"]',
        debounceForOneSecondThenUploadHtmlFragment
      );

      _container.on('click', '[data-provider]', function() {
        var provider = this.getAttribute('data-provider');
        utils.assert(provider, 'provider must be defined');

        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
          blockId: storyteller.assetSelectorStore.getBlockId(),
          componentIndex: storyteller.assetSelectorStore.getComponentIndex(),
          provider: provider
        });
      });

      _container.on('click', '[data-resume-from-step]', function() {
        var step = this.getAttribute('data-resume-from-step');
        utils.assert(step, 'step must be provided');

        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
          step: step
        });
      });

      _container.on('click', '.btn-apply', function() {
        _saveAndClose();
      });

      _container.on('click', '.btn-close', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CLOSE
        });
      });
    }

    function _saveAndClose() {
      // TODO this sequence of steps should likely be its own single action,
      // which both AssetSelectorStore and StoryStore handle.
      storyteller.dispatcher.dispatch({
        action: Actions.BLOCK_UPDATE_COMPONENT,
        blockId: storyteller.assetSelectorStore.getBlockId(),
        componentIndex: storyteller.assetSelectorStore.getComponentIndex(),
        type: storyteller.assetSelectorStore.getComponentType(),
        value: storyteller.assetSelectorStore.getComponentValue()
      });

      storyteller.dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_CLOSE
      });
    }

    function _renderSelector() {

      var step = storyteller.assetSelectorStore.getStep();
      var componentType = storyteller.assetSelectorStore.getComponentType();
      var componentValue = storyteller.assetSelectorStore.getComponentValue();
      var selectorTitle;
      var selectorContent;
      var selectorWideDisplay = false;

      // See if we need to render a new template, then render a media selector step if
      // necessary.
      if (step !== _lastRenderedStep) {

        switch (step) {

          case WIZARD_STEP.SELECT_ASSET_PROVIDER:
            selectorTitle = I18n.t('editor.asset_selector.choose_provider_heading');
            selectorContent = _renderChooseProvider();
            break;

          case WIZARD_STEP.ENTER_STORY_URL:
            selectorTitle = I18n.t('editor.asset_selector.story_widget.heading');
            selectorContent = _renderChooseStoryTemplate(componentValue);
            break;

          case WIZARD_STEP.ENTER_YOUTUBE_URL:
            selectorTitle = I18n.t('editor.asset_selector.youtube.heading');
            selectorContent = _renderChooseYoutubeTemplate(componentValue);
            break;

          case WIZARD_STEP.SELECT_DATASET_FOR_VISUALIZATION:
            selectorTitle = I18n.t('editor.asset_selector.visualization.choose_dataset_heading');
            selectorContent = _renderChooseDatasetTemplate();
            selectorWideDisplay = true;
            break;

          case WIZARD_STEP.SELECT_TABLE_OR_CHART:
            selectorTitle = I18n.t('editor.asset_selector.visualization.choose_visualization_mode');
            selectorContent = _renderChooseTableOrChartTemplate();
            break;

          case WIZARD_STEP.CONFIGURE_VISUALIZATION:
            selectorTitle = I18n.t('editor.asset_selector.visualization.configure_vizualization_heading');
            selectorContent = _renderConfigureVisualizationTemplate();
            selectorWideDisplay = true;
            break;

          case WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD:
            selectorTitle = I18n.t('editor.asset_selector.image_upload.name');
            selectorContent = _renderChooseImageUploadTemplate();
            break;

          case WIZARD_STEP.IMAGE_UPLOADING:
          case WIZARD_STEP.IMAGE_UPLOAD_ERROR:
            selectorTitle = I18n.t('editor.asset_selector.image_upload.name');
            selectorContent = _renderFileUploadProgressTemplate();
            break;

          case WIZARD_STEP.IMAGE_PREVIEW:
            selectorTitle = I18n.t('editor.asset_selector.image_upload.name');
            selectorContent = _renderImagePreviewTemplate();
            break;

          case WIZARD_STEP.ENTER_EMBED_CODE:
            selectorTitle = I18n.t('editor.asset_selector.embed_code.heading');
            selectorContent = _renderChooseEmbedCodeTemplate(componentValue);
            break;

          default:
            selectorTitle = null;
            selectorContent = null;
            break;
        }

        if (selectorContent) {
          _showSelectorWith({
            title: selectorTitle,
            content: selectorContent,
            wide: selectorWideDisplay
          });
        } else {
          _hideSelector();
        }
      }

      // Now put the data into the template rendered above
      // This handles updating data when the template does NOT need to be re-rendered
      // Note: Some templates may not have renderData function because they do
      // not update dynamically
      switch (step) {

        case WIZARD_STEP.ENTER_STORY_URL:
          _renderChooseStoryData(componentValue);
          break;

        case WIZARD_STEP.ENTER_YOUTUBE_URL:
          _renderChooseYoutubeData(componentValue);
          break;

        case WIZARD_STEP.CONFIGURE_VISUALIZATION:
          _renderConfigureVisualizationData(componentType, componentValue);
          break;

        case WIZARD_STEP.IMAGE_PREVIEW:
          _renderImagePreviewData(componentValue);
          break;

        case WIZARD_STEP.IMAGE_UPLOAD_ERROR:
          _renderImageUploadErrorData(componentValue);
          break;

        case WIZARD_STEP.ENTER_EMBED_CODE:
          _renderPreviewEmbedCodeData(componentValue);
          break;

        default:
          break;
      }

      _lastRenderedStep = step;
    }

    function _renderChooseProvider() {

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

      var storyWidgetHeader = $('<h3>').
        text(I18n.t('editor.asset_selector.story_widget.name'));
      var storyWidgetDescription = $('<p>').
        text(I18n.t('editor.asset_selector.story_widget.description'));

      var embedCodeHeader = $('<h3>').
        text(I18n.t('editor.asset_selector.embed_code.name'));
      var embedCodeDescription = $('<p>').
        text(I18n.t('editor.asset_selector.embed_code.description'));

      var providers = $('<ul>', {'class': 'asset-selector-button-list'}).append([
        $('<li>', {
          'data-provider': 'SOCRATA_VISUALIZATION'
        }).append(visualizationHeader, visualizationDescription),
        $('<li>', {
          'data-provider': 'STORY_WIDGET'
        }).append(storyWidgetHeader, storyWidgetDescription),
        $('<li>', {
          'data-provider': 'YOUTUBE'
        }).append(youtubeHeader, youtubeDescription),
        $('<li>', {
          'data-provider': 'IMAGE'
        }).append(imageUploadHeader, imageUploadDescription),
        $('<li>', {
          'data-provider': 'EMBED_CODE'
        }).append(embedCodeHeader, embedCodeDescription)
      ]);

      return providers;
    }

    function _renderChooseImageUploadTemplate() {

      var inputSubtext = $('<h3>', {
        'class': 'asset-selector-input-subtext'
      }).text(I18n.t('editor.asset_selector.image_upload.input_subtext'));

      var inputLabel = $(
        '<h2>',
        { 'class': 'modal-input-label modal-input-label-centered input-label' }
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

      var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn btn-primary btn-apply',
          'disabled': 'disabled'
        }
      ).text(_insertButtonText());

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
        { 'class': 'modal-button-group r-to-l' }
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

      return [ content, buttonGroup ];
    }

    function _renderFileUploadProgressTemplate() {
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
        { 'class': 'asset-selector-input-subtext asset-selector-uploading-message' }
      ).text(I18n.t('editor.asset_selector.image_upload.uploading_message'));

      var uploadCancelButton = $(
        '<button>',
        {
          'class': 'btn-default btn-inverse asset-selector-cancel-upload',
          'data-provider': 'IMAGE'
        }
      ).text(I18n.t('editor.asset_selector.cancel_button_text'));

      var tryAgainButton = $(
        '<button>',
        {
          'class': 'hidden btn-default btn-inverse asset-selector-try-again',
          'data-provider': 'IMAGE'
        }
      ).text(I18n.t('editor.asset_selector.try_again_button_text'));

      progress.append([
        uploadProgressMessage,
        progressSpinner,
        uploadCancelButton,
        tryAgainButton
      ]);

      var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn-primary btn-apply',
          'disabled': 'disabled'
        }
      ).text(_insertButtonText());

      var content = $(
        '<div>',
        { 'class': 'asset-selector-input-group' }
      ).append([
        progress
      ]);

      var buttonGroup = $(
        '<div>',
        { 'class': 'modal-button-group r-to-l' }
      ).append([
        backButton,
        insertButton
      ]);

      return [ content, buttonGroup ];
    }

    function _renderImageUploadErrorData(componentProperties) {
      var progressContainer = _container.find('.asset-selector-image-upload-progress');
      var progressSpinner = progressContainer.find('.btn-busy');
      var progressMessage = progressContainer.find('.asset-selector-uploading-message');
      var cancelButton = progressContainer.find('.asset-selector-cancel-upload');
      var tryAgainButton = progressContainer.find('.asset-selector-try-again');
      var errorStep = componentProperties.step;
      var messageTranslationKey;

      if (errorStep) {
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
      var previewImageLabel = $(
        '<h2>',
        { 'class': 'asset-selector-preview-image-label' }
      ).text(I18n.t('editor.asset_selector.image_preview.preview_label'));

      var previewImage = $(
        '<img>',
        { 'class': 'asset-selector-preview-image' }
      );

      var previewContainer = $(
        '<div>',
        { 'class': 'asset-selector-preview-image-container' }
      ).append([
        previewImage
      ]);

      var descriptionLabel = $(
        '<h2>',
        { 'class': 'asset-selector-image-description-label' }
      ).text(I18n.t('editor.asset_selector.image_preview.description_label'));

      var questionIcon = $('<span>', { 'class': 'icon-question-inverse asset-selector-image-alt-hint' });

      var inputLabelText = $(
        '<p>',
        { 'class': 'asset-selector-image-alt-input-info' }
      ).text(I18n.t('editor.asset_selector.image_preview.description_alt_attribute'));

      var inputLabel = inputLabelText.append([questionIcon]);

      var inputField = $(
        '<input>',
        {
          'class': 'asset-selector-alt-text-input',
          'type': 'text'
        }
      );

      var descriptionContainer = $(
        '<div>',
        { 'class': 'asset-selector-image-description-container' }
      ).append([
        inputField,
        inputLabel
      ]);

      var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn-primary btn-apply'
        }
      ).text(_insertButtonText());

      var buttonGroup = $(
        '<div>',
        { 'class': 'modal-button-group r-to-l' }
      ).append([
        backButton,
        insertButton
      ]);

      var content = $(
        '<div>',
        { 'class': 'asset-selector-input-group' }
      ).append([
        previewImageLabel,
        previewContainer,
        descriptionLabel,
        descriptionContainer
      ]);

      return [ content, buttonGroup ];
    }

    function _renderImagePreviewData(componentProperties) {

      var documentId = null;
      var imageUrl = null;
      var altAttribute = null;
      var imageContainer = _container.find('.asset-selector-preview-image-container');
      var imageElement = imageContainer.find('.asset-selector-preview-image');
      var imageSrc = imageElement.attr('src');
      var altInputField = _container.find('.asset-selector-alt-text-input');
      var insertButton = _container.find('.btn-apply');

      if (componentProperties !== null &&
        _.has(componentProperties, 'documentId') &&
        _.has(componentProperties, 'url')) {

        documentId = componentProperties.documentId;
        imageUrl = componentProperties.url;
        altAttribute = componentProperties.alt;
      }

      altInputField.attr('value', _.isEmpty(altAttribute) ? null : altAttribute);

      if (!_.isNull(documentId) && !_.isNull(imageUrl)) {

        if (imageSrc !== imageUrl) {
          imageElement.attr('src', imageUrl);
        }

        insertButton.prop('disabled', false);
      } else {
        insertButton.prop('disabled', true);
      }
    }

    function _renderChooseStoryTemplate() {

      var inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
        text(I18n.t('editor.asset_selector.story_widget.input_label'));

      var inputControl = $(
        '<input>',
        {
          'class': 'asset-selector-text-input',
          'data-asset-selector-validate-field': 'storyUrl',
          'placeholder': 'https://www.example.com/stories/s/abcd-efgh',
          'type': 'text'
        }
      );

      var previewInvalidMessageTitle = $(
        '<div>',
        { 'class': 'asset-selector-invalid-title' }
      ).html(
        [
          I18n.t('editor.asset_selector.story_widget.invalid_message_title_1'),
          '<br />',
          I18n.t('editor.asset_selector.story_widget.invalid_message_title_2')
        ].join('')
      );

      var previewInvalidMessageDescription = $(
        '<div>',
        { 'class': 'asset-selector-invalid-description' }
      ).text(
        I18n.t('editor.asset_selector.story_widget.invalid_message_description')
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

      var previewWidgetContainer = $(
        '<div>',
        {
          'class': 'asset-selector-preview-widget-container'
        }
      );

      var previewContainer = $(
        '<div>',
        {
          'class': 'asset-selector-preview-container asset-selector-story-widget-preview-container'
        }
      ).append([
        previewInvalidMessage,
        previewWidgetContainer
      ]);

      var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn btn-primary btn-apply'
        }
      ).text(_insertButtonText());

      var content = $('<div>', { 'class': 'asset-selector-input-group' }).append([
        inputLabel,
        inputControl,
        previewContainer
      ]);

      var buttonGroup = $(
        '<div>',
        {
          'class': 'modal-button-group r-to-l'
        }).append([ backButton, insertButton ]);

      return [ content, buttonGroup ];
    }

    /**
     * componentValue is of the following form:
     *
     * {
     *   type: 'media',
     *   subtype: 'storyWidget',
     *   value: {
     *     url: '<Story url>'
     *   }
     * }
     */
    function _renderChooseStoryData(componentProperties) {
      var $previewContainer = _container.find('.asset-selector-preview-container');
      var $storyWidgetPreviewContainer = _container.find('.asset-selector-preview-widget-container');
      var $inputControl = _container.find('[data-asset-selector-validate-field="storyUrl"]');
      var $insertButton = _container.find('.btn-apply');
      var storyDomain = null;
      var storyUid = null;
      var renderedStoryDomain = $storyWidgetPreviewContainer.attr('data-rendered-story-domain');
      var renderedStoryUid = $storyWidgetPreviewContainer.attr('data-rendered-story-uid');
      var componentData;

      if (componentProperties !== null &&
        _.has(componentProperties, 'domain') &&
        _.has(componentProperties, 'storyUid')) {

        storyDomain = componentProperties.domain;
        storyUid = componentProperties.storyUid;
      }

      if (storyDomain !== null && storyUid !== null) {

        if (
          storyDomain !== renderedStoryDomain ||
          storyUid !== renderedStoryUid
        ) {

          componentData = {
            type: 'story.widget',
            value: {
              domain: storyDomain,
              storyUid: storyUid
            }
          }

          $storyWidgetPreviewContainer.
            trigger('destroy').
            empty().
            append($('<div>').componentStoryWidget(componentData)).
            attr('data-rendered-story-domain', storyDomain).
            attr('data-rendered-story-uid', storyUid);

          // If we have already configured a story but there is not currently-
          // selected url, it is probably because we're editing an existing
          // component. In order to make the UI consistent with this state,
          // we can synthesize a valid URL for the component and set the value
          // of the text input control to reflect that.
          if (_.isEmpty($inputControl.val().replace(/\s/g, ''))) {
            $inputControl.val(
              'https://{0}/stories/s/{1}'.format(storyDomain, storyUid)
            );
          }

          $previewContainer.removeClass('invalid');

          $insertButton.prop('disabled', false);
        }

      } else {

        $storyWidgetPreviewContainer.
          trigger('destroy').
          empty().
          attr('data-rendered-story-domain', null).
          attr('data-rendered-story-uid', null);

        // Only show the 'invalid url' icon if the user has entered text.
        if (_.isEmpty($inputControl.val().replace(/\s/g, ''))) {
          $previewContainer.removeClass('invalid');
        } else {
          $previewContainer.addClass('invalid');
        }

        $insertButton.prop('disabled', true);
      }
    }

    function _renderChooseYoutubeTemplate() {

      var inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
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

      var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn btn-primary btn-apply'
        }
      ).text(_insertButtonText());

      var content = $('<div>', { 'class': 'asset-selector-input-group' }).append([
        inputLabel,
        inputControl,
        previewContainer
      ]);

      var buttonGroup = $(
        '<div>',
        {
          'class': 'modal-button-group r-to-l'
        }).append([ backButton, insertButton ]);

      return [ content, buttonGroup ];
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
      var iframeElement = _container.find('.asset-selector-preview-iframe');
      var iframeSrc = iframeElement.attr('src');
      var inputControl = _container.find('[data-asset-selector-validate-field="youtubeId"]');
      var iframeContainer;
      var insertButton = _container.find('.btn-apply');

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

        iframeContainer = _container.find('.asset-selector-preview-container');

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
     *     url: '<html fragment url>',
     *     documentId: documentId,
     *     layout: {
     *       height: 300
     *     }
     *   }
     * }
     */
    function _renderPreviewEmbedCodeData(componentProperties) {

      var htmlFragmentUrl = null;
      var documentId = null;
      var percentLoaded = null;
      var errorStep = null;
      var messageTranslationKey;
      var iframeContainer = _container.find('.asset-selector-preview-container');
      var iframeElement = _container.find('.asset-selector-preview-iframe');
      var invalidMessageContainer = _container.find('.asset-selector-invalid-message');
      var invalidMessageElement = _container.find('.asset-selector-invalid-description');
      var iframeSrc = iframeElement.attr('src');
      var loadingButton = _container.find('.btn-busy');
      var insertButton = _container.find('.btn-apply');
      var insecureHtmlWarning = _container.find('.asset-selector-insecure-html-warning');
      var textareaElement = _container.find('.asset-selector-text-input');

      function textareaIsUnedited() {
        return textareaElement.val() === '';
      }

      if (_.has(componentProperties, 'url')) {
        htmlFragmentUrl = componentProperties.url;
      }

      if (_.has(componentProperties, 'percentLoaded')) {
        percentLoaded = componentProperties.percentLoaded;
      }

      if (_.has(componentProperties, 'step')) {
        errorStep = componentProperties.step;
      }

      if (_.has(componentProperties, 'documentId')) {
        documentId = componentProperties.documentId;
      }

      insecureHtmlWarning.toggle(_warnAboutInsecureHTML);

      if (!_.isNull(htmlFragmentUrl)) {

        if (iframeSrc !== htmlFragmentUrl) {
          iframeElement.attr('src', htmlFragmentUrl);
          iframeElement.attr('data-document-id', documentId);

          // On first load, prepopulate the textarea with whatever
          // HTML previously entered.
          if (textareaIsUnedited()) {
            $.get(htmlFragmentUrl).then(function(htmlFragment) {
              // DO NOT PUT THIS DIRECTLY INTO THE DOM!
              // htmlFragment is _arbitrary_ html - we display it
              // only in other-domain iframes for security.
              // Here, we're only putting the content into a textarea.
              if (textareaIsUnedited()) {
                textareaElement.val(htmlFragment);
              }
            });
          }
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
      var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

      var datasetChooserIframe = $(
        '<iframe>',
        {
          'class': 'asset-selector-dataset-chooser-iframe asset-selector-full-width-iframe',
          'src': _datasetChooserUrl()
        }
      );

      var loadingButton = $('<button>', {
        'class': 'btn btn-transparent btn-busy visualization-busy',
        'disabled': true
      }).append($('<span>'));

      var buttonGroup = $('<div>', {
        'class': 'modal-button-group r-to-l'
      }).append([ backButton ]);

      datasetChooserIframe[0].onDatasetSelected = function(datasetObj) {
        $(this).trigger('datasetSelected', datasetObj);
      };

      datasetChooserIframe.one('load', function() {
        loadingButton.addClass('hidden');
      });

      return [ loadingButton, datasetChooserIframe, buttonGroup ];
    }

    function _renderChooseTableOrChartTemplate() {
      var $backButton = _renderModalBackButton(WIZARD_STEP.SELECT_DATASET_FOR_VISUALIZATION);

      var $chartButton = $('<button>', { 'class': 'default-focus btn-visualize-chart' }).
        append($('<span>', { 'class': 'icon-chart' })).
        append($('<div>').text(I18n.t('editor.asset_selector.visualization.choose_chart')));

      var $tableButton = $('<button>', { 'class': 'btn-visualize-table' }).
        append($('<span>', { 'class': 'icon-table' })).
        append($('<div>').text(I18n.t('editor.asset_selector.visualization.choose_table')));

      var $visualizationChoiceGroup = $('<div>', {
        'class': 'visualization-choice'
      }).append([ $chartButton, $tableButton ]);

      var $buttonGroup = $('<div>', {
        'class': 'modal-button-group r-to-l'
      }).append([ $backButton ]);

      $chartButton.on('click', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP
        });
      });

      $tableButton.on('click', function() {
        storyteller.dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_VISUALIZE_AS_TABLE
        });
        // TODO this should likely be handled automatically as part of ASSET_SELECTOR_VISUALIZE_AS_TABLE.
        // See TODO in _saveAndClose().
        _saveAndClose();
      });

      return [ $visualizationChoiceGroup, $buttonGroup ];
    }

    function _renderConfigureVisualizationTemplate() {
      var configureVisualizationIframe = $(
        '<iframe>',
        {
          'class': 'asset-selector-configure-visualization-iframe asset-selector-full-width-iframe',
          'src': ''
        }
      );

      var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_TABLE_OR_CHART);

      // TODO: Map insert button to APPLY instead of CLOSE, and share insert button
      // into shared function
      var insertButton = $(
        '<button>',
        {
          'class': 'btn-primary btn-apply',
          'disabled': 'disabled'
        }
      ).text(_insertButtonText());

      var loadingButton = $('<button>', {
        'class': 'btn-transparent btn-busy visualization-busy',
        'disabled': true
      }).append($('<span>'));

      var buttonGroup = $('<div>', {
        'class': 'modal-button-group r-to-l'
      }).append([ backButton, insertButton ]);

      configureVisualizationIframe[0].onVisualizationSelected = function(datasetObj, format, originalUid) {
        // This function is called by the visualization chooser when:
        //   - The user makes or clears a selection (argument is either null or a visualization).
        //   - The page finishes loading (argument is null).
        // In either case, we should consider the iframe loaded.
        // originalUid may be null (say if the user created the visualization inline).
        configureVisualizationIframe.
          trigger('visualizationSelected', {
            data: datasetObj,

            // format can either be 'classic' or 'vif'.
            format: format,
            originalUid: originalUid
          });
      };

      return [ loadingButton, configureVisualizationIframe, buttonGroup ];
    }

    function _renderConfigureVisualizationData(componentType, componentProperties) {
      var insertButton = _container.find('.btn-apply');

      if (componentProperties.dataset) {
        var iframeElement = _container.find('.asset-selector-configure-visualization-iframe');
        _updateVisualizationChooserUrl(iframeElement, componentProperties);
      }

      insertButton.prop('disabled', !componentType);
    }

    /**
     * Small helper functions
     */

    function _datasetChooserUrl() {
      return encodeURI(
        '{0}/browse/select_dataset?suppressed_facets[]=type&limitTo=datasets'.
          format(window.location.origin)
      );
    }

    function _updateVisualizationChooserUrl(iframeElement, componentProperties) {
      var currentIframeSrc = iframeElement.attr('src');
      var currentIframeDatasetUidParam =
        (currentIframeSrc.match(/datasetId=\w\w\w\w-\w\w\w\w/) || [])[0];

      // Update src if the dataset uid search param is different
      // (we don't care about defaultColumn or defaultRelatedVisualizationUid changing -
      // these shouldn't cause iframe reloads).
      if (
        (currentIframeDatasetUidParam || '').indexOf(componentProperties.dataset.datasetUid) === -1) {
        var newIframeSrc = _visualizationChooserUrl(componentProperties);
        iframeElement.
          attr('src', newIframeSrc).
          one('load', function() {
            $('#asset-selector-container .btn-transparent.btn-busy').addClass('hidden');
          });
      }
    }

    function _visualizationChooserUrl(componentProperties) {
      var defaultColumn = _.get(componentProperties, 'vif.columnName', null);
      var defaultVifType = _.get(componentProperties, 'vif.type', null);
      var defaultRelatedVisualizationUid = _.get(componentProperties, 'originalUid', null);

      return encodeURI(
        '{0}/component/visualization/add?datasetId={1}&defaultColumn={2}&defaultVifType={3}&defaultRelatedVisualizationUid={4}'.
          format(
            window.location.origin,
            componentProperties.dataset.datasetUid,
            defaultColumn,
            defaultVifType,
            defaultRelatedVisualizationUid
          )
      );
    }

    function _renderChooseEmbedCodeTemplate() {
      var loadingButton = $('<button>', {
        'class': 'btn-transparent btn-busy hidden',
        disabled: true
      }).append($('<span>'));

      var inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
        text(I18n.t('editor.asset_selector.embed_code.input_label'));

      var inputControl = $(
        '<textarea>',
        {
          'class': 'asset-selector-text-input',
          'data-asset-selector-field': 'embedHtml',
          'type': 'text'
        }
      );

      var previewLabel = $('<h3>', { 'class': 'modal-input-label input-label' }).
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

      var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

      var insertButton = $(
        '<button>',
        {
          'class': 'btn-primary btn-apply'
        }
      ).text(_insertButtonText());

      var content = $('<div>', { 'class': 'asset-selector-input-group' }).append([
        inputLabel,
        inputControl,
        previewLabel,
        previewContainer
      ]);

      var buttonGroup = $(
        '<div>',
        {
          'class': 'modal-button-group r-to-l'
        }).append([ backButton, insertButton ]);

      return [ content, buttonGroup ];
    }

    function _renderModalBackButton(fromStep) {
      return $(
        '<button>',
        {
          'class': 'btn-default btn-inverse back-btn',
          'data-resume-from-step': fromStep
        }
      ).text(
        I18n.t('editor.asset_selector.back_button_text')
      );
    }

    function _showSelectorWith(modalOptions) {
      _container.modal(modalOptions).trigger('modal-open');
      _container.find('.default-focus').focus();
    }

    function _hideSelector() {
      _container.modal({
        content: null // We never re-show the modal with old content, so save
                      // a bit of resources by removing the content.
      }).trigger('modal-close');
    }
  }

  function _insertButtonText() {
    var isEditingExisting = storyteller.assetSelectorStore.isEditingExisting();

    return I18n.t(
      isEditingExisting ?
        'editor.asset_selector.update_button_text' :
        'editor.asset_selector.insert_button_text'
    );
  }

  root.socrata.storyteller.AssetSelectorRenderer = AssetSelectorRenderer;
})(window);
