/**
 * Usage Instructions
 *
 * Stories are instantiated from existing story data. This clearly leads to an
 * 'Unmoved Mover' kind of paradox and hey, we should be ok with that.
 *
 * To instantiate a new Story from existing data, pass the data in to the
 * constructor, like so:
 *
 * var story = new Story({
 *   fourByFour: 'test-test',
 *   title: 'Test Story',
 *   blocks: [
 *     {
 *       id: 1,
 *       layout: '12',
 *       components: [
 *         { type: 'text', value: 'Hello, world!' }
 *       ]
 *     }
 *   ]
 * });
 *
 * Updates to blocks should be made on the block objects directly; they can
 * be conveniently accessed using the .getBlockAtIndex() or .getBlockWithId()
 * methods, e.g.:
 *
 * block2 = story.getBlockAtIndex(1);
 * block2.updateComponentAtIndex(0, 'text', 'Hello, world!');
 *
 * Since the Story keeps references to all the blocks, your changes should
 * be automatically propagated back into the story context, so calling the
 * .serialize() method on the story directly after modifying the block should
 * reflect the change that was just made.
 */
;var Story = (function() {

  'use strict';

  var FOUR_BY_FOUR_PATTERN = /^\w{4}-\w{4}$/;

  /**
   * @constructor
   * @param {object} storyData
   *   @property {string} fourByFour
   *   @property {string} title
   *   @property {object[]} blocks
   *     @property {(number|string)} id
   *     @property {string} layout
   *     @property {object[]} components
   */
  function Story(storyData) {

    if (typeof storyData !== 'object') {
      throw new Error(
        '`storyData` argument must be an object (is of type ' + (typeof storyData) + ').'
      )
    }

    if (!storyData.hasOwnProperty('fourByFour')) {
      throw new Error('`storyData` argument contains no `fourByFour` property.');
    }

    if (storyData.fourByFour.match(FOUR_BY_FOUR_PATTERN) === null) {
      throw new Error('`fourByFour` property is not a valid four-by-four: "' + storyData.fourByFour + '".');
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

    /**
     * @return {string}
     */
    this.getFourByFour = function() {
      return _fourByFour;
    };

    /**
     * @return {string}
     */
    this.getTitle = function() {
      return _title;
    };

    /**
     * @return {Block[]}
     */
    this.getBlocks = function() {
      return _blocks;
    };

    /**
     * @param {number} index
     */
    this.getBlockAtIndex = function(index) {

      if (index < 0 || index >= _blocks.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      return _blocks[index];
    };

    /**
     * @param {(number|text)} id
     */
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

    /**
     * @param {number} index
     * @param {Block} block
     */
    this.insertBlockAtIndex = function(index, block) {

      if (index < 0 || index > _blocks.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      if (!(block instanceof Block)) {
        throw new Error(
          '`block` argument must be a Block (is of type ' + (typeof block) + ').'
        );
      }

      if (index === _blocks.length) {
        _blocks.push(block);
      } else {
        _blocks.splice(index, 0, block);
      }
    };

    /**
     * @param {Block} block
     */
    this.appendBlock = function(block) {
      this.insertBlockAtIndex(_blocks.length, block);
    };

    /**
     * @param {number} index
     */
    this.removeBlockAtIndex = function(index) {

      if (index < 0 || index >= _blocks.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      _blocks.splice(index, 1);
    };

    /**
     * @param {(number|string)} id
     * @return {Block}
     */
    this.removeBlockWithId = function(id) {

      _blocks = _blocks.filter(function(block) {
        return block.getId() !== id;
      });
    };

    /**
     * @param {number} index1
     * @param {number} index2
     */
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

    /**
     * @return {object}
     *   @property {string} fourByFour
     *   @property {string} title
     *   @property {object[]} blocks
     *     @property {(number|string)} [id]
     *     @property {string} [layout]
     *     @property {object[]} [components]
     *       @property {string} type
     *       @property {string} value
     */
    this.serialize = function() {

      return {
        fourByFour: _fourByFour,
        title: _title,
        blocks: _blocks.map(function(block) {
          return block.serialize();
        })
      };
    };

    /**
     * Private methods
     */

    /**
     * @param {object[]} blockDataArray
     *   @property {(number|string)} id
     *   @property {string} layout
     *   @property {object[]} components
     *     @property {string} type
     *     @property {string} value
     * @return {Block[]}
     */
    function _rehydrateBlocks(blockDataArray) {

      if (typeof blockDataArray !== 'object' || !(blockDataArray instanceof Array)) {
        throw new Error(
          '`blockDataArray` argument must be an array (is of type ' + (typeof blockData) + ').'
        );
      }

      return blockDataArray.map(function(blockData) {
        return new Block(blockData);
      });
    }
  }

  return Story;
})();
