;var StoryStore = (function() {

  'use strict';

  function StoryStore() {

    var self = this;
    var _stories = {};

    window.dispatcher.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Constants.STORY_CREATE:
          _createStory(payload);
          break;

        case Constants.STORY_INSERT_BLOCK:
          _insertBlock(payload);
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

    _.extend(self, new Store());

    /**
     * Public methods
     */

    this.storyExists = function(storyUid) {
      return _stories.hasOwnProperty(storyUid);
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

      self._emitChange();
    }

    function _insertBlock(payload) {

      if (!payload.hasOwnProperty('storyUid')) {
        throw new Error('`storyUid` property is required.');
      }

      if (!payload.hasOwnProperty('insertAt')) {
        throw new Error('`insertAt` property is required.');
      }

      if (!payload.hasOwnProperty('blockId')) {
        throw new Error('`blockId` property is required.');
      }

      var story = _getStoryByUid(payload.storyUid);

      story.insertBlockAtIndex(payload.insertAt, payload.blockId);

      self._emitChange();
    }

    function _moveBlockUp(payload) {

      if (!payload.hasOwnProperty('storyUid')) {
        throw new Error('`storyUid` property is required.');
      }

      if (!payload.hasOwnProperty('blockId')) {
        throw new Error('`blockId` property is required.');
      }

      if (typeof payload.blockId !== 'string') {
        throw new Error(
          '`blockId` must be a string (is of type ' +
          (typeof payload.blockId) +
          '.'
        );
      }

      var story = _getStoryByUid(payload.storyUid);
      var blockIndex = story.getBlockIndexWithId(payload.blockId);

      story.swapBlocksAtIndices(blockIndex, blockIndex - 1);

      self._emitChange();
    }

    function _moveBlockDown(payload) {

      if (!payload.hasOwnProperty('storyUid')) {
        throw new Error('`storyUid` property is required.');
      }

      if (!payload.hasOwnProperty('blockId')) {
        throw new Error('`blockId` property is required.');
      }

      if (typeof payload.blockId !== 'string') {
        throw new Error(
          '`blockId` must be a string (is of type ' +
          (typeof payload.blockId) +
          '.'
        );
      }

      var story = _getStoryByUid(payload.storyUid);
      var blockIndex = story.getBlockIndexWithId(payload.blockId);

      story.swapBlocksAtIndices(blockIndex, blockIndex + 1);

      self._emitChange();
    }

    function _deleteBlock(payload) {

      if (!payload.hasOwnProperty('storyUid')) {
        throw new Error('`storyUid` property is required.');
      }

      if (!payload.hasOwnProperty('blockId')) {
        throw new Error('`blockId` property is required.');
      }

      if (typeof payload.blockId !== 'string') {
        throw new Error(
          '`blockId` must be a string (is of type ' +
          (typeof payload.blockId) +
          '.'
        );
      }

      var story = _getStoryByUid(payload.storyUid);

      story.removeBlockWithId(payload.blockId);

      self._emitChange();
    }
  }

  return StoryStore;
})();
