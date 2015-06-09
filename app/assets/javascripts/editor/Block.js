/**
 * Usage Instructions
 *
 * Blocks are either instantiated from existing block data or are cloned from
 * existing blocks. This clearly leads to an 'Unmoved Mover' kind of paradox
 * and hey, we should be ok with that.
 *
 * To instantiate a new Block from existing data, pass the data in to the
 * constructor, like so:
 *
 * var block = new Block({
 *   id: 1,
 *   layout: '6-6',
 *   components: [
 *     { type: 'text', value: 'Hello, world!' },
 *     { type: 'text', value: 'Gutentag' }
 *   ]
 * });
 *
 * Once you have a live block object, you may clone it by using the .clone()
 * method to create a new block (for example, when dragging from the
 * inspiration story):
 *
 * var clonedBlock = block.clone();
 *
 * Cloning a block will immediately mark the clone as dirty. Dirty blocks
 * serialize into an object containing the actual block data, whereas non-dirty
 * blocks serialize into an object with only an id property. This signals our
 * back-end that the block has not changed and thus the reference to the stored
 * block data is still valid (whereas attempting to save a dirty block will
 * result in the creation of a new block record in the datastore).
 */
;var Block = (function() {

  'use strict';

  /**
   * @constructor
   * @param {object} blockData
   *   @property {(number|string)} id
   *   @property {string} layout
   *   @property {object[]} components
   */
  function Block(blockData) {

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

    var _dirty = false;
    var _id = blockData.id;
    var _layout = blockData.layout;
    var _components = blockData.components;

    /**
     * Public methods
     */

    /**
     * @return {boolean}
     */
    this.isDirty = function() {
      return _dirty;
    };

    this.markDirty = function() {
      _dirty = true;
    };

    /**
     * @return {string}
     */
    this.getId = function() {
      return _id;
    };

    /**
     * @return {string}
     */
    this.getLayout = function() {
      return _layout;
    };

    /**
     * @param {string} layout
     */
    this.updateLayout = function(layout) {

      if (typeof layout !== 'string') {
        throw new Error(
          '`layout` argument must be a string (is of type ' +
          (typeof layout) +
          ').'
        );
      }

      _layout = layout;
    };

    /**
     * @return {object[]}
     */
    this.getComponents = function() {
      return _components;
    };

    /**
     * @param {number} index
     * @return {object}
     */
    this.getComponentAtIndex = function(index) {

      if (index < 0 || index >= _components.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      return _components[index];
    };

    /**
     * @param {number} index
     */
    this.updateComponentAtIndex = function(index, componentType, componentValue) {

      if (index < 0 || index >= _components.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      if (typeof componentType !== 'string') {
        throw new Error(
          '`componentType` argument must be a string (is of type ' +
          (typeof componentType) +
          ').'
        );
      }

      switch (componentType) {
        case 'text':
          _updateTextAtIndex(index, componentValue);
          break;
        case 'image':
          _updateImageAtIndex(index, componentValue);
          break;
        case 'visualization':
          _updateVisualizationAtIndex(index, componentValue);
          break;
        default:
          throw new Error(
            'Unrecognized `componentType`: ' + componentType + '.'
          );
      }

      this.markDirty();
    };

    /**
     * @return {object}
     *   @property {(number|string)} [id]
     *   @property {string} [layout]
     *   @property {object[]} [components]
     *     @property {string} type
     *     @property {string} value
     */
    this.serialize = function() {

      var blockData = {
        id: _id
      };

      if (this.isDirty()) {
        blockData = {
          layout: _layout,
          components: _components
        };
      }

      return blockData;
    };

    /**
     * @return {Block}
     */
    this.clone = function() {

      var newBlock = new Block({
        id: _generateTemporaryId(),
        layout: _layout,
        components: _cloneComponents(_components)
      });

      newBlock.markDirty();

      return newBlock;
    };

    /**
     * Private methods
     */

    /**
     * @return {string}
     */
    function _generateTemporaryId() {
      return 'temp-' + String(Date.now());
    }

    /**
     * Deep-copies an array of components.
     *
     * @param {object[]} components
     * @return {object[]}
     */
    function _cloneComponents(components) {

      var newComponents = [];

      for (var i = 0; i < components.length; i++) {

        if (typeof components[i].value !== 'string') {
          throw new Error(
            'component value must be of type string (is a ' +
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

    /**
     * @param {number} index
     * @param {string} text
     */
    function _updateTextAtIndex(index, text) {

      if (typeof text !== 'string') {
        throw new Error(
          '`text` argument must be a string (is of type ' +
          (typeof text) +
          ').'
        );
      }

      _components[index] = {
        type: 'text',
        value: text
      };
    }

    /**
     * @param {number} index
     * @param {string} imageUrl
     */
    function _updateImageAtIndex(index, imageUrl) {

      if (typeof imageUrl !== 'string') {
        throw new Error(
          '`imageUrl` argument must be a string (is of type ' +
          (typeof imageUrl) +
          ').'
        );
      }

      _components[index] = {
        type: 'image',
        value: imageUrl
      };
    }

    /**
     * @param {number} index
     * @param {string} visualizationUrl
     */
    function _updateVisualizationAtIndex(index, visualizationUrl) {

      if (typeof visualizationUrl !== 'string') {
        throw new Error(
          '`visualizationUrl` argument must be a string (is of type ' +
          (typeof visualizationUrl) +
          ').'
        );
      }

      _components[index] = {
        type: 'visualization',
        value: visualizationUrl
      };
    }
  }

  return Block;
})();
