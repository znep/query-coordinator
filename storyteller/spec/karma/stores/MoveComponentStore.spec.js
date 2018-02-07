import { expect } from 'chai';

import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import MoveComponentStore, {__RewireAPI__ as MoveComponentStoreAPI} from 'editor/stores/MoveComponentStore';
import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';

describe('MoveComponentStore', () => {
  let moveComponentStore;
  let dispatcher;
  let blockComponentAtIndex;

  let blockId = 'blockId';
  let componentIndex = 0;

  const rewires = () => {
    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);
    MoveComponentStoreAPI.__Rewire__('storyStore', {
      getBlockComponentAtIndex: _.constant(blockComponentAtIndex)
    });
  };

  const resets = () => {
    MoveComponentStoreAPI.__ResetDependency__('dispatcher');
    MoveComponentStoreAPI.__ResetDependency__('storyStore');
  };

  beforeEach(() => {
    rewires();
    moveComponentStore = new MoveComponentStore();
  });

  afterEach(() => {
    resets();
  });

  describe('MOVE_COMPONENT_START', () => {
    const dispatchMoveComponentStart = () => {
      dispatcher.dispatch({
        action: Actions.MOVE_COMPONENT_START,
        blockId,
        componentIndex
      });
    };

    beforeEach(() => {
      dispatchMoveComponentStart();
    });

    it('sets isUserChoosingMoveDestination to true', () => {
      expect(moveComponentStore.isUserChoosingMoveDestination()).to.equal(true);
    });

    it('sets sourceComponent to the blockId and componentIndex', () => {
      expect(moveComponentStore.getSourceMoveComponent()).to.deep.equal({ blockId, componentIndex });
    });

    describe('isComponentBeingMoved', () => {
      it('returns false for IDs and indexes that don\'t match the source component', () => {
        expect(moveComponentStore.isComponentBeingMoved('notBlockId', Math.Infinity)).to.equal(false);
      });

      it('returns true for an ID and index that matches the source component', () => {
        expect(moveComponentStore.isComponentBeingMoved(blockId, componentIndex)).to.equal(true);
      });
    });

    describe('isComponentValidMoveDestination', () => {
      beforeEach(() => {
        blockComponentAtIndex = { type: 'youtube.video' };
        rewires();
        moveComponentStore = new MoveComponentStore();
        dispatchMoveComponentStart();
      });

      it('returns false for the source component', () => {
        expect(moveComponentStore.isComponentValidMoveDestination(blockId, componentIndex)).to.equal(false);
      });

      it('returns true for any media component', () => {
        expect(moveComponentStore.isComponentValidMoveDestination('notBlockId', Math.Infinity)).to.equal(true);
      });
    });
  });

  describe('MOVE_COMPONENT_DESTINATION_CHOSEN', () => {
    beforeEach(() => {
      dispatcher.dispatch({
        action: Actions.MOVE_COMPONENT_DESTINATION_CHOSEN
      });
    });

    it('sets isUserChoosingDestination to false', () => {
      expect(moveComponentStore.isUserChoosingMoveDestination()).to.equal(false);
    });
  });

  describe('MOVE_COMPONENT_CANCEL', () => {
    beforeEach(() => {
      dispatcher.dispatch({
        action: Actions.MOVE_COMPONENT_CANCEL
      });
    });

    it('sets isUserChoosingDestination to false', () => {
      expect(moveComponentStore.isUserChoosingMoveDestination()).to.equal(false);
    });

    it('sets sourceComponent to null for all Object properties', () => {
      expect(moveComponentStore.getSourceMoveComponent()).to.deep.equal({
        blockId: null,
        componentIndex: null
      });
    });
  });

  describe('isComponentValidSource', () => {
    it('returns false for an invalid component type', () => {
      expect(moveComponentStore.isComponentValidMoveSource('not.valid')).to.equal(false);
    });

    it('returns true for a valid component type', () => {
      expect(moveComponentStore.isComponentValidMoveSource('youtube.video')).to.equal(true);
    });
  });
});
