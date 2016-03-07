import _ from 'lodash';
import StorytellerUtils from '../StorytellerUtils';

export default function StoryRendererElementCache() {
  var _elements = {};

  this.getBlock = function(blockId) {
    var element = null;

    if (_elements.hasOwnProperty(blockId)) {
      element = _elements[blockId].blockElement;
    }

    return element;
  };

  this.getComponent = function(blockId, componentIndex) {
    StorytellerUtils.assertHasProperty(_elements, blockId);
    StorytellerUtils.assert(
      _elements[blockId].components.length > componentIndex,
      StorytellerUtils.format(
        'block with id "{0}"" does not have a component at index {1}.',
        blockId,
        componentIndex
      )
    );

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
