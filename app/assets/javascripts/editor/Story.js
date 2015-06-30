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
 *   uid: 'test-test',
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
   *   @property {string} uid
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

    if (!storyData.hasOwnProperty('uid')) {
      throw new Error('`storyData` argument contains no `uid` property.');
    }

    if (storyData.uid.match(FOUR_BY_FOUR_PATTERN) === null) {
      throw new Error('`uid` property is not a valid four-by-four: "' + storyData.uid + '".');
    }

    if (!storyData.hasOwnProperty('title')) {
      throw new Error('`storyData` argument contains no `title` property.');
    }

    if (!storyData.hasOwnProperty('blocks')) {
      throw new Error('`storyData` argument contains no `blocks` property.');
    }

    var _uid = storyData.uid;
    var _title = storyData.title;
    var _blockIds = _extractBlockIds(storyData.blocks);

    /**
     * Public methods
     */

    /**
     * @return {string}
     */
    this.getUid = function() {
      return _uid;
    };

    /**
     * @return {string}
     */
    this.getTitle = function() {
      return _title;
    };

    /**
     * @return {string[]}
     */
    this.getBlockIds = function() {
      return _blockIds;
    };

    /**
     * @param {number} index
     */
    this.getBlockIdAtIndex = function(index) {

      if (index < 0 || index >= _blockIds.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      return _blockIds[index];
    };

    /**
     * @param {string} blockId
     */
    this.getBlockIndexWithId = function(blockId) {

      var index = null;

      for (var i = 0; i < _blockIds.length; i++) {
        if (_blockIds[i] === blockId) {

          index = i;
          break;
        }
      }

      return index;
    };

    /**
     * @param {number} index
     * @param {string} blockId
     */
    this.insertBlockAtIndex = function(index, blockId) {

      if (index < 0 || index > _blockIds.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      if (typeof blockId !== 'string') {
        throw new Error(
          '`blockId` argument must be a string (is of type ' +
          (typeof blockId) +
          ').'
        );
      }

      if (index === _blockIds.length) {
        _blockIds.push(blockId);
      } else {
        _blockIds.splice(index, 0, blockId);
      }
    };

    /**
     * @param {string} blockId
     */
    this.appendBlock = function(blockId) {
      this.insertBlockAtIndex(_blockIds.length, blockId);
    };

    /**
     * @param {number} index
     */
    this.removeBlockAtIndex = function(index) {

      if (index < 0 || index >= _blockIds.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      _blockIds.splice(index, 1);
    };

    /**
     * @param {string} blockId
     */
    this.removeBlockWithId = function(blockId) {

      _blockIds = _blockIds.filter(function(testBlockId) {
        return testBlockId !== blockId;
      });
    };

    /**
     * @param {number} index1
     * @param {number} index2
     */
    this.swapBlocksAtIndices = function(index1, index2) {

      if (index1 < 0 || index1 >= _blockIds.length) {
        throw new Error('`index1` argument is out of bounds.');
      }

      if (index2 < 0 || index2 >= _blockIds.length) {
        throw new Error('`index2` argument is out of bounds.');
      }

      var tempBlock = _blockIds[index1];
      _blockIds[index1] = _blockIds[index2];
      _blockIds[index2] = tempBlock;
    };

    /**
     * @return {object}
     *   @property {string} id
     *   @property {string} title
     *   @property {string[]} blockIds
     */
    this.serialize = function() {

      return {
        uid: _uid,
        title: _title,
        blocks: _blockIds
      };
    };

    /**
     * Private methods
     */

    /**
     * @param {object[]} blockData
     *   @property {string} id
     *   @property {string} layout
     *   @property {object[]} components
     *     @property {string} type
     *     @property {string} value
     * @return {string[]}
     */
    function _extractBlockIds(blockData) {
      return blockData.map(function(blockDatum) {

        if (_.isUndefined(blockDatum.id)) {
          throw new Error(
            '`blocks` argument block has no id property: ' +
            JSON.stringify(blockDatum) +
            '.'
          );
        }

        return blockDatum.id;
      });
    }
  }

  return Story;
})();
