import $ from 'jQuery';
import _ from 'lodash';

import '../components/Modal';
import I18n from '../I18n';
import Actions from '../Actions';
import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher } from '../Dispatcher';
import { WIZARD_STEP, assetSelectorStore } from '../stores/AssetSelectorStore';
import FileUploader from '../FileUploader';
import { flyoutRenderer } from '../FlyoutRenderer';

export default function AssetSelectorRenderer(options) {

  var _container = options.assetSelectorContainerElement || null;
  var _lastRenderedStep = null;
  var _warnAboutInsecureHTML = false;

  StorytellerUtils.assertInstanceOf(_container, $);

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

    assetSelectorStore.addChangeListener(function() {
      _renderSelector();
    });
  }

  function _attachEvents() {

    _container.on('modal-dismissed', function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_CLOSE
      });
    });

    _container.on(
      'change',
      '[data-asset-selector-validate-field="imageUpload"]',
      function(event) {
        if (event.target.files && event.target.files.length > 0) {
          _cancelFileUpload();
          storyteller.fileUploader = new FileUploader();
          storyteller.fileUploader.upload(event.target.files[0], {
            progressAction: Actions.FILE_UPLOAD_PROGRESS,
            errorAction: Actions.FILE_UPLOAD_ERROR,
            doneAction: Actions.FILE_UPLOAD_DONE
          });
        }
      }
    );

    _container.on(
      'input',
      '.asset-selector-alt-text-input',
      function(event) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE,
          altAttribute: $(event.target).val()
        });
      }
    );

    _container.on(
      'mouseenter',
      '.asset-selector-image-alt-hint',
      function() {
        flyoutRenderer.render({
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
        flyoutRenderer.clear();
      }
    );

    _container.on(
      'mouseenter',
      '.asset-selector-goal-url-hint',
      function() {
        flyoutRenderer.render({
          element: this,
          content: '<span class="tooltip-text">' +
            I18n.t('editor.asset_selector.goal_tile.url_tooltip') +
            '</span>',
          rightSideHint: false,
          belowTarget: false
        });
      }
    );

    _container.on(
      'mouseout',
      '.asset-selector-goal-url-hint',
      function() {
        flyoutRenderer.clear();
      }
    );

    _container.on(
      'input',
      '[data-asset-selector-validate-field="storyUrl"]',
      function(event) {

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_STORY_URL,
          url: $(event.target).val()
        });
      }
    );

    _container.on(
      'input',
      '[data-asset-selector-validate-field="goalUrl"]',
      function(event) {

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_GOAL_URL,
          url: $(event.target).val()
        });
      }
    );

    _container.on(
      'input',
      '[data-asset-selector-validate-field="youtubeId"]',
      function(event) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL,
          url: $(event.target).val()
        });
      }
    );

    _container.on(
      'viewSelected',
      function(event, datasetObj) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
          domain: datasetObj.domainCName || window.location.hostname,
          datasetUid: datasetObj.id,
          isNewBackend: datasetObj.newBackend
        });
      }
    );

    _container.on(
      'mapOrChartSelected',
      function(event, mapOrChartObj) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART,
          domain: mapOrChartObj.domainCName || window.location.hostname,
          mapOrChartUid: mapOrChartObj.id
        });
      }
    );

    _container.on(
      'visualizationSelected',
      function(event, selectedVisualization) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: selectedVisualization
        });
      }
    );

    var debounceForOneSecondThenUploadHtmlFragment = _.debounce(function(event) {
      _cancelFileUpload();
      storyteller.fileUploader = new FileUploader();

      var htmlFragment = $(event.target).val();
      _warnAboutInsecureHTML = /src=("|')http:\/\//.test(htmlFragment);
      if (htmlFragment.length === 0) {
        return;
      }

      var simulatedFileForUpload = {
        name: 'embedded_fragment.html',
        size: htmlFragment.length,
        type: 'text/html',
        body: htmlFragment
      };

      storyteller.fileUploader.upload(simulatedFileForUpload, {
        progressAction: Actions.EMBED_CODE_UPLOAD_PROGRESS,
        errorAction: Actions.EMBED_CODE_UPLOAD_ERROR,
        doneAction: Actions.EMBED_CODE_UPLOAD_DONE
      });

    }, Constants.EMBED_CODE_DEBOUNCE_DELAY);

    _container.on(
      'input',
      '[data-asset-selector-field="embedHtml"]',
      debounceForOneSecondThenUploadHtmlFragment
    );

    _container.on('click', '[data-provider]', function() {
      var provider = this.getAttribute('data-provider');
      StorytellerUtils.assert(provider, 'provider must be defined');

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: assetSelectorStore.getBlockId(),
        componentIndex: assetSelectorStore.getComponentIndex(),
        provider: provider
      });
    });

    _container.on('click', '[data-visualization-option]', function() {
      var visualizationOption = this.getAttribute('data-visualization-option');

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN,
        visualizationOption: visualizationOption
      });
    });

    _container.on('click', '[data-resume-from-step]', function() {
      var step = this.getAttribute('data-resume-from-step');
      StorytellerUtils.assert(step, 'step must be provided');

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
        step: step
      });
    });

    _container.on('click', '.btn-apply', function() {
      _saveAndClose();
    });

    _container.on('click', '.btn-close', function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_CLOSE
      });
    });
  }

  function _saveAndClose() {
    // TODO this sequence of steps should likely be its own single action,
    // which both AssetSelectorStore and StoryStore handle.
    dispatcher.dispatch({
      action: Actions.BLOCK_UPDATE_COMPONENT,
      blockId: assetSelectorStore.getBlockId(),
      componentIndex: assetSelectorStore.getComponentIndex(),
      type: assetSelectorStore.getComponentType(),
      value: assetSelectorStore.getComponentValue()
    });

    dispatcher.dispatch({
      action: Actions.ASSET_SELECTOR_CLOSE
    });
  }

  function _cancelFileUpload() {
    if (storyteller.fileUploader) {
      storyteller.fileUploader.cancel();
    }
  }

  function _renderSelector() {
    var step = assetSelectorStore.getStep();
    var componentType = assetSelectorStore.getComponentType();
    var componentValue = assetSelectorStore.getComponentValue();
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
          selectorTitle = I18n.t('editor.asset_selector.story_tile.heading');
          selectorContent = _renderChooseStoryTemplate(componentValue);
          break;

        case WIZARD_STEP.ENTER_GOAL_URL:
          selectorTitle = I18n.t('editor.asset_selector.goal_tile.heading');
          selectorContent = _renderChooseGoalTemplate(componentValue);
          break;

        case WIZARD_STEP.ENTER_YOUTUBE_URL:
          selectorTitle = I18n.t('editor.asset_selector.youtube.heading');
          selectorContent = _renderChooseYoutubeTemplate(componentValue);
          break;

        case WIZARD_STEP.SELECT_VISUALIZATION_OPTION:
          selectorTitle = I18n.t('editor.asset_selector.visualization.choose_visualization_option_heading');
          selectorContent = _renderChooseVisualizationOptions();
          break;

        case WIZARD_STEP.SELECT_DATASET_FOR_VISUALIZATION:
          selectorTitle = I18n.t('editor.asset_selector.visualization.choose_dataset_heading');
          selectorContent = _renderChooseDatasetTemplate();
          selectorWideDisplay = true;
          break;

        case WIZARD_STEP.SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG:
          selectorTitle = I18n.t('editor.asset_selector.visualization.choose_map_or_chart_heading');
          selectorContent = _renderChooseMapOrChartTemplate();
          selectorWideDisplay = true;
          break;

        case WIZARD_STEP.SELECT_TABLE_FROM_CATALOG:
          selectorTitle = I18n.t('editor.asset_selector.visualization.choose_insert_table_heading');
          selectorContent = _renderChooseTableTemplate();
          selectorWideDisplay = true;
          break;

        case WIZARD_STEP.CONFIGURE_VISUALIZATION:
          selectorTitle = I18n.t('editor.asset_selector.visualization.configure_vizualization_heading');
          selectorContent = _renderConfigureVisualizationTemplate();
          selectorWideDisplay = true;
          break;

        case WIZARD_STEP.TABLE_PREVIEW:
          selectorTitle = I18n.t('editor.asset_selector.visualization.preview_table_heading');
          selectorContent = _renderTablePreviewTemplate();
          selectorWideDisplay = true;
          break;

        case WIZARD_STEP.CONFIGURE_MAP_OR_CHART:
          selectorTitle = I18n.t('editor.asset_selector.visualization.configure_map_or_chart_heading');
          selectorContent = _renderConfigureMapOrChartTemplate();
          selectorWideDisplay = true;
          break;

        case WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD:
          selectorTitle = I18n.t('editor.asset_selector.image_upload.name');
          selectorContent = _renderChooseImageTemplate();
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

      case WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD:
        _renderChooseImageGalleryPreview();
        break;

      case WIZARD_STEP.ENTER_STORY_URL:
        _renderChooseStoryData(componentValue);
        break;

      case WIZARD_STEP.ENTER_GOAL_URL:
        _renderChooseGoalData(componentValue);
        break;

      case WIZARD_STEP.ENTER_YOUTUBE_URL:
        _renderChooseYoutubeData(componentValue);
        break;

      case WIZARD_STEP.CONFIGURE_VISUALIZATION:
        _renderConfigureVisualizationData(componentType, componentValue);
        break;

      case WIZARD_STEP.TABLE_PREVIEW:
        _renderTablePreviewData(componentType, componentValue);
        break;

      case WIZARD_STEP.CONFIGURE_MAP_OR_CHART:
        _renderConfigureMapOrChartData(componentType, componentValue);
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

    var storyTileHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.story_tile.name'));
    var storyTileDescription = $('<p>').
      text(I18n.t('editor.asset_selector.story_tile.description'));

    var goalTileHeader;
    var goalTileDescription;
    var $goalTileProvider;

    if (Environment.ENABLE_GOAL_TILES) {

      goalTileHeader = $('<h3>').
        text(I18n.t('editor.asset_selector.goal_tile.name'));
      goalTileDescription = $('<p>').
        text(I18n.t('editor.asset_selector.goal_tile.description'));
      $goalTileProvider = $('<li>', {
        'data-provider': 'GOAL_TILE'
      }).append(goalTileHeader, goalTileDescription);
    }

    var embedCodeHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.embed_code.name'));
    var embedCodeDescription = $('<p>').
      text(I18n.t('editor.asset_selector.embed_code.description'));

    var providers = $('<ul>', {'class': 'asset-selector-button-list'}).append([
      $('<li>', {
        'data-provider': 'SOCRATA_VISUALIZATION'
      }).append(visualizationHeader, visualizationDescription),
      $('<li>', {
        'data-provider': 'STORY_TILE'
      }).append(storyTileHeader, storyTileDescription),
      // TODO: Bring the feature-flag-enabled code path back here to conform
      // with local style once feature flag is removed.
      $goalTileProvider,
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

  function _renderChooseVisualizationOptions() {
    var insertVisualizationHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.visualization.choose_insert_visualziation_heading'));
    var insertVisualizationDescription = $('<p>').
      text(I18n.t('editor.asset_selector.visualization.choose_insert_visualization_description'));

    var insertTableHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.visualization.choose_insert_table_heading'));
    var insertTableDescription = $('<p>').
      text(I18n.t('editor.asset_selector.visualization.choose_insert_table_description'));

    var createVisualizationHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.visualization.choose_create_visualization_heading'));
    var createVisualizationDescription = $('<p>').
      text(I18n.t('editor.asset_selector.visualization.choose_create_visualization_description'));

    var visualizationOptions =
      $(
        '<ul>',
        {'class': 'asset-selector-button-list visualization-options'}
      ).
        append([
          $(
            '<li>',
            {'data-visualization-option': 'INSERT_VISUALIZATION'}
          ).
            append(insertVisualizationHeader, insertVisualizationDescription),
          $(
            '<li>',
            {'data-visualization-option': 'INSERT_TABLE'}
          ).
            append(insertTableHeader, insertTableDescription),
          $(
            '<li>',
            {'data-visualization-option': 'CREATE_VISUALIZATION'}
          ).append(createVisualizationHeader, createVisualizationDescription)
        ]);

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    var buttonGroup = $(
      '<div>',
      { 'class': 'modal-button-group r-to-l' }
    ).append([
      backButton
    ]);

    return [ visualizationOptions, buttonGroup ];
  }

  function _renderChooseImageTemplate() {
    var tabs = $('<ul>', {
      class: 'image-tabs tabs'
    });

    var tabUpload = $('<li>', {
      class: 'tab active'
    }).append(
      $('<a>', {href: '#page-upload'}).text(I18n.t('editor.asset_selector.image_upload.tab_upload'))
    );

    var tabGetty = $('<li>', {
      class: 'tab'
    }).append(
      $('<a>', {href: '#page-getty'}).text(I18n.t('editor.asset_selector.image_upload.tab_getty'))
    );

    tabs.append(tabUpload, tabGetty);

    tabs.find('a').click(function(event) {
      event.preventDefault();

      var href = $(event.target).closest('[href]');
      var id = href.attr('href');

      $('.image-tabs .tab').removeClass('active');
      $('.image-pages .page').removeClass('active');

      $(id).addClass('active');
      href.parent().addClass('active');
    });

    var pages = $('<div>', {
      class: 'image-pages pages'
    });

    var pageUpload = $('<div>', {
      id: 'page-upload',
      class: 'page active',
      'data-tab-default': true
    }).append(_renderChooseImageUploadTemplate());

    var pageGetty = $('<div>', {
      id: 'page-getty',
      class: 'page'
    }).append(_renderChooseImageGalleryTemplate());

    pages.append(pageUpload, pageGetty);

    return [tabs, pages];
  }

  function _renderChooseImageGalleryTemplate() {
    var search = $('<div>', {
      class: 'images-search'
    });

    var searchField = $('<input>', {
      class: 'asset-selector-text-input',
      placeholder: I18n.t('editor.asset_selector.image_upload.search'),
      type: 'text'
    });

    var searchLoadingSpinner = $('<button>', {
      class: 'btn btn-busy btn-transparent images-search-loading-spinner'
    }).append($('<span>')).hide();

    var searchError = $('<div>', {
      class: 'alert warning-bar hidden images-error'
    }).append(
      $('<p>').append($('<span>', {class: 'icon-warning'})),
      $('<p>').text(I18n.t('editor.asset_selector.image_upload.errors.image_search'))
    );

    search.append(searchField, searchLoadingSpinner);

    var galleryResults = $('<div>', {
      class: 'gallery-results'
    });

    var showMoreButton = $('<button>', {
      class: 'btn btn-default gallery-show-more'
    }).append(
      $('<span>').text(I18n.t('editor.asset_selector.image_upload.show_more'))
    );

    var thatsEverything = $('<button>', {
      class: 'btn btn-default gallery-thats-everything',
      style: 'display: none;',
      disabled: true
    }).text(I18n.t('editor.asset_selector.image_upload.thats_it'));

    galleryResults.append(
      $('<div>', {class: 'gallery-column hidden'}),
      $('<div>', {class: 'gallery-column hidden'}),
      $('<div>', {class: 'gallery-column hidden'}),
      showMoreButton,
      thatsEverything
    );

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);
    var selectButton = $(
      '<button>',
      {
        'class': 'btn btn-primary btn-apply',
        'disabled': 'disabled'
      }
    ).text(I18n.t('editor.asset_selector.select_button_text'));

    var navGroup = $(
      '<div>',
      { 'class': 'modal-button-group r-to-l' }
    ).append([
      backButton,
      selectButton
    ]);

    selectButton.click(function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
        step: WIZARD_STEP.IMAGE_PREVIEW
      });
    });

    searchField.keyup(function(event) {
      if (event.keyCode === 13) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_IMAGE_SEARCH,
          phrase: searchField.val()
        });
      }
    });

    showMoreButton.click(function() {
      showMoreButton.
        addClass('btn-busy').
        prop('disabled', true);
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_SEARCH_NEXT_PAGE
      });
    });

    return [search, searchError, galleryResults, navGroup];
  }

  function _renderChooseImageGalleryPreview() {
    var results = assetSelectorStore.getImageSearchResults();
    var hasImages = assetSelectorStore.hasImageSearchResults();
    var hasError = assetSelectorStore.hasImageSearchError();
    var isSearching = assetSelectorStore.isImageSearching();

    if (hasImages) {
      var promises = [];
      var chunked = _.chunk(results, 3);

      chunked.forEach(function(images) {
        images.forEach(function(image, index) {
          var uri = _.find(image.display_sizes, {name: 'thumb'}).uri;
          var id = image.id;

          var promise = new Promise(function(resolve, reject) {
            var imageElement = new Image();

            imageElement.src = uri;
            imageElement.onerror = reject;
            imageElement.onload = function() {
              $('.gallery-column:nth-child(' + (index + 1) + ')').append(
                $('<div>', {class: 'gallery-result'}).append(
                  imageElement,
                  $('<div>', {class: 'gallery-result-cover'}),
                  $('<span>', {class: 'icon-checkmark3'})
                )
              );

              resolve();
            };
            imageElement.onclick = function(event) {
              var $image = $(event.currentTarget).closest('[src]');
              var $result = $(event.currentTarget).closest('.gallery-result');

              if ($result.hasClass('active')) {
                $result.removeClass('active');
                $('.btn-apply').prop('disabled', true);
              } else {
                $('.gallery-result').removeClass('active');
                $result.addClass('active');
                $('.btn-apply').prop('disabled', false);

                dispatcher.dispatch({
                  action: Actions.ASSET_SELECTOR_IMAGE_SELECTED,
                  id: id
                });
              }
            };
          });

          promises.push(promise);
        });
      });

      Promise.all(promises).then(function() {
        var hasMoreImages = assetSelectorStore.canPageImageSearchNext();
        var outOfImages = !hasMoreImages;

        $('.images-error').addClass('hidden');
        $('.images-search-loading-spinner').hide();

        $('.gallery-thats-everything').toggle(outOfImages);
        $('.gallery-show-more').
          removeClass('btn-busy').
          prop('disabled', outOfImages).
          toggle(hasMoreImages);

        $('.gallery-column').removeClass('hidden');
      }).catch(function() {
        $('.images-search-loading-spinner').hide();
        $('.images-error').removeClass('hidden');
      });
    } else if (hasError) {
      $('.images-error').removeClass('hidden');
      $('.images-search-loading-spinner').hide();
    } else if (isSearching) {
      $('.images-search-loading-spinner').show();
      $('.gallery-column').empty();
      $('.gallery-show-more').hide();
      $('.gallery-thats-everything').hide();
    } else {
      $('.images-search-loading-spinner').hide();
      assetSelectorStore.hasImageSearchPhrase() && $('.images-error').removeClass('hidden');
      $('.gallery-column').empty();
      $('.gallery-show-more').hide();
      $('.gallery-thats-everything').hide();
    }
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

    var backButton;
    var componentType = assetSelectorStore.getComponentType();

    if (componentType === 'image') {
      // Paradoxically, we allow image components to be changed into other asset types.
      backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);
    } else {
      // Not so for other image-using components - they're locked to what they are (hero, author).
      backButton = $('<button>', {class: 'btn-default', 'data-action': Actions.ASSET_SELECTOR_CLOSE});
      backButton.text(I18n.t('editor.modal.buttons.cancel'));
    }

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
      _renderModalInsertButton({ disabled: true })
    ]);

    // Indirection for styling's sake.
    // The <button> clicks triggers an <input type=file> click.
    inputButton.click(function(event) {
      event.preventDefault();
      inputControl.click();
    });

    backButton.one('click', function() {
      if (backButton.attr('data-action')) {
        dispatcher.dispatch({
          action: backButton.attr('data-action')
        });
      }
    });

    return [ content, buttonGroup ];
  }

  function _renderFileUploadProgressTemplate() {
    var componentType = assetSelectorStore.getComponentType();
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
        'data-provider': componentType.toUpperCase()
      }
    ).text(I18n.t('editor.asset_selector.cancel_button_text'));

    var tryAgainButton = $(
      '<button>',
      {
        'class': 'hidden btn-default btn-inverse asset-selector-try-again',
        'data-provider': componentType.toUpperCase()
      }
    ).text(I18n.t('editor.asset_selector.try_again_button_text'));

    progress.append([
      uploadProgressMessage,
      progressSpinner,
      uploadCancelButton,
      tryAgainButton
    ]);

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD);

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
      _renderModalInsertButton({ disabled: true })
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
        messageTranslationKey = StorytellerUtils.format('editor.asset_selector.image_upload.errors.{0}', errorStep);
      } else {
        messageTranslationKey = 'editor.asset_selector.image_upload.errors.exception';
      }

      progressMessage.html(I18n.t(messageTranslationKey));
    }
  }

  function _renderImagePreviewTemplate() {
    var previewImageLabel = $(
      '<h2>',
      { 'class': 'asset-selector-preview-label' }
    ).text(I18n.t('editor.asset_selector.image_preview.preview_label'));

    var previewImage = $(
      '<img>',
      { 'class': 'asset-selector-preview-image' }
    );

    var previewContainer = $(
      '<div>',
      { 'class': 'asset-selector-preview-container' }
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

    inputField.on('keyup', function(event) {
      if (event.keyCode === 13) {
        $('.modal-dialog .btn-apply').click();
      }
    });

    var descriptionContainer = $(
      '<div>',
      { 'class': 'asset-selector-image-description-container' }
    ).append([
      inputField,
      inputLabel
    ]);

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD);

    var buttonGroup = $(
      '<div>',
      { 'class': 'modal-button-group r-to-l' }
    ).append([
      backButton,
      _renderModalInsertButton()
    ]);

    var isImage = assetSelectorStore.getComponentType() === 'image';
    var content = $(
      '<div>',
      { 'class': 'asset-selector-input-group' }
    ).append([
      previewImageLabel,
      previewContainer,
      isImage ? descriptionLabel : null,
      isImage ? descriptionContainer : null
    ]);

    return [ content, buttonGroup ];
  }

  // Some components types have the image properties under an `image` field,
  // whereas the image component itself has the image properties at the root.
  function _extractImageUrl(componentProperties) {
    return _.get(
      componentProperties,
      'url',
      _.get(componentProperties, 'image.url', null) // Try again, this time under image.url. Overall default is null.
    );
  }

  function _extractImageAlt(componentProperties) {
    return _.get(
      componentProperties,
      'alt',
      _.get(componentProperties, 'image.alt', null) // Try again, this time under image.alt. Overall default is null.
    );
  }

  function _renderImagePreviewData(componentProperties) {
    var imageUrl = _extractImageUrl(componentProperties);
    var altAttribute = _extractImageAlt(componentProperties);
    var imageContainer = _container.find('.asset-selector-preview-container');
    var imageElement = imageContainer.find('.asset-selector-preview-image');
    var imageSrc = imageElement.attr('src');
    var altInputField = _container.find('.asset-selector-alt-text-input');
    var insertButton = _container.find('.btn-apply');

    altInputField.attr('value', _.isEmpty(altAttribute) ? null : altAttribute);

    if (!_.isNull(imageUrl)) {
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
      text(I18n.t('editor.asset_selector.story_tile.input_label'));

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
        I18n.t('editor.asset_selector.story_tile.invalid_message_title_1'),
        '<br />',
        I18n.t('editor.asset_selector.story_tile.invalid_message_title_2')
      ].join('')
    );

    var previewInvalidMessageDescription = $(
      '<div>',
      { 'class': 'asset-selector-invalid-description' }
    ).text(
      I18n.t('editor.asset_selector.story_tile.invalid_message_description')
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

    var previewTileContainer = $(
      '<div>',
      {
        'class': 'asset-selector-story-tile-embed-component'
      }
    );

    var previewContainer = $(
      '<div>',
      {
        'class': 'asset-selector-story-tile-preview-container'
      }
    ).append([
      previewInvalidMessage,
      previewTileContainer
    ]);

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    var content = $('<div>', { 'class': 'asset-selector-input-group' }).append([
      inputLabel,
      inputControl,
      previewContainer
    ]);

    var buttonGroup = $(
      '<div>',
      {
        'class': 'modal-button-group r-to-l'
      }).append([ backButton, _renderModalInsertButton() ]);

    return [ content, buttonGroup ];
  }

  function _renderChooseStoryData(componentProperties) {
    var $previewContainer = _container.find('.asset-selector-story-tile-preview-container');
    var $storyTilePreviewContainer = _container.find('.asset-selector-story-tile-embed-component');
    var $inputControl = _container.find('[data-asset-selector-validate-field="storyUrl"]');
    var $insertButton = _container.find('.btn-apply');
    var storyDomain = null;
    var storyUid = null;
    var renderedStoryDomain = $storyTilePreviewContainer.attr('data-rendered-story-domain');
    var renderedStoryUid = $storyTilePreviewContainer.attr('data-rendered-story-uid');
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
          type: 'story.tile',
          value: {
            domain: storyDomain,
            storyUid: storyUid
          }
        };

        $storyTilePreviewContainer.
          trigger('destroy').
          empty().
          append($('<div>').componentStoryTile(componentData)).
          attr('data-rendered-story-domain', storyDomain).
          attr('data-rendered-story-uid', storyUid);

        // If we have already configured a story but there is not currently-
        // selected url, it is probably because we're editing an existing
        // component. In order to make the UI consistent with this state,
        // we can synthesize a valid URL for the component and set the value
        // of the text input control to reflect that.
        if (_.isEmpty($inputControl.val().replace(/\s/g, ''))) {
          $inputControl.val(
            StorytellerUtils.format(
              'https://{0}/stories/s/{1}',
              storyDomain,
              storyUid
            )
          );
        }

        $previewContainer.removeClass('invalid');

        $insertButton.prop('disabled', false);
      }

    } else {

      $storyTilePreviewContainer.
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

  function _renderChooseGoalTemplate() {
    var inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
      append([
        $('<span>').text(I18n.t('editor.asset_selector.goal_tile.input_label')),
        $('<span>', {'class': 'icon-question-inverse asset-selector-goal-url-hint'})
      ]);

    var inputControl = $(
      '<input>',
      {
        'class': 'asset-selector-text-input',
        'data-asset-selector-validate-field': 'goalUrl',
        'placeholder': 'https://www.example.com/stat/goals/abcd-1234/abcd-1234/abcd-1234',
        'type': 'text'
      }
    );

    var previewInvalidMessageTitle = $(
      '<div>',
      { 'class': 'asset-selector-invalid-title' }
    ).html(
      [
        I18n.t('editor.asset_selector.goal_tile.invalid_message_title_1'),
        '<br />',
        I18n.t('editor.asset_selector.goal_tile.invalid_message_title_2')
      ].join('')
    );

    var previewInvalidMessageDescription = $(
      '<div>',
      { 'class': 'asset-selector-invalid-description' }
    ).text(
      I18n.t('editor.asset_selector.goal_tile.invalid_message_description')
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

    var previewTileContainer = $(
      '<div>',
      {
        'class': 'asset-selector-goal-tile-embed-component'
      }
    );

    var previewContainer = $(
      '<div>',
      {
        'class': 'asset-selector-goal-tile-preview-container'
      }
    ).append([
      previewInvalidMessage,
      previewTileContainer
    ]);

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    var content = $('<div>', { 'class': 'asset-selector-input-group' }).append([
      inputLabel,
      inputControl,
      previewContainer
    ]);

    var buttonGroup = $(
      '<div>',
      {
        'class': 'modal-button-group r-to-l'
      }).append([ backButton, _renderModalInsertButton() ]);

    return [ content, buttonGroup ];
  }

  function _renderChooseGoalData(componentProperties) {
    var $previewContainer = _container.find('.asset-selector-goal-tile-preview-container');
    var $goalTilePreviewContainer = _container.find('.asset-selector-goal-tile-embed-component');
    var $inputControl = _container.find('[data-asset-selector-validate-field="goalUrl"]');
    var $insertButton = _container.find('.btn-apply');
    var goalDomain = null;
    var goalUid = null;
    var goalFullUrl = null;
    var renderedGoalDomain = $goalTilePreviewContainer.attr('data-rendered-goal-domain');
    var renderedGoalUid = $goalTilePreviewContainer.attr('data-rendered-goal-uid');
    var componentData;

    function allComponentPropertiesAreNotNull(properties) {

      return (
        _.isObject(properties) &&
        _.has(properties, 'domain') &&
        !_.isNull(_.get(properties, 'domain')) &&
        _.has(properties, 'goalUid') &&
        !_.isNull(_.get(properties, 'goalUid')) &&
        _.has(properties, 'goalFullUrl') &&
        !_.isNull(_.get(properties, 'goalFullUrl'))
      );
    }

    if (allComponentPropertiesAreNotNull(componentProperties)) {
      goalDomain = componentProperties.domain;
      goalUid = componentProperties.goalUid;
      goalFullUrl = componentProperties.goalFullUrl;

      if (
        goalDomain !== renderedGoalDomain ||
        goalUid !== renderedGoalUid
      ) {

        componentData = {
          type: 'goal.tile',
          value: {
            domain: goalDomain,
            goalUid: goalUid,
            goalFullUrl: goalFullUrl
          }
        };

        $goalTilePreviewContainer.
          trigger('destroy').
          empty().
          append($('<div>').componentGoalTile(componentData)).
          attr('data-rendered-goal-domain', goalDomain).
          attr('data-rendered-goal-uid', goalUid);

        // If we have already configured a goal but there is not currently-
        // selected url, it is probably because we're editing an existing
        // component. In order to make the UI consistent with this state,
        // we can insert the URL originally provided by the user.
        if ($inputControl.val().trim() === '') {
          $inputControl.val(goalFullUrl);
        }

        $previewContainer.removeClass('invalid');

        $insertButton.prop('disabled', false);
      }

    } else {

      $goalTilePreviewContainer.
        trigger('destroy').
        empty().
        attr('data-rendered-goal-domain', null).
        attr('data-rendered-goal-uid', null);

      // Only show the 'invalid url' icon if the user has entered text.
      $previewContainer.
        toggleClass(
          'invalid',
          $inputControl.val().trim() !== ''
        );

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

    var content = $('<div>', { 'class': 'asset-selector-input-group' }).append([
      inputLabel,
      inputControl,
      previewContainer
    ]);

    var buttonGroup = $(
      '<div>',
      {
        'class': 'modal-button-group r-to-l'
      }).append([ backButton, _renderModalInsertButton() ]);

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
      youtubeEmbedUrl = StorytellerUtils.generateYoutubeIframeSrc(youtubeId);
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
    var percentLoaded = assetSelectorStore.getUploadPercentLoaded();
    var isUploading = assetSelectorStore.isUploading();
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
    var isNotUploadingAndDoesNotHaveSource = !isUploading && _.isUndefined(iframeSrc);
    var isUploadingAndHasSource = isUploading && _.isString(iframeSrc);
    var showPlaceholder = isNotUploadingAndDoesNotHaveSource || isUploadingAndHasSource;

    function textareaIsUnedited() {
      return textareaElement.val() === '';
    }

    if (_.has(componentProperties, 'url')) {
      htmlFragmentUrl = componentProperties.url;
    }

    if (_.has(componentProperties, 'step')) {
      errorStep = componentProperties.step;
    }

    if (_.has(componentProperties, 'documentId')) {
      documentId = componentProperties.documentId;
    }

    insecureHtmlWarning.toggle(_warnAboutInsecureHTML);
    loadingButton.toggleClass('hidden', !isUploading);
    iframeContainer.toggleClass('placeholder', showPlaceholder);

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

      invalidMessageContainer.hide();
      insertButton.prop('disabled', false);
    } else if (!_.isNull(errorStep)) {
      if (/^validation.*/.test(errorStep)) {
        messageTranslationKey = StorytellerUtils.format('editor.asset_selector.embed_code.errors.{0}', errorStep);
      } else {
        messageTranslationKey = 'editor.asset_selector.embed_code.errors.exception';
      }

      iframeElement.attr('src', '');
      invalidMessageContainer.show();
      invalidMessageElement.html(I18n.t(messageTranslationKey));

      iframeContainer.addClass('invalid');

      insertButton.prop('disabled', true);
    } else if (_.isFinite(percentLoaded)) {

      invalidMessageContainer.hide();

      iframeContainer.removeClass('invalid');

      insertButton.prop('disabled', true);
    } else {
      invalidMessageContainer.hide();
      insertButton.prop('disabled', true);
    }
  }

  // Renders a view chooser (/browse/choose_dataset)
  // with the given params. When a view is picked,
  // a 'viewSelected' browser event is triggered with
  //
  function _renderViewChooserTemplate(paramString) {
    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_VISUALIZATION_OPTION);

    var viewChooserIframe = $(
      '<iframe>',
      {
        'class': 'asset-selector-dataset-chooser-iframe asset-selector-full-width-iframe',
        'src': _viewChooserUrl(paramString)
      }
    );

    var loadingButton = $('<button>', {
      'class': 'btn btn-transparent btn-busy visualization-busy',
      'disabled': true
    }).append($('<span>'));

    var buttonGroup = $('<div>', {
      'class': 'modal-button-group r-to-l'
    }).append([ backButton ]);

    viewChooserIframe[0].onDatasetSelected = function(datasetObj) {
      $(this).trigger('viewSelected', datasetObj);
    };

    viewChooserIframe.one('load', function() {
      loadingButton.addClass('hidden');
    });

    return [ loadingButton, viewChooserIframe, buttonGroup ];

  }

  function _renderChooseDatasetTemplate() {
    return _renderViewChooserTemplate('suppressed_facets[]=type&limitTo=datasets');
  }

  function _renderChooseTableTemplate() {
    if (Environment.ENABLE_FILTERED_TABLE_CREATION) {
      // Due to bugs in frontend we cannot limitTo datasets plus filtered views.
      // We can limitTo one or the other, but not both. Without refactoring
      // the frontend dataset picker, our only recourse is to limitTo tables, which
      // includes datasets, filtered views, and grouped views. We don't support
      // grouped views, but for now we're OK just notifying the user if they
      // select a grouped view.
      return _renderViewChooserTemplate('suppressed_facets[]=type&limitTo=tables');
    } else {
      return _renderChooseDatasetTemplate();
    }
  }

  function _renderChooseMapOrChartTemplate() {
    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_VISUALIZATION_OPTION);

    var mapOrChartChooserIframe = $(
      '<iframe>',
      {
        'class': 'asset-selector-mapOrChart-chooser-iframe asset-selector-full-width-iframe',
        'src': _mapOrChartChooserUrl()
      }
    );

    var loadingButton = $('<button>', {
      'class': 'btn btn-transparent btn-busy visualization-busy',
      'disabled': true
    }).append($('<span>'));

    var buttonGroup = $('<div>', {
      'class': 'modal-button-group r-to-l'
    }).append([ backButton ]);

    mapOrChartChooserIframe[0].onDatasetSelected = function(mapOrChartObj) {
      $(this).trigger('mapOrChartSelected', mapOrChartObj);
    };

    mapOrChartChooserIframe.one('load', function() {
      loadingButton.addClass('hidden');
    });

    return [ loadingButton, mapOrChartChooserIframe, buttonGroup ];
  }

  function _renderConfigureVisualizationTemplate() {
    var configureVisualizationIframe = $(
      '<iframe>',
      {
        'class': 'asset-selector-configure-visualization-iframe asset-selector-full-width-iframe',
        'src': ''
      }
    );

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_DATASET_FOR_VISUALIZATION);

    // TODO: Map insert button to APPLY instead of CLOSE, and share insert button
    // into shared function
    var loadingButton = $('<button>', {
      'class': 'btn-transparent btn-busy visualization-busy',
      'disabled': true
    }).append($('<span>'));

    var buttonGroup = $('<div>', {
      'class': 'modal-button-group r-to-l'
    }).append([ backButton, _renderModalInsertButton({ disabled: true }) ]);

    configureVisualizationIframe[0].onVisualizationSelectedV2 = function(datasetObjJson, format, originalUid) {
      // This function is called by the visualization chooser when:
      //   - The user makes or clears a selection (argument is either null or a visualization).
      //   - The page finishes loading (argument is null).
      // In either case, we should consider the iframe loaded.
      // originalUid may be null (say if the user created the visualization inline).
      configureVisualizationIframe.
        trigger('visualizationSelected', {
          data: JSON.parse(datasetObjJson),

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

  function _renderTablePreviewTemplate() {
    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_TABLE_FROM_CATALOG);

    var buttonGroup = $('<div>', {
      'class': 'modal-button-group r-to-l'
    }).append([ backButton, _renderModalInsertButton() ]);

    var label = $(
      '<h2>',
      { 'class': 'asset-selector-preview-label' }
    ).text(I18n.t('editor.asset_selector.visualization.preview_label'));

    var table = $(
      '<div>',
      { 'class': 'asset-selector-preview-table' }
    );

    var container = $(
      '<div>',
      { 'class': 'asset-selector-preview-container' }
    ).append([
      table
    ]);

    var content = $(
      '<div>',
      { 'class': 'asset-selector-input-group' }
    ).append([
      label,
      container
    ]);

    return [ content, buttonGroup ];
  }

  function _renderTablePreviewData(componentType, componentProperties) {
    var table = _container.find('.asset-selector-preview-table');
    table.componentSocrataVisualizationTable(
      {
        type: componentType,
        value: _.extend(
          {},
          componentProperties,
          {
            layout: {
              height: table.height() - parseFloat(table.parent().css('padding')) * 2
            }
          }
        )
      }
    );
  }


  function _renderConfigureMapOrChartTemplate() {
    var configureMapOrChartIframe = $(
      '<iframe>',
      {
        'class': 'asset-selector-configure-mapchart-iframe asset-selector-full-width-iframe',
        'src': ''
      }
    );

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG);

    var loadingButton = $('<button>', {
      'class': 'btn-transparent btn-busy visualization-busy',
      'disabled': true
    }).append($('<span>'));

    var buttonGroup = $('<div>', {
      'class': 'modal-button-group r-to-l'
    }).append([ backButton, _renderModalInsertButton({ disabled: true }) ]);

    return [ loadingButton, configureMapOrChartIframe, buttonGroup ];
  }

  function _renderConfigureMapOrChartData(componentType, componentProperties) {
    var dataset;
    var insertButton = _container.find('.btn-apply');
    var mapChartIframe = _container.find('.asset-selector-configure-mapchart-iframe');
    var assetSelectorStoreDataset = assetSelectorStore.getDataset();
    var savedDatasetMatchesSelectedDataset = (
      assetSelectorStoreDataset &&
      componentProperties.visualization &&
      componentProperties.visualization.id === assetSelectorStoreDataset.id
    );
    var isEditingWithoutSavedDataset = !assetSelectorStoreDataset && assetSelectorStore.isEditingExisting();

    if (componentProperties.dataset && _container.find('.component-socrata-visualization-classic').length === 0) {

      if (savedDatasetMatchesSelectedDataset || isEditingWithoutSavedDataset) {
        dataset = componentProperties.visualization;
      } else {
        dataset = JSON.parse(JSON.stringify(assetSelectorStoreDataset));
      }

      // If the visualization has a table, make sure it does not display.
      dataset.metadata.renderTypeConfig.visible.table = false;

      mapChartIframe.hide();

      var componentContainer = $(
        '<div>',
        {
          'class': 'asset-selector-component-container'
        }
      );

      _container.
        find('.modal-content').
        prepend(componentContainer);

      componentContainer.on('component::visualization-loaded', function() {
        $('.btn-busy').addClass('hidden');
        insertButton.prop('disabled', false);

        mapChartIframe.
          trigger('visualizationSelected', {
            data: dataset,

            // format can either be 'classic' or 'vif'.
            format: 'classic',
            originalUid: dataset.id
          });
      });

      componentContainer.componentSocrataVisualizationClassic(
        {
          type: 'socrata.visualization.classic',
          value: {
            visualization: dataset
          }
        },
        null, {
          resizeSupported: false
        });

      insertButton.prop('disabled', true);
    }
  }

  /**
   * Small helper functions
   */

  function _viewChooserUrl(paramString) {
    return encodeURI(
      StorytellerUtils.format(
        '{0}/browse/select_dataset?{1}',
        window.location.protocol + '//' + window.location.hostname,
        paramString
      )
    );
  }

  function _mapOrChartChooserUrl() {
    // remove suppressed_facets param upon frontend release to show 'view types' menu
    //
    // cetera_search must be set to false until multiple limitTo parameters are enabled for cetera
    // limitTo array parameter currently only works with clytemnestra
    return encodeURI(
      StorytellerUtils.format(
        '{0}/browse/select_dataset?filtered_types[]=maps&filtered_types[]=charts&limitTo[]=charts&limitTo[]=maps&limitTo[]=blob&cetera_search=false',
        window.location.protocol + '//' + window.location.hostname
      )
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
      StorytellerUtils.format(
        '{0}/component/visualization/add?datasetId={1}&defaultColumn={2}&defaultVifType={3}&defaultRelatedVisualizationUid={4}',
        window.location.protocol + '//' + window.location.hostname,
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
        'class': 'asset-selector-preview-iframe',
        'sandbox': Environment.EMBED_CODE_SANDBOX_IFRAME_ALLOWANCES
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
      }).append([ backButton, _renderModalInsertButton() ]);

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

function _renderModalInsertButton(options) {
  return $(
    '<button>',
    { 'class': 'btn-primary btn-apply' }
  ).
  text(_insertButtonText()).
  attr('disabled', _.get(options, 'disabled', false));
}

function _insertButtonText() {
  var isEditingExisting = assetSelectorStore.isEditingExisting();

  return I18n.t(
    isEditingExisting ?
      'editor.asset_selector.update_button_text' :
      'editor.asset_selector.insert_button_text'
  );
}
