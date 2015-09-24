(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function AssetSelectorStore() {

    _.extend(this, new storyteller.Store());

    var self = this;
    var _currentSelectorState = null;
    var _currentBlockId = null;
    var _currentComponentIndex = null;
    var _currentComponentType = 'assetSelector';
    var _currentComponentProperties = _getDefaultComponentProperties();

    this.register(function(payload) {

      var action;

      utils.assertHasProperty(payload, 'action');

      action = payload.action;

      // Note that we do not assign `_currentSelectorState` the value of action
      // outside of the case statements because ALL events will pass through
      // this function and we only want to alter `_currentSelectorState` in
      // response to actions that are actually relevant.
      switch (action) {

        case Actions.ASSET_SELECTOR_CHOOSE_PROVIDER:
          _currentSelectorState = action;
          _chooseProvider(payload);
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_YOUTUBE:
          _currentSelectorState = action;
          _chooseYoutube();
          break;

        case Actions.ASSET_SELECTOR_UPDATE_YOUTUBE_URL:
          _updateYoutubeUrl(payload);
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION:
          _currentSelectorState = action;
          _chooseVisualization();
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_VISUALIZATION_DATASET:
          _currentSelectorState = action;
          _chooseVisualizationDataset(payload);
          break;

        case Actions.ASSET_SELECTOR_UPDATE_VISUALIZATION_CONFIGURATION:
          _updateVisualizationConfiguration(payload);
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_IMAGE_UPLOAD:
          _currentSelectorState = action;
          _chooseImageUpload();
          break;

        case Actions.FILE_UPLOAD_PROGRESS:
          _currentSelectorState = action;
          _updateImageUploadProgress(payload);
          break;

        case Actions.FILE_UPLOAD_DONE:
          _currentSelectorState = action;
          _updateImagePreview(payload);
          break;

        case Actions.FILE_UPLOAD_ERROR:
          _currentSelectorState = action;
          _updateImageUploadError(payload);
          break;

        case Actions.ASSET_SELECTOR_CHOOSE_EMBED_CODE:
          _currentSelectorState = action;
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

    this.getCurrentSelectorState = function() {
      return _currentSelectorState;
    };

    this.getCurrentBlockId = function() {
      return _currentBlockId;
    };

    this.getCurrentComponentIndex = function() {
      return _currentComponentIndex;
    };

    this.getCurrentComponentType = function() {
      return _currentComponentType;
    };

    this.getCurrentComponentValue = function() {
      return _currentComponentProperties;
    };

    this.isValid = function() {

      var valid = false;

      switch (_currentComponentProperties.provider) {

        case 'youtube':
          if (_currentComponentProperties.id !== null &&
            _currentComponentProperties.url !== null) {

            valid = true;
          }
          break;

        default:
          break;
      }

      return valid;
    };

    /**
     * Private methods
     */

    function _chooseProvider(payload) {

      utils.assertHasProperties(payload, 'blockId', 'componentIndex');

      _currentBlockId = payload.blockId;
      _currentComponentIndex = payload.componentIndex;

      self._emitChange();
    }

    function _chooseYoutube() {

      self._emitChange();
    }

    function _chooseVisualization() {

      self._emitChange();
    }

    function _chooseImageUpload() {
      _cancelFileUploads();
      self._emitChange();
    }

    function _chooseEmbedCode() {
      _currentComponentProperties = {};
      _cancelFileUploads();
      self._emitChange();
    }

    function _chooseVisualizationDataset(payload) {
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
      _currentComponentProperties = {
        vif: {
          domain: window.location.host,
          datasetUid: uid
        }
      };

      self._emitChange();
    }

    function _updateVisualizationConfiguration(payload) {
      var vif = payload.vif;

      if (vif) {
        switch (vif.type) {
          case 'columnChart':
            _currentComponentType = 'socrata.visualization.columnChart';
            _currentComponentProperties = {
              vif: vif
            };
            break;
          case 'featureMap':
            _currentComponentType = 'socrata.visualization.featureMap';
            _currentComponentProperties = {
              vif: vif
            };
            break;
        }

        self._emitChange();
      }
    }

    function _updateImageUploadProgress(payload) {
      _currentComponentProperties = {
        percentLoaded: payload.percentLoaded
      };

      self._emitChange();
    }

    function _updateImagePreview(payload) {
      var imageUrl = payload.url;
      var documentId = payload.documentId;

      _currentComponentType = 'image';

      _currentComponentProperties = {
        documentId: documentId,
        url: imageUrl
      };

      self._emitChange();
    }

    function _updateImageUploadError(payload) {
      _currentComponentType = 'imageUploadError';

      _currentComponentProperties = {
        step: payload.error.step
      };

      if (!_.isUndefined(payload.error.reason)) {
        _currentComponentProperties.reason = payload.error.reason;
      }

      self._emitChange();
    }

    function _updateYoutubeUrl(payload) {

      var youtubeId = _extractIdFromYoutubeUrl(payload.url);
      var youtubeUrl = null;

      if (youtubeId !== null) {
        youtubeUrl = payload.url;
      }

      _currentComponentType = 'youtube.video';

      _currentComponentProperties = {
        id: youtubeId,
        url: youtubeUrl
      };

      self._emitChange();
    }

    function _closeDialog() {

      _currentSelectorState = null;
      _currentBlockId = null;
      _currentComponentIndex = null;
      _currentComponentProperties = _getDefaultComponentProperties();

      _cancelFileUploads();

      self._emitChange();
    }

    function _getDefaultComponentProperties() {
      return {};
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
      _currentComponentType = 'embeddedHtml';

      _currentComponentProperties = {
        percentLoaded: payload.percentLoaded
      };

      self._emitChange();
    }

    function _updateEmbedCodeError(payload) {
      _currentComponentProperties = {
        error: true,
        step: payload.error.step
      };

      if (!_.isUndefined(payload.error.reason)) {
        _currentComponentProperties.reason = payload.error.reason;
      }

      self._emitChange();
    }

    function _updateEmbedCodePreview(payload) {
      var htmlFragmentUrl = payload.url;

      _currentComponentType = 'embeddedHtml';

      _currentComponentProperties = {
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
