import $ from 'jQuery';
import _ from 'lodash';

import I18n from '../I18n';
import Store from './Store';
import Actions from '../Actions';
import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { storyStore } from './StoryStore';
import { fileUploaderStore, STATUS } from './FileUploaderStore';
import httpRequest, { storytellerAPIRequestHeaders } from '../../services/httpRequest';
import { exceptionNotifier } from '../../services/ExceptionNotifier';

// The step in the asset selection flow the user is in.
export var WIZARD_STEP = {
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
  // You walk through the new authorship workflow.
  AUTHOR_VISUALIZATION: 'AUTHOR_VISUALIZATION',
  // You chose some other visualization. Use Data Lens embed to configure it.
  CONFIGURE_VISUALIZATION: 'CONFIGURE_VISUALIZATION',
  // You chose a map or chart. Please edit it to your liking.
  CONFIGURE_MAP_OR_CHART: 'CONFIGURE_MAP_OR_CHART',
  TABLE_PREVIEW: 'TABLE_PREVIEW',

  SELECT_IMAGE_TO_UPLOAD: 'SELECT_IMAGE_TO_UPLOAD',
  IMAGE_UPLOADING: 'IMAGE_UPLOADING',
  IMAGE_PREVIEW: 'IMAGE_PREVIEW',
  IMAGE_UPLOAD_ERROR: 'IMAGE_UPLOAD_ERROR'
};

export var assetSelectorStore = StorytellerUtils.export(new AssetSelectorStore(), 'storyteller.assetSelectorStore');

// Given a view blob an an intended componentType, returns true
// if there is any hope of visualizing it directly.
// We gotta do this because of the craziness around NBE
// migration which sometimes require using a completely
// different view than the intended view (but not always,
// ha ha!).
export function viewIsDirectlyVisualizable(intendedComponentType, viewData) {
  var isNewBackend = _.get(viewData, 'newBackend') === true;
  var hasGroupBys = !_.isEmpty(_.get(viewData, 'query.groupBys'));
  var hasQuery = !_.isEmpty(_.get(viewData, 'query'));
  var isCreatingTable = intendedComponentType === 'socrata.visualization.table';

  // Now this is peculiar because our backend is peculiar.
  // All this stems from the fact that ALL our visualizations
  // depend on NBE APIs (or are explicitly unsupported on the OBE).
  //
  // If the OBE view DOES NOT have a query applied, we cannot
  // use it via the NBE API and must thus query for the NBE uid.
  // A missing NBE uid in this case is an error.
  //
  // HOWEVER(!!)
  // if the OBE view DOES have a query applied, and it has NO groupBys,
  // we can visualize it as a table. We can get away with this because
  // magic elves have granted us the ability to read with NBE APIs using
  // the canonical view UID. This does not work for un-queried views,
  // which don't support NBE APIs directly. However, we don't feel
  // comfortable supporting anything other than tables in this case.
  // There's too much of a testing burden to be practical at this time.
  //
  // Read the above carefully. It's the opposite of what you might
  // expect. Maybe even the opposite of that. What.

  if (isNewBackend) {
    return true;
  } else if (hasGroupBys) {
    // Not working with NBE APIs at this time.
    return false;
  } else if (hasQuery) {
    if (isCreatingTable) {
      // Well okay, but only if you SWEAR you'll create just a table...
      return true;
    } else {
      // Old backend, with query, not creating table. Unsupported.
      return false;
    }
  } else {
    // No query. This suggests that there is an NBE uid we should be using,
    // but that's Someone Else's Problem.
    return false;
  }
}

export default function AssetSelectorStore() {
  _.extend(this, new Store());

  var self = this;

  // Contains the entire state of this store.
  // Possible properties (all optional):
  // - step: Name of current embed wizard step. This is ill-defined and needs work.
  //         Practically speaking, this controls which wizard step AssetSelectorRenderer
  //         shows in the UI.
  // - blockId: ID of block being configured.
  // - componentIndex: Index of component in block being configured.
  // - componentType: Type of component user has selected.
  // - componentProperties: Configuration of component user has selected.
  var _state = {};

  this.register(function(payload) {
    StorytellerUtils.assertHasProperty(payload, 'action');

    switch (payload.action) {

      case Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT:
        _selectNew(payload);
        break;

      case Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED:
        _editExisting(payload);
        break;

      case Actions.ASSET_SELECTOR_UPDATE_IMAGE_ALT_ATTRIBUTE:
        _updateImageAltAttribute(payload);
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
          case 'INSERT_TABLE':
            _visualizeAsTable();
            break;
          case 'CREATE_VISUALIZATION':
            _state.isAuthoringVisualization = false;
            _chooseCreateVisualization();
            break;
          case 'AUTHOR_VISUALIZATION':
            _state.isAuthoringVisualization = true;
            _chooseCreateVisualization();
            break;
        }
        break;

      case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET:
        _chooseVisualizationDataset(payload);
        break;

      case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_MAP_OR_CHART:
        _chooseVisualizationMapOrChart(payload);
        break;

      case Actions.ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP:
        _visualizeAsChart(payload);
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
  this.getStep = function() {
    return _state.step;
  };

  this.getBlockId = function() {
    return _state.blockId;
  };

  this.getComponentIndex = function() {
    return _state.componentIndex;
  };

  this.getComponentType = function() {
    return _state.componentType;
  };

  this.getComponentValue = function() {
    return _state.componentProperties;
  };

  this.getDataset = function() {
    return _state.dataset;
  };

  this.getErrorReason = function() {
    return _.get(_state.componentProperties, 'reason', null);
  };

  this.getFileId = function() {
    return _.get(_state, 'fileId', null);
  };

  this.getPreviewImageData = function() {
    return _.get(_state, 'previewImage', null);
  };

  this.hasPreviewImageData = function() {
    return _.isObject(this.getPreviewImageData());
  };

  this.getPreviewImageUrl = function() {
    return _.get(_state, 'previewImageUrl', null);
  };

  this.hasPreviewImageUrl = function() {
    return _.isString(this.getPreviewImageUrl());
  };

  this.hasImageUrl = function() {
    var value = getImageComponent(this.getComponentValue());
    return !_.isEmpty(_.get(value, 'url', null));
  };

  this.hasImageUrlChanged = function() {
    var value = getImageComponent(this.getComponentValue());
    var originalValue = getImageComponent(_state.originalComponentProperties);

    var url = _.get(value, 'url', null);
    var originalUrl = _.get(originalValue, 'url', null);

    return url !== originalUrl;
  };

  this.isEditingExisting = function() {
    return _state.isEditingExisting === true;
  };

  this.isUploadingFile = function() {
    return !_.isNull(_.get(_state, 'fileId', null));
  };

  this.isHTMLFragment = function(filename) {
    if (filename) {
      return filename === Constants.EMBEDDED_FRAGMENT_FILE_NAME;
    } else if (self.getFileId()) {
      var file = fileUploaderStore.fileById(self.getFileId());
      return file.raw.name === Constants.EMBEDDED_FRAGMENT_FILE_NAME;
    } else {
      return false;
    }
  };

  this.getDroppedImage = function() {
    return _.get(_state, 'droppedImage', null);
  };

  this.isCropping = function() {
    return _.get(_state, 'cropping', false);
  };

  this.isCropComplete = function() {
    return _.get(_state, 'cropComplete', false);
  };

  this.isCroppingUiEnabled = function() {
    return _.get(_state, 'croppingUiEnabled', false);
  };

  this.hasCropChanged = function() {
    var originalCrop = getImageComponent(_state.originalComponentProperties).crop;
    var crop = getImageComponent(_state.componentProperties).crop;

    return !_.isEqual(originalCrop, crop);
  };

  this.hasCrop = function() {
    var componentProperties = getImageComponent(self.getComponentValue());

    return _.has(componentProperties, 'crop.x') &&
      _.has(componentProperties, 'crop.y') &&
      _.has(componentProperties, 'crop.width') &&
      _.has(componentProperties, 'crop.height');
  };

  this.getImageSearchUrl = function() {
    var phrase = this.getImageSearchPhrase();
    var phraseIsNull = _.isNull(phrase);
    var phraseIsEmptyString = _.isString(phrase) && _.isEmpty(phrase);

    var page = this.getImageSearchPage();
    var pageSize = this.getImageSearchPageSize();
    var query = StorytellerUtils.format(
      'phrase={0}&page={1}&page_size={2}',
      encodeURIComponent(phrase),
      encodeURIComponent(page),
      encodeURIComponent(pageSize)
    );

    if (phraseIsNull || phraseIsEmptyString) {
      return null;
    } else {
      return StorytellerUtils.format(
        '{0}getty-images/search?{1}',
        Constants.API_PREFIX_PATH,
        query
      );
    }
  };

  this.getImageSearchResults = function() {
    return _.get(_state, 'imageSearchResults', []);
  };

  this.getImageSearchPhrase = function() {
    return _.get(_state, 'imageSearchPhrase', null);
  };

  this.getImageSearchPage = function() {
    return _.get(_state, 'imageSearchPage', 1);
  };

  this.getImageSearchSelected = function() {
    return _.get(_state, 'selectedImageId', null);
  };

  this.getImageSearchPageSize = function() {
    return Constants.IMAGE_SEARCH_PAGE_SIZE;
  };

  this.hasImageSearchPhrase = function() {
    return self.getImageSearchPhrase() !== null;
  };

  this.hasImageSearchResults = function() {
    return !_.get(_state, 'imageSearchEmpty', true);
  };

  this.isImageSearching = function() {
    return _.get(_state, 'imageSearching', false);
  };

  this.hasImageSearchError = function() {
    return _.get(_state, 'imageSearchError', false);
  };

  this.canPageImageSearchNext = function() {
    return (self.getImageSearchPage() + 1) * self.getImageSearchPageSize() <= _state.imageSearchCount;
  };

  function getImageComponent(componentProperties) {
    var type = self.getComponentType();

    return type === 'author' ?
      _.get(componentProperties, 'image') :
      componentProperties;
  }

  function _setImageSearchPhrase(payload) {
    StorytellerUtils.assertHasProperty(payload, 'phrase');
    StorytellerUtils.assertIsOneOfTypes(payload.phrase, 'string');

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
    }).then(function(response) {
      _state.imageSearchResults = self.getImageSearchResults().concat(response.images);
      _state.imageSearchCount += response.result_count;
      _state.imageSearchEmpty = _state.imageSearchCount === 0;
      _state.imageSearching = false;
      _state.imageSearchError = false;
      self._emitChange();
    }, function() {
      _state.imageSearching = false;
      _state.imageSearchError = true;
      self._emitChange();
    });
  }

  function _nextImageSearchPage() {
    if (self.canPageImageSearchNext()) {
      _state.imageSearchPage = self.getImageSearchPage() + 1;
      _setImageSearchPhrase({phrase: self.getImageSearchPhrase(), continuous: true});
    }
  }

  function _setImageSearchSelection(payload) {
    StorytellerUtils.assertHasProperty(payload, 'id');
    StorytellerUtils.assertIsOneOfTypes(payload.id, 'string', 'number');

    var type = self.getComponentType();
    var url = StorytellerUtils.format('{0}getty-images/{1}', Constants.API_PREFIX_PATH, payload.id);
    var image = {
      documentId: null,
      url: url
    };

    if (_state.selectedImageId !== payload.id) {
      _state.previewImageUrl = image.url;
      _state.selectedImageId = payload.id;

      if (type === 'author') {
        _state.componentProperties.image = image;
      } else if (type === 'hero') {
        _state.componentProperties = _.merge(_state.componentProperties, image);
      } else {
        _state.componentProperties = image;
      }
    } else {
      _state.selectedImageId = null;
    }

    self._emitChange();
  }

  function setImageCrop(payload) {
    StorytellerUtils.assertHasProperty(payload, 'crop');
    StorytellerUtils.assertHasProperties(payload.crop, 'width', 'height', 'x', 'y');

    var value = getImageComponent(self.getComponentValue());
    value.crop = payload.crop;

    self._emitChange();
  }

  function commitImageCrop() {
    var value = getImageComponent(self.getComponentValue());
    var documentUrl = StorytellerUtils.format('{0}documents/{1}', Constants.API_PREFIX_PATH, value.documentId);
    var documentRequestOptions = {
      dataType: 'json',
      headers: storytellerAPIRequestHeaders()
    };

    _state.cropping = true;
    _state.cropComplete = false;

    self._emitChange();

    httpRequest('get', documentUrl, documentRequestOptions).
      then(cropImage).
      catch(cropImageError);
  }

  function cropImage(data) {
    var value = getImageComponent(self.getComponentValue());
    var cropUrl = StorytellerUtils.format('{0}documents/{1}/crop', Constants.API_PREFIX_PATH, value.documentId);
    var document = value.crop ? {
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

    var cropRequestOptions = {
      dataType: 'text',
      data: JSON.stringify({ document: document }),
      headers: storytellerAPIRequestHeaders()
    };

    httpRequest('put', cropUrl, cropRequestOptions).
      then(function() {
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
        reason: I18n.t('editor.asset_selector.image_preview.errors.cropping')
      }
    });

    self._emitChange();
  }

  function startImageCropping() {
    var value = getImageComponent(self.getComponentValue());
    var crop = _.cloneDeep(Constants.DEFAULT_CROP);

    _state.croppingUiEnabled = true;
    value.crop = crop;

    self._emitChange();
  }

  function resetImageCropping() {
    var value = getImageComponent(self.getComponentValue());

    _state.croppingUiEnabled = false;

    if (value) {
      delete value.crop;
    }

    self._emitChange();
  }

  function setPreviewImage(payload) {
    StorytellerUtils.assertHasProperty(payload, 'file');

    var message;
    var reader;
    var file = payload.file;
    var isNotValidFileSize = file.size > Constants.MAX_FILE_SIZE_BYTES;
    var isNotValidImageType = !_.includes(Constants.VALID_IMAGE_TYPES, file.type);
    var isNotValidFileType = !_.includes(Constants.VALID_FILE_TYPES, file.type);

    if (isNotValidFileSize || (isNotValidImageType && isNotValidFileType)) {
      message = isNotValidFileSize ?
        'editor.asset_selector.image_upload.errors.validation_file_size' :
        'editor.asset_selector.image_upload.errors.validation_file_type';

      _state.step = WIZARD_STEP.IMAGE_UPLOAD_ERROR;
      _.set(_state.componentProperties, 'reason', I18n.t(message));
    } else {
      if (!_state.componentProperties) {
        _state.componentProperties = {};
      }

      if (_state.componentProperties && _state.componentProperties.reason) {
        delete _state.componentProperties.reason;
      }

      _state.step = WIZARD_STEP.IMAGE_PREVIEW;

      reader = new FileReader();
      reader.
        addEventListener('load', function() {
          _state.previewImageUrl = reader.result;
          _state.previewImage = file;
          self._emitChange();
        });
      reader.
        addEventListener('error', function() {
          _state.componentProperties.reason = I18n.t('editor.asset_selector.image_preview.errors.cannot_render_image');
          _state.step = WIZARD_STEP.IMAGE_UPLOAD_ERROR;
          self._emitChange();
        });

      reader.readAsDataURL(payload.file);
    }

    _state.cropComplete = false;
    self._emitChange();
  }

  function backToImageUpload() {
    var value = getImageComponent(self.getComponentValue());

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
    var type = component.type;
    var value = component.value;

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
    }

    if (type.indexOf('socrata.visualization.') === 0) {
      if (Environment.ENABLE_VISUALIZATION_AUTHORING_WORKFLOW && _.get(value, 'vif.format.version') === 2) {
        return WIZARD_STEP.AUTHOR_VISUALIZATION;
      }

      return WIZARD_STEP.CONFIGURE_VISUALIZATION;
    }

    // Something went wrong and we don't know where to pick up from (new embed type?),
    // so open the wizard at the very first step.
    return WIZARD_STEP.SELECT_ASSET_PROVIDER;
  }

  function _selectNew(payload) {
    StorytellerUtils.assertHasProperties(payload, 'blockId', 'componentIndex');

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
    var component;
    var domain;
    var datasetUid;
    var value;

    StorytellerUtils.assertHasProperties(payload, 'blockId', 'componentIndex');

    component = storyStore.getBlockComponentAtIndex(
      payload.blockId,
      payload.componentIndex
    );

    _state = {
      step: _stepForUpdate(component),
      blockId: payload.blockId,
      componentIndex: payload.componentIndex,
      componentType: component.type,
      componentProperties: component.value,
      originalComponentProperties: _.cloneDeep(component.value),
      isEditingExisting: true
    };

    domain = _.get(component, 'value.dataset.domain');
    datasetUid = _.get(component, 'value.dataset.datasetUid');

    if (component.type === 'image' || component.type === 'hero' || component.type === 'author') {
      value = getImageComponent(component.value);
      _state.previewImageUrl = value.url;

      if (!_.isEmpty(value.crop)) {
        _state.croppingUiEnabled = true;
      }
    }

    if (datasetUid) {
      // Fetch additional data needed for UI.
      _getView(domain, datasetUid).
        then(_setComponentPropertiesFromViewData).
        then(self._emitChange);
    } else {
      self._emitChange();
    }
  }

  function _jumpToStep(payload) {
    StorytellerUtils.assertHasProperties(payload, 'step');
    StorytellerUtils.assertHasProperty(WIZARD_STEP, payload.step);

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
    _state.step = WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD;
    self._emitChange();
  }

  function _chooseEmbedCode() {
    _state.step = WIZARD_STEP.ENTER_EMBED_CODE;
    _state.componentProperties = {};
    self._emitChange();
  }

  // Given a view data object we can't directly visualize, returns a promise
  // for a view data object we can directly visualize. Not guaranteed to succeed, as
  // this transformation is not possible in all conditions.
  function _getVisualizableView(originalViewData) {

    // If we could not reach Core Server, fail silently because the HTTP request
    // failure has already notified Airbrake.
    if (originalViewData === null) {
      return Promise.reject(null);
    }

    if (viewIsDirectlyVisualizable(_state.componentType, originalViewData)) {

      return Promise.resolve(originalViewData);
    } else {

      return _getNbeView(originalViewData.domain, originalViewData.id).
        then(
          function(nbeViewData) {

            // EN-7322 - No repsonse on choosing some datasets
            //
            // Do not assume that we have view data. If the request for
            // /api/migrations/four-four.json returned 404 it means that there
            // is no corresponding NBE version of this dataset.
            if (_.isPlainObject(nbeViewData)) {

              // We should be able to handle all NBE datasets.
              StorytellerUtils.assert(
                viewIsDirectlyVisualizable(_state.componentType, nbeViewData),
                'All versions of this dataset deemed unfit for visualization!'
              );
              return nbeViewData;
            } else {

              // No migration. Give up.
              /* eslint-disable no-alert */
              alert(
                I18n.t(
                'editor.asset_selector.visualization.choose_dataset_unsupported_error'
                )
              );
              /* eslint-enable no-alert */
              return Promise.reject(null);
            }
          }
        );
    }
  }

  function _chooseVisualizationDataset(payload) {
    StorytellerUtils.assertIsOneOfTypes(payload.domain, 'string');
    StorytellerUtils.assertIsOneOfTypes(payload.datasetUid, 'string');

    _getView(payload.domain, payload.datasetUid).
      then(_getVisualizableView).
      then(
        function(viewData) {
          var isCreatingTable = (
            _state.componentType === 'socrata.visualization.table'
          );
          var authoringWorkflowAndSvgVisualizationsEnabled = (
            _state.isAuthoringVisualization &&
            Environment.ENABLE_VISUALIZATION_AUTHORING_WORKFLOW &&
            Environment.ENABLE_SVG_VISUALIZATIONS
          );

          _setComponentPropertiesFromViewData(viewData);

          if (isCreatingTable) {
            _setUpTableFromSelectedDataset();
            _state.step = WIZARD_STEP.TABLE_PREVIEW;
          } else if (authoringWorkflowAndSvgVisualizationsEnabled ) {
            _state.step = WIZARD_STEP.AUTHOR_VISUALIZATION;
          } else {
            _state.step = WIZARD_STEP.CONFIGURE_VISUALIZATION;
          }
          self._emitChange();
        }
      ).
      catch(
        function(error) {

          // EN-7322 - No response on choosing some datasets
          //
          // If the user attempts to add a chart using an OBE dataset that has
          // no corresponding migrated NBE dataset, this promise chain is
          // expected to fail. As such, we probably don't want to notify
          // Airbrake.
          //
          // If the user has attempted to add a chart using one of these
          // datasets we will reject the _getVisualizableView promise with
          // null, which can be used to signify that this is one of the
          // expected errors.
          // Since the messaging to the user that the dataset they selected is
          // not currently visualizable is done in _getVisualizableView, we can
          // just fail silently here.
          //
          // TODO: Consider consolidating the user messaging for different
          // expected error cases here and not in their upstream functions.
          if (error !== null) {

            if (window.console && console.error) {
              console.error('Error selecting dataset: ', error);
            }

            exceptionNotifier.notify(error);
          }
        }
      );
  }

  function _chooseVisualizationMapOrChart(payload) {
    _state.step = WIZARD_STEP.CONFIGURE_MAP_OR_CHART;

    StorytellerUtils.assertIsOneOfTypes(payload.domain, 'string');

    var mapChartError = function() {

      /* eslint-disable no-alert */
      alert(
        I18n.t('editor.asset_selector.visualization.choose_map_or_chart_error')
      );
      /* eslint-enable no-alert */
    };

    _getView(payload.domain, payload.mapOrChartUid).
      then(
        function(viewData) {
          var isChartOrMapView = (
            _.isPlainObject(viewData) &&
            (
              viewData.displayType === 'chart' ||
              viewData.displayType === 'map'
            )
          );

          if (isChartOrMapView) {

            _setComponentPropertiesFromViewData(viewData);
            self._emitChange();
          } else {
            mapChartError();
          }
        }
      ).
      catch(
        function() {

          mapChartError();
        }
      );
  }

  function _setUpTableFromSelectedDataset() {
    var visualization;
    // TODO We need an official story for handling row unit.
    // view.rowLabel exists, but does not provide the pluralized form.
    // Also, we don't sync this information to the NBE today.
    // This record/records hardcoding is also done by VisualizationAddController
    // in Data Lens.
    var unit = I18n.t('editor.visualizations.default_unit');
    var defaultSortColumn;
    StorytellerUtils.assertHasProperties(
      _state,
      'componentProperties.dataset.domain',
      'componentProperties.dataset.datasetUid',
      'dataset.columns'
    );
    StorytellerUtils.assert(
      _state.componentType === 'socrata.visualization.table',
      'Visualization under construction is not a table, cannot proceed. Was: ' + _state.componentType
    );

    StorytellerUtils.assert(_state.dataset.columns.length > 0, 'dataset must have at least one column');
    defaultSortColumn = _state.dataset.columns[0];

    visualization = {
      'type': 'table',
      'unit': unit,
      'title': _.get(_state, 'dataset.name', ''),
      'domain': _state.componentProperties.dataset.domain,
      'format': {
        'type': 'visualization_interchange_format',
        'version': 1
      },
      'origin': {
        'url': window.location.toString().replace(/\/edit$/, ''),
        'type': 'storyteller_asset_selector'
      },
      'filters': [],
      'createdAt': (new Date()).toISOString(),
      'datasetUid': _state.componentProperties.dataset.datasetUid,
      'aggregation': {
        'field': null,
        'function': 'count'
      },
      'description': _.get(_state, 'dataset.description', ''),
      'configuration': {
        'order': [
          {
            'ascending': true,
            'columnName': defaultSortColumn.fieldName
          }
        ],
        'localization': {}
      }
    };

    _state.componentProperties = {
      vif: visualization,
      dataset: _state.componentProperties.dataset,
      originalUid: null
    };
  }

  function _visualizeAsChart() {
    _state.step = WIZARD_STEP.CONFIGURE_VISUALIZATION;
    self._emitChange();
  }

  // Given a dataset domain, uid, and view metadata, sets:
  // * _state.componentProperties.dataset.domain,
  // * _state.componentProperties.dataset.datasetUid,
  // * _state.dataset
  function _setComponentPropertiesFromViewData(viewData) {
    StorytellerUtils.assertIsOneOfTypes(viewData, 'object');
    StorytellerUtils.assertHasProperties(viewData,
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

  function _getNbeView(domain, obeUid) {
    var migrationsUrl = StorytellerUtils.format(
      'https://{0}/api/migrations/{1}.json',
      domain,
      obeUid
    );

    return httpRequest('GET', migrationsUrl).
      then(
        function(migrationData) {
          return _getView(domain, migrationData.nbeId);
        }
      ).
      catch(
        function(error) {
          var noMigrationMatch = error.
            message.
              match('Cannot find migration info for view with id');

          // We expect to get 404s back for calls to /api/migrations for
          // OBE datasets with no corresponding NBE dataset, so let's not
          // notify Airbrake if this is the case. (This isn't a great
          // approach but it seems better than treating 404s as a special
          // case in httpRequest and then needing to explicitly check for
          // 404s in every place that we use it).
          if (noMigrationMatch === null) {
            exceptionNotifier.notify(error);
          }

          // Because this error is already notified here we do not need to
          // propagate it upward where the return vaule may be misinterpreted.
          return null;
        }
      );
  }

  function _getView(domain, uid) {
    // Fetch the view info.
    // NOTE: Beware that view.metadata is not sync'd across to the NBE
    // as of this writing. If you need to get info out of view.metadata
    // (like rowLabel), you'll need to fetch the OBE view separately.
    // Also, I CAN'T BELIEVE I'M WRITING THIS AGAIN
    var viewUrl = StorytellerUtils.format(
      'https://{0}/api/views/{1}.json?read_from_nbe=true',
      domain,
      uid
    );

    return httpRequest('GET', viewUrl).
      then(
        function(viewData) {

          // Retcon the domain into the view data.
          // We'd have to pass it around like 5 methods
          // otherwise.
          viewData.domain = domain;

          return viewData;
        },
        function(error) {

          if (self.getStep() === WIZARD_STEP.CONFIGURE_MAP_OR_CHART) {
            _state.step = WIZARD_STEP.SELECT_MAP_OR_CHART_VISUALIZATION_FROM_CATALOG;
          } else if (self.getStep() === WIZARD_STEP.CONFIGURE_VISUALIZATION) {
            _state.step = WIZARD_STEP.SELECT_DATASET_FOR_VISUALIZATION;
          } else if (self.getStep() === WIZARD_STEP.TABLE_PREVIEW) {
            _state.step = WIZARD_STEP.SELECT_TABLE_FROM_CATALOG;
          } else {
            _state.step = WIZARD_STEP.SELECT_ASSET_PROVIDER;
          }

          self._emitChange();

          exceptionNotifier.notify(error);
          /* eslint-disable no-alert */
          alert(I18n.t('editor.asset_selector.visualization.choose_dataset_error'));
          /* eslint-enable no-alert */

          return null;
        }
      );
  }

  function _updateVisualizationConfiguration(payload) {
    var visualization = payload.visualization.data;

    if (_.isEmpty(visualization)) {
      _state.componentType = null;
      _state.componentProperties = {
        dataset: _state.componentProperties.dataset
      };

      self._emitChange();
    } else if (payload.visualization.format === 'classic') {
      _state.componentType = 'socrata.visualization.classic';
      _state.componentProperties = {
        visualization: visualization,
        dataset: _state.componentProperties.dataset,
        originalUid: payload.visualization.originalUid
      };

      self._emitChange();
    } else if (payload.visualization.format === 'vif') {
      StorytellerUtils.assertHasProperty(
        _state,
        'componentProperties.dataset'
      );

      _state.componentType = StorytellerUtils.format('socrata.visualization.{0}', visualization.type);
      _state.componentProperties = {
        vif: visualization,
        dataset: _state.componentProperties.dataset,
        originalUid: payload.visualization.originalUid
      };

      self._emitChange();
    } else if (payload.visualization.format === 'vif2') {
      _state.componentType = StorytellerUtils.format('socrata.visualization.{0}', visualization.series[0].type);
      _state.componentProperties = {
        vif: visualization,
        dataset: _state.componentProperties.dataset,
        originalUid: payload.visualization.originalUid
      };
    }
  }

  function _updateDroppedImage(payload) {
    var hasFiles = Array.isArray(payload.files) && payload.files.length > 0;
    var previouslyDroppedImage = self.getDroppedImage();
    var fileChanged =  _.isNull(previouslyDroppedImage) || (previouslyDroppedImage.name !== payload.files[0].name);

    if (hasFiles && fileChanged) {
      _state.droppedImage = payload.files[0];
      self._emitChange();
    }
  }

  function upload(payload) {
    StorytellerUtils.assertHasProperty(payload, 'id');

    var crop = getImageComponent(self.getComponentValue()).crop;
    var hasCrop = crop && crop.x !== 0 && crop.y !== 0 && crop.width !== 100 && crop.height !== 100;
    var isNotHTMLFragment = _.isEmpty(payload.file) || !self.isHTMLFragment(payload.file.name);

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

  fileUploaderStore.addChangeListener(function() {
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
    var type = self.getComponentType();
    var image = {
      documentId: file.resource.id,
      url: file.resource.url,
      crop: _state.componentProperties.crop
    };

    if (type === 'author') {
      _state.componentProperties = _.merge(
        _state.componentProperties,
        { image: image }
      );
    } else {
      _state.componentProperties = _.merge(
        _state.componentProperties,
        image
      );
    }

    self._emitChange();
  }

  function _updateImageUploadError(payload) {
    var value = self.getComponentValue();

    if (!_.isUndefined(payload.error.reason)) {
      _.set(value, 'reason', payload.error.reason);
    }

    self._emitChange();
  }

  function _updateImageAltAttribute(payload) {
    var value = self.getComponentValue();
    var altAttribute = payload.altAttribute;

    if (_state.componentType === 'image') {
      value.alt = altAttribute;
    } else {
      throw new Error(
        StorytellerUtils.format(
          'Component type is {0}. Cannot update alt attribute.',
          _state.componentType
        )
      );
    }

    self._emitChange();
  }

  function _updateStoryUrl(payload) {
    _state.componentType = 'story.tile';

    var openInNewWindow = _.get(_state.componentProperties, 'openInNewWindow', false);

    _state.componentProperties = _.merge(
      _componentPropertiesFromStoryUrl(payload.url),
      { openInNewWindow: openInNewWindow }
    );

    self._emitChange();
  }

  function _updateStoryWindowTarget() {
    StorytellerUtils.assertEqual(_state.componentType, 'story.tile');

    _state.componentProperties.openInNewWindow = !_state.componentProperties.openInNewWindow;

    self._emitChange();
  }

  function _updateGoalUrl(payload) {
    var goalDomain = _extractDomainFromGoalUrl(payload.url);
    var goalUid = _extractGoalUidFromGoalUrl(payload.url);

    _state.componentType = 'goal.tile';

    _state.componentProperties = {
      domain: goalDomain,
      goalUid: goalUid,
      goalFullUrl: payload.url
    };

    self._emitChange();
  }

  function _updateYoutubeUrl(payload) {

    var youtubeId = _extractIdFromYoutubeUrl(payload.url);
    var youtubeUrl = null;

    if (youtubeId !== null) {
      youtubeUrl = payload.url;
    }

    _state.componentType = 'youtube.video';

    _state.componentProperties = {
      id: youtubeId,
      url: youtubeUrl
    };

    self._emitChange();
  }

  function setProvider(payload) {
    StorytellerUtils.assertHasProperty(payload, 'provider');

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
        throw new Error(
          StorytellerUtils.format(
            'Unsupported provider: {0}',
            payload.provider
          )
        );
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
      return $('<a href="' + url + '">').get(0);
    } else {
      return null;
    }
  }

  function _componentPropertiesFromStoryUrl(url) {
    var parsedUrl = _parseUrl(url);
    if (!parsedUrl) { return {}; }

    if (parsedUrl.pathname.indexOf(Constants.VIEW_PREFIX_PATH) === 0) {
      // Find the last thing in the url that looks like a uid (4x4).
      // We can't take the first thing because our story title may look
      // like a 4x4, and it comes first.
      var uid = _(
        parsedUrl.pathname.substring(Constants.VIEW_PREFIX_PATH.length).split('/')
      ).
      compact(). // Removes blank strings.
      findLast(function(c) {
        return c.match(Constants.FOUR_BY_FOUR_PATTERN);
      });

      if (uid) {
        return { domain: parsedUrl.hostname, storyUid: uid };
      }
    }

    return {};
  }

  function _extractDomainFromGoalUrl(goalUrl) {
    var match = goalUrl.match(/^https\:\/\/([a-z0-9\.\-]{3,})\/(?:.*)stat\/goals\/.*$/i);
    var goalDomain = null;

    if (match !== null) {
      goalDomain = match[1];
    }

    return goalDomain;
  }

  function _extractGoalUidFromGoalUrl(goalUrl) {
    var dashboardGoalRegex = /^https:\/\/.+\/stat\/goals\/(?:default|\w{4}-\w{4})\/\w{4}-\w{4}\/(\w{4}-\w{4})$/i;
    var singleGoalRegex = /^https:\/\/.+\/stat\/goals\/single\/(\w{4}-\w{4})$/i;
    var goalUid = null;

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

    var youtubeId = null;
    var patterns = Constants.YOUTUBE_URL_PATTERNS;
    var tokens;

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
        tokens = youtubeUrl.split(/[\/\&\?=#\.\s]/g);

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
    var htmlFragmentUrl = resource.url;
    var documentId = resource.id;

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
