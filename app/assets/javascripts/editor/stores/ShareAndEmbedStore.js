(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function ShareAndEmbedStore() {

    _.extend(this, new storyteller.Store());

    var _currentOpenState = false;
    var self = this;

    this.register(function(payload) {
      var action;

      utils.assertHasProperty(payload, 'action');

      action = payload.action;

      // Note that we do not assign `_currentOpenState` the value of action
      // outside of the case statements because ALL events will pass through
      // this function and we only want to alter `_currentSelectorState` in
      // response to actions that are actually relevant.
      switch (action) {

        case Actions.SHARE_AND_EMBED_MODAL_OPEN:
          _openDialog();
          break;

        case Actions.SHARE_AND_EMBED_MODAL_CLOSE:
          _closeDialog();
          break;
      }
    });

    /**
     * Public methods
     */

    this.isOpen = function() {
      return _currentOpenState;
    };

    this.getStoryUrl = function() {
      return '{0}/stories/s/{1}'.format(
        window.location.origin,
        window.userStoryData.uid
      );
    };

    this.getStoryWidgetUrl = function() {
      return '{0}/widget'.format(this.getStoryUrl());
    };

    this.getStoryEmbedCode = function() {
      return (
        '<iframe ' +
          'src="{0}" ' +
          'style="' +
            'width:600px;' +
            'height:320px;' +
            'background-color:transparent;' +
            'overflow:hidden;' +
          '" ' +
          'scrolling="no" ' +
          'frameborder="0">' +
        '</iframe>').
      format(
        this.getStoryWidgetUrl()
      );
    };

    /**
     * Private methods
     */

    function _openDialog() {
      _currentOpenState = true;

      self._emitChange();
    }

    function _closeDialog() {
      _currentOpenState = false;

      self._emitChange();
    }
  }

  root.socrata.storyteller.ShareAndEmbedStore = ShareAndEmbedStore;
})(window);
