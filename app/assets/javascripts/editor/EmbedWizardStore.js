;var EmbedWizardStore = (function() {

  'use strict';

  function EmbedWizardStore() {

    var self = this;
    var _currentWizardState = null;
    var _currentBlockId = null;
    var _currentComponentIndex = null;
    var _currentComponentProperties = _getDefaultComponentProperties();

    window.dispatcher.register(function(payload) {

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

        case Constants.EMBED_WIZARD_CLOSE:
          _closeDialog();
          break;
      }
    });

    _.extend(self, new Store());

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
  }

  return EmbedWizardStore;
})();
