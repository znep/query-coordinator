import _ from 'lodash';

import Store from './Store';
import Actions from '../Actions';
import { assertHasProperty, assertHasProperties } from 'common/js_utils';

export var linkModalStore = new LinkModalStore();
export default function LinkModalStore() {
  _.extend(this, new Store());

  var self = this;
  var inputs = null;
  var visible = false;
  var editorId = null;
  var valid = false;
  var urlValidity = false;
  var accepted = false;

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
    return editorId;
  };

  this.getVisibility = function() {
    return visible;
  };

  this.getAccepted = function() {
    return accepted;
  };

  this.getInputs = function() {
    return inputs;
  };

  this.getValidity = function() {
    return valid;
  };

  this.getURLValidity = function() {
    return urlValidity;
  };

  this.shouldSelectLink = function(targetEditorId) {
    return editorId === targetEditorId && visible;
  };

  this.shouldInsertLink = function(targetEditorId) {
    return editorId === targetEditorId && accepted;
  };

  function _openModal(payload) {
    assertHasProperty(payload, 'editorId');

    visible = true;
    editorId = payload.editorId;

    _setInputs(payload);
  }

  function _closeModal() {
    visible = valid = urlValidity = accepted = false;
    inputs = null;

    self._emitChange();
  }

  function _setAccepted(payload) {
    accepted = true;
    _setInputs(payload);
  }

  function _setInputs(payload) {
    assertHasProperties(payload, 'text', 'link', 'openInNewWindow');

    var urlRegex = /^https?:\/\/.+\../;
    var emailRegex = /^(mailto:)?.+@./;

    inputs = {
      text: payload.text,
      link: payload.link,
      openInNewWindow: payload.openInNewWindow
    };

    valid = _.isString(inputs.text) && _.isString(inputs.link) && inputs.link.length > 0;

    urlValidity = urlRegex.test(inputs.link) || emailRegex.test(inputs.link);

    // If we have an email address without a protocol, inject the protocol.
    if (emailRegex.test(inputs.link) && !_.startsWith(inputs.link, 'mailto:')) {
      inputs.link = `mailto:${inputs.link}`;
    }

    self._emitChange();
  }
}
