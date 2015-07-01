;var BlockStore = (function() {

  'use strict';

  function BlockStore() {

    var self = this;

    var _blocks = {};

    window.dispatcher.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Constants.BLOCK_CREATE:
          _createBlock(payload);
          break;

        case Constants.BLOCK_UPDATE_COMPONENT:
          _updateComponentAtIndex(payload);
          break;

        case Constants.BLOCK_COPY_INTO_STORY:
          _copyBlockIntoStory(payload);
          break;
      }
    });

    _.extend(self, new Store());

    /**
     * Public methods
     */

    this.getLayout = function(blockId) {

      var block = _getBlockById(blockId);

      return block.getLayout();
    };

    this.getComponents = function(blockId) {

      var block = _getBlockById(blockId);

      return block.getComponents();
    };

    this.getComponentAtIndex = function(blockId, index) {

      var block = _getBlockById(blockId);

      return block.getComponentAtIndex(index);
    };

    /**
     * Private methods
     */

    function _getBlockById(blockId) {

      if (typeof blockId !== 'string') {
        throw new Error('`blockId` argument is not a string');
      }

      if (!_blocks.hasOwnProperty(blockId)) {
        throw new Error('Block with id "' + blockId + '" does not exist.');
      }

      return _blocks[blockId];
    }

    function _createBlock(payload) {

      var newBlock = new Block(payload.data);
      var newBlockId = newBlock.getId();

      if (_blocks.hasOwnProperty(newBlockId)) {
        throw new Error('Block with id `' + newBlockId + '` already exists.');
      }

      _blocks[newBlockId] = newBlock;

      self._emitChange();
    }

    function _updateComponentAtIndex(payload) {

      var block = _getBlockById(payload.blockId);
      var index = payload.index;
      var type = payload.type;
      var value = payload.value;

      block.updateComponentAtIndex(index, type, value);

      self._emitChange();
    }

    function _copyBlockIntoStory(payload) {

      if (!payload.hasOwnProperty('storyUid')) {
        throw new Error('`storyUid` property is required.');
      }

      if (!payload.hasOwnProperty('insertAt')) {
        throw new Error('`insertAt` property is required.');
      }

      var newBlock = _getBlockById(payload.blockId).clone();
      var newBlockId = newBlock.getId();

      _blocks[newBlockId] = newBlock;

      window.dispatcher.dispatch({
        action: Constants.STORY_INSERT_BLOCK,
        storyUid: payload.storyUid,
        blockId: newBlockId,
        insertAt: payload.insertAt
      });
    }
  }

  return BlockStore;
})();
