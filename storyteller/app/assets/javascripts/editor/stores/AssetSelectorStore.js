import $ from 'jquery';
import _ from 'lodash';

import I18n from '../I18n';
import Store from './Store';
import Actions from '../Actions';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertHasProperty, assertEqual, assertIsOneOfTypes, assertHasProperties } from 'common/js_utils';
import { storyStore } from './StoryStore';
import { fileUploaderStore, STATUS } from './FileUploaderStore';
import httpRequest, { federationHeaders, storytellerHeaders } from '../../services/httpRequest';
import { exceptionNotifier } from '../../services/ExceptionNotifier';

function t(str) {
  return I18n.t(`editor.asset_selector.${str}`);
}

// The step in the asset selection flow the user is in.
export const WIZARD_STEP = {
  // Do you want a Socrata visualization, Youtube, an image, etc?
  SELECT_ASSET_PROVIDER: 'SELECT_ASSET_PROVIDER',

  ENTER_YOUTUBE_URL: 'ENTER_YOUTUBE_URL',

  ENTER_EMBED_CODE: 'ENTER_EMBED_CODE',

  ENTER_STORY_URL: 'ENTER_STORY_URL',

  ENTER_GOAL_URL: 'ENTER_GOAL_URL',

  // You want a Socrata visualization, so please choose an option
  SELECT_VISUALIZATION_OPTION: 'SELECT_VISUALIZATION_OPTION',
  // You want a Socrata visualization, so please choose your dataset.
  SELECT_DATASET_FOR_VISUALIZATION: 'SELECT_DATASET_FOR_VISUALIZATION',
  // You choose a table.
  SELECT_TABLE_FROM_CATALOG: 'SELECT_TABLE_FROM_CATALOG',
  // You choose a map or chart visualization.
  SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG: 'SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG',
  // You choose to embed a measure.
  SELECT_MEASURE_FROM_CATALOG: 'SELECT_MEASURE_FROM_CATALOG',
  // Do you want a card or chart?
  CONFIGURE_MEASURE: 'CONFIGURE_MEASURE',
  // You walk through the new authorship workflow.
  AUTHOR_VISUALIZATION: 'AUTHOR_VISUALIZATION',
  // You chose a map or chart. Please edit it to your liking.
  CONFIGURE_MAP_OR_CHART: 'CONFIGURE_MAP_OR_CHART',
  TABLE_PREVIEW: 'TABLE_PREVIEW',

  SELECT_IMAGE_TO_UPLOAD: 'SELECT_IMAGE_TO_UPLOAD',
  IMAGE_UPLOADING: 'IMAGE_UPLOADING',
  IMAGE_PREVIEW: 'IMAGE_PREVIEW',
  IMAGE_UPLOAD_ERROR: 'IMAGE_UPLOAD_ERROR'
};

export const assetSelectorStore = StorytellerUtils.export(new AssetSelectorStore(), 'storyteller.assetSelectorStore');

// Given a view blob an an intended componentType, returns true
// if there is any hope of visualizing it directly.
// We gotta do this because of the craziness around NBE
// migration which sometimes require using a completely
// different view than the intended view (but not always,
// ha ha!).
export function viewIsDirectlyVisualizable(intendedComponentType, viewData) {
  const isNewBackend = _.get(viewData, 'newBackend') === true;
  const isCreatingTable = intendedComponentType === 'socrata.visualization.table';

  return isNewBackend || isCreatingTable;
}

export default function AssetSelectorStore() {
  _.extend(this, new Store());

  const self = this;

  // Contains the entire state of this store.
  // Possible properties (all optional):
  // - step: Name of current embed wizard step. This is ill-defined and needs work.
  //         Practically speaking, this controls which wizard step AssetSelectorRenderer
  //         shows in the UI.
  // - blockId: ID of block being configured.
  // - componentIndex: Index of component in block being configured.
  // - componentType: Type of component user has selected.
  // - componentProperties: Configuration of component user has selected.
  let _state = {};

  this.register((payload) => {
    assertHasProperty(payload, 'action');

    switch (payload.action) {

      case Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT:
        _selectNew(payload);
        break;

      case Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED:
        _editExisting(payload);
        break;

      case Actions.ASSET_SELECTOR_UPDATE_COMPONENT_TYPE:
        _setComponentType(payload.type);
        self._emitChange();
        break;

      case Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE:
        _updateImageAltAttribute(payload);
        break;

      case Actions.ASSET_SELECTOR_UPDATE_IMAGE_URL_WRAPPER:
        _updateImageUrlWrapper(payload);
        break;

      case Actions.ASSET_SELECTOR_UPDATE_TITLE_ATTRIBUTE:
        _updateFrameTitleAttribute(payload);
        break;

      case Actions.ASSET_SELECTOR_UPDATE_STORY_URL:
        _updateStoryUrl(payload);
        break;

      case Actions.ASSET_SELECTOR_TOGGLE_STORY_WINDOW_TARGET:
        _updateStoryWindowTarget();
        break;

      case Actions.ASSET_SELECTOR_UPDATE_GOAL_URL:
        _updateGoalUrl(payload);
        break;

      case Actions.ASSET_SELECTOR_TOGGLE_GOAL_WINDOW_TARGET:
        _updateGoalWindowTarget();
        break;

      case Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL:
        _updateYoutubeUrl(payload);
        break;

      case Actions.ASSET_SELECTOR_PROVIDER_CHOSEN:
        setProvider(payload);
        break;

      case Actions.ASSET_SELECTOR_VISUALIZATION_OPTION_CHOSEN:
        delete _state.componentType;
        switch (payload.visualizationOption) {
          case 'INSERT_VISUALIZATION':
            _chooseInsertVisualization();
            break;
          case 'INSERT_MEASURE':
            _chooseInsertMeasure();
            break;
          case 'INSERT_TABLE':
            _visualizeAsTable();
            break;
          case 'AUTHOR_VISUALIZATION':
            _chooseCreateVisualization();
            break;
        }
        break;

      case Actions.ASSET_SELECTOR_CHOOSE_MEASURE:
        _measureChosen(payload);
        break;

      case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET:
        _chooseVisualizationDataset(payload);
        break;

      case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART:
        _chooseVisualizationMapOrChart(payload);
        break;

      case Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION:
        _updateVisualizationConfiguration(payload);
        break;

      case Actions.ASSET_SELECTOR_DRAG_FILES:
        _updateDroppedImage(payload);
        break;

      case Actions.ASSET_SELECTOR_CLOSE:
        _closeDialog();
        break;

      case Actions.ASSET_SELECTOR_JUMP_TO_STEP:
        _jumpToStep(payload);
        break;

      case Actions.ASSET_SELECTOR_IMAGE_SEARCH_LOAD_MORE:
        _nextImageSearchPage();
        break;

      case Actions.ASSET_SELECTOR_IMAGE_SEARCH:
        _setImageSearchPhrase(payload);
        break;

      case Actions.ASSET_SELECTOR_IMAGE_SELECTED:
        _setImageSearchSelection(payload);
        break;

      case Actions.ASSET_SELECTOR_IMAGE_CROP_SET:
        setImageCrop(payload);
        break;

      case Actions.ASSET_SELECTOR_IMAGE_CROP_COMMIT:
        commitImageCrop();
        break;

      case Actions.ASSET_SELECTOR_IMAGE_CROP_START:
        startImageCropping();
        break;

      case Actions.ASSET_SELECTOR_IMAGE_CROP_RESET:
        resetImageCropping();
        break;

      case Actions.ASSET_SELECTOR_IMAGE_UPLOAD:
        setPreviewImage(payload);
        break;

      case Actions.ASSET_SELECTOR_TOGGLE_IMAGE_WINDOW_TARGET:
        _updateImageWindowTarget();
        break;

      case Actions.ASSET_SELECTOR_IMAGE_PREVIEW_BACK:
        backToImageUpload();
        break;

      case Actions.URL_UPLOAD:
      case Actions.FILE_UPLOAD:
        upload(payload);
        break;
    }
  });

  /**
   * Public methods
   */

  // Asset selection takes the form of a wizard, each user action
  // causing a transition to one of a number of distinct "steps".
  // This returns the specific step the user is in right now.
  //
  // Returns one of WIZARD_STEP.
  this.getStep = () => _state.step;

  this.getBlockId = () => _state.blockId;

  this.getComponentIndex = () => _state.componentIndex;

  this.getComponentType = () => _state.componentType;

  this.getComponentValue = () => _state.componentProperties;

  // Returns the dataset chosen by the user from the
  // dataset picker, if any.
  //
  // Returns:
  // {
  //   id: <4x4>,
  //   domain: <dataset domain>,
  //   vifId: <vif within vizCanvas> [optional]
  // }
  this.getDatasetUserSelectedFromList = () => {
    const value = this.getComponentValue();
    const id = _.get(value, 'dataset.datasetUid');
    const domain = _.get(value, 'dataset.domain');
    const vifId = _.get(value, 'dataset.vifId');
    if (domain && id) {
      return { domain, id, vifId };
    } else {
      return null;
    }
  };

  // Returns the dataset information from the VIF being edited,
  // if any.
  //
  // Returns:
  // {
  //   id: <4x4>,
  //   domain: <dataset domain>
  // }
  this.getDatasetInVif = () => {
    const value = this.getComponentValue();
    const isVersionOneVif = _.get(value, 'vif.format.version') === 1;

    const domain = isVersionOneVif ?
      _.get(value, 'vif.domain') :
      _.get(value, 'vif.series[0].dataSource.domain');
    const id = isVersionOneVif ?
      _.get(value, 'vif.datasetUid') :
      _.get(value, 'vif.series[0].dataSource.datasetUid');

    if (domain && id) {
      return { domain, id };
    } else {
      return null;
    }
  };

  // Gets the dataset metadata (view blob from core)
  // of the dataset related to the asset being
  // edited.
  this.getDataset = () => _state.dataset;

  this.getErrorReason = () => _.get(_state.componentProperties, 'reason', null);

  this.isDirty = () => {
    const {
      componentType,
      componentProperties,
      originalComponentType,
      originalComponentProperties
    } = _state;

    // layout sub-property is attached to component.value but not managed
    // by asset selector
    const originalProperties = _.omit(originalComponentProperties, 'layout');

    const isTypeEqual = _.isEqual(componentType, originalComponentType);
    const isPropsEqual = _.isEqual(componentProperties, originalProperties);

    return !isTypeEqual || !isPropsEqual;
  };

  this.getFileId = () => _.get(_state, 'fileId', null);

  this.getPreviewImageData = () => _.get(_state, 'previewImage', null);

  this.getPreviewImageUrl = () => _.get(_state, 'previewImageUrl', null);

  this.getImageWindowTarget = () => _.get(_state, 'openInNewWindow', false);

  this.hasPreviewImageData = () => _.isObject(this.getPreviewImageData());

  this.hasPreviewImageUrl = () => _.isString(this.getPreviewImageUrl());

  this.hasImageUrl = () => {
    const value = getImageComponent(this.getComponentValue());
    return !_.isEmpty(_.get(value, 'url', null));
  };

  this.hasImageUrlChanged = () => {
    const value = getImageComponent(this.getComponentValue());
    const originalValue = getImageComponent(_state.originalComponentProperties);

    const url = _.get(value, 'url', null);
    const originalUrl = _.get(originalValue, 'url', null);

    return url !== originalUrl;
  };

  this.isEditingExisting = () => _state.isEditingExisting === true;

  this.isUploadingFile = () => !_.isNull(_.get(_state, 'fileId', null));

  this.isHTMLFragment = (filename) => {
    if (filename) {
      return filename === Constants.EMBEDDED_FRAGMENT_FILE_NAME;
    } else if (self.getFileId()) {
      const file = fileUploaderStore.fileById(self.getFileId());
      return file.raw.name === Constants.EMBEDDED_FRAGMENT_FILE_NAME;
    } else {
      return false;
    }
  };

  this.getDroppedImage = () => _.get(_state, 'droppedImage', null);

  this.isCropping = () => _.get(_state, 'cropping', false);

  this.isCropComplete = () => _.get(_state, 'cropComplete', false);

  this.isCroppingUiEnabled = () => _.get(_state, 'croppingUiEnabled', false);

  this.hasCropChanged = () => {
    const originalCrop = getImageComponent(_state.originalComponentProperties).crop;
    const crop = getImageComponent(_state.componentProperties).crop;

    return !_.isEqual(originalCrop, crop);
  };

  this.hasCrop = () => {
    const componentProperties = getImageComponent(self.getComponentValue());

    return _.has(componentProperties, 'crop.x') &&
      _.has(componentProperties, 'crop.y') &&
      _.has(componentProperties, 'crop.width') &&
      _.has(componentProperties, 'crop.height');
  };

  this.getImageSearchUrl = () => {
    const phrase = this.getImageSearchPhrase();
    const phraseIsNull = _.isNull(phrase);
    const phraseIsEmptyString = _.isString(phrase) && _.isEmpty(phrase);

    const page = this.getImageSearchPage();
    const pageSize = this.getImageSearchPageSize();

    if (phraseIsNull || phraseIsEmptyString) {
      return null;
    } else {
      const queryString = _.map(
        {
          phrase: phrase,
          page: page,
          page_size: pageSize
        },
        (val, key) => `${key}=${encodeURIComponent(val)}`
      ).join('&');

      return `${Constants.API_PREFIX_PATH}/getty-images/search?${queryString}`;
    }
  };

  this.getImageSearchResults = () => _.get(_state, 'imageSearchResults', []);

  this.getImageSearchPhrase = () => _.get(_state, 'imageSearchPhrase', null);

  this.getImageSearchPage = () => _.get(_state, 'imageSearchPage', 1);

  this.getImageSearchSelected = () => _.get(_state, 'selectedImageId', null);

  this.getImageSearchPageSize = () => Constants.IMAGE_SEARCH_PAGE_SIZE;

  this.hasImageSearchPhrase = () => self.getImageSearchPhrase() !== null;

  this.hasImageSearchResults = () => !_.get(_state, 'imageSearchEmpty', true);

  this.isImageSearching = () => _.get(_state, 'imageSearching', false);

  this.hasImageSearchError = () => _.get(_state, 'imageSearchError', false);

  this.canPageImageSearchNext = () => {
    return (self.getImageSearchPage() + 1) * self.getImageSearchPageSize() <= _state.imageSearchCount;
  };

  function getImageComponent(componentProperties) {
    const type = self.getComponentType();

    return type === 'author' ?
      _.get(componentProperties, 'image') :
      componentProperties;
  }

  function _setImageSearchPhrase(payload) {
    assertHasProperty(payload, 'phrase');
    assertIsOneOfTypes(payload.phrase, 'string');

    _state.imageSearchPhrase = payload.phrase.trim();
    _state.imageSearching = _state.imageSearchPhrase.length > 0;
    _state.imageSearchError = false;

    if (!payload.continuous) {
      _state.imageSearchResults = [];
      _state.imageSearchCount = 0;
      _state.imageSearchPage = 1;
      _state.imageSearchEmpty = true;

      self._emitChange();
    }

    if (!self.isImageSearching()) {
      return;
    }

    $.getJSON({
      method: 'GET',
      url: self.getImageSearchUrl()
    }).then((response) => {
      _state.imageSearchResults = self.getImageSearchResults().concat(response.images);
      _state.imageSearchCount += response.result_count;
      _state.imageSearchEmpty = _state.imageSearchCount === 0;
      _state.imageSearching = false;
      _state.imageSearchError = false;
      self._emitChange();
    }, () => {
      _state.imageSearching = false;
      _state.imageSearchError = true;
      self._emitChange();
    });
  }

  function _updateImageWindowTarget() {
    assertEqual(self.getComponentType(), 'image');

    const value = self.getComponentValue();
    value.openInNewWindow = !value.openInNewWindow;

    self._emitChange();
  }

  function _nextImageSearchPage() {
    if (self.canPageImageSearchNext()) {
      _state.imageSearchPage = self.getImageSearchPage() + 1;
      _setImageSearchPhrase({phrase: self.getImageSearchPhrase(), continuous: true});
    }
  }

  function _setImageSearchSelection(payload) {
    assertHasProperty(payload, 'id');
    assertIsOneOfTypes(payload.id, 'string', 'number');

    const type = self.getComponentType();
    const url = `${Constants.API_PREFIX_PATH}/getty-images/${payload.id}`;
    const image = {
      documentId: null,
      url: url
    };

    if (_state.selectedImageId !== payload.id) {
      _state.previewImageUrl = image.url;
      _state.selectedImageId = payload.id;

      if (type === 'author') {
        _state.componentProperties.image = _.merge(_state.componentProperties.image, image);
      } else {
        _state.componentProperties = _.merge(_state.componentProperties, image);
      }
    } else {
      _state.selectedImageId = null;
    }

    self._emitChange();
  }

  function setImageCrop(payload) {
    assertHasProperty(payload, 'crop');
    assertHasProperties(payload.crop, 'width', 'height', 'x', 'y');

    const value = getImageComponent(self.getComponentValue());
    value.crop = payload.crop;

    self._emitChange();
  }

  function commitImageCrop() {
    const value = getImageComponent(self.getComponentValue());
    const documentUrl = `${Constants.API_PREFIX_PATH}/documents/${value.documentId}`;
    const documentRequestOptions = {
      dataType: 'json',
      headers: storytellerHeaders()
    };

    _state.cropping = true;
    _state.cropComplete = false;

    self._emitChange();

    httpRequest('get', documentUrl, documentRequestOptions).
      then(cropImage).
      catch(cropImageError);
  }

  function cropImage({ data }) {
    const value = getImageComponent(self.getComponentValue());
    const cropUrl = `${Constants.API_PREFIX_PATH}/documents/${value.documentId}/crop`;
    const document = value.crop ? {
      crop_x: value.crop.x / 100,
      crop_y: value.crop.y / 100,
      crop_width: value.crop.width / 100,
      crop_height: value.crop.height / 100
    } : {
      crop_x: null,
      crop_y: null,
      crop_width: null,
      crop_height: null
    };

    const cropRequestOptions = {
      dataType: 'text',
      data: { document },
      headers: storytellerHeaders()
    };

    httpRequest('put', cropUrl, cropRequestOptions).
      then(() => {
        _state.cropping = false;
        _state.cropComplete = true;
        value.url = data.document.url;

        self._emitChange();
      }).
      catch(cropImageError);
  }

  function cropImageError(error) {
    _state.cropping = false;

    exceptionNotifier.notify(error);

    _updateImageUploadError({
      error: {
        reason: t('image_preview.errors.cropping')
      }
    });

    self._emitChange();
  }

  function startImageCropping() {
    const value = getImageComponent(self.getComponentValue());
    const crop = _.cloneDeep(Constants.DEFAULT_CROP);

    _state.croppingUiEnabled = true;
    value.crop = crop;

    self._emitChange();
  }

  function resetImageCropping() {
    const value = getImageComponent(self.getComponentValue());

    _state.croppingUiEnabled = false;

    if (value) {
      delete value.crop;
    }

    self._emitChange();
  }

  function setPreviewImage(payload) {
    assertHasProperty(payload, 'file');

    const file = payload.file;
    const isNotValidFileSize = file.size > Constants.MAX_FILE_SIZE_BYTES;
    const isNotValidImageType = !_.includes(Constants.VALID_IMAGE_TYPES, file.type);
    const isNotValidFileType = !_.includes(Constants.VALID_FILE_TYPES, file.type);

    if (isNotValidFileSize || (isNotValidImageType && isNotValidFileType)) {
      const message = isNotValidFileSize ?
        'image_upload.errors.validation_file_size' :
        'image_upload.errors.validation_file_type';

      _state.step = WIZARD_STEP.IMAGE_UPLOAD_ERROR;
      _.set(_state.componentProperties, 'reason', t(message));
    } else {
      _state.componentProperties = _state.componentProperties || { urlValidity: true, openInNewWindow: false };

      if (_state.componentProperties.reason) {
        delete _state.componentProperties.reason;
      }

      _state.step = WIZARD_STEP.IMAGE_PREVIEW;

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        _state.previewImageUrl = reader.result;
        _state.previewImage = file;
        self._emitChange();
      });
      reader.addEventListener('error', () => {
        _state.componentProperties.reason = t('image_preview.errors.cannot_render_image');
        _state.step = WIZARD_STEP.IMAGE_UPLOAD_ERROR;
        self._emitChange();
      });

      reader.readAsDataURL(payload.file);
    }

    _state.cropComplete = false;
    self._emitChange();
  }

  function backToImageUpload() {
    const value = getImageComponent(self.getComponentValue());

    _state.previewImageUrl = null;
    _state.previewImage = null;
    _state.step = WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD;

    _state.imageSearchResults = [];
    _state.imageSearchEmpty = true;
    _state.imageSearching = false;
    _state.imageSearchError = false;

    _state.croppingUiEnabled = false;
    _state.cropComplete = false;

    if (value) {
      delete value.crop;
    }

    self._emitChange();
  }

  /**
   * Private methods
   */

  /**
   * Given an asset type (i.e. 'socrata.visualization.classic'), returns
   * the step the wizard should start from given the user is updating
   * a component.
   */
  function _stepForUpdate(component) {
    const type = component.type;

    switch (type) {
      case 'hero': return WIZARD_STEP.IMAGE_PREVIEW;
      case 'image': return WIZARD_STEP.IMAGE_PREVIEW;
      case 'story.tile':
      case 'story.widget':
        return WIZARD_STEP.ENTER_STORY_URL;
      case 'goal.tile':
        return WIZARD_STEP.ENTER_GOAL_URL;
      case 'youtube.video': return WIZARD_STEP.ENTER_YOUTUBE_URL;
      case 'embeddedHtml': return WIZARD_STEP.ENTER_EMBED_CODE;
      case 'author': return WIZARD_STEP.IMAGE_PREVIEW; // Author blocks act like an image embed + RTE blurb.
      case 'socrata.visualization.table': return WIZARD_STEP.TABLE_PREVIEW;
      case 'socrata.visualization.classic': return WIZARD_STEP.CONFIGURE_MAP_OR_CHART;
      case 'socrata.visualization.vizCanvas': return WIZARD_STEP.CONFIGURE_MAP_OR_CHART;
      case 'measure.card': return WIZARD_STEP.CONFIGURE_MEASURE;
      case 'measure.chart': return WIZARD_STEP.CONFIGURE_MEASURE;
    }

    if (type.indexOf('socrata.visualization.') === 0) {
      return WIZARD_STEP.AUTHOR_VISUALIZATION;
    }

    // Something went wrong and we don't know where to pick up from (new embed type?),
    // so open the wizard at the very first step.
    return WIZARD_STEP.SELECT_ASSET_PROVIDER;
  }

  function _selectNew(payload) {
    assertHasProperties(payload, 'blockId', 'componentIndex');

    _state = {
      step: WIZARD_STEP.SELECT_ASSET_PROVIDER,
      blockId: payload.blockId,
      componentIndex: payload.componentIndex,
      isEditingExisting: false,
      componentProperties: payload.initialComponentProperties
    };

    self._emitChange();
  }

  function _editExisting(payload) {
    assertHasProperties(payload, 'blockId', 'componentIndex');

    const component = storyStore.getBlockComponentAtIndex(
      payload.blockId,
      payload.componentIndex
    );

    _state = {
      step: _stepForUpdate(component),
      blockId: payload.blockId,
      componentIndex: payload.componentIndex,
      componentType: component.type,
      componentProperties: component.value,
      originalComponentType: _.clone(component.type),
      originalComponentProperties: _.cloneDeep(component.value),
      isEditingExisting: true
    };

    if (_.includes(['image', 'hero', 'author'], component.type)) {
      const value = getImageComponent(component.value);
      _state.previewImageUrl = value.url;

      if (!_.isEmpty(value.crop)) {
        _state.croppingUiEnabled = true;
      }

      value.urlValidity = true;
    }

    const dataset = self.getDatasetUserSelectedFromList() || self.getDatasetInVif();
    // Skip vizCanvas components because we've already retrieved the view by this point
    // and we don't store the whole view in the component.
    if (component.type !== 'socrata.visualization.vizCanvas' && dataset) {
      // Fetch additional data needed for UI.
      _getView(dataset.domain, dataset.id).
        then(_setComponentPropertiesFromViewData).
        then(self._emitChange);
    } else {
      self._emitChange();
    }
  }

  function _jumpToStep(payload) {
    assertHasProperties(payload, 'step');
    assertHasProperty(WIZARD_STEP, payload.step);

    if (_state.step !== payload.step) {
      _state.step = payload.step;
      self._emitChange();
    }
  }

  function _setComponentType(type) {
    _state.componentType = type;
  }

  function _chooseStoryTile() {
    _state.step = WIZARD_STEP.ENTER_STORY_URL;
    self._emitChange();
  }

  function _chooseGoalTile() {
    _state.step = WIZARD_STEP.ENTER_GOAL_URL;
    self._emitChange();
  }

  function _chooseYoutube() {
    _state.step = WIZARD_STEP.ENTER_YOUTUBE_URL;
    self._emitChange();
  }

  function _chooseInsertVisualization() {
    _state.step = WIZARD_STEP.SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG;
    self._emitChange();
  }

  function _chooseInsertMeasure() {
    _state.step = WIZARD_STEP.SELECT_MEASURE_FROM_CATALOG;
    self._emitChange();
  }

  function _visualizeAsTable() {
    _state.step = WIZARD_STEP.SELECT_TABLE_FROM_CATALOG;
    _state.componentType = 'socrata.visualization.table';
    self._emitChange();
  }

  function _chooseCreateVisualization() {
    _state.step = WIZARD_STEP.SELECT_DATASET_FOR_VISUALIZATION;
    self._emitChange();
  }

  function _chooseVisualizationOption() {
    _state.step = WIZARD_STEP.SELECT_VISUALIZATION_OPTION;
    self._emitChange();
  }

  function _chooseImageUpload() {
    if (_state.componentType === 'image') {
      _state.componentProperties = _.merge(_state.componentProperties || {}, { urlValidity: true, openInNewWindow: false });
    }

    _state.step = WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD;
    self._emitChange();
  }

  function _chooseEmbedCode() {
    _state.step = WIZARD_STEP.ENTER_EMBED_CODE;
    _state.componentProperties = {};
    self._emitChange();
  }

  function _chooseVisualizationDataset(payload) {
    assertIsOneOfTypes(payload.viewData, 'object');

    const isCreatingTable = _state.componentType === 'socrata.visualization.table';

    _setComponentPropertiesFromViewData(payload.viewData);

    if (isCreatingTable) {
      _setUpTableFromSelectedDataset();
      _state.step = WIZARD_STEP.TABLE_PREVIEW;
    } else {
      // If we previously configured a table in this AssetSelector session, the vif.type is set to "table"
      // which screws with the AX's initial state and causes a bug with the chart type picker
      if (_.get(_state, 'componentProperties.vif.type') === 'table') {
        _.unset(_state, 'componentProperties.vif.type');
      }
      _state.step = WIZARD_STEP.AUTHOR_VISUALIZATION;
    }

    self._emitChange();
  }

  function _measureChosen(payload) {
    assertIsOneOfTypes(payload.domain, 'string', 'Payload must include "domain"');
    assertIsOneOfTypes(payload.uid, 'string', 'Payload must include "uid"');

    _state.componentType = 'measure.card';
    _state.componentProperties = _state.componentProperties || {};
    _.extend(_state.componentProperties, {
      measure: {
        domain: payload.domain,
        uid: payload.uid
      }
    });

    _state.step = WIZARD_STEP.CONFIGURE_MEASURE;
    self._emitChange();
  }

  function _chooseVisualizationMapOrChart(payload) {
    _state.step = WIZARD_STEP.CONFIGURE_MAP_OR_CHART;

    assertIsOneOfTypes(payload.domain, 'string', 'Payload must include "domain"');
    assertIsOneOfTypes(payload.mapOrChartUid, 'string', 'Payload must include "mapOrChartUid"');
    assertIsOneOfTypes(payload.viewData, 'object', 'Payload must include "viewData"');

    const mapChartError = () => {
      alert(t('visualization.choose_map_or_chart_error')); // eslint-disable-line no-alert
    };

    const { viewData } = payload;
    let vifId;

    const isChartOrMapView = (
      _.isPlainObject(viewData) &&
      (
        viewData.displayType === 'chart' ||
        viewData.displayType === 'map' ||
        viewData.displayType === 'visualization'
      )
    );

    // is this a viz-canvas or a classic chart/map?
    // classic viz will not have a vifId
    if (viewData.displayType === 'visualization') {
      // For now, while we only have one visualization per canvas, we're going to default to the first one
      vifId = viewData.displayFormat.visualizationCanvasMetadata.vifs[0].id;
    }

    if (isChartOrMapView) {
      _setComponentPropertiesFromViewData(viewData);
      if (viewData.displayType === 'visualization' && vifId) {
        const vizProps = {
          vifId
        };
        _setComponentPropertiesFromVizCanvasVisualization(vizProps);
      }
      self._emitChange();
    } else {
      mapChartError();
    }
  }

  function _setUpTableFromSelectedDataset() {
    // TODO We need an official story for handling row unit.
    // view.rowLabel exists, but does not provide the pluralized form.
    // Also, we don't sync this information to the NBE today.
    // This record/records hardcoding is also done by VisualizationAddController
    // in Data Lens.
    const unit = I18n.t('editor.visualizations.default_unit');

    assertHasProperties(
      _state,
      'componentProperties.dataset.domain',
      'componentProperties.dataset.datasetUid',
      'dataset.columns'
    );
    assert(
      _state.componentType === 'socrata.visualization.table',
      `Visualization under construction is not a table, cannot proceed. Was: ${_state.componentType}`
    );

    assert(_state.dataset.columns.length > 0, 'dataset must have at least one column');

    const visualization = {
      type: 'table',
      unit: unit,
      title: _.get(_state, 'dataset.name', ''),
      domain: _state.componentProperties.dataset.domain,
      format: {
        type: 'visualization_interchange_format',
        version: 1
      },
      origin: {
        url: window.location.toString().replace(/\/edit$/, ''),
        type: 'storyteller_asset_selector'
      },
      filters: [],
      createdAt: (new Date()).toISOString(),
      datasetUid: _state.componentProperties.dataset.datasetUid,
      aggregation: {
        field: null,
        'function': 'count'
      },
      description: _.get(_state, 'dataset.description', ''),
      configuration: {
        localization: {}
      }
    };

    _state.componentProperties = {
      vif: visualization,
      dataset: _state.componentProperties.dataset,
      originalUid: null
    };
  }

  // Given a dataset domain, uid, and view metadata, sets:
  // * _state.componentProperties.dataset.domain,
  // * _state.componentProperties.dataset.datasetUid,
  // * _state.dataset
  function _setComponentPropertiesFromViewData(viewData) {
    assertIsOneOfTypes(viewData, 'object');
    assertHasProperties(viewData,
      'domain', // We retcon this in, sorry if you tried to feed in plain data from /api/views.
      'id'
    );

    _state.componentProperties = _state.componentProperties || {};
    _.extend(_state.componentProperties, {
      dataset: {
        domain: viewData.domain,
        datasetUid: viewData.id
      }
    });

    // Not going into _state.componentProperties, as we don't want this blob
    // to end up stored in the story component data.
    _state.dataset = _.cloneDeep(viewData);
  }

  // Sets componentProperties.visualization for viz-canvas visualizations
  function _setComponentPropertiesFromVizCanvasVisualization(vizProps) {
    assertIsOneOfTypes(vizProps, 'object');
    assertHasProperty(vizProps, 'vifId');

    _state.componentProperties = _state.componentProperties || {};
    _.extend(_state.componentProperties.dataset, vizProps);
  }

  function _getView(domain, uid) {
    // Fetch the view info.
    // NOTE: Beware that view.metadata is not sync'd across to the NBE
    // as of this writing. If you need to get info out of view.metadata
    // (like rowLabel), you'll need to fetch the OBE view separately.
    // Also, I CAN'T BELIEVE I'M WRITING THIS AGAIN
    var viewUrl = `https://${domain}/api/views/${uid}.json`;

    return httpRequest('GET', viewUrl, { headers: federationHeaders() }).
      then(({ data }) => {
        // Retcon the domain into the view data.
        // We'd have to pass it around like 5 methods otherwise.
        data.domain = domain;
        return data;
      }, (error) => {
        const step = self.getStep();

        if (step === WIZARD_STEP.CONFIGURE_MAP_OR_CHART) {
          _state.step = WIZARD_STEP.SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG;
        } else if (step === WIZARD_STEP.TABLE_PREVIEW) {
          _state.step = WIZARD_STEP.SELECT_TABLE_FROM_CATALOG;
        } else {
          _state.step = WIZARD_STEP.SELECT_ASSET_PROVIDER;
        }

        self._emitChange();

        exceptionNotifier.notify(error);
        alert(t('visualization.choose_dataset_error')); // eslint-disable-line no-alert

        return null;
      });
  }

  function _updateVisualizationConfiguration(payload) {
    const visualization = payload.visualization.data;
    const format = payload.visualization.format;

    if (_.isEmpty(visualization)) {

      _state.componentType = null;
      _state.componentProperties = {
        dataset: _state.componentProperties.dataset
      };

      self._emitChange();
    } else if (format === 'vizCanvas') {
      _state.componentType = 'socrata.visualization.vizCanvas';
      _state.componentProperties = {
        dataset: _state.componentProperties.dataset
      };

      self._emitChange();
    } else if (format === 'classic') {

      _state.componentType = 'socrata.visualization.classic';
      _state.componentProperties = {
        visualization: visualization,
        dataset: _state.componentProperties.dataset,
        originalUid: payload.visualization.originalUid
      };

      self._emitChange();
    } else if (format === 'vif') {

      assertHasProperty(_state, 'componentProperties.dataset');

      _state.componentType = `socrata.visualization.${visualization.type}`;
      _state.componentProperties = {
        vif: visualization,
        dataset: _state.componentProperties.dataset,
        originalUid: payload.visualization.originalUid
      };

      self._emitChange();
    } else if (payload.visualization.format === 'vif2') {

      // If we are updating a visualization, we need to check if its layout
      // height has been previously set and remember it so that it can be added
      // back into the new component properties after they have been reset.
      const layoutHeight = _.get(_state, 'componentProperties.layout.height');
      const visualizationType = visualization.series[0].type.split('.')[0];

      _state.componentType = `socrata.visualization.${visualizationType}`;
      _state.componentProperties = {
        vif: visualization,
        dataset: _state.componentProperties.dataset,
        originalUid: payload.visualization.originalUid
      };

      // If layout height was previously set, set the same layout height in the
      // new component properties.
      if (layoutHeight) {
        _.set(_state, 'componentProperties.layout.height', layoutHeight);
      }

      self._emitChange();
    }
  }

  function _updateDroppedImage(payload) {
    const hasFiles = Array.isArray(payload.files) && payload.files.length > 0;
    const previouslyDroppedImage = self.getDroppedImage();
    const fileChanged =  _.isNull(previouslyDroppedImage) || (previouslyDroppedImage.name !== payload.files[0].name);

    if (hasFiles && fileChanged) {
      _state.droppedImage = payload.files[0];
      self._emitChange();
    }
  }

  function upload(payload) {
    assertHasProperty(payload, 'id');

    const crop = getImageComponent(self.getComponentValue()).crop;
    const hasCrop = crop && crop.x !== 0 && crop.y !== 0 && crop.width !== 100 && crop.height !== 100;
    const isNotHTMLFragment = _.isEmpty(payload.file) || !self.isHTMLFragment(payload.file.name);

    _state.fileId = payload.id;
    // Clear any erroring that may be lingering.
    delete _state.componentProperties.reason;

    if (isNotHTMLFragment) {
      if (hasCrop) {
        _state.cropping = true;
      }

      self._emitChange();
    }
  }

  function _handleEmbedCodeFragment(file) {
    switch (file.status) {
      case STATUS.CANCELLED:
        _state.fileId = null;
        break;
      case STATUS.COMPLETED:
        _state.fileId = null;
        _updateEmbedCodePreview(file.resource);
        break;
      case STATUS.ERRORED:
        _state.fileId = null;
        _updateEmbedCodeError({error: {reason: file.message}});
        break;
      case STATUS.SIGNED:
      case STATUS.ACKNOWLEDGED:
      case STATUS.UPLOADING:
      case STATUS.PROCESSING:
        // Nothing.
        break;
      default:
        _state.fileId = null;
        break;
    }
  }

  function _handleImage(file) {
    switch (file.status) {
      case STATUS.CANCELLED:
        _state.fileId = null;
        _state.cropping = false;
        self._emitChange();
        break;

      case STATUS.COMPLETED:
        _state.cropping = false;
        _updateImagePreview(file);
        break;

      case STATUS.ERRORED:
        _state.fileId = null;
        _state.cropping = false;
        _updateImageUploadError({error: {reason: file.message}});
        break;

      case STATUS.UPLOADING:
      case STATUS.PROCESSING:
        self._emitChange();
        break;

      case STATUS.SIGNED:
      case STATUS.ACKNOWLEDGED:
        // Nothing.
        break;

      default:
        _state.fileId = null;
        break;
    }
  }

  fileUploaderStore.addChangeListener(() => {
    if (self.isUploadingFile()) {
      var id = self.getFileId();
      var file = fileUploaderStore.fileById(id);

      if (file.raw && self.isHTMLFragment(file.raw.name)) {
        _handleEmbedCodeFragment(file);
      } else {
        _handleImage(file);
      }
    }
  });

  function _updateImagePreview(file) {
    const type = self.getComponentType();
    const properties = _state.componentProperties;

    const image = {
      ...properties,
      documentId: file.resource.id,
      url: file.resource.url
    };

    switch (type) {
      // Three different merge strategies for three different component types.
      // The author component expects image data to be _nested_ inside its data.
      // The hero component expects image data to live _alongside_ its data.
      // The image component expects image data to _be_ its data.
      //
      // We should try to eliminate this branching in favor of a single code path,
      // but that probably will necessitate a migration (for affected blocks) and
      // some way to reset component properties in order not to regress EN-8295.
      case 'author':
        _state.componentProperties = _.merge(
          _state.componentProperties,
          { image }
        );
        break;

      case 'hero':
        _state.componentProperties = _.merge(
          _state.componentProperties,
          image
        );
        break;

      case 'image':
        _state.componentProperties = image;
        break;

      default:
        throw new Error(`Invalid component type ${type} for image processing!`);
    }

    self._emitChange();
  }

  function _updateImageUploadError(payload) {
    const value = self.getComponentValue();

    if (!_.isUndefined(payload.error.reason)) {
      _.set(value, 'reason', payload.error.reason);
    }

    self._emitChange();
  }

  function _updateImageAltAttribute(payload) {
    const value = self.getComponentValue();
    const altAttribute = payload.altAttribute;

    if (_state.componentType === 'image') {
      value.alt = altAttribute;
    } else {
      throw new Error(`Component type is ${_state.componentType}. Cannot update alt attribute.`);
    }

    self._emitChange();
  }

  function _updateImageUrlWrapper(payload) {
    const value = self.getComponentValue();
    let url = payload.url;

    // If it isn't empty, it should look like an HTTP URI, mailto URI, or plain email address.
    const urlRegex = /^https?:\/\/.+\../;
    const emailRegex = /^(mailto:)?.+@./;
    const urlValidity = _.isString(url) &&
      (
        url.length === 0 ||
        urlRegex.test(url) ||
        emailRegex.test(url)
      );

    if (_state.componentType === 'image') {
      // If we have an email address without a protocol, inject the protocol.
      if (emailRegex.test(url) && !_.startsWith(url, 'mailto:')) {
        url = `mailto:${url}`;
      }

      value.link = url;
      value.urlValidity = urlValidity;
    } else {
      throw new Error(`Component type is ${_state.componentType}. Cannot update URL wrapper.`);
    }

    self._emitChange();
  }

  function _updateFrameTitleAttribute(payload) {
    const value = self.getComponentValue();
    const titleAttribute = payload.titleAttribute;

    if (_state.componentType === 'youtube.video' || _state.componentType === 'embeddedHtml') {
      value.title = titleAttribute;
    } else {
      throw new Error(`Component type is ${_state.componentType}. Cannot update title attribute.`);
    }

    self._emitChange();
  }

  function _updateStoryUrl(payload) {
    _state.componentType = 'story.tile';

    const openInNewWindow = _.get(_state.componentProperties, 'openInNewWindow', false);

    _state.componentProperties = _.merge(
      _componentPropertiesFromStoryUrl(payload.url),
      { openInNewWindow }
    );

    self._emitChange();
  }

  function _updateStoryWindowTarget() {
    assertEqual(self.getComponentType(), 'story.tile');

    const value = self.getComponentValue();
    value.openInNewWindow = !value.openInNewWindow;

    self._emitChange();
  }

  function _updateGoalUrl(payload) {
    const goalDomain = _extractDomainFromGoalUrl(payload.url);
    const goalUid = _extractGoalUidFromGoalUrl(payload.url);

    _state.componentType = 'goal.tile';

    _state.componentProperties = {
      domain: goalDomain,
      goalUid: goalUid,
      goalFullUrl: payload.url
    };

    self._emitChange();
  }

  function _updateGoalWindowTarget() {
    assertEqual(self.getComponentType(), 'goal.tile');

    const value = self.getComponentValue();
    value.openInNewWindow = !value.openInNewWindow;

    self._emitChange();
  }

  function _updateYoutubeUrl(payload) {
    const youtubeId = _extractIdFromYoutubeUrl(payload.url);
    const youtubeUrl = youtubeId === null ? null : payload.url;

    _state.componentType = 'youtube.video';

    _state.componentProperties = {
      id: youtubeId,
      url: youtubeUrl
    };

    self._emitChange();
  }

  function setProvider(payload) {
    assertHasProperty(payload, 'provider');

    switch (payload.provider) {
      case 'SOCRATA_VISUALIZATION':
        _chooseVisualizationOption();
        break;
      case 'STORY_TILE':
        _chooseStoryTile();
        break;
      case 'GOAL_TILE':
        _chooseGoalTile();
        break;
      case 'YOUTUBE':
        _chooseYoutube();
        break;
      case 'HERO':
        _setComponentType('hero');
        _chooseImageUpload();
        break;
      case 'IMAGE':
        _setComponentType('image');
        _chooseImageUpload();
        break;
      case 'EMBED_CODE':
        _chooseEmbedCode();
        break;
      default:
        throw new Error(`Unsupported provider: ${payload.provider}`);
    }
  }

  function _closeDialog() {
    _state = {};
    self._emitChange();
  }

  function _parseUrl(url) {
    if (url.match(/https?:\/\//)) {
      // Have to build the anchor node this way to work around IE11 behavior
      // where the leading slash was dropped from pathname.
      return $(`<a href="${url}">`).get(0);
    } else {
      return null;
    }
  }

  function _componentPropertiesFromStoryUrl(url) {
    const parsedUrl = _parseUrl(url);
    if (!parsedUrl) { return {}; }

    if (parsedUrl.pathname.indexOf(Constants.VIEW_PREFIX_PATH) === 0) {
      // Find the last thing in the url that looks like a uid (4x4).
      // We can't take the first thing because our story title may look
      // like a 4x4, and it comes first.
      const uid = _(parsedUrl.pathname.substring(Constants.VIEW_PREFIX_PATH.length).split('/')).
        compact(). // Removes blank strings.
        findLast((c) => c.match(Constants.FOUR_BY_FOUR_PATTERN));

      if (uid) {
        return { domain: parsedUrl.hostname, storyUid: uid };
      }
    }

    return {};
  }

  function _extractDomainFromGoalUrl(goalUrl) {
    const match = goalUrl.match(/^https\:\/\/([a-z0-9\.\-]{3,})\/(?:.*)stat\/goals\/.*$/i);
    const goalDomain = match === null ? null : match[1];

    return goalDomain;
  }

  function _extractGoalUidFromGoalUrl(goalUrl) {
    const uidMatcher = '\\w{4}-\\w{4}';
    const suffixMatcher = '(?:/view|/preview|/edit|/edit-story|/edit-classic)?';
    const dashboardGoalRegex = new RegExp(
      `^https://.+/stat/goals/(?:default|${uidMatcher})/${uidMatcher}/(${uidMatcher})${suffixMatcher}/?$`, 'i'
    );
    const singleGoalRegex = new RegExp(
      `^https://.+/stat/goals/single/(${uidMatcher})${suffixMatcher}/?$`, 'i'
    );

    let goalUid = null;
    if (dashboardGoalRegex.test(goalUrl)) {
      goalUid = goalUrl.match(dashboardGoalRegex)[1];
    } else if (singleGoalRegex.test(goalUrl)) {
      goalUid = goalUrl.match(singleGoalRegex)[1];
    }

    return goalUid;
  }

  /**
   * See: https://github.com/jmorrell/get-youtube-id/
   */
  function _extractIdFromYoutubeUrl(youtubeUrl) {
    let youtubeId = null;
    const patterns = Constants.YOUTUBE_URL_PATTERNS;

    if (/youtu\.?be/.test(youtubeUrl)) {

      // If any pattern matches, return the ID
      for (var i = 0; i < patterns.length; ++i) {
        if (patterns[i].test(youtubeUrl)) {
          youtubeId = patterns[i].exec(youtubeUrl)[1];
          break;
        }
      }

      if (!youtubeId) {
        // If that fails, break it apart by certain characters and look
        // for the 11 character key
        const tokens = youtubeUrl.split(/[\/\&\?=#\.\s]/g);

        for (i = 0; i < tokens.length; ++i) {
          if (/^[^#\&\?]{11}$/.test(tokens[i])) {
            youtubeId = tokens[i];
            break;
          }
        }
      }
    }

    return youtubeId;
  }

  function _updateEmbedCodeError(payload) {
    _state.componentProperties = {
      error: true,
      step: payload.error.step
    };

    if (!_.isUndefined(payload.error.reason)) {
      _state.componentProperties.reason = payload.error.reason;
    }

    self._emitChange();
  }

  function _updateEmbedCodePreview(resource) {
    const htmlFragmentUrl = resource.url;
    const documentId = resource.id;

    _state.componentType = 'embeddedHtml';
    _state.componentProperties = {
      url: htmlFragmentUrl,
      documentId: documentId,
      layout: {
        height: Constants.DEFAULT_VISUALIZATION_HEIGHT
      }
    };

    self._emitChange();
  }
}
