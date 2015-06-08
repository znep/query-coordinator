;var Story = (function() {

  'use strict';

  var FOUR_BY_FOUR_PATTERN = /^\w{4}-\w{4}$/;

  function Story(storyData) {

    if (typeof storyData !== 'object') {
      throw new Error(
        '`storyData` argument must be an object (is of type ' + typeof storyData + ').'
      )
    }

    if (!storyData.hasOwnProperty('fourByFour')) {
      throw new Error('`storyData` argument contains no `fourByFour` property.');
    }

    if (storyData.fourByFour.match(FOUR_BY_FOUR_PATTERN) === null) {
      throw new Error('`fourByFour` property is not a valid four-by-four');
    }

    if (!storyData.hasOwnProperty('title')) {
      throw new Error('`storyData` argument contains no `title` property.');
    }

    if (!storyData.hasOwnProperty('blocks')) {
      throw new Error('`storyData` argument contains no `blocks` property.');
    }

    var _fourByFour = storyData.fourByFour;
    var _title = storyData.title;
    var _blocks = _rehydrateBlocks(storyData.blocks);

    /**
     * Public methods
     */

    this.getFourByFour = function() {
      return _fourByFour;
    };

    this.getTitle = function() {
      return _title;
    };

    this.getBlocks = function() {
      return _blocks;
    };

    this.getBlockAtIndex = function(index) {

      if (index < 0 || index >= _blocks.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      return _blocks[index];
    };

    this.getBlockWithId = function(id) {

      var block = null;

      for (var i = 0; i < _blocks.length; i++) {
        if (_blocks[i].getId() === id) {

          block = _blocks[i];
          break;
        }
      }

      return block;
    };

    this.insertBlockAtIndex = function(index, block) {

      if (index < 0 || index > _blocks.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      if (!(block instanceof Block)) {
        throw new Error(
          '`block` argument must be a Block (is of type ' + typeof block + ').'
        );
      }

      if (index === _blocks.length) {
        _blocks.push(block);
      } else {
        _blocks.splice(index, 0, block);
      }
    };

    this.appendBlock = function(block) {
      this.insertBlockAtIndex(_blocks.length, block);
    };

    this.removeBlockAtIndex = function(index) {

      if (index < 0 || index >= _blocks.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      _blocks.splice(index, 1);
    };

    this.removeBlockWithId = function(id) {

      _blocks = _blocks.filter(function(block) {
        return block.getId() !== id;
      });
    };

    this.swapBlocksAtIndices = function(index1, index2) {

      if (index1 < 0 || index1 >= _blocks.length) {
        throw new Error('`index1` argument is out of bounds.');
      }

      if (index2 < 0 || index2 >= _blocks.length) {
        throw new Error('`index2` argument is out of bounds.');
      }

      var tempBlock = _blocks[index1];
      _blocks[index1] = _blocks[index2];
      _blocks[index2] = tempBlock;
    };

    this.save = function() {

      return {
        fourByFour: _fourByFour,
        title: _title,
        blocks: _blocks.map(function(block) {
          return block.save();
        })
      };
    };

    /**
     * Private methods
     */

    function _rehydrateBlocks(blockDataArray) {

      if (typeof blockDataArray !== 'object' || !(blockDataArray instanceof Array)) {
        throw new Error(
          '`blockDataArray` argument must be an array (is of type ' + typeof blockData + ').'
        );
      }

      return blockDataArray.map(function(blockData) {
        return new Block(blockData);
      });
    }
  }

  return Story;
})();
