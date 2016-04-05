import _ from 'lodash';

import Store from '../stores/Store';
import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';

export var shareAndEmbedStore = new ShareAndEmbedStore();
export default function ShareAndEmbedStore() {
  _.extend(this, new Store());

  var _currentOpenState = false;
  var self = this;

  this.register(function(payload) {
    StorytellerUtils.assertHasProperty(payload, 'action');
    // Note that we do not assign `_currentOpenState` the value of action
    // outside of the case statements because ALL events will pass through
    // this function and we only want to alter `_currentSelectorState` in
    // response to actions that are actually relevant.
    switch (payload.action) {

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
    return StorytellerUtils.format(
      '{0}/stories/s/{1}',
      window.location.protocol + '//' + window.location.hostname,
      Environment.STORY_UID
    );
  };

  this.getStoryTileUrl = function() {
    return StorytellerUtils.format('{0}/tile', this.getStoryUrl());
  };

  this.getStoryEmbedCode = function() {
    return StorytellerUtils.format(
      '<iframe ' +
        'src="{0}" ' +
        'style="' +
          'width:600px;' +
          'height:345px;' +
          'background-color:transparent;' +
          'overflow:hidden;' +
        '" ' +
        'scrolling="no" ' +
        'frameborder="0">' +
      '</iframe>',
      this.getStoryTileUrl()
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
