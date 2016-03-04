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

    // Note that we do not assign `_currentSelectorState` the value of action
    // outside of the case statements because ALL events will pass through
    // this function and we only want to alter `_currentSelectorState` in
    // response to actions that are actually relevant.
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
