(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  var FOUR_BY_FOUR_PATTERN = /^\w{4}-\w{4}$/;

  function StoryStore() {

    _.extend(this, new storyteller.Store());

    var self = this;
    var _stories = {};
    var _blocks = {};

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Constants.STORY_CREATE:
          _setStory(payload.data);
          break;

        case Constants.STORY_SET_TITLE:
          _setStoryTitle(payload);
          break;

        case Constants.STORY_SET_DESCRIPTION:
          _setStoryDescription(payload);
          break;

        case Constants.STORY_OVERWRITE_STATE:
          _setStory(payload.data, true);
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

        case Constants.STORY_INSERT_BLOCK:
          _insertBlockIntoStory(payload);
          break;

        case Constants.BLOCK_UPDATE_COMPONENT:
          _updateBlockComponentAtIndex(payload);
          break;

        case Constants.HISTORY_UNDO:
        case Constants.HISTORY_REDO:
          _applyHistoryState();
          break;

        case Constants.STORY_UPDATE_THEME:
          _setStoryThemeId(payload);
          break;
      }
    });

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

    this.getStoryDescription = function(storyUid) {

      var story = _getStory(storyUid);

      return story.description;
    };

    this.getStoryThemeId = function(storyUid) {

      var story = _getStory(storyUid);

      return story.themeId || 'classic';
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

      var components = this.getBlockComponents(blockId);

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
        description: story.description,
        themeId: story.themeId,
        blocks: story.blockIds.map(_serializeBlock)
      };
    };

    this.serializeStoryDiff = function(storyUid) {

      var story = _getStory(storyUid);

      return {
        uid: story.uid,
        title: story.title,
        description: story.description,
        themeId: story.themeId,
        blocks: story.blockIds.map(_serializeBlockDiff)
      };
    };

    /**
     * Private methods
     */

    /**
     * Action responses
     */

    function _setStoryTitle(payload) {

      utils.assertHasProperty(payload, 'storyUid');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertHasProperty(payload, 'title');
      utils.assertIsOneOfTypes(payload.title, 'string');

      var storyUid = payload.storyUid;

      _getStory(storyUid).title = payload.title;

      self._emitChange();
    }

    function _setStoryDescription(payload) {

      utils.assertHasProperty(payload, 'storyUid');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertHasProperty(payload, 'description');
      utils.assertIsOneOfTypes(payload.description, 'string');

      var storyUid = payload.storyUid;

      _getStory(storyUid).description = payload.description;

      self._emitChange();
    }

    function _setStoryThemeId(payload) {
      utils.assertHasProperty(payload, 'storyUid');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertHasProperty(payload, 'themeId');
      utils.assertIsOneOfTypes(payload.themeId, 'string');

      var storyUid = payload.storyUid;

      _getStory(storyUid).themeId = payload.themeId;

      self._emitChange();
    }

    function _moveBlockUp(payload) {

      utils.assertHasProperty(payload, 'storyUid');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertHasProperty(payload, 'blockId');
      utils.assertIsOneOfTypes(payload.blockId, 'string');

      var storyUid = payload.storyUid;
      var blockId = payload.blockId;
      var blockIndex = _getStoryBlockIndexWithId(storyUid, blockId);

      _swapStoryBlocksAtIndices(storyUid, blockIndex, blockIndex - 1);

      self._emitChange();
    }

    function _moveBlockDown(payload) {

      utils.assertHasProperty(payload, 'storyUid');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertHasProperty(payload, 'blockId');
      utils.assertIsOneOfTypes(payload.blockId, 'string');

      var storyUid = payload.storyUid;
      var blockId = payload.blockId;
      var blockIndex = _getStoryBlockIndexWithId(storyUid, blockId);

      _swapStoryBlocksAtIndices(storyUid, blockIndex, blockIndex + 1);

      self._emitChange();
    }

    function _deleteBlock(payload) {

      utils.assertHasProperty(payload, 'storyUid');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertHasProperty(payload, 'blockId');
      utils.assertIsOneOfTypes(payload.blockId, 'string');

      var storyUid = payload.storyUid;
      var story = _getStory(storyUid);
      var blockId = payload.blockId;
      var indexOfBlockIdToRemove = story.blockIds.indexOf(blockId);

      if (indexOfBlockIdToRemove < 0) {
        throw new Error('`blockId` does not exist in story.');
      }

      story.blockIds.splice(indexOfBlockIdToRemove, 1);

      self._emitChange();
    }

    function _insertBlockIntoStory(payload) {

      utils.assertHasProperty(payload, 'storyUid');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertHasProperty(payload, 'insertAt');
      utils.assertIsOneOfTypes(payload.insertAt, 'number');

      if (typeof payload.insertAt !== 'number') {
        throw new Error(
          '`insertAt` must be a number (is of type ' +
          (typeof payload.insertAt) +
          '.'
        );
      }

      var storyUid = payload.storyUid;
      var clonedBlock = _cloneBlock(payload.blockContent);
      var blockId = clonedBlock.id;

      _blocks[blockId] = clonedBlock;
      _insertStoryBlockAtIndex(storyUid, blockId, payload.insertAt);

      self._emitChange();
    }

    function _updateBlockComponentAtIndex(payload) {

      utils.assertHasProperty(payload, 'componentIndex');
      utils.assertIsOneOfTypes(payload.componentIndex, 'number', 'string');
      utils.assertHasProperty(payload, 'type');
      utils.assertIsOneOfTypes(payload.type, 'string');
      utils.assertHasProperty(payload, 'value');

      var block = _getBlock(payload.blockId);
      var index = parseInt(payload.componentIndex, 10);
      var component;

      // Verify that it is a number *after* the parseInt but report on its
      // original type.
      if (isNaN(index)) {
        throw new Error(
          'Invalid component index: "' + payload.componentIndex + '".'
        );
      }

      if (index < 0 || index > block.components.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      component = block.components[index];

      if (component.type !== payload.type || component.value !== payload.value) {

        block.components[payload.componentIndex] = {
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

      utils.assertIsOneOfTypes(storyUid, 'string');
      utils.assertHasProperty(
        _stories,
        storyUid,
        'Story with uid "' + storyUid + '" does not exist.'
      );

      return _stories[storyUid];
    }

    function _getBlock(blockId) {

      utils.assertIsOneOfTypes(blockId, 'string');
      utils.assertHasProperty(
        _blocks,
        blockId,
        'Block with id "' + blockId + '" does not exist.'
      );

      return _blocks[blockId];
    }

    function _setStory(storyData, overwrite) {

      var storyUid;
      var blockIds = [];

      _validateStoryData(storyData);

      storyUid = storyData.uid;

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
        description: storyData.description,
        themeId: storyData.themeId,
        blockIds: blockIds
      };

      self._emitChange();
    }

    function _setBlock(blockData, overwrite) {

      var blockId;

      _validateBlockData(blockData);

      blockId = blockData.id;

      if (!overwrite && _blocks.hasOwnProperty(blockId)) {
        throw new Error(
          'Block with id "' + blockId + '" already exists.'
        );
      }

      _blocks[blockId] = {
        id: blockId,
        layout: blockData.layout,
        components: _cloneBlockComponents(blockData.components)
      };
    }

    function _cloneBlock(blockContent) {

      var block = blockContent;

      return {
        id: _generateTemporaryId(),
        layout: block.layout,
        components: _cloneBlockComponents(block.components),
        dirty: true
      };
    }

    function _cloneBlockComponents(components) {

      return components.map(function(component) {
        return _.pick(component, ['type', 'value']);
      });
    }

    function _validateStoryData(storyData) {

      utils.assertIsOneOfTypes(storyData, 'object');
      utils.assertHasProperty(storyData, 'uid');
      utils.assertHasProperty(storyData, 'title');
      utils.assertHasProperty(storyData, 'description');
      utils.assertHasProperty(storyData, 'blocks');

      if (storyData.uid.match(FOUR_BY_FOUR_PATTERN) === null) {
        throw new Error(
          '`uid` property is not a valid four-by-four: "' +
          JSON.stringify(storyData.uid) +
          '".'
        );
      }
    }

    function _validateBlockData(blockData) {

      utils.assertIsOneOfTypes(blockData, 'object');
      utils.assertHasProperty(blockData, 'id');
      utils.assertHasProperty(blockData, 'layout');
      utils.assertHasProperty(blockData, 'components');

      blockData.components.forEach(function(component) {
        utils.assertHasProperty(component, 'type');
      });

      if (typeof blockData.id !== 'string') {
        throw new Error(
          '`blockData` argument `id` property must be a string (is of type ' +
          (typeof blockData.id) +
          ').'
        );
      }
    }

    function _getStoryBlockIndexWithId(storyUid, blockId) {

      var story = _getStory(storyUid);
      var index = story.blockIds.indexOf(blockId);

      if (index === -1) {
        index = null;
      }

      return index;
    }

    function _insertStoryBlockAtIndex(storyUid, blockId, index) {

      var story = _getStory(storyUid);
      var storyBlockIdCount = story.blockIds.length;

      utils.assertIsOneOfTypes(blockId, 'string');
      utils.assertIsOneOfTypes(index, 'number');

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

      utils.assertIsOneOfTypes(index1, 'number');
      utils.assertIsOneOfTypes(index2, 'number');

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

    function _serializeBlock(blockId) {

      var block = _getBlock(blockId);

      return {
        id: block.id,
        layout: block.layout,
        components: block.components
      };
    }

    // TODO: Verify that this works as intended.
    function _serializeBlockDiff(blockId) {

      var block = _getBlock(blockId);
      var serializedBlock;

      if (block.hasOwnProperty('dirty') && block.dirty) {

        serializedBlock = {
          layout: block.layout,
          components: block.components
        };

      } else {

        serializedBlock = {
          id: block.id
        };

      }

      return serializedBlock;
    }

    // The history state is set in HistoryStore, and a `.waitFor()` ensures
    // this will always run after the cursor is in the correct position.
    function _applyHistoryState() {

      storyteller.dispatcher.waitFor([ storyteller.historyStore.getDispatcherToken() ]);

      var serializedStory = storyteller.historyStore.getStateAtCursor();

      if (serializedStory) {
        _setStory(
          JSON.parse(serializedStory),
          true
        );
      }
    }
  }

  root.socrata.storyteller.StoryStore = StoryStore;
})(window);
