;window.socrata.storyteller.StoryRendererElementCache = (function(storyteller) {

  'use strict';

  function StoryRendererElementCache() {

    var _elements = {};

    this.getBlock = function(blockId) {

      var element = null;

      if (_elements.hasOwnProperty(blockId)) {
        element = _elements[blockId].blockElement;
      }

      return element;
    };

    this.getComponent = function(blockId, componentIndex) {

      if (!_elements.hasOwnProperty(blockId)) {
        throw new Error(
          'block with id "' + blockId + '" is not present in cache'
        );
      }

      if (_elements[blockId].components.length <= componentIndex) {
        throw new Error(
          'block with id "' +
          blockId +
          '" does not have a component at index ' +
          componentIndex +
          '.'
        );
      }

      return _elements[blockId].components[componentIndex];
    };

    this.setBlock = function(blockId, componentCount, blockElement) {

      if (!_elements.hasOwnProperty(blockId)) {
        _elements[blockId] = {};
      }

      _elements[blockId].blockElement = blockElement;
      _elements[blockId].components = [];
      _elements[blockId].components.length = componentCount;
    };

    this.setComponent = function(blockId, componentIndex, componentElement) {

      var components;

      if (!_elements.hasOwnProperty(blockId)) {
        _elements[blockId] = {};
      }

      if (!_elements[blockId].hasOwnProperty('components')) {
        _elements[blockId].components = [];
      }

      components = _elements[blockId].components;

      if (components.length <= componentIndex) {
        components.length = componentIndex + 1;
      }

      components[componentIndex] = componentElement;
    };

    this.getUnusedBlockIds = function(currentBlockIds) {

      var self = this;
      var blockIdsToRemove = _.difference(
        Object.keys(_elements),
        currentBlockIds
      );

      return blockIdsToRemove;
    };

    this.flushBlock = function(blockId) {
      delete _elements[blockId];
    };
  }

  return StoryRendererElementCache;
})(window.socrata.storyteller);
