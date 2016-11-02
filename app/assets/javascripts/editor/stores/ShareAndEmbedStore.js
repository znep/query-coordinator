import _ from 'lodash';

import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import httpRequest from '../../services/httpRequest';
import Store from './Store';
import { coreSavingStore } from './CoreSavingStore';

export var shareAndEmbedStore = new ShareAndEmbedStore();
export default function ShareAndEmbedStore() {
  _.extend(this, new Store());

  var self = this;

  var _currentOpenState = false;
  var _currentSavingState = false;
  // View URL for the story. Initialized from the environment,
  // but updates come from the embed tile API if the user changes
  // the story title.
  var _storyViewUrl = Environment.STORY_VIEW_URL;

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

  coreSavingStore.addChangeListener(function() {
    var saveInProgress = coreSavingStore.isSaveInProgress();
    var lastSaveError = coreSavingStore.lastRequestSaveErrorForStory(
      Environment.STORY_UID
    );

    if (!saveInProgress) {
      httpRequest('GET', self.getStoryTileApiUrl()).then(function(data) {
        _storyViewUrl = _.get(data, 'url', _storyViewUrl);
        self._emitChange();
      });

      if (_currentSavingState && !lastSaveError) {
        _closeDialog();
      } else {
        _currentSavingState = false;
      }
    } else {
      _currentSavingState = true;
    }
  });

  /**
   * Public methods
   */

  this.isOpen = function() {
    return _currentOpenState;
  };

  this.getStoryUrl = function() {
    return _storyViewUrl;
  };

  this.getStoryTileUrl = function() {
    return StorytellerUtils.format('{0}/tile', this.getStoryUrl());
  };

  this.getStoryTileApiUrl = function() {
    return this.getStoryTileUrl() + '.json';
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
    _currentSavingState = false;

    self._emitChange();
  }
}
