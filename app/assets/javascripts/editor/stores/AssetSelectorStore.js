(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  // The step in the asset selection flow the user is in.
  var WIZARD_STEP = {
    // Do you want a Socrata visualization, Youtube, an image, etc?
    SELECT_ASSET_PROVIDER: 'SELECT_ASSET_PROVIDER',

    ENTER_YOUTUBE_URL: 'ENTER_YOUTUBE_URL',

    ENTER_EMBED_CODE: 'ENTER_EMBED_CODE',

    // You want a Socrata visualization, so please choose your dataset.
    SELECT_DATASET_FOR_VISUALIZATION: 'SELECT_DATASET_FOR_VISUALIZATION',
    // You chose a dataset. Will it be displayed as a table or some other visualization?
    SELECT_TABLE_OR_CHART: 'SELECT_TABLE_OR_CHART',
    // You chose some other visualization. Please edit it to your liking.
    CONFIGURE_VISUALIZATION: 'CONFIGURE_VISUALIZATION',

    SELECT_IMAGE_TO_UPLOAD: 'SELECT_IMAGE_TO_UPLOAD',
    IMAGE_UPLOADING: 'IMAGE_UPLOADING',
    IMAGE_PREVIEW: 'IMAGE_PREVIEW',
    IMAGE_UPLOAD_ERROR: 'IMAGE_UPLOAD_ERROR'
  };

  function AssetSelectorStore() {

    _.extend(this, new storyteller.Store());

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

      var action;

      utils.assertHasProperty(payload, 'action');

      action = payload.action;

      switch (action) {

        case Actions.ASSET_SELECTOR_SELECT_ASSET_FOR_COMPONENT:
          _selectNew(payload);
          break;

        case Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED:
          _editExisting(payload);
          break;

        case Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL:
          _updateYoutubeUrl(payload);
          break;

        case Actions.ASSET_SELECTOR_PROVIDER_CHOSEN:
          switch (payload.provider) {
            case 'SOCRATA_VISUALIZATION':
              _chooseVisualization();
              break;
            case 'YOUTUBE':
              _chooseYoutube();
              break;
            case 'IMAGE':
              _chooseImageUpload();
              break;
            case 'EMBED_CODE':
              _chooseEmbedCode();
              break;
            default:
              throw new Error('Unsupported provider: {0}'.format(payload.provider));
          }
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET:
          _chooseVisualizationDataset(payload);
          break;

        case Actions.ASSET_SELECTOR_VISUALIZE_AS_TABLE:
          _visualizeAsTable(payload);
          break;

        case Actions.ASSET_SELECTOR_VISUALIZE_AS_CHART_OR_MAP:
          _visualizeAsChart(payload);
          break;

        case Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION:
          _updateVisualizationConfiguration(payload);
          break;

        case Actions.FILE_UPLOAD_PROGRESS:
          _updateImageUploadProgress(payload);
          break;

        case Actions.FILE_UPLOAD_DONE:
          _updateImagePreview(payload);
          break;

        case Actions.FILE_UPLOAD_ERROR:
          _updateImageUploadError(payload);
          break;

        case Actions.EMBED_CODE_UPLOAD_PROGRESS:
          _updateEmbedCodeProgress(payload);
          break;

        case Actions.EMBED_CODE_UPLOAD_ERROR:
          _updateEmbedCodeError(payload);
          break;

        case Actions.EMBED_CODE_UPLOAD_DONE:
          _updateEmbedCodePreview(payload);
          break;

        case Actions.ASSET_SELECTOR_CLOSE:
          _closeDialog();
          break;

        case Actions.ASSET_SELECTOR_RESUME_FROM_STEP:
          _resumeFromStep(payload);
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

    this.isEditingExisting = function() {
      return _state.isEditingExisting === true;
    };

    /**
     * Private methods
     */

    /**
     * Given an asset type (i.e. 'socrata.visualization.classic'), returns
     * the step the wizard should start from given the user is updating
     * a component.
     */
    function _stepForUpdate(type) {
      switch (type) {
        case 'image': return WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD;
        case 'youtube.video': return WIZARD_STEP.ENTER_YOUTUBE_URL;
        case 'embeddedHtml': return WIZARD_STEP.ENTER_EMBED_CODE;
      }

      if (type === 'socrata.visualization.table') {
        return WIZARD_STEP.SELECT_TABLE_OR_CHART;
      }

      if (type.indexOf('socrata.visualization.') === 0) {
        return WIZARD_STEP.CONFIGURE_VISUALIZATION;
      }

      // Something went wrong and we don't know where to pick up from (new embed type?),
      // so open the wizard at the very first step.
      return WIZARD_STEP.SELECT_ASSET_PROVIDER;
    }

    function _selectNew(payload) {
      utils.assertHasProperties(payload, 'blockId', 'componentIndex');

      _state = {
        step: WIZARD_STEP.SELECT_ASSET_PROVIDER,
        blockId: payload.blockId,
        componentIndex: payload.componentIndex,
        isEditingExisting: false
      };

      self._emitChange();
    }


    function _editExisting(payload) {
      var component;

      utils.assertHasProperties(payload, 'blockId', 'componentIndex');

      component = storyteller.storyStore.getBlockComponentAtIndex(
        payload.blockId,
        payload.componentIndex
      );

      _resumeFromStep(_.extend({}, payload, { step: _stepForUpdate(component.type) }));
    }

    function _resumeFromStep(payload) {
      var component;
      var datasetUid;

      utils.assertHasProperties(payload, 'blockId', 'componentIndex', 'step');

      component = storyteller.storyStore.getBlockComponentAtIndex(
        payload.blockId,
        payload.componentIndex
      );

      _state = {
        step: payload.step,
        blockId: payload.blockId,
        componentIndex: payload.componentIndex,
        componentType: component.type,
        componentProperties: component.value,
        isEditingExisting: true
      };

      datasetUid = _.get(component, 'value.dataset.datasetUid');
      if (datasetUid) {
        _setVisualizationDataset(datasetUid); // Fetch additional data needed for UI.
      } else {
        self._emitChange();
      }
    }

    function _chooseYoutube() {
      _state.step = WIZARD_STEP.ENTER_YOUTUBE_URL;
      self._emitChange();
    }

    function _chooseVisualization() {
      _state.step = WIZARD_STEP.SELECT_DATASET_FOR_VISUALIZATION;
      self._emitChange();
    }

    function _chooseImageUpload() {
      _state.step = WIZARD_STEP.SELECT_IMAGE_TO_UPLOAD;
      _cancelFileUploads();
      self._emitChange();
    }

    function _chooseEmbedCode() {
      _state.step = WIZARD_STEP.ENTER_EMBED_CODE;
      _state.componentProperties = {};
      _cancelFileUploads();
      self._emitChange();
    }

    function _chooseVisualizationDataset(payload) {
      _state.step = WIZARD_STEP.SELECT_TABLE_OR_CHART;
      if (payload.isNewBackend) {
        _setVisualizationDataset(payload.datasetUid);
      } else {
        // We have an OBE datasetId, go fetch the NBE datasetId
        $.get('/api/migrations/{0}.json'.format(payload.datasetUid)).
        then(
          function(migrationData) {
            _setVisualizationDataset(migrationData.nbeId);
          },
          function(error) {
            alert('This dataset cannot be chosen at this time.'); //eslint-disable-line no-alert
            storyteller.airbrake.notify(error);
          }
        );
      }
    }

    function _visualizeAsTable() {
      var visualization;
      // TODO We need an official story for handling row unit.
      // view.rowLabel exists, but does not provide the pluralized form.
      // Also, we don't sync this information to the NBE today.
      // This record/records hardcoding is also done by VisualizationAddController
      // in Data Lens.
      var unit = I18n.t('editor.visualizations.default_unit');
      var defaultSortColumn;
      utils.assertHasProperties(
        _state,
        'componentProperties.dataset.domain',
        'componentProperties.dataset.datasetUid',
        'dataset.columns'
      );

      utils.assert(_state.dataset.columns.length > 0, 'dataset must have at least one column');
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

      _state.componentType = 'socrata.visualization.table';
      _state.componentProperties = {
        vif: visualization,
        dataset: _state.componentProperties.dataset,
        originalUid: null
      };

      self._emitChange();
    }

    function _visualizeAsChart() {
      _state.step = WIZARD_STEP.CONFIGURE_VISUALIZATION;
      self._emitChange();
    }

    function _setVisualizationDataset(uid) {
      // Fetch the view info.
      // NOTE: Beware that view.metadata is not sync'd across to the NBE
      // as of this writing. If you need to get info out of view.metadata
      // (like rowLabel), you'll need to fetch the OBE view separately.
      $.get('/api/views/{0}.json'.format(uid)).then(
        function(data) {
          _state.componentProperties = {
            dataset: {
              domain: window.location.host,
              datasetUid: uid
            }
          };

          // Not going into _state.componentProperties, as we don't want this blob
          // to end up stored in the story component data.
          _state.dataset = _.cloneDeep(data);

          self._emitChange();
        },
        function(error) {
          storyteller.airbrake.notify(error);
          // TODO
          alert('This dataset cannot be chosen at this time.'); //eslint-disable-line no-alert
        }
      );
    }

    function _updateVisualizationConfiguration(payload) {
      var visualization = payload.visualization.data;

      if (payload.visualization.format === 'classic') {
        _state.componentType = 'socrata.visualization.classic';
        _state.componentProperties = {
          visualization: visualization,
          dataset: _state.componentProperties.dataset,
          originalUid: payload.visualization.originalUid
        };

        self._emitChange();
      } else if (payload.visualization.format === 'vif') {
        utils.assertHasProperty(
          _state,
          'componentProperties.dataset'
        );

        _state.componentType = 'socrata.visualization.{0}'.format(visualization.type);
        _state.componentProperties = {
          vif: visualization,
          dataset: _state.componentProperties.dataset,
          originalUid: payload.visualization.originalUid
        };

        self._emitChange();
      }
    }

    function _updateImageUploadProgress(payload) {
      _state.step = WIZARD_STEP.IMAGE_UPLOADING;
      _state.componentProperties = {
        percentLoaded: payload.percentLoaded
      };

      self._emitChange();
    }

    function _updateImagePreview(payload) {
      var imageUrl = payload.url;
      var documentId = payload.documentId;

      _state.step = WIZARD_STEP.IMAGE_PREVIEW;
      _state.componentType = 'image';

      _state.componentProperties = {
        documentId: documentId,
        url: imageUrl
      };

      self._emitChange();
    }

    function _updateImageUploadError(payload) {
      _state.step = WIZARD_STEP.IMAGE_UPLOAD_ERROR;
      _state.componentType = 'imageUploadError';

      _state.componentProperties = {
        step: payload.error.step
      };

      if (!_.isUndefined(payload.error.reason)) {
        _state.componentProperties.reason = payload.error.reason;
      }

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

      _cancelFileUploads();

      self._emitChange();
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

    function _updateEmbedCodeProgress(payload) {
      _state.componentType = 'embeddedHtml';

      _state.componentProperties = {
        percentLoaded: payload.percentLoaded
      };

      self._emitChange();
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

    function _updateEmbedCodePreview(payload) {
      var htmlFragmentUrl = payload.url;
      var documentId = payload.documentId;

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

    function _cancelFileUploads() {
      if (storyteller.fileUploader && storyteller.fileUploader !== null) {
        storyteller.fileUploader.destroy();
        storyteller.fileUploader = null;
      }
    }
  }

  AssetSelectorStore.WIZARD_STEP = WIZARD_STEP;

  root.socrata.storyteller.AssetSelectorStore = AssetSelectorStore;
})(window);
