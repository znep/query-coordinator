(function() {

  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function LinkModalStore() {
    _.extend(this, new storyteller.Store());

    var _self = this;
    var _inputs = null;
    var _visible = false;
    var _editorId = null;
    var _valid = false;
    var _urlValidity = false;
    var _accepted = false;

    this.register(function(payload) {
      switch (payload.action) {
        case Actions.LINK_MODAL_OPEN:
          _openModal(payload);
          break;
        case Actions.LINK_MODAL_CLOSE:
          _closeModal();
          break;
        case Actions.LINK_MODAL_UPDATE:
          _setInputs(payload);
          break;
        case Actions.LINK_MODAL_ACCEPT:
          _setAccepted(payload);
          break;
      }
    });

    this.getEditorId = function() {
      return _editorId;
    };

    this.getVisibility = function() {
      return _visible;
    };

    this.getAccepted = function() {
      return _accepted;
    };

    this.getInputs = function() {
      return _inputs;
    };

    this.getValidity = function() {
      return _valid;
    };

    this.getURLValidity = function() {
      return _urlValidity;
    };

    this.shouldSelectLink = function(editorId) {
      return editorId === _editorId && _visible;
    };

    this.shouldInsertLink = function(editorId) {
      return editorId === _editorId && _accepted;
    };

    function _openModal(payload) {
      utils.assertHasProperty(payload, 'editorId');

      _visible = true;
      _editorId = payload.editorId;

      _setInputs(payload);
    }

    function _closeModal() {
      _visible = _valid = _urlValidity = _accepted = false;
      _inputs = null;

      _self._emitChange();
    }

    function _setAccepted(payload) {
      _accepted = true;
      _setInputs(payload);
    }

    function _setInputs(payload) {
      utils.assertHasProperties(payload, 'text', 'link', 'openInNewWindow');

      _inputs = {
        text: payload.text,
        link: payload.link,
        openInNewWindow: payload.openInNewWindow
      };

      _valid = typeof _inputs.text === 'string' &&
        (typeof _inputs.link === 'string' && _inputs.link.length > 0);

      _urlValidity = (typeof _inputs.link === 'string' && _inputs.link.length === 0) || /^https?:\/\/.+/.test(_inputs.link);

      _self._emitChange();
    }
  }

  storyteller.LinkModalStore = LinkModalStore;
})();
