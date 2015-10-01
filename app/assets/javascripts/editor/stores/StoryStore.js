(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  var FOUR_BY_FOUR_PATTERN = /^\w{4}-\w{4}$/;

  // A store for story data.
  // Each story is comprised of blocks, which in turn
  // are comprised of one or more component.
  //
  // For the purposes of the store API, blocks are represented by client-side IDs that
  // remain constant until page reload. These IDs are not to be confused with the IDs
  // in the database, which are not exposed via any API. Those server-side IDs change
  // every time the story is saved, and no effort is expended attempting to sync client
  // and server block IDs.
  function StoryStore() {

    _.extend(this, new storyteller.Store());

    var self = this;
    var _stories = {};

    // Mapping of constant client-side ID
    // to block JSON. Client-side IDs
    // only change when the page reloads.
    var _blocks = {};

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Actions.STORY_CREATE:
          _importStory(payload.data);
          break;

        case Actions.STORY_SET_TITLE:
          _setStoryTitle(payload);
          break;

        case Actions.STORY_SAVED:
          _setStoryDigest(payload);
          break;

        case Actions.STORY_SET_DESCRIPTION:
          _setStoryDescription(payload);
          break;

        case Actions.STORY_SET_PERMISSIONS:
          _setStoryPermissions(payload);
          break;

        case Actions.STORY_SET_PUBLISHED_STORY:
          _setStoryPublishedStory(payload);
          break;

        case Actions.STORY_OVERWRITE_STATE:
          _overwriteStory(payload.data);
          break;

        case Actions.STORY_MOVE_BLOCK_UP:
          _moveBlockUp(payload);
          break;

        case Actions.STORY_MOVE_BLOCK_DOWN:
          _moveBlockDown(payload);
          break;

        case Actions.STORY_DELETE_BLOCK:
          _deleteBlock(payload);
          break;

        case Actions.STORY_INSERT_BLOCK:
          _insertBlockIntoStory(payload);
          break;

        case Actions.BLOCK_UPDATE_COMPONENT:
          _updateBlockComponentAtIndex(payload);
          break;

        case Actions.HISTORY_UNDO:
        case Actions.HISTORY_REDO:
          _applyHistoryState();
          break;

        case Actions.STORY_UPDATE_THEME:
          _setStoryTheme(payload);
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

    this.getStoryTheme = function(storyUid) {

      var story = _getStory(storyUid);

      return story.theme || 'classic';
    };

    this.getStoryDigest = function(storyUid) {
      var story = _getStory(storyUid);

      return story.digest;
    };

    this.getStoryPermissions = function(storyUid) {
      var story = _getStory(storyUid);

      return story.permissions;
    };

    this.getStoryPublishedStory = function(storyUid) {
      var story = _getStory(storyUid);

      return story.publishedStory;
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
        theme: story.theme,
        blocks: story.blockIds.map(_serializeBlock)
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

    function _setStoryDigest(payload) {

      utils.assertHasProperty(payload, 'storyUid');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertHasProperty(payload, 'digest');
      utils.assertIsOneOfTypes(payload.digest, 'string');

      var storyUid = payload.storyUid;

      _getStory(storyUid).digest = payload.digest;

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

    function _setStoryPermissions(payload) {
      utils.assertIsOneOfTypes(payload, 'object');
      utils.assertHasProperties(payload, 'storyUid', 'isPublic');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertIsOneOfTypes(payload.isPublic, 'boolean');

      var storyUid = payload.storyUid;

      _getStory(storyUid).permissions = {
        isPublic: payload.isPublic
      };

      self._emitChange();
    }

    function _setStoryPublishedStory(payload) {
      utils.assertIsOneOfTypes(payload, 'object');
      utils.assertHasProperties(payload, 'storyUid', 'publishedStory');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');

      var storyUid = payload.storyUid;

      _getStory(storyUid).publishedStory = payload.publishedStory;

      self._emitChange();
    }

    function _setStoryTheme(payload) {
      utils.assertHasProperty(payload, 'storyUid');
      utils.assertIsOneOfTypes(payload.storyUid, 'string');
      utils.assertHasProperty(payload, 'theme');
      utils.assertIsOneOfTypes(payload.theme, 'string');

      var storyUid = payload.storyUid;

      _getStory(storyUid).theme = payload.theme;

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
      var blockId = _importBlockAndGenerateClientSideId(clonedBlock);

      _insertStoryBlockAtIndex(storyUid, blockId, payload.insertAt);

      self._emitChange();
    }

    function _updateBlockComponentAtIndex(payload) {

      utils.assertHasProperties(payload, 'componentIndex', 'type', 'value', 'blockId');
      utils.assertIsOneOfTypes(payload.componentIndex, 'number', 'string');
      utils.assertIsOneOfTypes(payload.type, 'string');
      utils.assertIsOneOfTypes(payload.blockId, 'string');

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
      }

      self._emitChange();
    }

    /**
     * Helper methods
     */

    function _generateClientSideId() {
      return _.uniqueId('clientSideId_');
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

    function _importBlockAndGenerateClientSideId(blockData) {
      var clientSideBlockId = _generateClientSideId();
      _setBlock(clientSideBlockId, blockData);
      return clientSideBlockId;
    }

    /**
     * Deserializes a story represented as a JSON blob into this store.
     * Will not overwrite an existing story.
     * If the argument's uid property corresponds to a story already in
     * this store, an error is thrown.
     */
    function _importStory(storyData) {
      utils.assert(
        !_stories.hasOwnProperty(storyData.uid),
        'Cannot import story: story with uid {0} already exists.'.format(storyData.uid)
      );

      _setStory(storyData);
    }

    /**
     * Updates a story in this store according to the provided story JSON.
     * If the argument's uid property does not correspond to a story already
     * in this store, an error is thrown.
     */
    function _overwriteStory(storyData) {
      utils.assert(
        _stories.hasOwnProperty(storyData.uid),
        'Cannot overwrite story: story with uid {0} does not exist.'.format(storyData.uid)
      );

      _setStory(storyData);
    }

    /**
     * Deserializes a story represented as a JSON blob into this store.
     * Consider using _importStory or _overwriteStory, as they verify
     * the presence/absence of the story in the store (this function
     * overwrites/creates blindly).
     */
    function _setStory(storyData) {

      var storyUid;
      var blockIds;

      _validateStoryData(storyData);

      storyUid = storyData.uid;

      blockIds = _.map(storyData.blocks, _importBlockAndGenerateClientSideId);

      _stories[storyUid] = {
        uid: storyUid,
        title: storyData.title,
        description: storyData.description,
        theme: storyData.theme,
        blockIds: blockIds,
        digest: storyData.digest,
        permissions: storyData.permissions
      };

      self._emitChange();
    }

    function _setBlock(clientSideBlockId, blockData) {

      _validateBlockData(blockData);

      if (_blocks.hasOwnProperty(clientSideBlockId)) {
        throw new Error(
          'Block with id {0} already exists.'.format(clientSideBlockId)
        );
      }

      _blocks[clientSideBlockId] = {
        layout: blockData.layout,
        components: _cloneBlockComponents(blockData.components)
      };
    }

    function _cloneBlock(blockContent) {

      var block = blockContent;

      return {
        layout: block.layout,
        components: _cloneBlockComponents(block.components)
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
      utils.assertHasProperty(blockData, 'layout');
      utils.assertHasProperty(blockData, 'components');

      if (blockData.id) {
        throw new Error('Unexpected block ID in block JSON');
      }

      blockData.components.forEach(function(component) {
        utils.assertHasProperty(component, 'type');
      });
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
      // NOTE! This _must not_ return any reference
      // to internal data structures! Everything
      // must be a fresh instance. Otherwise, the
      // returned object is a backdoor allowing
      // untracked state changes to this store's state.

      var block = _getBlock(blockId);

      return {
        layout: block.layout,
        components: _.clone(block.components)
      };
    }

    // The history state is set in HistoryStore, and a `.waitFor()` ensures
    // this will always run after the cursor is in the correct position.
    function _applyHistoryState() {
      storyteller.dispatcher.waitFor([ storyteller.historyStore.getDispatcherToken() ]);

      var serializedStory = storyteller.historyStore.getStateAtCursor();

      if (serializedStory) {
        var deserializedStory = JSON.parse(serializedStory);
        // Make sure we keep the latest digest - if a user undoes past a save,
        // saving a draft should continue to work.
        deserializedStory.digest = self.getStoryDigest(deserializedStory.uid);

        _overwriteStory(deserializedStory);
      }
    }
  }

  root.socrata.storyteller.StoryStore = StoryStore;
})(window);
