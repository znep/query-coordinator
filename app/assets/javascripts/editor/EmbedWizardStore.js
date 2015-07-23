;var EmbedWizardStore = (function() {

  'use strict';

  function EmbedWizardStore() {

    var self = this;
    var _currentWizardState = null;
    var _currentBlockId = null;
    var _currentComponentIndex = null;
    var _currentProviderOptions = {
      provider: 'wizard'
    };

    window.dispatcher.register(function(payload) {

      var action = payload.action;

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
        value: _currentProviderOptions
      };
    };

    this.isValid = function() {

      var valid = false;

      if (_currentProviderOptions) {

        switch (_currentProviderOptions.provider) {

          default:
            break;
        }
      }

      return valid;
    };

    /**
     * Private methods
     */

    function _chooseProvider(payload) {

      _currentBlockId = payload.blockId;
      _currentComponentIndex = payload.componentIndex;

      self._emitChange();
    }

    function _closeDialog() {

      _currentWizardState = null;
      _currentBlockId = null;
      _currentComponentIndex = null;
      _currentProviderOptions = {
        provider: 'wizard',
      };

      self._emitChange();
    }
  }

  return EmbedWizardStore;
})();
