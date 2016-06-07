import $ from 'jQuery';
import _ from 'lodash';

import I18n from '../I18n';
import Store from './Store';
import Actions from '../Actions';
import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { storyStore } from './StoryStore';
import {fileUploaderStore, STATUS} from './FileUploaderStore';
import httpRequest from '../../services/httpRequest';
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
  var isCreatingTable = intendedComponentType === 'socrata.visualization.table';
  var hasQuery = !_.isEmpty(viewData.query);
  var hasGroupBys = !_.isEmpty(_.get(viewData, 'query.groupBys'));

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

  if (viewData.newBackend) {
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

      case Actions.FILE_UPLOAD:
        _upload(payload);
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

  this.getFileId = function() {
    return _.get(_state, 'fileId', null);
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
      isEditingExisting: true
    };

    domain = _.get(component, 'value.dataset.domain');
    datasetUid = _.get(component, 'value.dataset.datasetUid');

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
    if (viewIsDirectlyVisualizable(_state.componentType, originalViewData)) {
      return Promise.resolve(originalViewData);
    } else {
      return _getNbeView(originalViewData.domain, originalViewData.id).then(
        function(nbeViewData) {
          // We should be able to handle all NBE datasets.
          StorytellerUtils.assert(
            viewIsDirectlyVisualizable(_state.componentType, nbeViewData),
            'All versions of this dataset deemed unfit for visualization!'
          );
          return nbeViewData;
        },
        function() {
          // No migration. Give up.
          alert(I18n.t('editor.asset_selector.visualization.choose_dataset_unsupported_error')); //eslint-disable-line no-alert
          return Promise.reject();
        }
      );
    }
  }

  function _chooseVisualizationDataset(payload) {
    StorytellerUtils.assertIsOneOfTypes(payload.domain, 'string');
    StorytellerUtils.assertIsOneOfTypes(payload.datasetUid, 'string');

    _getView(payload.domain, payload.datasetUid).then(
      _getVisualizableView
    ).then(function(viewData) {
      var isCreatingTable = (_state.componentType === 'socrata.visualization.table');
      _setComponentPropertiesFromViewData(viewData);

      if (isCreatingTable) {
        _setUpTableFromSelectedDataset();
        _state.step = WIZARD_STEP.TABLE_PREVIEW;
      } else if (_state.isAuthoringVisualization && Environment.ENABLE_VISUALIZATION_AUTHORING_WORKFLOW && Environment.ENABLE_SVG_VISUALIZATIONS) {
        _state.step = WIZARD_STEP.AUTHOR_VISUALIZATION;
      } else {
        _state.step = WIZARD_STEP.CONFIGURE_VISUALIZATION;
      }
      self._emitChange();
    }).catch(function(error) {

      if (window.console && console.error) {
        console.error('Error selecting dataset: ', error);
      }

      exceptionNotifier.notify(error);
    });
  }

  function _chooseVisualizationMapOrChart(payload) {
    _state.step = WIZARD_STEP.CONFIGURE_MAP_OR_CHART;

    StorytellerUtils.assertIsOneOfTypes(payload.domain, 'string');

    var mapChartError = function(jqXhr, textStatus, error) { //eslint-disable-line no-unused-vars
      alert(I18n.t('editor.asset_selector.visualization.choose_map_or_chart_error')); //eslint-disable-line no-alert
    };

    _getView(payload.domain, payload.mapOrChartUid).then(
      function(viewData) {
        if (viewData.displayType === 'chart' || viewData.displayType === 'map') {
          _setComponentPropertiesFromViewData(viewData);
          self._emitChange();
        } else {
          mapChartError();
        }
      },
      mapChartError
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
      catch(exceptionNotifier.notify);
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

  function _upload(payload) {
    var isNotHTMLFragment = !self.isHTMLFragment(payload.file.name);

    _state.fileId = payload.id;

    if (isNotHTMLFragment) {
      _state.step = WIZARD_STEP.IMAGE_UPLOADING;
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
      case STATUS.PROGRESSING:
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
        _state.step = WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD;
        self._emitChange();
        break;
      case STATUS.COMPLETED:
        _state.fileId = null;
        _updateImagePreview({resource: file.resource});
        break;
      case STATUS.ERRORED:
        _state.fileId = null;
        _updateImageUploadError({error: {reason: file.message}});
        break;
      case STATUS.SIGNED:
      case STATUS.ACKNOWLEDGED:
      case STATUS.PROGRESSING:
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

      if (self.isHTMLFragment(file.raw.name)) {
        _handleEmbedCodeFragment(file);
      } else {
        _handleImage(file);
      }
    }
  });

  function _updateImagePreview(payload) {
    var imageUrl = payload.resource.url;
    var documentId = payload.resource.id;
    var componentType = _state.componentType;

    _state.step = WIZARD_STEP.IMAGE_PREVIEW;

    if (componentType === 'image') {
      _state.componentProperties = {
        documentId: documentId,
        url: imageUrl
      };
    } else if (componentType === 'hero') {
      var html = _.get(_state, 'componentProperties.html'); // Preserve any previous HTML content.

      _state.componentProperties = {
        documentId: documentId,
        url: imageUrl
      };

      if (html) {
        _state.componentProperties.html = html;
      }
    } else if (componentType === 'author') {
      _.set(_state.componentProperties, 'image.documentId', documentId);
      _.set(_state.componentProperties, 'image.url', imageUrl);
    } else {
      throw new Error('Don\'t know how to set image values for component: ' + _state.componentType);
    }

    self._emitChange();
  }

  function _updateImageUploadError(payload) {
    _state.step = WIZARD_STEP.IMAGE_UPLOAD_ERROR;
    _state.componentProperties = {};

    if (!_.isUndefined(payload.error.reason)) {
      _state.componentProperties.reason = payload.error.reason;
    }

    self._emitChange();
  }

  function _updateImageAltAttribute(payload) {
    var altAttribute = payload.altAttribute;

    if (_state.componentType === 'image') {
      _state.componentProperties.alt = altAttribute;
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

  function _closeDialog() {

    _state = {};

    self._emitChange();
  }

  function _parseUrl(url) {
    if (url.match(/https?:\/\//)) {
      var a = document.createElement('a');
      a.href = url;
      return a;
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
    var match = goalUrl.match(/^https\:\/\/.*\/stat\/goals\/(?:default|\w{4}\-\w{4})\/\w{4}\-\w{4}\/(\w{4}\-\w{4})/i);
    var goalUid = null;

    if (match !== null) {
      goalUid = match[1];
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
