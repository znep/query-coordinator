(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

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

        case Actions.ASSET_SELECTOR_CHOOSE_PROVIDER:
          _chooseProvider(payload);
          break;

        case Actions.ASSET_SELECTOR_EDIT_EXISTING:
          _editExisting(payload);
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_YOUTUBE:
          _chooseYoutube();
          break;

        case Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL:
          _updateYoutubeUrl(payload);
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION:
          _chooseVisualization();
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET:
          _chooseVisualizationDataset(payload);
          break;

        case Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION:
          _updateVisualizationConfiguration(payload);
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD:
          _chooseImageUpload();
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

        case Actions.ASSET_SELECTOR_CHOOSE_EMBED_CODE:
          _chooseEmbedCode();
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
      }
    });

    /**
     * Public methods
     */

    // TODO document which values this can have.
    // Currently can be a random-ish assortment of
    // action names that may or may not have any
    // relation to how this Store entered a given
    // step.
    //
    // We should not be returning Action names here.
    // Each step should be part of an enum defined
    // by AssetSelectorStore itself.
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

    /**
     * Private methods
     */

    /**
     * Given an asset type (i.e. "socrata.visualization.classic"), returns
     * the action name for the final step in the wizard.
     */
    function _mapComponentTypeToFinalEditStep(type) {
      switch (type) {
        case 'image': return Actions.FILE_UPLOAD_DONE;
        case 'youtube.video': return Actions.ASSET_SELECTOR_CHOOSE_YOUTUBE;
        case 'embeddedHtml': return Actions.ASSET_SELECTOR_CHOOSE_EMBED_CODE;
      }

      if (type.indexOf('socrata.visualization.') === 0) {
        return Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET;
      }

      // Something went wrong and we don't know where to pick up from (new embed type?),
      // so open the wizard at the very first step.
      return Actions.ASSET_SELECTOR_CHOOSE_PROVIDER;
    }

    function _editExisting(payload) {
      var component;

      utils.assertHasProperties(payload, 'blockId', 'componentIndex');

      component = storyteller.storyStore.getBlockComponentAtIndex(
        payload.blockId,
        payload.componentIndex
      );

      _state = {
        step: _mapComponentTypeToFinalEditStep(component.type),
        blockId: payload.blockId,
        componentIndex: payload.componentIndex,
        componentType: component.type,
        componentProperties: component.value
      };

      self._emitChange();
    }

    function _chooseProvider(payload) {
      utils.assertHasProperties(payload, 'blockId', 'componentIndex');
      _state.step = Actions.ASSET_SELECTOR_CHOOSE_PROVIDER;

      _state.blockId = payload.blockId;
      _state.componentIndex = payload.componentIndex;

      self._emitChange();
    }

    function _chooseYoutube() {
      _state.step = Actions.ASSET_SELECTOR_CHOOSE_YOUTUBE;
      self._emitChange();
    }

    function _chooseVisualization() {
      _state.step = Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION;
      self._emitChange();
    }

    function _chooseImageUpload() {
      _state.step = Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD;
      _cancelFileUploads();
      self._emitChange();
    }

    function _chooseEmbedCode() {
      _state.step = Actions.ASSET_SELECTOR_CHOOSE_EMBED_CODE;
      _state.componentProperties = {};
      _cancelFileUploads();
      self._emitChange();
    }

    function _chooseVisualizationDataset(payload) {
      _state.step = Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET;
      if (payload.isNewBackend) {
        _setVisualizationDatasetUid(payload.datasetUid);
      } else {
        // We have an OBE datasetId, go fetch the NBE datasetId
        $.get('/api/migrations/{0}.json'.format(payload.datasetUid)).
          done(function(data) {
            _setVisualizationDatasetUid(data.nbeId);
          }).
          fail(function() {
            alert('This dataset cannot be chosen at this time.'); //eslint-disable-line no-alert
          });
      }
    }

    function _setVisualizationDatasetUid(uid) {
      _state.componentProperties = {
        dataset: {
          domain: window.location.host,
          datasetUid: uid
        }
      };

      self._emitChange();
    }

    function _updateVisualizationConfiguration(payload) {
      var visualization = payload.visualization.data;

      if (payload.visualization.format === 'classic') {
        _state.componentType = 'socrata.visualization.classic';
        _state.componentProperties = {
          visualization: visualization
        };

        self._emitChange();
      } else if (payload.visualization.format === 'vif') {
        _state.componentType = 'socrata.visualization.{0}'.format(visualization.type);
        _state.componentProperties = {
          vif: visualization
        };

        self._emitChange();
      }
    }

    function _updateImageUploadProgress(payload) {
      _state.step = Actions.FILE_UPLOAD_PROGRESS;
      _state.componentProperties = {
        percentLoaded: payload.percentLoaded
      };

      self._emitChange();
    }

    function _updateImagePreview(payload) {
      var imageUrl = payload.url;
      var documentId = payload.documentId;

      _state.step = Actions.FILE_UPLOAD_DONE;
      _state.componentType = 'image';

      _state.componentProperties = {
        documentId: documentId,
        url: imageUrl
      };

      self._emitChange();
    }

    function _updateImageUploadError(payload) {
      _state.step = Actions.FILE_UPLOAD_ERROR;
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

      _state.componentType = 'embeddedHtml';

      _state.componentProperties = {
        url: htmlFragmentUrl,
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

  root.socrata.storyteller.AssetSelectorStore = AssetSelectorStore;
})(window);
