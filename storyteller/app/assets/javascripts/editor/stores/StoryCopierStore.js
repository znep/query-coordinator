import _ from 'lodash';

import Store from './Store';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';

export var storyCopierStore = new StoryCopierStore();
export default function StoryCopierStore() {
  _.extend(this, new Store());

  var _currentOpenState = false;
  var self = this;

  this.register(function(payload) {
    StorytellerUtils.assertHasProperty(payload, 'action');

    var action = payload.action;
    switch (action) {
      case Actions.STORY_MAKE_COPY_MODAL_OPEN:
        _openDialog();
        break;
      case Actions.STORY_MAKE_COPY_MODAL_CANCEL:
        _closeDialog();
        break;
    }
  });

  /**
   * Public methods
   */

  this.getCurrentOpenState = function() {
    return _currentOpenState;
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
