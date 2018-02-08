import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactCrop from 'react-image-crop';
import AuthoringWorkflow from 'common/authoring_workflow';
import AssetSelector from 'common/components/AssetSelector';
import { FeatureFlags } from 'common/feature_flags';
import { MetadataProvider } from 'common/visualizations/dataProviders';

import '../components/Modal';
import I18n from '../I18n';
import Actions from '../Actions';
import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertInstanceOf } from 'common/js_utils';
import { exceptionNotifier } from '../../services/ExceptionNotifier';
import { dispatcher } from '../Dispatcher';
import { WIZARD_STEP, assetSelectorStore } from '../stores/AssetSelectorStore';
import { STATUS, fileUploaderStore } from '../stores/FileUploaderStore';
import { flyoutRenderer } from '../FlyoutRenderer';

export default function AssetSelectorRenderer(options) {
  const ENABLE_GETTY_IMAGES_GALLERY = FeatureFlags.value('enable_getty_images_gallery');


  var _container = options.assetSelectorContainerElement || null;
  var _lastRenderedStep = null;
  var _warnAboutInsecureHTML = false;

  assertInstanceOf(_container, $);

  _container.modal();

  _listenForChanges();
  _attachEvents();

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
      '.asset-selector-url-wrapper-input',
      function(event) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_IMAGE_URL_WRAPPER,
          url: event.target.value
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
        '.asset-selector-image-url-wrapper-hint',
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
      '.asset-selector-image-url-wrapper-hint',
      function() {
        flyoutRenderer.render({
          element: this,
          content: '<span class="tooltip-text">' +
            I18n.t('editor.asset_selector.image_preview.url_wrapper_tooltip') +
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
      'change',
      '#open-image-in-new-window',
      function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_TOGGLE_IMAGE_WINDOW_TARGET
        });
      }
    );

    _container.on(
      'change',
      '#open-goal-in-new-window',
      function() {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_TOGGLE_GOAL_WINDOW_TARGET
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
      'visualizationSelected',
      function(event, selectedVisualization) {
        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: selectedVisualization
        });
      }
    );

    const debounceForOneSecondThenUploadHtmlFragment = _.debounce(function(event) {
      const htmlFragment = $(event.target).val();
      _warnAboutInsecureHTML = /src=['"]?http:\/\//.test(htmlFragment);
      if (htmlFragment.length === 0) {
        return;
      }

      if (assetSelectorStore.isUploadingFile() && assetSelectorStore.isHTMLFragment()) {
        dispatcher.dispatch({
          action: Actions.FILE_CANCEL,
          id: assetSelectorStore.getFileId()
        });
      }

      const blobForUpload = new Blob([`<!DOCTYPE html>${htmlFragment}`], {type: 'text/html'});
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
      const provider = this.getAttribute('data-provider');
      assert(provider, 'provider must be defined');

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_PROVIDER_CHOSEN,
        blockId: assetSelectorStore.getBlockId(),
        componentIndex: assetSelectorStore.getComponentIndex(),
        provider
      });
    });

    _container.on('click', '[data-visualization-option]', function() {
      const visualizationOption = this.getAttribute('data-visualization-option');

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN,
        visualizationOption
      });
    });

    _container.on('click', '[data-resume-from-step]', function() {
      const step = this.getAttribute('data-resume-from-step');
      assert(step, 'step must be provided');

      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
        step
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
    const step = assetSelectorStore.getStep();
    const componentType = assetSelectorStore.getComponentType();
    const componentValue = assetSelectorStore.getComponentValue();
    let selectorTitle;
    let selectorContent;
    let selectorWideDisplay = false;

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
          selectorContent = _renderChooseDatasetForVisualizationTemplate();
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
    const youtubeHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.youtube.name'));
    const youtubeDescription = $('<p>').
      text(I18n.t('editor.asset_selector.youtube.description'));

    const visualizationHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.visualization.name'));
    const visualizationDescription = $('<p>').
      text(I18n.t('editor.asset_selector.visualization.description'));

    const imageUploadHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.image_upload.name'));
    const imageUploadDescription = $('<p>').
      text(
        ENABLE_GETTY_IMAGES_GALLERY ?
          I18n.t('editor.asset_selector.image_upload.description_with_getty_images') :
          I18n.t('editor.asset_selector.image_upload.description')
      );

    const storyTileHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.story_tile.name'));
    const storyTileDescription = $('<p>').
      text(I18n.t('editor.asset_selector.story_tile.description'));

    const goalTileHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.goal_tile.name'));
    const goalTileDescription = $('<p>').
      text(I18n.t('editor.asset_selector.goal_tile.description'));

    const embedCodeHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.embed_code.name'));
    const embedCodeDescription = $('<p>').
      text(I18n.t('editor.asset_selector.embed_code.description'));

    const providers = $('<ul>', {'class': 'asset-selector-button-list'}).append([
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
    const insertVisualizationHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.visualization.choose_insert_visualization_heading'));
    const insertVisualizationDescription = $('<p>').
      text(I18n.t('editor.asset_selector.visualization.choose_insert_visualization_description'));

    const insertTableHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.visualization.choose_insert_table_heading'));
    const insertTableDescription = $('<p>').
      text(I18n.t('editor.asset_selector.visualization.choose_insert_table_description'));

    const authorVisualizationHeader = $('<h3>').
      text(I18n.t('editor.asset_selector.visualization.choose_create_visualization_heading'));
    const authorVisualizationDescription = $('<p>').
      text(I18n.t('editor.asset_selector.visualization.choose_create_visualization_description'));

    const visualizationOptions =
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

    visualizationOptions.append(
      $(
        '<li>',
        {'data-visualization-option': 'AUTHOR_VISUALIZATION'}
      ).append(authorVisualizationHeader, authorVisualizationDescription)
    );

    const backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    const buttonGroup = $(
      '<div>',
      { 'class': 'modal-button-group r-to-l' }
    ).append([
      backButton
    ]);

    return [ visualizationOptions, buttonGroup ];
  }

  function _renderChooseImageTemplate() {
    const tabs = $('<ul>', {
      class: 'image-tabs tabs'
    }).toggleClass('hidden', !ENABLE_GETTY_IMAGES_GALLERY);

    const tabUpload = $('<li>', {
      class: 'tab active'
    }).append(
      $('<a>', {href: '#page-upload'}).text(I18n.t('editor.asset_selector.image_upload.tab_upload'))
    );

    const tabGetty = $('<li>', {
      class: 'tab'
    }).append(
      $('<a>', {href: '#page-getty'}).text(I18n.t('editor.asset_selector.image_upload.tab_getty'))
    );

    tabs.append(tabUpload, tabGetty);

    tabs.on('click', 'a', function(event) {
      event.preventDefault();

      const href = $(event.target).closest('[href]');
      const id = href.attr('href');

      tabs.find('.tab').removeClass('active');
      pages.find('.page').removeClass('active');

      $(id).addClass('active');
      href.parent().addClass('active');
    });

    const pages = $('<div>', {
      class: 'image-pages pages'
    });

    const pageUpload = $('<div>', {
      id: 'page-upload',
      class: 'page active',
      'data-tab-default': true
    }).append(_renderChooseImageUploadTemplate());

    const pageGetty = $('<div>', {
      id: 'page-getty',
      class: 'page'
    }).append(_renderChooseImageGalleryTemplate());

    pages.append(pageUpload, pageGetty);

    return [tabs, pages];
  }

  function _renderChooseImageGalleryTemplate() {
    const searchForm = $('<form>', {
      class: 'images-search'
    });

    const searchField = $('<input>', {
      class: 'asset-selector-text-input text-input',
      placeholder: I18n.t('editor.asset_selector.image_upload.search_instructions'),
      type: 'text'
    });

    const searchLoadingSpinner = $('<button>', {
      class: 'btn btn-busy btn-transparent images-search-loading-spinner'
    }).append($('<span>')).hide();

    const searchInputGroup = $('<span>', { class: 'input-group' }).
      append([
        searchField,
        searchLoadingSpinner,
        $('<input>', {
          class: 'btn btn-primary',
          type: 'submit',
          value: I18n.t('editor.asset_selector.image_upload.search')
        })
      ]);

    const searchError = $('<div>', {
      class: 'alert warning-bar hidden images-error'
    }).append(
      $('<p>').append($('<span>', {class: 'socrata-icon-warning'})),
      $('<p>').text(I18n.t('editor.asset_selector.image_upload.errors.image_search'))
    );

    searchForm.append(searchInputGroup);

    const galleryResults = $('<div>', {
      class: 'gallery-results'
    });

    const showMoreButton = $('<button>', {
      class: 'btn btn-default gallery-show-more'
    }).append(
      $('<span>').text(I18n.t('editor.asset_selector.image_upload.show_more'))
    );

    const thatsEverything = $('<button>', {
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

    let backButton;
    const componentType = assetSelectorStore.getComponentType();

    if (componentType === 'image') {
      // Paradoxically, we allow image components to be changed into other asset types.
      backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);
    } else {
      // Not so for other image-using components - they're locked to what they are (hero, author).
      backButton = $('<button>', {class: 'btn btn-default', 'data-action': Actions.ASSET_SELECTOR_CLOSE});
      backButton.text(I18n.t('editor.modal.buttons.cancel'));
    }

    const selectButton = $(
      '<button>',
      {
        'class': 'btn btn-primary btn-apply',
        'disabled': 'disabled'
      }
    ).text(I18n.t('editor.asset_selector.select_button_text'));

    const navGroup = $(
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
      const action = backButton.attr('data-action');
      if (action) {
        dispatcher.dispatch({ action });
      }
    });

    return [searchForm, searchError, galleryResults, navGroup];
  }

  function _getBestColumnForImagePlacement(imageElement) {
    const columns = $('.gallery-column').map(function() {
      const $this = $(this);
      const heights = $this.find('.gallery-result').map(function() {
        return $(this).data('height');
      });

      const heightWithNewImage = _.reduce(
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

    const smallestEffectiveColumn = _.reduce(columns, function(previousColumn, nextColumn) {
      const minimum = Math.min(previousColumn.height, nextColumn.height);

      return minimum === previousColumn.height ?
        previousColumn :
        nextColumn;
    }, {height: Infinity});

    const width = smallestEffectiveColumn.element.width();

    smallestEffectiveColumn.adjustedImageHeight = width * (
      imageElement.height / imageElement.width
    );

    return smallestEffectiveColumn;
  }

  function _renderChooseImageGalleryPreviewData() {
    const results = assetSelectorStore.getImageSearchResults();
    const hasImages = assetSelectorStore.hasImageSearchResults();
    const hasError = assetSelectorStore.hasImageSearchError();
    const isSearching = assetSelectorStore.isImageSearching();

    if (hasImages) {
      const renderedSources = _.keyBy(_.map(_container.find('.gallery-result img'), 'src'));
      const promises = results.map(function(image) {
        const uri = _.find(image.display_sizes, {name: 'preview'}).uri;
        const alreadyInSources = renderedSources.hasOwnProperty(uri);

        if (alreadyInSources) {
          return Promise.resolve();
        } else {
          const id = image.id;
          const promise = new Promise(function(resolve, reject) {
            const imageElement = new Image();

            imageElement.src = uri;
            imageElement.onerror = reject;
            imageElement.onclick = function() {
              dispatcher.dispatch({
                action: Actions.ASSET_SELECTOR_IMAGE_SELECTED,
                id: id
              });
            };
            imageElement.onload = function() {
              const column = _getBestColumnForImagePlacement(imageElement);

              column.element.append(
                $('<div>', {class: 'gallery-result', 'data-height': column.adjustedImageHeight}).append(
                  imageElement,
                  $('<div>', {class: 'gallery-result-cover'}),
                  $('<span>', {class: 'socrata-icon-checkmark3'})
                )
              );

              resolve();
            };
          });

          return promise;
        }
      });

      Promise.all(promises).then(function() {
        const galleryResults = _container.find('.gallery-result');
        const hasMoreImages = assetSelectorStore.canPageImageSearchNext();
        const outOfImages = !hasMoreImages;

        galleryResults.each(function(i, result) {
          const $result = $(result);
          const $image = $result.find('img');
          const isSelectedImage = $image.attr('src').indexOf(assetSelectorStore.getImageSearchSelected()) >= 0;

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

    const dragLabel = $(
      '<h2>',
      { class: 'image-drag-label' }
    ).text(I18n.t('editor.asset_selector.image_upload.drag_label'));

    const inputLabel = $(
      '<h2>',
      { 'class': 'modal-input-label modal-input-label-centered input-label' }
    ).text(I18n.t('editor.asset_selector.image_upload.input_label'));

    const dragInstructionsSpacer = $(
      '<div>',
      { class: 'image-instructions-spacer' }
    );

    const inputButton = $('<button>', {
      'class': 'image-choose-upload-now btn btn-default'
    }).text(I18n.t('editor.asset_selector.image_upload.input_button_text'));

    const inputControl = $(
      '<input>',
      {
        'class': 'asset-selector-text-input hidden',
        'data-asset-selector-validate-field': 'imageUpload',
        'type': 'file',
        'name': 'image-file'
      }
    );

    let backButton;
    const componentType = assetSelectorStore.getComponentType();

    if (componentType === 'image') {
      // Paradoxically, we allow image components to be changed into other asset types.
      backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);
    } else {
      // Not so for other image-using components - they're locked to what they are (hero, author).
      backButton = $('<button>', {class: 'btn btn-default', 'data-action': Actions.ASSET_SELECTOR_CLOSE});
      backButton.text(I18n.t('editor.modal.buttons.cancel'));
    }

    const content = $(
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
        const files = event.originalEvent.dataTransfer.files;

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

    const buttonGroup = $(
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
    const progress = $(
      '<div>',
      { 'class': 'asset-selector-image-upload-progress' }
    );

    const progressSpinner = $('<button>', {
      'class': 'btn btn-transparent btn-busy',
      'disabled': true
    }).append($('<span>'));

    const uploadProgressMessage = $(
      '<h3>',
      { 'class': 'asset-selector-input-subtext asset-selector-uploading-message' }
    ).text(I18n.t('editor.asset_selector.image_upload.uploading_message'));

    const cancel = function() {
      const id = assetSelectorStore.getFileId();

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

    const tryAgainButton = $(
      '<button>',
      { 'class': 'btn btn-default hidden asset-selector-try-again' }
    ).text(I18n.t('editor.asset_selector.try_again_button_text'));

    const uploadCancelButton = $(
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

    const backButton = $(
      '<button>',
      { class: 'btn btn-default back-btn' }
    ).text(I18n.t('editor.asset_selector.back_button_text'));

    backButton.on('click', cancel);

    const content = $(
      '<div>',
      { 'class': 'asset-selector-input-group' }
    ).append([
      progress
    ]);

    const buttonGroup = $(
      '<div>',
      { 'class': 'modal-button-group r-to-l' }
    ).append([
      backButton,
      _renderModalInsertButton({ disabled: true })
    ]);

    return [ content, buttonGroup ];
  }

  function _renderImageUploadErrorData(componentProperties) {
    const progressContainer = _container.find('.asset-selector-image-upload-progress');
    const progressSpinner = progressContainer.find('.btn-busy');
    const progressMessage = progressContainer.find('.asset-selector-uploading-message');
    const cancelButton = progressContainer.find('.asset-selector-cancel-upload');
    const tryAgainButton = progressContainer.find('.asset-selector-try-again');

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
    const type = assetSelectorStore.getComponentType();
    const value = assetSelectorStore.getComponentValue();
    const documentId = type === 'author' ? value.image.documentId : value.documentId;

    if (documentId) {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_IMAGE_CROP_COMMIT
      });
    } else {
      uploadUrl();
    }
  }

  function uploadUrl() {
    const type = assetSelectorStore.getComponentType();
    const value = assetSelectorStore.getComponentValue();
    const url = type === 'author' ? value.image.url : value.url;

    dispatcher.dispatch({
      action: Actions.URL_UPLOAD,
      url: url,
      id: _.uniqueId()
    });
  }

  function _renderImagePreviewTemplate() {
    const errorMessaging = $(
      '<div>',
      { 'class': 'alert error asset-selector-error hidden' }
    );

    const previewImageLabel = $(
      '<h2>',
      { 'class': 'asset-selector-preview-label' }
    ).text(I18n.t('editor.asset_selector.image_preview.preview_label'));

    const previewSpinner = $(
      '<button>',
      { 'class': 'btn btn-busy btn-transparent asset-selector-preview-spinner hidden' }
    ).append($('<span>'));

    const cropButton = $('<button>', {
      'class': 'btn btn-xs btn-default btn-toggle image-crop-btn',
      'data-action': 'ASSET_SELECTOR_IMAGE_CROP_START'
    }).append([
      $('<span>', {'class': 'socrata-icon-crop image-crop-btn-icon'}),
      I18n.t('editor.asset_selector.image_preview.crop')
    ]);

    const resetImageButton = $('<button>', {
      'class': 'btn btn-xs btn-default image-crop-reset-btn',
      'data-action': 'ASSET_SELECTOR_IMAGE_CROP_RESET'
    }).append([
      $('<span>', {'class': 'socrata-icon-close-2 image-crop-reset-btn-icon'}),
      I18n.t('editor.asset_selector.image_preview.reset_image')
    ]);

    const imageActionsContainer = $('<div>', {
      'class': 'image-actions-container'
    }).append([
      cropButton,
      resetImageButton,
      previewSpinner
    ]);

    const previewContainer = $(
      '<div>',
      { 'class': 'asset-selector-preview-container asset-selector-image-preview-container' }
    );

    const gettyImageInfo = $(
      '<div>',
      { class: 'alert info getty-image-info hidden' }
    ).append(
      $('<div>', { class: 'alert-icon' }).append(
        $('<span>', {class: 'socrata-icon-info-inverse'})
      ),
      $('<div>', { class: 'alert-content' }).append(
        $('<p>').append(
          StorytellerUtils.format(I18n.t('editor.asset_selector.image_upload.getty_image_terms'), _insertButtonText())
        )
      )
    );

    const questionIcon = $('<span>', { 'class': 'socrata-icon-question-inverse asset-selector-image-alt-hint' });

    const descriptionLabel = $(
      '<h2>',
      { 'class': 'asset-selector-image-description-label' }
    ).append(
      I18n.t('editor.asset_selector.image_preview.description_label'),
      questionIcon
    );

    const altInputField = $('<form>').append($(
      '<input>',
      {
        'class': 'asset-selector-alt-text-input text-input',
        'type': 'text'
      }
    ));

    altInputField.on('keyup', function(event) {
      if (event.keyCode === 13) {
        $('.modal-dialog .image-crop-upload-btn').click();
      }
    });

    const descriptionContainer = $(
      '<div>',
      { 'class': 'asset-selector-image-description-container' }
    ).append([
      altInputField
    ]);

    const urlWrapperQuestionMark = $('<span>', {
      class: 'socrata-icon-question-inverse asset-selector-image-url-wrapper-hint'
    });

    const urlWrapperLabel = $(
      '<h2>',
      { 'class': 'asset-selector-image-url-wrapper-label' }
    ).append(
      I18n.t('editor.asset_selector.image_preview.url_wrapper_label'),
      urlWrapperQuestionMark
    );

    const urlWrapperField = $('<form>').append(
      $('<input>', { class: 'asset-selector-url-wrapper-input text-input', type: 'text' })
    );

    const warningIcon = $('<span>', {
      class: 'socrata-icon-warning'
    });

    const urlValidityMessage = $('<p>', {
      class: 'asset-selector-url-wrapper-validity'
    }).append(
      warningIcon,
      I18n.t('editor.invalid_link_message')
    );

    const urlWrapperContainer = $('<div>', {
      class: 'asset-selector-image-url-wrapper-container'
    }).append([urlWrapperField, urlValidityMessage]);

    const backButton = $('<button>', {
      'class': 'btn btn-default image-crop-back-btn'
    }).text(I18n.t('editor.asset_selector.back_button_text'));

    const insertButton = $('<button>', {
      'class': 'btn btn-primary image-crop-upload-btn btn-legacy'
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

    const checkboxOptions = {
      id: 'open-image-in-new-window',
      i18nLabel: 'editor.asset_selector.image_preview.open_in_new_window'
    };

    const buttonGroup = $(
      '<div>',
      { 'class': 'modal-button-group r-to-l' }
    ).append([
      $('<small>', { 'class': 'image-loading-status hidden' }).append(
        I18n.t('editor.asset_selector.image_preview.loading.uploading_image')
      ),
      backButton,
      insertButton
    ]);

    const isImage = assetSelectorStore.getComponentType() === 'image';

    const newWindowControl = isImage ? _renderModalCheckbox(checkboxOptions) : null;

    const content = $(
      '<div>',
      { 'class': 'asset-selector-input-group' }
    ).append([
      errorMessaging,
      previewImageLabel,
      imageActionsContainer,
      previewContainer,
      gettyImageInfo,
      isImage ? descriptionLabel : null,
      isImage ? descriptionContainer : null,
      isImage ? urlWrapperLabel : null,
      isImage ? urlWrapperContainer : null
    ]);

    return [ content, newWindowControl, buttonGroup ];
  }

  function extractImageAlt(componentProperties) {
    return _.get(
      componentProperties,
      'alt',
      _.get(componentProperties, 'image.alt', null) // Try again, this time under image.alt. Overall default is null.
    );
  }

  function extractImageUrlWrapper(componentProperties) {
    return _.get(
      componentProperties,
      'link',
      _.get(componentProperties, 'image.link', null)
    );
  }

  function extractImageUrlValidity(componentProperties) {
    return _.get(
      componentProperties,
      'urlValidity',
      _.get(componentProperties, 'image.urlValidity', false)
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
    const file = fileUploaderStore.fileById(assetSelectorStore.getFileId());
    const crop = assetSelectorStore.getComponentType() === 'author' ?
      componentProperties.image.crop :
      componentProperties.crop;

    const $newWindowCheckbox = _container.find('#open-image-in-new-window');

    const imageUrl = grabOriginalImage(assetSelectorStore.getPreviewImageUrl());
    const existingImageUrl = _container.find('img').attr('src');
    const altAttribute = extractImageAlt(componentProperties);
    const url = extractImageUrlWrapper(componentProperties);
    const urlValidity = extractImageUrlValidity(componentProperties);

    const openInNewWindow = _.get(componentProperties, 'openInNewWindow', false);

    const isUploadingFile = assetSelectorStore.isUploadingFile();
    const isCropping = assetSelectorStore.isCropping();
    const isCroppingUiEnabled = assetSelectorStore.isCroppingUiEnabled();
    const isImage = assetSelectorStore.getComponentType() === 'image';
    const isGettyImage = Constants.VALID_STORYTELLER_GETTY_IMAGE_URL_API_PATTERN.test(imageUrl);

    const hasCompletedUpload = isUploadingFile && file.status === STATUS.COMPLETED;
    const doesNotHaveError = !_.has(componentProperties, 'reason');
    let loadingMessage = '';

    if (file && file.status === STATUS.UPLOADING && file.progress < 1) {
      loadingMessage = 'editor.asset_selector.image_preview.loading.uploading_image';
    } else if (file && file.status === STATUS.ACKNOWLEDGED && isGettyImage) {
      loadingMessage = 'editor.asset_selector.image_preview.loading.retrieving_image';
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
      find('.asset-selector-url-wrapper-input').
      attr('value', _.isEmpty(url) ? null : url);

    _container.
      find('.asset-selector-url-wrapper-validity').
      toggleClass('hidden', urlValidity);

    _container.
      find('.getty-image-info').
      toggleClass('hidden', !isGettyImage);

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
      prop('disabled', isUploadingFile || isCropping || (isImage && !urlValidity)).
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

    $newWindowCheckbox.prop('checked', openInNewWindow);

    if (hasCompletedUpload || assetSelectorStore.isCropComplete()) {
      saveAndClose();
    } else if (imageUrl) {
      renderImagePreviewFromUrl(imageUrl, crop);
    }
  }

  function _renderChooseStoryTemplate() {
    const inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
      text(I18n.t('editor.asset_selector.story_tile.input_label'));

    const inputControl = $(
      '<input>',
      {
        'class': 'text-input',
        'data-asset-selector-validate-field': 'storyUrl',
        'placeholder': 'https://www.example.com/stories/s/story-title/abcd-efgh',
        'type': 'text'
      }
    );

    const previewInvalidMessageTitle = $(
      '<div>',
      { 'class': 'asset-selector-invalid-title' }
    ).html([
      I18n.t('editor.asset_selector.story_tile.invalid_message_title_1'),
      '<br />',
      I18n.t('editor.asset_selector.story_tile.invalid_message_title_2')
    ].join(''));

    const previewInvalidMessageDescription = $(
      '<div>',
      { 'class': 'asset-selector-invalid-description' }
    ).text(
      I18n.t('editor.asset_selector.story_tile.invalid_message_description')
    );

    const previewInvalidMessage = $(
      '<div>',
      {
        'class': 'asset-selector-invalid-message'
      }
    ).append([
      previewInvalidMessageTitle,
      previewInvalidMessageDescription
    ]);

    const previewTileContainer = $(
      '<div>',
      {
        'class': 'asset-selector-story-tile-embed-component'
      }
    );

    const previewContainer = $(
      '<div>',
      {
        'class': 'asset-selector-story-tile-preview-container'
      }
    ).append([
      previewInvalidMessage,
      previewTileContainer
    ]);

    const backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    const content = $('<form>', { 'class': 'asset-selector-input-group asset-selector-story-tile' }).append([
      inputLabel,
      inputControl,
      previewContainer
    ]);

    const checkboxOptions = {
      id: 'open-story-in-new-window',
      i18nLabel: 'editor.asset_selector.story_tile.open_in_new_window'
    };

    const newWindowControl = _renderModalCheckbox(checkboxOptions);

    const buttonGroup = $(
      '<div>',
      {
        'class': 'modal-button-group r-to-l'
      }).append([ backButton, _renderModalInsertButton() ]);

    return [ content, newWindowControl, buttonGroup ];
  }

  function _renderChooseStoryData(componentProperties) {
    const $previewContainer = _container.find('.asset-selector-story-tile-preview-container');
    const $storyTilePreviewContainer = _container.find('.asset-selector-story-tile-embed-component');
    const $inputControl = _container.find('[data-asset-selector-validate-field="storyUrl"]');
    const $newWindowCheckbox = _container.find('#open-story-in-new-window');
    const $insertButton = _container.find('.btn-apply');
    const renderedStoryDomain = $storyTilePreviewContainer.attr('data-rendered-story-domain');
    const renderedStoryUid = $storyTilePreviewContainer.attr('data-rendered-story-uid');
    let storyDomain = null;
    let storyUid = null;
    let openInNewWindow = false;
    let componentData;

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
          append($('<div>').componentStoryTile({
            blockId: assetSelectorStore.getBlockId(),
            componentIndex: assetSelectorStore.getComponentIndex(),
            componentData,
            theme: null
          })).
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
    const inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
      append([
        $('<span>').text(I18n.t('editor.asset_selector.goal_tile.input_label')),
        $('<span>', {'class': 'socrata-icon-question-inverse asset-selector-goal-url-hint'})
      ]);

    const inputControl = $(
      '<input>',
      {
        'class': 'text-input',
        'data-asset-selector-validate-field': 'goalUrl',
        'placeholder': 'https://www.example.com/stat/goals/abcd-1234/abcd-1234/abcd-1234',
        'type': 'text'
      }
    );

    const previewInvalidMessageTitle = $(
      '<div>',
      { 'class': 'asset-selector-invalid-title' }
    ).html([
      I18n.t('editor.asset_selector.goal_tile.invalid_message_title_1'),
      '<br />',
      I18n.t('editor.asset_selector.goal_tile.invalid_message_title_2')
    ].join(''));

    const previewInvalidMessageDescription = $(
      '<div>',
      { 'class': 'asset-selector-invalid-description' }
    ).text(
      I18n.t('editor.asset_selector.goal_tile.invalid_message_description')
    );

    const previewInvalidMessage = $(
      '<div>',
      {
        'class': 'asset-selector-invalid-message'
      }
    ).append([
      previewInvalidMessageTitle,
      previewInvalidMessageDescription
    ]);

    const previewTileContainer = $(
      '<div>',
      {
        'class': 'asset-selector-goal-tile-embed-component'
      }
    );

    const previewContainer = $(
      '<div>',
      {
        'class': 'asset-selector-goal-tile-preview-container'
      }
    ).append([
      previewInvalidMessage,
      previewTileContainer
    ]);

    const backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    const content = $('<form>', { 'class': 'asset-selector-input-group asset-selector-goal-tile' }).append([
      inputLabel,
      inputControl,
      previewContainer
    ]);

    const checkboxOptions = {
      id: 'open-goal-in-new-window',
      i18nLabel: 'editor.asset_selector.goal_tile.open_in_new_window'
    };

    const newWindowControl = _renderModalCheckbox(checkboxOptions);

    const buttonGroup = $(
      '<div>',
      {
        'class': 'modal-button-group r-to-l'
      }).append([ backButton, _renderModalInsertButton() ]);

    return [ content, newWindowControl, buttonGroup ];
  }

  function _renderChooseGoalData(componentProperties) {
    const $previewContainer = _container.find('.asset-selector-goal-tile-preview-container');
    const $goalTilePreviewContainer = _container.find('.asset-selector-goal-tile-embed-component');
    const $inputControl = _container.find('[data-asset-selector-validate-field="goalUrl"]');
    const $insertButton = _container.find('.btn-apply');
    const $newWindowCheckbox = _container.find('#open-goal-in-new-window');
    const renderedGoalDomain = $goalTilePreviewContainer.attr('data-rendered-goal-domain');
    const renderedGoalUid = $goalTilePreviewContainer.attr('data-rendered-goal-uid');
    let goalDomain = null;
    let goalUid = null;
    let goalFullUrl = null;
    let componentData;
    let openInNewWindow;

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
      openInNewWindow = _.get(componentProperties, 'openInNewWindow', false);

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
          append($('<div>').componentGoalTile({
            componentData,
            theme: null,
            blockId: assetSelectorStore.getBlockId(),
            componentIndex: assetSelectorStore.getComponentIndex()
          })).
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

    $newWindowCheckbox.prop('checked', openInNewWindow);
  }

  function _renderChooseYoutubeTemplate() {
    const inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
      text(I18n.t('editor.asset_selector.youtube.input_label'));

    const inputControl = $(
      '<input>',
      {
        'class': 'text-input',
        'data-asset-selector-validate-field': 'youtubeId',
        'placeholder': 'https://www.youtube.com/',
        'type': 'text'
      }
    );

    const previewInvalidMessageTitle = $(
      '<div>',
      { 'class': 'asset-selector-invalid-title' }
    ).html([
      I18n.t('editor.asset_selector.youtube.invalid_message_title_1'),
      '<br />',
      I18n.t('editor.asset_selector.youtube.invalid_message_title_2')
    ].join(''));

    const previewInvalidMessageDescription = $(
      '<div>',
      { 'class': 'asset-selector-invalid-description' }
    ).text(
      I18n.t('editor.asset_selector.youtube.invalid_message_description')
    );

    const previewInvalidMessage = $(
      '<div>',
      {
        'class': 'asset-selector-invalid-message'
      }
    ).append([
      previewInvalidMessageTitle,
      previewInvalidMessageDescription
    ]);

    const previewIframe = $(
      '<iframe>',
      {
        'class': 'asset-selector-preview-iframe'
      }
    );

    const previewContainer = $(
      '<div>',
      {
        'class': 'asset-selector-preview-container'
      }
    ).append([
      previewInvalidMessage,
      previewIframe
    ]);

    const questionIcon = $('<span>', { 'class': 'socrata-icon-question-inverse asset-selector-youtube-title-hint' });

    const titleLabel = $(
      '<h2>',
      { 'class': 'asset-selector-youtube-title-label' }
    ).append(
      I18n.t('editor.asset_selector.youtube.title_label'),
      questionIcon
    );

    const inputField = $('<form>').append($(
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

    const titleContainer = $(
      '<div>',
      { 'class': 'asset-selector-youtube-title-container' }
    ).append([
      inputField
    ]);

    const backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    const content = $('<form>', { 'class': 'asset-selector-input-group asset-selector-youtube' }).append([
      inputLabel,
      inputControl,
      previewContainer,
      titleLabel,
      titleContainer
    ]);

    const buttonGroup = $(
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
    const iframeElement = _container.find('.asset-selector-preview-iframe');
    const iframeSrc = iframeElement.attr('src');
    const inputControl = _container.find('[data-asset-selector-validate-field="youtubeId"]');
    const titleControl = _container.find('.asset-selector-title-input');
    const insertButton = _container.find('.btn-apply');
    let youtubeId = null;
    let youtubeUrl = null;
    let youtubeEmbedUrl;
    let iframeTitle;
    let iframeContainer;

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
    const isUploading = assetSelectorStore.isUploadingFile();
    const iframeContainer = _container.find('.asset-selector-preview-container');
    const iframeElement = _container.find('.asset-selector-preview-iframe');
    const invalidMessageContainer = _container.find('.asset-selector-invalid-message');
    const invalidMessageElement = _container.find('.asset-selector-invalid-description');
    const iframeSrc = iframeElement.attr('src');
    const loadingButton = _container.find('.btn-busy');
    const insertButton = _container.find('.btn-apply');
    const insecureHtmlWarning = _container.find('.asset-selector-insecure-html-warning');
    const textareaElement = _container.find('.asset-selector-text-input');
    const titleControl = _container.find('.asset-selector-title-input');
    const isNotUploadingAndDoesNotHaveSource = !isUploading && _.isUndefined(iframeSrc);
    const isUploadingAndHasSource = isUploading && _.isString(iframeSrc);
    const showPlaceholder = isNotUploadingAndDoesNotHaveSource || isUploadingAndHasSource;
    let htmlFragmentUrl = null;
    let documentId = null;
    let errorReason = null;
    let iframeTitle;

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

  function _closeAssetSelectorModal() {
    const element = document.getElementById('common-asset-selector');
    _.defer(() => { ReactDOM.unmountComponentAtNode(element); });
  }

  function _renderAssetSelectorTemplate(props) {
    const element = document.getElementById('common-asset-selector');

    function handleClose() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_CLOSE
      });

      _closeAssetSelectorModal();
    }

    function handleBackButtonClick() {
      dispatcher.dispatch({
        action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
        step: WIZARD_STEP.SELECT_VISUALIZATION_OPTION
      });

      _closeAssetSelectorModal();
    }

    const modalFooterChildren = (
      <div className="common-asset-selector-modal-footer-button-group">
        <div className="authoring-footer-buttons">
          <button className="authoring-back-button" onClick={handleBackButtonClick}>
            <span className="icon-arrow-left" />
            {I18n.t('editor.asset_selector.back_button_text')}
          </button>
        </div>
        <div className="authoring-actions">
          <button className="btn btn-sm btn-default cancel" onClick={handleClose}>{I18n.t('shared.visualizations.modal.close')}</button>
          <button className="btn btn-sm btn-primary done" disabled>{I18n.t('shared.visualizations.modal.insert')}</button>
        </div>
      </div>
    );

    const defaultAssetSelectorProps = {
      closeOnSelect: false,
      modalFooterChildren,
      onClose: handleClose,
      resultsPerPage: 6,
      showBackButton: false
    };

    const assetSelectorProps = _.extend({}, defaultAssetSelectorProps, props);
    return ReactDOM.render(<AssetSelector {...assetSelectorProps} />, element);
  }

  function _handleDatasetAssetSelected(assetData) {
    // We don't want to get the initial view with the `read_from_nbe` flags. We get the migration and nbe view later.
    const datasetConfig = {
      domain: assetData.domain,
      datasetUid: assetData.id,
      readFromNbe: false
    };

    // Check for the NBE version of the dataset we're choosing
    const metadataProvider = new MetadataProvider(datasetConfig);
    metadataProvider.getDatasetMetadata().
      then((datasetView) => {
        if (_.get(datasetView, 'newBackend', false)) {
          return datasetView;
        } else {
          return metadataProvider.getDatasetMigrationMetadata().
            then((migrationMetadata) => {
              // get the nbe dataset view
              return new MetadataProvider({
                domain: datasetConfig.domain,
                datasetUid: migrationMetadata.nbeId
              }).getDatasetMetadata();
            }).
            catch((error) => {
              // if we don't have migration data for filtered or grouped views AND we're using this asset
              // to render a table, we can still try to render the obe dataset
              if (
                assetSelectorStore.getComponentType() === 'socrata.visualization.table' &&
                assetData.displayType === 'filter'
              ) {
                return datasetView;
              } else {
                console.error(`Error getting migrated view for ${JSON.stringify(assetData)}`, error);
                return Promise.reject(error);
              }
            });
        }
      }).
      then((nbeViewData) => {
        // EN-7322 - No response on choosing some datasets
        //
        // Do not assume that we have view data. If the request for
        // /api/migrations/four-four.json returned 404 it means that there
        // is no corresponding NBE version of this dataset.
        //
        // We do some additional handling of missing migration data for filtered
        // and grouped views above so we can safely ignore the missing `newBackend`
        // value below
        if (_.isPlainObject(nbeViewData)) {
          if (assetData.displayType !== 'filter') {
            // We should be able to handle all NBE datasets.
            assert(
              _.get(nbeViewData, 'newBackend'),
              'All versions of this dataset deemed unfit for visualization!'
            );
          }

          // Retcon the domain into the view data.
          // We'd have to pass it around like 5 methods otherwise. (still true?)
          nbeViewData.domain = datasetConfig.domain;

          // This dataset view is fit for visualization!
          dispatcher.dispatch({
            action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET,
            viewData: nbeViewData
          });

          _closeAssetSelectorModal();
        } else {
          // No migration. Give up.
          return Promise.reject(null);
        }
      }).
      catch((error) => {
        // EN-7322 - No response on choosing some datasets
        //
        // If the user attempts to add a chart using an OBE dataset that has
        // no corresponding migrated NBE dataset, this promise chain is
        // expected to fail. As such, we probably don't want to notify
        // Airbrake.
        //
        // TODO: Consider consolidating the user messaging for different
        // expected error cases here and not in their upstream functions.
        if (!_.isNull(error)) {
          alert(I18n.t('editor.asset_selector.visualization.choose_dataset_unsupported_error')); // eslint-disable-line no-alert

          if (window.console && console.error) {
            console.error('Error selecting dataset: ', error);
          }

          // TODO do we want to skip airbraking for this, mixpanel/pendo instead?
          exceptionNotifier.notify(error);
        }
      });
  }

  function _renderChooseDatasetForVisualizationTemplate() {
    // We currently only support plain-old datasets for visualizations.
    const assetSelectorProps = {
      baseFilters: {
        assetTypes: 'datasets',
        published: true
      },
      onAssetSelected: _handleDatasetAssetSelected,
      title: I18n.t('editor.asset_selector.visualization.choose_dataset_heading')
    };

    return _renderAssetSelectorTemplate(assetSelectorProps);
  }

  function _renderChooseTableTemplate() {
    const assetTypes =  ['datasets'];
    if (FeatureFlags.value('enable_filtered_tables_in_ax')) {
      assetTypes.push('filters');
    }

    const assetSelectorProps = {
      baseFilters: {
        assetTypes: assetTypes.join(','),
        published: true
      },
      onAssetSelected: _handleDatasetAssetSelected,
      title: I18n.t('editor.asset_selector.visualization.choose_dataset_heading')
    };

    return _renderAssetSelectorTemplate(assetSelectorProps);
  }

  function _handleVisualizationAssetSelected(assetData) {
    // We don't want to get the initial view with the `read_from_nbe` flags. That will cause
    // problems when we try to generate a preview of a classic visualization.
    const visualizationConfig = {
      domain: assetData.domain,
      datasetUid: assetData.id,
      readFromNbe: false
    };

    const metadataProvider = new MetadataProvider(visualizationConfig);
    metadataProvider.getDatasetMetadata().
      then((viewData) => {
        // Retcon the domain into the view data.
        // We'd have to pass it around like 5 methods otherwise. (still true?)
        viewData.domain = assetData.domain;

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART,
          domain: assetData.domain,
          mapOrChartUid: assetData.id,
          viewData
        });

        _closeAssetSelectorModal();
      }).
      catch((error) => {
        console.error('Encountered a problem when getting view for visualization:', error);
      });
  }

  function _renderChooseMapOrChartTemplate() {
    const assetSelectorProps = {
      baseFilters: {
        assetTypes: 'charts,maps',
        published: true
      },
      onAssetSelected: _handleVisualizationAssetSelected,
      title: I18n.t('editor.asset_selector.visualization.choose_map_or_chart_heading')
    };

    return _renderAssetSelectorTemplate(assetSelectorProps);
  }

  function _renderAuthorVisualizationTemplate() {
    const element = document.getElementById('authoring-workflow');

    const value = assetSelectorStore.getComponentValue();
    const userChosenDataset = assetSelectorStore.getDatasetUserSelectedFromList();
    const vifDataset = assetSelectorStore.getDatasetInVif();
    let vifToEdit;

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

    const authoringWorkflow = new AuthoringWorkflow(element, {
      vif: vifToEdit,
      filters: _.get(vifToEdit, 'series[0].dataSource.filters', []),
      enableFiltering: true,
      backButtonText: I18n.t('editor.asset_selector.visualization.authoring_visualization_back_button'),
      onBack: () => {
        authoringWorkflow.destroy();

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_JUMP_TO_STEP,
          step: WIZARD_STEP.SELECT_DATASET_FOR_VISUALIZATION
        });
      },
      onComplete: function(state) {
        const datasetUid = _.get(state.vif, 'series[0].dataSource.datasetUid');

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

  function _renderTablePreviewTemplate() {
    const backButton = _renderModalBackButton(WIZARD_STEP.SELECT_TABLE_FROM_CATALOG);

    const buttonGroup = $('<div>', {
      'class': 'modal-button-group r-to-l'
    }).append([ backButton, _renderModalInsertButton() ]);

    const label = $(
      '<h2>',
      { 'class': 'asset-selector-preview-label' }
    ).text(I18n.t('editor.asset_selector.visualization.preview_label'));

    const table = $(
      '<div>',
      { 'class': 'asset-selector-preview-table' }
    );

    const container = $(
      '<div>',
      { 'class': 'asset-selector-preview-container' }
    ).append([
      table
    ]);

    const content = $(
      '<div>',
      { 'class': 'asset-selector-input-group' }
    ).append([
      label,
      container
    ]);

    return [ content, buttonGroup ];
  }

  function _renderTablePreviewData(componentType, componentProperties) {
    const table = _container.find('.asset-selector-preview-table');

    const props = {
      blockId: assetSelectorStore.getBlockId(),
      componentIndex: assetSelectorStore.getComponentIndex(),
      theme: null,
      componentData: {
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
    };

    table.componentSocrataVisualizationTable(props);
  }

  function _chartOrMapIFrameContainer() {
    return $(
      '<iframe>',
      {
        'class': 'asset-selector-configure-mapchart-iframe asset-selector-full-width-iframe',
        'src': ''
      }
    );
  }

  function _chartOrMapVizCanvasContainer() {
    return $('<div class="asset-selector-configure-chartmap-vizcanvas asset-selector-full-width"></div>');
  }

  function _renderConfigureMapOrChartTemplate() {
    const isVizCanvasVisualization = !_.isUndefined(_.get(assetSelectorStore.getComponentValue(), 'dataset.vifId'));
    let chartOrMapContainer;

    if (isVizCanvasVisualization) {
      chartOrMapContainer = _chartOrMapVizCanvasContainer();
    } else {
      chartOrMapContainer = _chartOrMapIFrameContainer();
    }

    const backButton = _renderModalBackButton(WIZARD_STEP.SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG);

    let loadingButton;
    if (!isVizCanvasVisualization) {
      loadingButton = $('<button>', {
        'class': 'btn btn-transparent btn-busy visualization-busy',
        'disabled': true
      }).append($('<span>'));
    }

    const buttonGroup = $('<div>', {
      'class': 'modal-button-group r-to-l'
    }).append([ backButton, _renderModalInsertButton({ disabled: true }) ]);

    return [ loadingButton, chartOrMapContainer, buttonGroup ];
  }

  function _renderConfigureMapOrChartIframeData(componentType, componentProperties) {
    const insertButton = _container.find('.btn-apply');
    const mapChartIframe = _container.find('.asset-selector-configure-mapchart-iframe');
    const assetSelectorStoreDataset = assetSelectorStore.getDataset();
    const savedDatasetMatchesSelectedDataset = (
      assetSelectorStoreDataset &&
      componentProperties.visualization &&
      componentProperties.visualization.id === assetSelectorStoreDataset.id
    );
    const isEditingWithoutSavedDataset = !assetSelectorStoreDataset && assetSelectorStore.isEditingExisting();
    let dataset;

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

      const componentContainer = $(
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

      componentContainer.componentSocrataVisualizationClassic({
        blockId: assetSelectorStore.getBlockId(),
        componentIndex: assetSelectorStore.getComponentIndex(),
        componentData: {
          type: 'socrata.visualization.classic',
          value: {
            visualization: dataset
          }
        },
        theme: null,
        resizeSupported: false
      });

      insertButton.prop('disabled', true);
    }
  }

  function _renderConfigureMapOrChartVizCanvasData(componentType, componentProperties) {
    const insertButton = _container.find('.btn-apply');
    // const vizContainer = _container.find('.asset-selector-configure-chartmap-vizcanvas');
    // const assetSelectorStoreDataset = assetSelectorStore.getDataset();
    // const savedDatasetMatchesSelectedDataset = (
    //   assetSelectorStoreDataset &&
    //   componentProperties.visualization &&
    //   componentProperties.visualization.id === assetSelectorStoreDataset.id
    // );
    // const isEditingWithoutSavedDataset = !assetSelectorStoreDataset && assetSelectorStore.isEditingExisting();
    const visualization = {
      domain: componentProperties.dataset.domain,
      datasetUid: componentProperties.dataset.datasetUid,
      vifId: componentProperties.dataset.vifId
    };
    // let dataset;

    if (componentProperties.dataset && _container.find('.component-socrata-visualization-viz-canvas').length === 0) {

      // TODO I'm not sure this is really necessary
      // if (savedDatasetMatchesSelectedDataset || isEditingWithoutSavedDataset) {
      //   dataset = componentProperties.visualization;
      //   if (dataset === null) {
      //     return exceptionNotifier.notify(
      //       'componentProperties.visualization was unexpectedly null'
      //     );
      //   }
      // } else {
      //   dataset = JSON.parse(JSON.stringify(assetSelectorStoreDataset));
      //   if (dataset === null) {
      //     return exceptionNotifier.notify(
      //       'assetSelectorStoreDataset was unexpectedly null'
      //     );
      //   }
      // }

      const componentContainer = $(
        '<div>',
        {
          'class': 'asset-selector-component-container'
        }
      );

      _container.
        find('.modal-content').
        prepend(componentContainer);

      componentContainer.componentSocrataVisualizationVizCanvas({
        blockId: assetSelectorStore.getBlockId(),
        componentIndex: assetSelectorStore.getComponentIndex(),
        componentData: {
          type: 'socrata.visualization.vizCanvas',
          value: {
            dataset: visualization
          }
        },
        theme: null,
        resizeSupported: false
      });

      // can't dispatch in the middle of a dispatch
      _.defer(() => {
        insertButton.prop('disabled', false);

        dispatcher.dispatch({
          action: Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION,
          visualization: {
            data: visualization,
            format: 'vizCanvas'
          }
        });
      });

      insertButton.prop('disabled', true);
    }
  }

  function _renderConfigureMapOrChartData(componentType, componentProperties) {
    const isVizCanvasVisualization = !_.isUndefined(_.get(componentProperties, 'dataset.vifId'));
    if (isVizCanvasVisualization) {
      _renderConfigureMapOrChartVizCanvasData(componentType, componentProperties);
    } else {
      _renderConfigureMapOrChartIframeData(componentType, componentProperties);
    }
  }

  /**
   * Small helper functions
   */

  function _renderChooseEmbedCodeTemplate() {
    const loadingButton = $('<button>', {
      'class': 'btn btn-transparent btn-busy hidden',
      disabled: true
    }).append($('<span>'));

    const inputLabel = $('<h2>', { 'class': 'modal-input-label input-label' }).
      text(I18n.t('editor.asset_selector.embed_code.input_label'));

    const inputControl = $(
      '<textarea>',
      {
        'class': 'asset-selector-text-input text-area',
        'data-asset-selector-field': 'embedHtml',
        'type': 'text'
      }
    );

    const previewLabel = $('<h3>', { 'class': 'modal-input-label input-label' }).
      text(I18n.t('editor.asset_selector.embed_code.preview_label'));

    const previewInsecureMessage = $(
      '<div>',
      { 'class': 'asset-selector-insecure-html-warning warning-bar' }
    ).append(
      $('<p>').append($('<span>', {'class': 'socrata-icon-warning'})),
      $('<p>').text(I18n.t('editor.asset_selector.embed_code.insecure_html_warning'))
    );

    const previewInvalidMessageTitle = $(
      '<div>',
      { 'class': 'asset-selector-invalid-title' }
    ).html([
      I18n.t('editor.asset_selector.embed_code.invalid_message_title_1'),
      '<br />',
      I18n.t('editor.asset_selector.embed_code.invalid_message_title_2')
    ].join(''));

    const previewInvalidMessageDescription = $(
      '<div>',
      { 'class': 'asset-selector-invalid-description' }
    );

    const previewInvalidMessage = $(
      '<div>',
      {
        'class': 'asset-selector-invalid-message'
      }
    ).append([
      previewInvalidMessageTitle,
      previewInvalidMessageDescription
    ]);

    const previewIframe = $(
      '<iframe>',
      {
        'class': 'asset-selector-preview-iframe',
        'sandbox': Environment.EMBED_CODE_SANDBOX_IFRAME_ALLOWANCES
      }
    );

    const previewContainer = $(
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

    const questionIcon = $('<span>', { 'class': 'socrata-icon-question-inverse asset-selector-embed-code-title-hint' });

    const titleLabel = $(
      '<h2>',
      { 'class': 'asset-selector-embed-code-title-label' }
    ).append(
      I18n.t('editor.asset_selector.embed_code.title_label'),
      questionIcon
    );

    const inputField = $('<form>').append($(
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

    const titleContainer = $(
      '<div>',
      { 'class': 'asset-selector-embed-code-title-container' }
    ).append([
      inputField
    ]);

    const backButton = _renderModalBackButton(WIZARD_STEP.SELECT_ASSET_PROVIDER);

    backButton.on('click', function() {
      if (assetSelectorStore.isUploadingFile() && assetSelectorStore.isHTMLFragment()) {
        dispatcher.dispatch({
          action: Actions.FILE_CANCEL,
          id: assetSelectorStore.getFileId()
        });
      }
    });

    const content = $('<form>', { 'class': 'asset-selector-input-group asset-selector-embed-code' }).append([
      inputLabel,
      inputControl,
      previewLabel,
      previewContainer,
      titleLabel,
      titleContainer
    ]);

    const buttonGroup = $(
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

  function _renderModalCheckbox(checkboxOptions) {
    return $(
      '<div>', { 'class': 'modal-input-group' }
    ).append([
      $('<input>', { type: 'checkbox', id: checkboxOptions.id, 'class': 'modal-input' }),
      $('<label>', { 'for': checkboxOptions.id, 'class': 'modal-input-label' }).append([
        $('<span>', { 'class': 'socrata-icon-checkmark3' }),
        I18n.t(checkboxOptions.i18nLabel)
      ])
    ]);
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
  const isEditingExisting = assetSelectorStore.isEditingExisting();

  return I18n.t(
    isEditingExisting ?
      'editor.asset_selector.update_button_text' :
      'editor.asset_selector.insert_button_text'
  );
}
