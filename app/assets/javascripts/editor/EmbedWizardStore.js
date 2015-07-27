;window.socrata.storyteller.EmbedWizardStore = (function(storyteller) {

  'use strict';

  function EmbedWizardStore() {

    var Util = storyteller.Util;
    var self = this;
    var _currentWizardState = null;
    var _currentBlockId = null;
    var _currentComponentIndex = null;
    var _currentComponentProperties = _getDefaultComponentProperties();

    storyteller.dispatcher.register(function(payload) {

      var action;

      Util.assertHasProperty(payload, 'action');

      action = payload.action;

      // Note that we do not assign `_currentWizardState` the value of action
      // outside of the case statements because ALL events will pass through
      // this function and we only want to alter `_currentWizardState` in
      // response to actions that are actually relevant.
      switch (action) {

        case Constants.EMBED_WIZARD_CHOOSE_PROVIDER:
          _currentWizardState = action;
          _chooseProvider(payload);
          break;

        case Constants.EMBED_WIZARD_CHOOSE_YOUTUBE:
          _currentWizardState = action;
          _chooseYoutube();
          break;

        case Constants.EMBED_WIZARD_UPDATE_YOUTUBE_URL:
          _updateYouTubeUrl(payload);
          break;

        case Constants.EMBED_WIZARD_CLOSE:
          _closeDialog();
          break;
      }
    });

    _.extend(self, new storyteller.Store());

    /**
     * Public methods
     */

    this.getCurrentWizardState = function() {
      return _currentWizardState;
    };

    this.getCurrentBlockId = function() {
      return _currentBlockId;
    };

    this.getCurrentComponentIndex = function() {
      return _currentComponentIndex;
    };

    this.getCurrentComponentType = function() {
      return 'media';
    };

    this.getCurrentComponentValue = function() {

      return {
        type: 'embed',
        value: _currentComponentProperties
      };
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

      Util.assertHasProperties(payload, 'blockId', 'componentIndex');

      _currentBlockId = payload.blockId;
      _currentComponentIndex = payload.componentIndex;

      self._emitChange();
    }

    function _chooseYoutube() {

      self._emitChange();
    }

    function _updateYouTubeUrl(payload) {

      var youTubeId = _extractIdFromYouTubeUrl(payload.url);
      var youTubeUrl = null;

      if (youTubeId !== null) {
        youTubeUrl = payload.url;
      }

      _currentComponentProperties = {
        provider: 'youtube',
        id: youTubeId,
        url: youTubeUrl
      };

      self._emitChange();
    }

    function _closeDialog() {

      _currentWizardState = null;
      _currentBlockId = null;
      _currentComponentIndex = null;
      _currentComponentProperties = _getDefaultComponentProperties();

      self._emitChange();
    }

    function _getDefaultComponentProperties() {
      return {
        provider: 'wizard'
      };
    }

    /**
     * See: https://github.com/jmorrell/get-youtube-id/
     */
    function _extractIdFromYouTubeUrl(youTubeUrl) {

      var youTubeId = null;
      var patterns = Constants.YOUTUBE_URL_PATTERNS;
      var tokens;

      if (/youtu\.?be/.test(youTubeUrl)) {

        // If any pattern matches, return the ID
        for (var i = 0; i < patterns.length; ++i) {
          if (patterns[i].test(youTubeUrl)) {
            youTubeId = patterns[i].exec(youTubeUrl)[1];
            break;
          }
        }

        if (!youTubeId) {
          // If that fails, break it apart by certain characters and look
          // for the 11 character key
          tokens = youTubeUrl.split(/[\/\&\?=#\.\s]/g);

          for (i = 0; i < tokens.length; ++i) {
            if (/^[^#\&\?]{11}$/.test(tokens[i])) {
              youTubeId = tokens[i];
              break;
            }
          }
        }
      }

      return youTubeId;
    }
  }

  return EmbedWizardStore;
})(window.socrata.storyteller);
