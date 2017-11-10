import _ from 'lodash';

import Store from './Store';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import { assertHasProperty } from 'common/js_utils';
import { storyStore } from './StoryStore';

export const moveComponentStore = StorytellerUtils.export(new MoveComponentStore(), 'storyteller.moveComponentStore');

/**
 * Handles the swap of two components. This can happen from within the same
 * block or across blocks. Components are identified by blockId and
 * componentIndex.
 *
 * This swap may only occur between a subset of components (see isComponentTypeMovable).
 * This store is not responsible for the data representation of the components. That is
 * captured in StoryStore.
 */
export default function MoveComponentStore() {
  _.extend(this, new Store());

  let state = {
    sourceBlockId: null,
    sourceComponentIndex: null,
    isUserChoosingDestination: false
  };

  this.register((payload) => {
    switch (payload.action) {
      case Actions.MOVE_COMPONENT_START:
        moveStarted(payload);
        break;
      case Actions.MOVE_COMPONENT_DESTINATION_CHOSEN:
        moveEnded();
        break;
      case Actions.MOVE_COMPONENT_CANCEL:
        moveCancelled();
        break;
    }
  });

  this.isUserChoosingMoveDestination = () => {
    return state.isUserChoosingDestination;
  };

  this.isComponentValidMoveDestination = (blockId, componentIndex) => {
    const { type } = storyStore.getBlockComponentAtIndex(blockId, componentIndex);
    return isComponentTypeMovable(type) && !this.isComponentBeingMoved(blockId, componentIndex);
  };

  this.isComponentValidMoveSource = (componentType) => {
    return isComponentTypeMovable(componentType);
  };

  this.isComponentBeingMoved = (blockId, componentIndex) => {
    return blockId === state.sourceBlockId && componentIndex === state.sourceComponentIndex;
  };

  this.getSourceMoveComponent = () => {
    return { blockId: state.sourceBlockId, componentIndex: state.sourceComponentIndex };
  };

  const moveStarted = (payload) => {
    assertHasProperty(payload, 'blockId');
    assertHasProperty(payload, 'componentIndex');

    const { blockId, componentIndex } = payload;

    state.sourceBlockId = blockId;
    state.sourceComponentIndex = componentIndex;
    state.isUserChoosingDestination = true;

    this._emitChange();
  };

  const moveEnded = () => {
    state.isUserChoosingDestination = false;

    this._emitChange();
  };

  const moveCancelled = () => {
    state.isUserChoosingDestination = false;
    state.sourceBlockId = null;
    state.sourceComponentIndex = null;

    this._emitChange();
  };

  function isComponentTypeMovable(componentType) {
    return _.includes([
      'assetSelector',
      'image',
      'story.tile',
      'story.widget',
      'goal.tile',
      'youtube.video',
      'socrata.visualization.classic',
      'socrata.visualization.regionMap',
      'socrata.visualization.choroplethMap', // legacy
      'socrata.visualization.columnChart',
      'socrata.visualization.comboChart',
      'socrata.visualization.barChart',
      'socrata.visualization.pieChart',
      'socrata.visualization.timelineChart',
      'socrata.visualization.histogram',
      'socrata.visualization.table',
      'socrata.visualization.featureMap',
      'embeddedHtml'
    ], componentType);
  }
}
