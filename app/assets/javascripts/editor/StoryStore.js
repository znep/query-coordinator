;var StoryStore = (function() {

  'use strict';

  function StoryStore() {

    var _emitter = new EventEmitter();
    var _stories = {};

    window.dispatcher.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Constants.STORY_CREATE:
          _createStory(payload);
          break;

        case Constants.STORY_MOVE_BLOCK_UP:
          _moveBlockUp(payload);
          break;

        case Constants.STORY_MOVE_BLOCK_DOWN:
          _moveBlockDown(payload);
          break;

        case Constants.STORY_DELETE_BLOCK:
          _deleteBlock(payload);
          break;
      }
    });

    /**
     * Public methods
     */

    this.addChangeListener = function(callback) {
      _emitter.addListener(callback);
    };

    this.removeChangeListener = function(callback) {
      _emitter.removeListener(callback);
    };

    this.getTitle = function(storyUid) {

      var story = _getStoryByUid(storyUid);

      return story.getTitle();
    };

    this.getBlockIds = function(storyUid) {

      var story = _getStoryByUid(storyUid);

      return story.getBlockIds();
    };

    this.getBlockIdAtIndex = function(storyUid, index) {

      var story = _getStoryByUid(storyUid);

      return story.getBlockIdAtIndex(index);
    };

    /**
     * Private methods
     */

    function _getStoryByUid(storyUid) {

      if (typeof storyUid !== 'string') {
        throw new Error('`storyUid` argument is not a string');
      }

      if (!_stories.hasOwnProperty(storyUid)) {
        throw new Error('Story with uid "' + storyUid + '" does not exist.');
      }

      return _stories[storyUid];
    }

    function _createStory(payload) {

      var data = payload.data;
      var newStory = new Story(data);
      var newStoryUid = newStory.getUid();

      data.blocks.forEach(function(blockData) {
        window.dispatcher.dispatch({ action: Constants.BLOCK_CREATE, data: blockData });
      });

      if (_stories.hasOwnProperty(newStoryUid)) {
        throw new Error('Story with uid `' + newStoryUid + '` already exists.');
      }

      _stories[newStoryUid] = newStory;

      _emitter.emit();
    }

    function _moveBlockUp(payload) {

      var story = _getStoryByUid(payload.storyUid);
      var blockIndex = story.getBlockIndexWithId(payload.blockId);

      story.swapBlocksAtIndices(blockIndex, blockIndex - 1);

      _emitter.emit();
    }

    function _moveBlockDown(payload) {

      var story = _getStoryByUid(payload.storyUid);
      var blockIndex = story.getBlockIndexWithId(payload.blockId);

      story.swapBlocksAtIndices(blockIndex, blockIndex + 1);

      _emitter.emit();
    }

    function _deleteBlock(payload) {

      var story = _getStoryByUid(payload.storyUid);

      story.removeBlockWithId(payload.blockId);

      _emitter.emit();
    }
  }

  return StoryStore;
})();
