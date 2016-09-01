import $ from 'jQuery';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactCrop from 'react-image-crop';
import SocrataVisualizations from 'socrata-visualizations';

import '../components/Modal';
import I18n from '../I18n';
import Actions from '../Actions';
import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { exceptionNotifier } from '../../services/ExceptionNotifier';
import { dispatcher } from '../Dispatcher';
import { WIZARD_STEP, assetSelectorStore } from '../stores/AssetSelectorStore';
import { STATUS, fileUploaderStore } from '../stores/FileUploaderStore';
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
    assetSelectorStore.addChangeListener(_renderSelector);
    fileUploaderStore.addChangeListener(_renderSelector);
  }

  function _attachEvents() {

    _container.on('modal-dismissed', function() {
      var confirmed = true;
      if (assetSelectorStore.isUploadingFile() || assetSelectorStore.isCropping()) {
        confirmed = confirm(I18n.t('editor.asset_selector.image_preview.confirm_cancel'));
      }

      if (confirmed) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CLOSE
        });
      }
    });

    _container.on(
      'change',
      '[data-asset-selector-validate-field="imageUpload"]',
      function(event) {
        if (event.target.files && event.target.files.length > 0) {
          dispatcher.dispatch({
            id: _.uniqueId(),
            action: Actions.ASSET_SELECTOR_IMAGE_UPLOAD,
            file: event.target.files[0]
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
      'input',
      '.asset-selector-title-input',
      function(event) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE,
          titleAttribute: $(event.target).val()
        });
      }
    );

    _container.on(
      'mouseout',
      [
        '.asset-selector-image-alt-hint',
        '.asset-selector-youtube-title-hint',
        '.asset-selector-embed-code-title-hint',
        '.asset-selector-goal-url-hint'
      ].join(),
      flyoutRenderer.clear
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
      'mouseenter',
      '.asset-selector-youtube-title-hint',
      function() {
        flyoutRenderer.render({
          element: this,
          content: '<span class="tooltip-text">' +
            I18n.t('editor.asset_selector.youtube.title_attribute_tooltip') +
            '</span>',
          rightSideHint: false,
          belowTarget: false
        });
      }
    );

    _container.on(
      'mouseenter',
      '.asset-selector-embed-code-title-hint',
      function() {
        flyoutRenderer.render({
          element: this,
          content: '<span class="tooltip-text">' +
            I18n.t('editor.asset_selector.embed_code.title_attribute_tooltip') +
            '</span>',
          rightSideHint: false,
          belowTarget: false
        });
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
      'change',
      '#open-story-in-new-window',
      function() {

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_TOGGLE_STORY_WINDOW_TARGET
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
      var htmlFragment = $(event.target).val();
      _warnAboutInsecureHTML = /src=("|')http:\/\//.test(htmlFragment);
      if (htmlFragment.length === 0) {
        return;
      }

      if (assetSelectorStore.isUploadingFile() && assetSelectorStore.isHTMLFragment()) {
        dispatcher.dispatch({
          action: Actions.FILE_CANCEL,
          id: assetSelectorStore.getFileId()
        });
      }

      var blobForUpload = new Blob([htmlFragment], {type: 'text/html'});
      blobForUpload.name = Constants.EMBEDDED_FRAGMENT_FILE_NAME;

      dispatcher.dispatch({
        action: Actions.FILE_UPLOAD,
        file: blobForUpload,
        id: _.uniqueId()
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

    _container.on('click', '[data-action="ASSET_SELECTOR_IMAGE_CROP_START"]', function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_CROP_START
      });
    });

    _container.on('click', '[data-action="ASSET_SELECTOR_IMAGE_CROP_RESET"]', function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_CROP_RESET
      });
    });

    _container.on('click', '.btn-apply', function() {
      saveAndClose();
    });

    _container.on('click', '.btn-close', function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_CLOSE
      });
    });
  }

  function saveAndClose() {
    // TODO this sequence of steps should likely be its own single action,
    // which both AssetSelectorStore and StoryStore handle.

    if (assetSelectorStore.isDirty()) {
      dispatcher.dispatch({
        action: Actions.BLOCK_UPDATE_COMPONENT,
        blockId: assetSelectorStore.getBlockId(),
        componentIndex: assetSelectorStore.getComponentIndex(),
        type: assetSelectorStore.getComponentType(),
        value: assetSelectorStore.getComponentValue()
      });
    }

    dispatcher.dispatch({
      action: Actions.ASSET_SELECTOR_CLOSE
    });
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
      _lastRenderedStep = step;

      switch (step) {

        case WIZARD_STEP.SELECT_ASSET_PROVIDER:
          selectorTitle = I18n.t('editor.asset_selector.choose_provider_heading');
          selectorContent = _renderChooseProvider();
          break;

        case WIZARD_STEP.ENTER_STORY_URL:
          selectorTitle = I18n.t('editor.asset_selector.story_tile.heading');
          selectorContent = _renderChooseStoryTemplate();
          break;

        case WIZARD_STEP.ENTER_GOAL_URL:
          selectorTitle = I18n.t('editor.asset_selector.goal_tile.heading');
          selectorContent = _renderChooseGoalTemplate();
          break;

        case WIZARD_STEP.ENTER_YOUTUBE_URL:
          selectorTitle = I18n.t('editor.asset_selector.youtube.heading');
          selectorContent = _renderChooseYoutubeTemplate();
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

        case WIZARD_STEP.AUTHOR_VISUALIZATION:
          selectorContent = _renderAuthorVisualizationTemplate();
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
          selectorTitle = I18n.t('editor.asset_selector.visualization.preview_label');
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
          selectorContent = _renderChooseEmbedCodeTemplate();
          break;

        default:
          selectorTitle = null;
          selectorContent = null;
          break;
      }

      if (selectorContent) {
        _showSelectorWith({
          title: selectorTitle + (Environment.ENVIRONMENT === 'development' ? ' [' + step + ']' : ''),
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
        _renderChooseImageGalleryPreviewData();
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
        renderImagePreviewData(componentValue);
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
      text(
        Environment.ENABLE_GETTY_IMAGES_GALLERY ?
          I18n.t('editor.asset_selector.image_upload.description_with_getty_images') :
          I18n.t('editor.asset_selector.image_upload.description')
      );

    var storyTileHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.story_tile.name'));
    var storyTileDescription = $('<p>').
      text(I18n.t('editor.asset_selector.story_tile.description'));

    var goalTileHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.goal_tile.name'));
    var goalTileDescription = $('<p>').
      text(I18n.t('editor.asset_selector.goal_tile.description'));

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
      $('<li>', {
        'data-provider': 'GOAL_TILE'
      }).append(goalTileHeader, goalTileDescription),
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

    var authorVisualizationHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.visualization.choose_author_visualization_heading'));
    var authorVisualizationDescription = $('<p>').
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
            append(insertTableHeader, insertTableDescription)
        ]);

    if (Environment.ENABLE_VISUALIZATION_AUTHORING_WORKFLOW && Environment.ENABLE_SVG_VISUALIZATIONS) {
      visualizationOptions.append(
        $(
          '<li>',
          {'data-visualization-option': 'AUTHOR_VISUALIZATION'}
        ).append(authorVisualizationHeader, authorVisualizationDescription)
      );
    } else {
      visualizationOptions.append(
        $(
          '<li>',
          {'data-visualization-option': 'CREATE_VISUALIZATION'}
        ).append(createVisualizationHeader, createVisualizationDescription)
      );
    }

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
    }).toggleClass('hidden', !Environment.ENABLE_GETTY_IMAGES_GALLERY);

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

    tabs.on('click', 'a', function(event) {
      event.preventDefault();

      var href = $(event.target).closest('[href]');
      var id = href.attr('href');

      tabs.find('.tab').removeClass('active');
      pages.find('.page').removeClass('active');

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
    var searchForm = $('<form>', {
      class: 'images-search'
    });

    var searchField = $('<input>', {
      class: 'asset-selector-text-input text-input',
      placeholder: I18n.t('editor.asset_selector.image_upload.search_instructions'),
      type: 'text'
    });

    var searchLoadingSpinner = $('<button>', {
      class: 'btn btn-busy btn-transparent images-search-loading-spinner'
    }).append($('<span>')).hide();

    var searchInputGroup = $('<span>', { class: 'input-group' }).
      append([
        searchField,
        searchLoadingSpinner,
        $('<input>', {
          class: 'btn btn-primary',
          type: 'submit',
          value: I18n.t('editor.asset_selector.image_upload.search')
        })
      ]);

    var searchError = $('<div>', {
      class: 'alert warning-bar hidden images-error'
    }).append(
      $('<p>').append($('<span>', {class: 'icon-warning'})),
      $('<p>').text(I18n.t('editor.asset_selector.image_upload.errors.image_search'))
    );

    searchForm.append(searchInputGroup);

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
    }).text(I18n.t('editor.asset_selector.image_upload.thats_everything'));

    galleryResults.append(
      $('<div>', {class: 'gallery-column hidden'}),
      $('<div>', {class: 'gallery-column hidden'}),
      $('<div>', {class: 'gallery-column hidden'}),
      showMoreButton,
      thatsEverything
    );

    var backButton;
    var componentType = assetSelectorStore.getComponentType();

    if (componentType === 'image') {
      // Paradoxically, we allow image components to be changed into other asset types.
      backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);
    } else {
      // Not so for other image-using components - they're locked to what they are (hero, author).
      backButton = $('<button>', {class: 'btn btn-default', 'data-action': Actions.ASSET_SELECTOR_CLOSE});
      backButton.text(I18n.t('editor.modal.buttons.cancel'));
    }

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

    searchForm.submit(function() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_SEARCH,
        phrase: searchField.val()
      });
    });

    showMoreButton.click(function() {
      showMoreButton.
        addClass('btn-busy').
        prop('disabled', true);
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_SEARCH_LOAD_MORE
      });
    });

    backButton.one('click', function() {
      var action = backButton.attr('data-action');
      if (action) {
        dispatcher.dispatch({ action });
      }
    });

    return [searchForm, searchError, galleryResults, navGroup];
  }

  function _getBestColumnForImagePlacement(imageElement) {
    var columns = $('.gallery-column').map(function() {
      var $this = $(this);
      var heights = $this.find('.gallery-result').map(function() {
        return $(this).data('height');
      });

      var heightWithNewImage = _.reduce(
        heights,
        function(previousHeight, nextHeight) {
          return previousHeight + nextHeight;
        },
        imageElement.height
      );

      return {
        element: $this,
        height: heightWithNewImage
      };
    });

    var smallestEffectiveColumn = _.reduce(columns, function(previousColumn, nextColumn) {
      var minimum = Math.min(previousColumn.height, nextColumn.height);

      return minimum === previousColumn.height ?
        previousColumn :
        nextColumn;
    }, {height: Infinity});

    var width = smallestEffectiveColumn.element.width();

    smallestEffectiveColumn.adjustedImageHeight = width * (
      imageElement.height / imageElement.width
    );

    return smallestEffectiveColumn;
  }

  function _renderChooseImageGalleryPreviewData() {
    var results = assetSelectorStore.getImageSearchResults();
    var hasImages = assetSelectorStore.hasImageSearchResults();
    var hasError = assetSelectorStore.hasImageSearchError();
    var isSearching = assetSelectorStore.isImageSearching();

    if (hasImages) {
      var renderedSources = _.keyBy(_.map(_container.find('.gallery-result img'), 'src'));
      var promises = results.map(function(image) {
        var uri = _.find(image.display_sizes, {name: 'preview'}).uri;
        var alreadyInSources = renderedSources.hasOwnProperty(uri);

        if (alreadyInSources) {
          return Promise.resolve();
        } else {
          var id = image.id;
          var promise = new Promise(function(resolve, reject) {
            var imageElement = new Image();

            imageElement.src = uri;
            imageElement.onerror = reject;
            imageElement.onclick = function() {
              dispatcher.dispatch({
                action: Actions.ASSET_SELECTOR_IMAGE_SELECTED,
                id: id
              });
            };
            imageElement.onload = function() {
              var column = _getBestColumnForImagePlacement(imageElement);

              column.element.append(
                $('<div>', {class: 'gallery-result', 'data-height': column.adjustedImageHeight}).append(
                  imageElement,
                  $('<div>', {class: 'gallery-result-cover'}),
                  $('<span>', {class: 'icon-checkmark3'})
                )
              );

              resolve();
            };
          });

          return promise;
        }
      });

      Promise.all(promises).then(function() {
        var galleryResults = _container.find('.gallery-result');
        var hasMoreImages = assetSelectorStore.canPageImageSearchNext();
        var outOfImages = !hasMoreImages;

        galleryResults.each(function(i, result) {
          var $result = $(result);
          var $image = $result.find('img');
          var isSelectedImage = $image.attr('src').indexOf(assetSelectorStore.getImageSearchSelected()) >= 0;

          $result.toggleClass('active', isSelectedImage);

          // Work around IE11 automatically adding height/width attributes on
          // dynamically inserted image elements, causing distortion.
          // Width isn't an issue in our case; just need to unset height.
          $image.attr('height', null);
        });

        _container.find('.btn-apply').prop('disabled', _.isEmpty(assetSelectorStore.getImageSearchSelected()));

        $('.images-error').addClass('hidden');
        $('.images-search-loading-spinner').hide();

        $('.gallery-thats-everything').toggle(outOfImages);
        $('.gallery-show-more').
          removeClass('btn-busy').
          prop('disabled', outOfImages).
          toggle(hasMoreImages);

        $('.gallery-column').removeClass('hidden');
      }).catch(function(error) {
        console.error(error);

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
      if (assetSelectorStore.hasImageSearchPhrase()) {
        $('.images-error').removeClass('hidden');
      }

      $('.images-search-loading-spinner').hide();
      $('.gallery-column').empty();
      $('.gallery-show-more').hide();
      $('.gallery-thats-everything').hide();
    }
  }

  function _renderChooseImageUploadTemplate() {

    var dragLabel = $(
      '<h2>',
      { class: 'image-drag-label' }
    ).text(I18n.t('editor.asset_selector.image_upload.drag_label'));

    var inputLabel = $(
      '<h2>',
      { 'class': 'modal-input-label modal-input-label-centered input-label' }
    ).text(I18n.t('editor.asset_selector.image_upload.input_label'));

    var dragInstructionsSpacer = $(
      '<div>',
      { class: 'image-instructions-spacer' }
    );

    var inputButton = $('<button>', {
      'class': 'image-choose-upload-now btn btn-default'
    }).text(I18n.t('editor.asset_selector.image_upload.input_button_text'));

    var inputControl = $(
      '<input>',
      {
        'class': 'asset-selector-text-input hidden',
        'data-asset-selector-validate-field': 'imageUpload',
        'type': 'file',
        'name': 'image-file'
      }
    );

    var backButton;
    var componentType = assetSelectorStore.getComponentType();

    if (componentType === 'image') {
      // Paradoxically, we allow image components to be changed into other asset types.
      backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);
    } else {
      // Not so for other image-using components - they're locked to what they are (hero, author).
      backButton = $('<button>', {class: 'btn btn-default', 'data-action': Actions.ASSET_SELECTOR_CLOSE});
      backButton.text(I18n.t('editor.modal.buttons.cancel'));
    }

    var content = $(
      '<div>',
      { 'class': 'asset-selector-input-group asset-selector-input-group-fixed-height' }
    ).append([
      dragLabel,
      inputLabel,
      dragInstructionsSpacer,
      inputButton,
      inputControl
    ]);

    content.
      on('dragover', function(event) {
        content.addClass('active');

        event.stopPropagation();
        event.preventDefault();
      }).
      on('drop', function(event) {
        var files = event.originalEvent.dataTransfer.files;

        content.removeClass('active');

        event.stopPropagation();
        event.preventDefault();

        if (files[0]) {
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_IMAGE_UPLOAD,
            file: files[0]
          });
        }
      }).
      on('dragleave', function() {
        content.removeClass('active');
      });

    content.
      on('drop', function() {
      });

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

    var cancel = function() {
      var id = assetSelectorStore.getFileId();

      if (id) {
        dispatcher.dispatch({
          action: Actions.FILE_CANCEL,
          id: id
        });
      } else {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
          step: WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD
        });
      }
    };

    var tryAgainButton = $(
      '<button>',
      { 'class': 'btn btn-default hidden asset-selector-try-again' }
    ).text(I18n.t('editor.asset_selector.try_again_button_text'));

    var uploadCancelButton = $(
      '<button>',
      { 'class': 'btn btn-default asset-selector-cancel-upload' }
    ).text(I18n.t('editor.asset_selector.cancel_button_text'));

    tryAgainButton.on('click', cancel);
    uploadCancelButton.on('click', cancel);

    progress.append([
      uploadProgressMessage,
      progressSpinner,
      uploadCancelButton,
      tryAgainButton
    ]);

    var backButton = $(
      '<button>',
      { class: 'btn btn-default back-btn' }
    ).text(I18n.t('editor.asset_selector.back_button_text'));

    backButton.on('click', cancel);

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

    cancelButton.remove();
    progressSpinner.addClass('hidden');
    tryAgainButton.removeClass('hidden');

    if (componentProperties && componentProperties.reason) {
      progressMessage.html(componentProperties.reason);
    } else {
      progressMessage.html(I18n.t('editor.asset_selector.image_upload.errors.exception'));
    }
  }

  function uploadImage() {
    dispatcher.dispatch({
      action: Actions.FILE_UPLOAD,
      file: assetSelectorStore.getPreviewImageData(),
      id: _.uniqueId()
    });
  }

  function cropImage() {
    var type = assetSelectorStore.getComponentType();
    var value = assetSelectorStore.getComponentValue();
    var documentId = type === 'author' ? value.image.documentId : value.documentId;

    if (documentId) {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_CROP_COMMIT
      });
    } else {
      uploadUrl();
    }
  }

  function uploadUrl() {
    var type = assetSelectorStore.getComponentType();
    var value = assetSelectorStore.getComponentValue();
    var url = type === 'author' ? value.image.url : value.url;

    dispatcher.dispatch({
      action: Actions.URL_UPLOAD,
      url: url,
      id: _.uniqueId()
    });
  }

  function _renderImagePreviewTemplate() {
    var errorMessaging = $(
      '<div>',
      { 'class': 'alert error asset-selector-error hidden' }
    );

    var previewImageLabel = $(
      '<h2>',
      { 'class': 'asset-selector-preview-label' }
    ).text(I18n.t('editor.asset_selector.image_preview.preview_label'));

    var previewSpinner = $(
      '<button>',
      { 'class': 'btn btn-busy btn-transparent asset-selector-preview-spinner hidden' }
    ).append($('<span>'));

    var cropButton = $('<button>', {
      'class': 'btn btn-xs btn-default btn-toggle image-crop-btn',
      'data-action': 'ASSET_SELECTOR_IMAGE_CROP_START'
    }).append([
      $('<span>', {'class': 'icon-crop image-crop-btn-icon'}),
      I18n.t('editor.asset_selector.image_preview.crop')
    ]);

    var resetImageButton = $('<button>', {
      'class': 'btn btn-xs btn-default image-crop-reset-btn',
      'data-action': 'ASSET_SELECTOR_IMAGE_CROP_RESET'
    }).append([
      $('<span>', {'class': 'icon-close-2 image-crop-reset-btn-icon'}),
      I18n.t('editor.asset_selector.image_preview.reset_image')
    ]);

    var imageActionsContainer = $('<div>', {
      'class': 'image-actions-container'
    }).append([
      cropButton,
      resetImageButton,
      previewSpinner
    ]);

    var previewContainer = $(
      '<div>',
      { 'class': 'asset-selector-preview-container asset-selector-image-preview-container' }
    );

    var gettyImageInfo = $(
      '<div>',
      { class: 'alert info getty-image-info hidden' }
    ).append(
      $('<div>', { class: 'alert-icon' }).append(
        $('<span>', {class: 'icon-info-inverse'})
      ),
      $('<div>', { class: 'alert-content' }).append(
        $('<p>').append(
          StorytellerUtils.format(I18n.t('editor.asset_selector.image_upload.getty_image_terms'), _insertButtonText())
        )
      )
    );

    var questionIcon = $('<span>', { 'class': 'icon-question-inverse asset-selector-image-alt-hint' });

    var descriptionLabel = $(
      '<h2>',
      { 'class': 'asset-selector-image-description-label' }
    ).append(
      I18n.t('editor.asset_selector.image_preview.description_label'),
      questionIcon
    );


    var inputField = $('<form>').append($(
      '<input>',
      {
        'class': 'asset-selector-alt-text-input text-input',
        'type': 'text'
      }
    ));

    inputField.on('keyup', function(event) {
      if (event.keyCode === 13) {
        $('.modal-dialog .image-crop-upload-btn').click();
      }
    });

    var descriptionContainer = $(
      '<div>',
      { 'class': 'asset-selector-image-description-container' }
    ).append([
      inputField
    ]);

    var backButton = $('<button>', {
      'class': 'btn btn-default image-crop-back-btn'
    }).text(I18n.t('editor.asset_selector.back_button_text'));

    var insertButton = $('<button>', {
      'class': 'btn btn-primary image-crop-upload-btn'
    }).append(
      $('<span>').text(_insertButtonText)
    );

    backButton.one('click', function() {
      if (assetSelectorStore.isUploadingFile()) {
        dispatcher.dispatch({
          action: Actions.FILE_CANCEL,
          id: assetSelectorStore.getFileId()
        });
      }

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_PREVIEW_BACK
      });
    });

    insertButton.on('click', function() {
      if (assetSelectorStore.isEditingExisting()) {
        if (assetSelectorStore.hasPreviewImageData()) {
          uploadImage();
        } else if (assetSelectorStore.hasImageUrlChanged()) {
          uploadUrl();
        } else if (assetSelectorStore.hasCropChanged()) {
          cropImage();
        } else {
          saveAndClose();
        }
      } else {
        if (assetSelectorStore.hasPreviewImageData()) {
          uploadImage();
        } else if (assetSelectorStore.hasImageUrlChanged()) {
          uploadUrl();
        } else {
          saveAndClose();
        }
      }
    });

    var buttonGroup = $(
      '<div>',
      { 'class': 'modal-button-group r-to-l' }
    ).append([
      $('<small>', { 'class': 'image-loading-status hidden' }).append(
        I18n.t('editor.asset_selector.image_preview.loading.step_one')
      ),
      backButton,
      insertButton
    ]);

    var isImage = assetSelectorStore.getComponentType() === 'image';
    var content = $(
      '<div>',
      { 'class': 'asset-selector-input-group' }
    ).append([
      errorMessaging,
      previewImageLabel,
      imageActionsContainer,
      previewContainer,
      gettyImageInfo,
      isImage ? descriptionLabel : null,
      isImage ? descriptionContainer : null
    ]);

    return [ content, buttonGroup ];
  }

  function extractImageAlt(componentProperties) {
    return _.get(
      componentProperties,
      'alt',
      _.get(componentProperties, 'image.alt', null) // Try again, this time under image.alt. Overall default is null.
    );
  }

  function grabOriginalImage(url) {
    return assetSelectorStore.isEditingExisting() ?
      (url || '').replace(/\/(xlarge|large|medium|small)\//, '/original/') :
      url;
  }

  function onImageResize(crop) {
    dispatcher.dispatch({
      action: Actions.ASSET_SELECTOR_IMAGE_CROP_SET,
      crop: crop
    });
  }

  function renderImageCropper(source, crop) {
    var imageContainer = _container.find('.asset-selector-preview-container');
    var previewSpinner = _container.find('.asset-selector-preview-spinner');

    var imageCrop = React.createElement(ReactCrop, {
      src: grabOriginalImage(source),
      crop: crop,
      onComplete: onImageResize,
      onImageLoaded: function() {
        previewSpinner.addClass('hidden');
      },
      keepSelection: true
    });

    ReactDOM.render(imageCrop, imageContainer[0]);
  }

  function renderImagePreviewFromUrl(url, crop) {
    renderImageCropper(url, crop);
  }

  function renderImagePreviewData(componentProperties) {
    var file = fileUploaderStore.fileById(assetSelectorStore.getFileId());
    var crop = assetSelectorStore.getComponentType() === 'author' ?
      componentProperties.image.crop :
      componentProperties.crop;

    var imageUrl = grabOriginalImage(assetSelectorStore.getPreviewImageUrl());
    var existingImageUrl = _container.find('img').attr('src');
    var altAttribute = extractImageAlt(componentProperties);

    var isUploadingFile = assetSelectorStore.isUploadingFile();
    var isCropping = assetSelectorStore.isCropping();
    var isCroppingUiEnabled = assetSelectorStore.isCroppingUiEnabled();
    var isNotGettyImage = !Constants.VALID_STORYTELLER_GETTY_IMAGE_URL_API_PATTERN.test(imageUrl);

    var hasCompletedUpload = isUploadingFile && file.status === STATUS.COMPLETED;
    var doesNotHaveError = !_.has(componentProperties, 'reason');
    var loadingMessage = '';

    if (file && file.status === STATUS.UPLOADING && file.progress < 1) {
      loadingMessage = 'editor.asset_selector.image_preview.loading.uploading_image';
    } else if (isCropping || file && file.status === STATUS.PROCESSING) {
      if (isCropping) {
        loadingMessage = 'editor.asset_selector.image_preview.loading.optimizing_mobile_with_cropping';
      } else {
        loadingMessage = 'editor.asset_selector.image_preview.loading.optimizing_mobile';
      }
    }

    _container.
      find('.asset-selector-alt-text-input').
      attr('value', _.isEmpty(altAttribute) ? null : altAttribute);

    _container.
      find('.getty-image-info').
      toggleClass('hidden', isNotGettyImage);

    _container.
      find('.image-crop-btn').
      prop('disabled', isUploadingFile || isCropping).
      toggleClass('active', isCroppingUiEnabled);

    _container.
      find('.image-crop-reset-btn').
      prop('disabled', isUploadingFile || isCropping);

    _container.
      find('.asset-selector-preview-container').
      toggleClass('disable-pointer-events', !isCroppingUiEnabled || isUploadingFile || isCropping);

    _container.
      find('.image-crop-upload-btn').
      prop('disabled', isUploadingFile || isCropping).
      toggleClass('btn-busy', isUploadingFile || isCropping);

    _container.
      find('.asset-selector-error').
      text(_.get(componentProperties, 'reason', '')).
      toggleClass('hidden', doesNotHaveError);

    _container.
      find('.image-loading-status').
      toggleClass('hidden', !isUploadingFile && !isCropping).
      html(loadingMessage && I18n.t(loadingMessage));

    _container.
      find('.asset-selector-preview-spinner').
      toggleClass('hidden', existingImageUrl === imageUrl);

    if (hasCompletedUpload || assetSelectorStore.isCropComplete()) {
      saveAndClose();
    } else if (imageUrl) {
      renderImagePreviewFromUrl(imageUrl, crop);
    }
  }

  function _renderChooseStoryTemplate() {
    var inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
      text(I18n.t('editor.asset_selector.story_tile.input_label'));

    var inputControl = $(
      '<input>',
      {
        'class': 'text-input',
        'data-asset-selector-validate-field': 'storyUrl',
        'placeholder': 'https://www.example.com/stories/s/story-title/abcd-efgh',
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

    var content = $('<form>', { 'class': 'asset-selector-input-group asset-selector-story-tile' }).append([
      inputLabel,
      inputControl,
      previewContainer
    ]);

    var newWindowControl = $(
      '<div>', { 'class': 'modal-input-group' }
    ).append([
      $('<input>', { type: 'checkbox', id: 'open-story-in-new-window', 'class': 'modal-input' }),
      $('<label>', { 'for': 'open-story-in-new-window', 'class': 'modal-input-label' }).append([
        $('<span>', { 'class': 'icon-checkmark3' }),
        I18n.t('editor.asset_selector.story_tile.open_in_new_window')
      ])
    ]);

    var buttonGroup = $(
      '<div>',
      {
        'class': 'modal-button-group r-to-l'
      }).append([ backButton, _renderModalInsertButton() ]);

    return [ content, newWindowControl, buttonGroup ];
  }

  function _renderChooseStoryData(componentProperties) {
    var $previewContainer = _container.find('.asset-selector-story-tile-preview-container');
    var $storyTilePreviewContainer = _container.find('.asset-selector-story-tile-embed-component');
    var $inputControl = _container.find('[data-asset-selector-validate-field="storyUrl"]');
    var $newWindowCheckbox = _container.find('#open-story-in-new-window');
    var $insertButton = _container.find('.btn-apply');
    var storyDomain = null;
    var storyUid = null;
    var openInNewWindow = false;
    var renderedStoryDomain = $storyTilePreviewContainer.attr('data-rendered-story-domain');
    var renderedStoryUid = $storyTilePreviewContainer.attr('data-rendered-story-uid');
    var componentData;

    if (_.isPlainObject(componentProperties)) {

      storyDomain = _.get(componentProperties, 'domain', null);
      storyUid = _.get(componentProperties, 'storyUid', null);
      openInNewWindow = _.get(componentProperties, 'openInNewWindow', false);

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
          // We don't know the story title at this point so we can't generate the SEO-friendly
          // component of the URL. This is OK though, as the story tile will generate its own
          // SEO-friendly URLs when it renders.
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

    $newWindowCheckbox.prop('checked', openInNewWindow);
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
        'class': 'text-input',
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

    var content = $('<form>', { 'class': 'asset-selector-input-group asset-selector-goal-tile' }).append([
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
        'class': 'text-input',
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

    var questionIcon = $('<span>', { 'class': 'icon-question-inverse asset-selector-youtube-title-hint' });

    var titleLabel = $(
      '<h2>',
      { 'class': 'asset-selector-youtube-title-label' }
    ).append(
      I18n.t('editor.asset_selector.youtube.title_label'),
      questionIcon
    );

    var inputField = $('<form>').append($(
      '<input>',
      {
        'class': 'asset-selector-title-input text-input',
        'type': 'text'
      }
    ));

    inputField.on('keyup', function(event) {
      if (event.keyCode === 13) {
        $('.modal-dialog .btn-apply').click();
      }
    });

    var titleContainer = $(
      '<div>',
      { 'class': 'asset-selector-youtube-title-container' }
    ).append([
      inputField
    ]);

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    var content = $('<form>', { 'class': 'asset-selector-input-group asset-selector-youtube' }).append([
      inputLabel,
      inputControl,
      previewContainer,
      titleLabel,
      titleContainer
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
    var iframeTitle;
    var iframeElement = _container.find('.asset-selector-preview-iframe');
    var iframeSrc = iframeElement.attr('src');
    var inputControl = _container.find('[data-asset-selector-validate-field="youtubeId"]');
    var titleControl = _container.find('.asset-selector-title-input');
    var iframeContainer;
    var insertButton = _container.find('.btn-apply');

    if (componentProperties !== null &&
      _.has(componentProperties, 'id') &&
      _.has(componentProperties, 'url')) {

      youtubeId = componentProperties.id;
      youtubeUrl = componentProperties.url;
    }

    iframeTitle = _.get(componentProperties, 'title');
    titleControl.val(iframeTitle);

    if (youtubeId !== null && youtubeUrl !== null) {
      inputControl.val(youtubeUrl);

      // If there is a valid Youtube video id and it does not match the
      // current source of the preview iframe, point the preview iframe
      // at the new youtube video.
      youtubeEmbedUrl = StorytellerUtils.generateYoutubeIframeSrc(youtubeId);
      if (iframeSrc !== youtubeEmbedUrl) {
        iframeElement.attr('src', youtubeEmbedUrl);
      }

      iframeElement.attr('title', iframeTitle);

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
    var isUploading = assetSelectorStore.isUploadingFile();
    var errorReason = null;
    var iframeTitle;
    var iframeContainer = _container.find('.asset-selector-preview-container');
    var iframeElement = _container.find('.asset-selector-preview-iframe');
    var invalidMessageContainer = _container.find('.asset-selector-invalid-message');
    var invalidMessageElement = _container.find('.asset-selector-invalid-description');
    var iframeSrc = iframeElement.attr('src');
    var loadingButton = _container.find('.btn-busy');
    var insertButton = _container.find('.btn-apply');
    var insecureHtmlWarning = _container.find('.asset-selector-insecure-html-warning');
    var textareaElement = _container.find('.asset-selector-text-input');
    var titleControl = _container.find('.asset-selector-title-input');
    var isNotUploadingAndDoesNotHaveSource = !isUploading && _.isUndefined(iframeSrc);
    var isUploadingAndHasSource = isUploading && _.isString(iframeSrc);
    var showPlaceholder = isNotUploadingAndDoesNotHaveSource || isUploadingAndHasSource;

    function textareaIsUnedited() {
      return textareaElement.val() === '';
    }

    if (_.has(componentProperties, 'url')) {
      htmlFragmentUrl = componentProperties.url;
    }

    if (_.has(componentProperties, 'reason')) {
      errorReason = componentProperties.reason;
    }

    if (_.has(componentProperties, 'documentId')) {
      documentId = componentProperties.documentId;
    }

    if (_.has(componentProperties, 'title')) {
      iframeTitle = componentProperties.title;
    }

    insecureHtmlWarning.toggle(_warnAboutInsecureHTML);
    loadingButton.toggleClass('hidden', !isUploading);
    iframeContainer.toggleClass('placeholder', showPlaceholder);
    titleControl.val(iframeTitle);

    if (!_.isNull(htmlFragmentUrl)) {

      if (iframeSrc !== htmlFragmentUrl) {
        iframeElement.attr('src', htmlFragmentUrl);
        iframeElement.attr('data-document-id', documentId);

        // On first load, prepopulate the textarea with whatever
        // HTML previously entered.
        if (textareaIsUnedited()) {

          // from_xhr walks around browser caching, which was pulling an earlier
          // response from the <iframe> we load with the HTML fragment. The difference
          // in headers from the requests causes this XHR to fail. Adding a query param
          // creates a distinct request that can't be cached by association.
          htmlFragmentUrl += '&from_xhr=true';

          $.get(htmlFragmentUrl).then(function(htmlFragment) {
            if (textareaIsUnedited()) {
              // This is customer data. Don't put it in the DOM.
              // Here we show it as plain text.
              textareaElement.val(htmlFragment);
            }
          }, exceptionNotifier.error);
        }
      }

      iframeElement.attr('title', iframeTitle);

      iframeContainer.
        removeClass('placeholder').
        removeClass('invalid');

      invalidMessageContainer.hide();
      insertButton.prop('disabled', isUploading);
    } else if (!_.isNull(errorReason)) {

      iframeElement.attr('src', '');
      invalidMessageContainer.show();
      invalidMessageElement.html(I18n.t('editor.asset_selector.embed_code.errors.exception'));

      iframeContainer.addClass('invalid');

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

  function _renderAuthorVisualizationTemplate() {
    var element = document.getElementById('authoring-workflow');

    var value = assetSelectorStore.getComponentValue();
    var userChosenDataset = assetSelectorStore.getDatasetUserSelectedFromList();
    var vifDataset = assetSelectorStore.getDatasetInVif();
    var vifToEdit;

    // The dataset in `value.dataset.datasetUid` represents the dataset
    // the user chose from the dataset list.
    // If it differs from the vif's dataset, that means the user went back
    // from the AX and chose a different dataset. In that case, we should
    // generate a blank vif for them to start building a visualization.
    if (
      // There is even a VIF, AND
      vifDataset &&
      // EITHER there isn't a saved dataset choice
      // OR the dataset choice is different from the VIF.
      (!userChosenDataset || userChosenDataset.id === vifDataset.id)
    ) {
      vifToEdit = value.vif;
    } else {
      // User chose a new dataset. Make a blank starter vif.
      vifToEdit = {
        series: [{
          dataSource: {
            domain: userChosenDataset.domain,
            datasetUid: userChosenDataset.id
          }
        }],
        format: {
          type: 'visualization_interchange_format',
          version: 2
        }
      };
    }

    var authoringWorkflow = new SocrataVisualizations.AuthoringWorkflow(element, {
      vif: vifToEdit,
      backButtonText: I18n.t('editor.asset_selector.visualization.authoring_visualization_back_button'),
      onBack: () => {
        authoringWorkflow.destroy();

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
          step: WIZARD_STEP.SELECT_DATASET_FOR_VISUALIZATION
        });
      },
      onComplete: function(state) {
        var datasetUid = _.get(state.vif, 'series[0].dataSource.datasetUid');

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: {
            data: state.vif,
            format: 'vif2',
            originalUid: datasetUid
          }
        });

        authoringWorkflow.destroy();
        saveAndClose();
      },
      onCancel: function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CLOSE
        });

        authoringWorkflow.destroy();
      }
    });

    // Need to return something, otherwise the modal will be closed.
    // Sounds harmless, but the modal code controls story scrolling
    // behavior. If the modal is closed, the user will be able to
    // scroll the story underneath the authoring-workflow UI.
    return $('<div>');
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
      'class': 'btn btn-transparent btn-busy visualization-busy',
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
      'class': 'btn btn-transparent btn-busy visualization-busy',
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
        if (dataset === null) {
          return exceptionNotifier.notify(
            'componentProperties.visualization was unexpectedly null'
          );
        }
      } else {
        dataset = JSON.parse(JSON.stringify(assetSelectorStoreDataset));
        if (dataset === null) {
          return exceptionNotifier.notify(
            'assetSelectorStoreDataset was unexpectedly null'
          );
        }
      }

      // If the visualization has a table, make sure it does not display.
      _.set(dataset, 'metadata.renderTypeConfig.visible.table', false);

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
      'class': 'btn btn-transparent btn-busy hidden',
      disabled: true
    }).append($('<span>'));

    var inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
      text(I18n.t('editor.asset_selector.embed_code.input_label'));

    var inputControl = $(
      '<textarea>',
      {
        'class': 'asset-selector-text-input text-area',
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

    var questionIcon = $('<span>', { 'class': 'icon-question-inverse asset-selector-embed-code-title-hint' });

    var titleLabel = $(
      '<h2>',
      { 'class': 'asset-selector-embed-code-title-label' }
    ).append(
      I18n.t('editor.asset_selector.embed_code.title_label'),
      questionIcon
    );

    var inputField = $('<form>').append($(
      '<input>',
      {
        'class': 'asset-selector-title-input text-input',
        'type': 'text'
      }
    ));

    inputField.on('keyup', function(event) {
      if (event.keyCode === 13) {
        $('.modal-dialog .btn-apply').click();
      }
    });

    var titleContainer = $(
      '<div>',
      { 'class': 'asset-selector-embed-code-title-container' }
    ).append([
      inputField
    ]);

    var backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    backButton.on('click', function() {
      if (assetSelectorStore.isUploadingFile() && assetSelectorStore.isHTMLFragment()) {
        dispatcher.dispatch({
          action: Actions.FILE_CANCEL,
          id: assetSelectorStore.getFileId()
        });
      }
    });

    var content = $('<form>', { 'class': 'asset-selector-input-group asset-selector-embed-code' }).append([
      inputLabel,
      inputControl,
      previewLabel,
      previewContainer,
      titleLabel,
      titleContainer
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
        'class': 'btn btn-default back-btn',
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
    { 'class': 'btn btn-primary btn-apply' }
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
