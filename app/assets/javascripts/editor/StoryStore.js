;var StoryStore = (function() {

  'use strict';

  var FOUR_BY_FOUR_PATTERN = /^\w{4}-\w{4}$/;

  function StoryStore() {

    var self = this;
    var _stories = {};
    var _blocks = {};

    window.dispatcher.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Constants.STORY_CREATE:
          _setStory(payload.data);
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

        case Constants.BLOCK_COPY_INTO_STORY:
          _copyBlockIntoStory(payload);
          break;

        case Constants.BLOCK_UPDATE_COMPONENT:
          _updateBlockComponentAtIndex(payload);
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

    this.storyHasBlock = function(storyUid, blockId) {
      return _.includes(this.getStoryBlockIds(storyUid), blockId);
    };

    this.getStoryTitle = function(storyUid) {

      var story = _getStory(storyUid);

      return story.title;
    };

    this.getStoryBlockIds = function(storyUid) {

      var story = _getStory(storyUid);

      return story.blockIds;
    };

    this.getStoryBlockAtIndex = function(storyUid, index) {

      var story = _getStory(storyUid);
      var blockIds = story.blockIds;

      if (index < 0 || index >= blockIds.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      return _blocks[blockIds[index]];
    };

    this.getStoryBlockIdAtIndex = function(storyUid, index) {

      var story = _getStory(storyUid);
      var blockIds = story.blockIds;

      if (index < 0 || index >= blockIds.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      return blockIds[index];
    };

    this.getBlockLayout = function(blockId) {

      var block = _getBlock(blockId);

      return block.layout;
    };

    this.getBlockComponents = function(blockId) {

      var block = _getBlock(blockId);

      return block.components;
    };

    this.getBlockComponentAtIndex = function(blockId, index) {

      var block = _getBlock(blockId);
      var components = block.components;

      if (index < 0 || index >= components.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      return components[index];
    };

    this.serializeStory = function(storyUid) {

      var story = _getStory(storyUid);

      return {
        uid: story.uid,
        title: story.title,
        blocks: story.blockIds.map(function(blockId) {

          var block = _getBlock(blockId);

          return {
            id: block.id,
            layout: block.layout,
            components: block.components
          };
        })
      };
    };

    this.serializeStoryDiff = function(storyUid) {

      var story = _getStory(storyUid);

      return {
        uid: story.uid,
        title: story.title,
        blocks: story.blockIds.map(function(blockId) {

          var block = _getBlock(blockId);

          if (block.hasOwnProperty('dirty') && block.dirty) {
            return {
              layout: block.layout,
              components: block.components
            };
          } else {
            return {
              id: block.id
            };
          }
        })
      };
    };

    this.deserializeStory = function(storyData) {
      _setStory(storyData, true);
    };

    /**
     * Private methods
     */

    /**
     * Action responses
     */

    function _moveBlockUp(payload) {

      if (!payload.hasOwnProperty('storyUid')) {
        throw new Error('`storyUid` property is required.');
      }

      if (typeof payload.storyUid !== 'string') {
        throw new Error(
          '`storyUid` must be a string (is of type ' +
          (typeof payload.storyUid) +
          '.'
        );
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

      var storyUid = payload.storyUid;
      var blockId = payload.blockId;
      var blockIndex = _getStoryBlockIndexWithId(storyUid, blockId);

      _swapStoryBlocksAtIndices(storyUid, blockIndex, blockIndex - 1);

      self._emitChange();
    }

    function _moveBlockDown(payload) {

      if (!payload.hasOwnProperty('storyUid')) {
        throw new Error('`storyUid` property is required.');
      }

      if (typeof payload.storyUid !== 'string') {
        throw new Error(
          '`storyUid` must be a string (is of type ' +
          (typeof payload.storyUid) +
          '.'
        );
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

      var storyUid = payload.storyUid;
      var blockId = payload.blockId;
      var blockIndex = _getStoryBlockIndexWithId(storyUid, blockId);

      _swapStoryBlocksAtIndices(storyUid, blockIndex, blockIndex + 1);

      self._emitChange();
    }

    function _deleteBlock(payload) {

      if (!payload.hasOwnProperty('storyUid')) {
        throw new Error('`storyUid` property is required.');
      }

      if (typeof payload.storyUid !== 'string') {
        throw new Error(
          '`storyUid` must be a string (is of type ' +
          (typeof payload.storyUid) +
          '.'
        );
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

      var story = _getStory(payload.storyUid);
      var blockId = payload.blockId;
      var indexOfBlockIdToRemove = story.blockIds.indexOf(blockId);

      if (indexOfBlockIdToRemove < 0) {
        throw new Error('`blockId` does not exist in story.');
      }

      story.blockIds.splice(indexOfBlockIdToRemove, 1);

      self._emitChange();
    }

    function _copyBlockIntoStory(payload) {

      if (!payload.hasOwnProperty('storyUid')) {
        throw new Error('`storyUid` property is required.');
      }

      if (typeof payload.storyUid !== 'string') {
        throw new Error(
          '`storyUid` must be a string (is of type ' +
          (typeof payload.storyUid) +
          '.'
        );
      }

      if (!payload.hasOwnProperty('insertAt')) {
        throw new Error('`insertAt` property is required.');
      }

      if (typeof payload.insertAt !== 'number') {
        throw new Error(
          '`insertAt` must be a number (is of type ' +
          (typeof payload.insertAt) +
          '.'
        );
      }

      var clonedBlock = _cloneBlock(payload.blockId);
      var blockId = clonedBlock.id;

      _blocks[blockId] = clonedBlock;
      _insertStoryBlockAtIndex(payload.storyUid, blockId, payload.insertAt);

      self._emitChange();
    }

    function _updateBlockComponentAtIndex(payload) {

      var block = _getBlock(payload.blockId);
      var index = parseInt(payload.index, 10);
      var component = block.components[index];

      // Verify that it is a number *after* the parseInt but report on its
      // original type.
      if (typeof index !== 'number') {
        throw new Error(
          '`index` must be a number (is of type ' +
          (typeof payload.index) +
          '.'
        );
      }

      if (index < 0 || index > block.components.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      if (component.type !== payload.type || component.value !== payload.value) {
        block.components[payload.index] = {
          type: payload.type,
          value: payload.value
        };

        block.dirty = true;
      }

      self._emitChange();
    }

    /**
     * Helper methods
     */

    function _generateTemporaryId() {
      return 'temp_' + String(Date.now());
    }

    function _getStory(storyUid) {

      if (typeof storyUid !== 'string') {
        throw new Error('`storyUid` argument is not a string');
      }

      if (!_stories.hasOwnProperty(storyUid)) {
        throw new Error('Story with uid "' + storyUid + '" does not exist.');
      }

      return _stories[storyUid];
    }

    function _getBlock(blockId) {

      if (typeof blockId !== 'string') {
        throw new Error('`blockId` argument is not a string');
      }

      if (!_blocks.hasOwnProperty(blockId)) {
        throw new Error('Block with id "' + blockId + '" does not exist.');
      }

      return _blocks[blockId];
    }

    function _setStory(storyData, overwrite) {
      _validateStoryData(storyData);

      var storyUid = storyData.uid;
      var blockIds = [];

      if (!overwrite && _stories.hasOwnProperty(storyUid)) {
        throw new Error(
          'Story with uid "' + storyUid + '" already exists.'
        );
      }

      storyData.blocks.forEach(function(blockData) {
        _setBlock(blockData, overwrite);
        blockIds.push(blockData.id);
      });

      _stories[storyUid] = {
        uid: storyUid,
        title: storyData.title,
        blockIds: blockIds
      };
    }

    function _setBlock(blockData, overwrite) {
      _validateBlockData(blockData);

      var blockId = blockData.id;

      if (!overwrite && _blocks.hasOwnProperty(blockId)) {
        throw new Error(
          'Block with id "' + blockId + '" already exists.'
        );
      }

      _blocks[blockId] = {
        id: blockId,
        layout: blockData.layout,
        components: _cloneBlockComponents(blockData.components),
      };
    }

    function _cloneBlock(blockId) {

      var block = _getBlock(blockId);

      return {
        id: _generateTemporaryId(),
        layout: block.layout,
        components: _cloneBlockComponents(block.components),
        dirty: true
      };
    }

    function _cloneBlockComponents(components) {

      var newComponents = [];

      for (var i = 0; i < components.length; i++) {

        if (typeof components[i].value !== 'string') {
          throw new Error(
            'component value must be of type string (is of type ' +
            (typeof components[i].value) +
            ').'
          );
        }

        newComponents.push(
          {
            type: components[i].type,
            value: components[i].value
          }
        );
      }

      return newComponents;
    }

    function _validateStoryData(storyData) {

      if (typeof storyData !== 'object') {
        throw new Error(
          '`storyData` argument must be an object (is of type ' +
          (typeof storyData) +
          ').'
        );
      }

      if (!storyData.hasOwnProperty('uid')) {
        throw new Error('`storyData` argument contains no `uid` property.');
      }

      if (storyData.uid.match(FOUR_BY_FOUR_PATTERN) === null) {
        throw new Error(
          '`uid` property is not a valid four-by-four: "' +
          JSON.stringify(storyData.uid) +
          '".'
        );
      }

      if (!storyData.hasOwnProperty('title')) {
        throw new Error('`storyData` argument contains no `title` property.');
      }

      if (!storyData.hasOwnProperty('blocks')) {
        throw new Error('`storyData` argument contains no `blocks` property.');
      }
    }

    function _validateBlockData(blockData) {

      if (typeof blockData !== 'object') {
        throw new Error(
          '`blockData` argument must be an object (is of type ' +
          (typeof blockData) +
          ').'
        )
      }

      if (!blockData.hasOwnProperty('id')) {
        throw new Error(
          '`blockData` argument contains no `id` property.'
        );
      }

      if (typeof blockData.id !== 'string') {
        throw new Error(
          '`blockData` argument `id` property must be a string (is of type ' +
          (typeof blockData.id) +
          ').'
        );
      }

      if (!blockData.hasOwnProperty('layout')) {
        throw new Error(
          '`blockData` argument contains no `layout` property.'
        );
      }

      if (!blockData.hasOwnProperty('components')) {
        throw new Error(
          '`blockData` argument contains no `components` property.'
        );
      }
    }

    function _getStoryBlockIndexWithId(storyUid, blockId) {

      var story = _getStory(storyUid);
      var storyBlockIds = story.blockIds;
      var storyBlockIdCount = story.blockIds.length;
      var index = null;

      for (var i = 0; i < storyBlockIdCount; i++) {
        if (storyBlockIds[i] === blockId) {
          index = i;
          break;
        }
      }

      return index;
    }

    function _insertStoryBlockAtIndex(storyUid, blockId, index) {

      var story = _getStory(storyUid);
      var storyBlockIdCount = story.blockIds.length;
      var blockId = blockId;

      if (typeof blockId !== 'string') {
        throw new Error(
          '`blockId` argument must be a string (is of type ' +
          (typeof blockId) +
          ').'
        );
      }

      if (typeof index !== 'number') {
        throw new Error(
          '`index` argument must be a number (is of type ' +
          (typeof index) +
          ').'
        );
      }

      if (index < 0 || index > storyBlockIdCount) {
        throw new Error('`index` argument is out of bounds.');
      }

      if (index === storyBlockIdCount) {
        story.blockIds.push(blockId);
      } else {
        story.blockIds.splice(index, 0, blockId);
      }
    }

    function _swapStoryBlocksAtIndices(storyUid, index1, index2) {

      if (typeof index1 !== 'number') {
        throw new Error(
          '`index1` argument must be a number (is of type ' +
          (typeof index1) +
          ').'
        );
      }

      if (typeof index2 !== 'number') {
        throw new Error(
          '`index2` argument must be a number (is of type ' +
          (typeof index2) +
          ').'
        );
      }

      var story = _getStory(storyUid);
      var storyBlockIdCount = story.blockIds.length;

      if (index1 < 0 || index1 >= storyBlockIdCount) {
        throw new Error('`index1` argument is out of bounds.');
      }

      if (index2 < 0 || index2 >= storyBlockIdCount) {
        throw new Error('`index2` argument is out of bounds.');
      }

      var tempBlock = story.blockIds[index1];
      story.blockIds[index1] = story.blockIds[index2];
      story.blockIds[index2] = tempBlock;
    }
  }

  return StoryStore;
})();
