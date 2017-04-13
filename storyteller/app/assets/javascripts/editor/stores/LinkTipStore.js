import _ from 'lodash';

import Store from './Store';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';

/**
 * @class LinkTipStore
 * @description
 * Maintains the state of the in-line link editing tooltip.
 *
 * This tooltip has four major actions:
 * - LINK_TIP_OPEN: which opens the link attached to the specified editorId.
 * - LINK_TIP_REMOVE: enforces removal of the link wihin the editorId instance.
 * - LINK_TIP_CLOSE: which closes the link attached to the specified editorId.
 *
 * And one related action:
 * - LINK_MODAL_ACCEPT: when new information is saved into the same link the
 *   link tip is editing, it waits for acceptance within our primary link
 *   editing interface which is accessed through the RichTextToolbar.
 *   The saved state is mirrored here.
 */
export var linkTipStore = new LinkTipStore();
export default function LinkTipStore() {
  _.extend(this, new Store());

  var _self = this;
  var _visible = false;
  var _remove = false;
  var _inputs = null;
  var _boundingClientRect = null;
  var _editorId = null;

  this.register(function(payload) {
    switch (payload.action) {
      case Actions.LINK_TIP_OPEN:
        _openTip(payload);
        break;
      case Actions.LINK_MODAL_ACCEPT:
        _setInputs(payload);
        break;
      case Actions.LINK_TIP_CLOSE:
        _closeTip();
        break;
      case Actions.LINK_TIP_REMOVE:
        _removeLink();
        _closeTip();
        break;
    }
  });

  this.getEditorId = function() {
    return _editorId;
  };

  this.getBoundingClientRect = function() {
    return _boundingClientRect;
  };

  this.getVisibility = function() {
    return _visible;
  };

  this.getInputs = function() {
    return _inputs;
  };

  this.shouldRemoveLink = function(editorId) {
    return editorId === _editorId && _remove;
  };

  function _removeLink() {
    _remove = true;
    _self._emitChange();
  }

  function _openTip(payload) {
    StorytellerUtils.assertHasProperties(payload, 'text', 'link', 'editorId', 'openInNewWindow', 'boundingClientRect');

    _visible = true;
    _editorId = payload.editorId;

    _inputs = {
      text: payload.text,
      link: payload.link,
      openInNewWindow: payload.openInNewWindow
    };

    _boundingClientRect = payload.boundingClientRect;

    _self._emitChange();
  }

  function _setInputs(payload) {
    StorytellerUtils.assertHasProperties(payload, 'text', 'link', 'openInNewWindow');

    _inputs = {
      text: payload.text,
      link: payload.link,
      openInNewWindow: payload.openInNewWindow
    };

    _self._emitChange();
  }

  function _closeTip() {
    _visible = _remove = false;
    _inputs = _boundingClientRect = _editorId = null;

    _self._emitChange();
  }
}