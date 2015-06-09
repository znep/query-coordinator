;var Block = (function() {

  'use strict';

  function Block(blockData) {

    if (typeof blockData !== 'object') {
      throw new Error(
        '`blockData` argument must be an object (is of type ' + (typeof blockData) + ').'
      )
    }

    if (!blockData.hasOwnProperty('id')) {
      throw new Error('`blockData` argument contains no `id` property.');
    }

    if (!blockData.hasOwnProperty('layout')) {
      throw new Error('`blockData` argument contains no `layout` property.');
    }

    if (!blockData.hasOwnProperty('components')) {
      throw new Error('`blockData` argument contains no `components` property.');
    }

    var _dirty = false;
    var _id = blockData.id;
    var _layout = blockData.layout;
    var _components = blockData.components;

    /**
     * Public methods
     */

    this.isDirty = function() {
      return _dirty;
    };

    this.markDirty = function() {
      _dirty = true;
    };

    this.getId = function() {
      return _id;
    };

    this.getLayout = function() {
      return _layout;
    };

    this.updateLayout = function(layout) {

      if (typeof layout !== 'string') {
        throw new Error(
          '`layout` argument must be a string (is of type ' + (typeof layout) + ').'
        );
      }

      _layout = layout;
    };

    this.getComponents = function() {
      return _components;
    };

    this.getComponentAtIndex = function(index) {

      if (index < 0 || index >= _components.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      return _components[index];
    };

    this.updateComponentAtIndex = function(index, componentType, componentValue) {

      if (index < 0 || index >= _components.length) {
        throw new Error('`index` argument is out of bounds.');
      }

      if (typeof componentType !== 'string') {
        throw new Error(
          '`componentType` argument must be a string (is of type ' + (typeof componentType) + ').'
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

    function _generateTemporaryId() {
      return 'temp-' + String(Date.now());
    }

    function _cloneComponents(components) {

      var newComponents = [];

      for (var i = 0; i < components.length; i++) {

        if (typeof components[i].value !== 'string') {
          throw new Error(
            'component value must be of type string (is a ' + (typeof components[i].value) + ').'
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

    function _updateTextAtIndex(index, text) {

      if (typeof text !== 'string') {
        throw new Error(
          '`text` argument must be a string (is of type ' + (typeof text) + ').'
        );
      }

      _components[index] = {
        type: 'text',
        value: text
      };
    }

    function _updateImageAtIndex(index, imageUrl) {

      if (typeof imageUrl !== 'string') {
        throw new Error(
          '`imageUrl` argument must be a string (is of type ' + (typeof imageUrl) + ').'
        );
      }

      _components[index] = {
        type: 'image',
        value: imageUrl
      };
    }

    function _updateVisualizationAtIndex(index, visualizationUrl) {

      if (typeof visualizationUrl !== 'string') {
        throw new Error(
          '`visualizationUrl` argument must be a string (is of type ' + (typeof visualizationUrl) + ').'
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
