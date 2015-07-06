;var StoryRendererElementCache = (function() {

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

      var component = null;

      if (!_elements.hasOwnProperty(blockId)) {
        throw new Error(
          'block with id "' + blockId + '" is not present in cache'
        );
      }

      if (_elements[blockId].components.hasOwnProperty(componentIndex)) {
        component = _elements[blockId].components[componentIndex];
      }

      return component;
    };

    this.setBlock = function(blockId, blockElement) {

      if (!_elements.hasOwnProperty(blockId)) {
        _elements[blockId] = {};
      }

      _elements[blockId].blockElement = blockElement;
    };

    this.setComponent = function(blockId, componentIndex, componentElement) {

      if (!_elements.hasOwnProperty(blockId)) {
        _elements[blockId] = {};
      }

      if (!_elements[blockId].hasOwnProperty('components')) {
        _elements[blockId].components = {};
      }

      _elements[blockId].components[componentIndex] = componentElement;
    };

    this.flushBlock = function(blockId) {

      if (_elements.hasOwnProperty(blockId)) {
        delete _elements[blockId];
      }
    };

    this.flushBlocksExcept = function(currentBlockIds) {

      var self = this;
      var blockIdsToRemove = Object.
        keys(_elements).
        filter(function(blockId) {
          return currentBlockIds.indexOf(blockId) === -1;
        });

      blockIdsToRemove.forEach(function(blockId) {
        self.getBlock(blockId).remove();
        self.flushBlock(blockId);
      });
    };
  }

  return StoryRendererElementCache;
})();
