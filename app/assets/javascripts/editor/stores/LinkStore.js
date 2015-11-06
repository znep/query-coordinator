(function() {

  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function LinkStore() {
    _.extend(this, new storyteller.Store());

    var _self = this;
    var _inputs = null;
    var _visible = false;
    var _editorId = null;

    this.register(function(payload) {
      switch(payload.action) {
        case Actions.LINK_MODAL_SET_EDITOR:
          _setEditor(payload);
          break;
        case Actions.LINK_MODAL_CLOSE:
          _closeModal();
          break;
        case Actions.LINK_MODAL_OPEN:
          _openModal();
          break;
        case Actions.LINK_MODAL_FORMAT:
          _setInputs(payload);
          break;
      }
    });

    this.getEditorId = function() {
      return _editorId;
    };

    this.getVisibility = function() {
      return _visible;
    };

    this.getInputs = function() {
      return _inputs;
    }

    function _openModal() {
      _visible = true;
      _self._emitChange();
    }

    function _closeModal() {
      _visible = false;
      _inputs = null;
      _self._emitChange();
    }

    function _setEditor(payload) {
      utils.assert(payload, 'editorId');

      _editorId = payload.editorId;
      _self._emitChange();
    }

    function _setInputs(payload) {
      utils.assertHasProperties(payload, 'text', 'link');

      _inputs = {
        text: payload.text,
        link: payload.link
      };

      _self._emitChange();
    }
  }

  storyteller.LinkStore = LinkStore;
})();
