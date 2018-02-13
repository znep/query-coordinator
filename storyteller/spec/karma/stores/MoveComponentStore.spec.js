import { assert } from 'chai';

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
    StoreAPI.__ResetDependency__('dispatcher');
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
      assert.isTrue(moveComponentStore.isUserChoosingMoveDestination());
    });

    it('sets sourceComponent to the blockId and componentIndex', () => {
      assert.deepEqual(
        moveComponentStore.getSourceMoveComponent(),
        { blockId, componentIndex }
      );
    });

    describe('isComponentBeingMoved', () => {
      it('returns false for IDs and indexes that don\'t match the source component', () => {
        assert.isFalse(moveComponentStore.isComponentBeingMoved('notBlockId', Math.Infinity));
      });

      it('returns true for an ID and index that matches the source component', () => {
        assert.isTrue(moveComponentStore.isComponentBeingMoved(blockId, componentIndex));
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
        assert.isFalse(moveComponentStore.isComponentValidMoveDestination(blockId, componentIndex));
      });

      it('returns true for any media component', () => {
        assert.isTrue(moveComponentStore.isComponentValidMoveDestination('notBlockId', Math.Infinity));
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
      assert.isFalse(moveComponentStore.isUserChoosingMoveDestination());
    });
  });

  describe('MOVE_COMPONENT_CANCEL', () => {
    beforeEach(() => {
      dispatcher.dispatch({
        action: Actions.MOVE_COMPONENT_CANCEL
      });
    });

    it('sets isUserChoosingDestination to false', () => {
      assert.isFalse(moveComponentStore.isUserChoosingMoveDestination());
    });

    it('sets sourceComponent to null for all Object properties', () => {
      assert.deepEqual(
        moveComponentStore.getSourceMoveComponent(),
        {
          blockId: null,
          componentIndex: null
        }
      );
    });
  });

  describe('isComponentValidSource', () => {
    it('returns false for an invalid component type', () => {
      assert.isFalse(moveComponentStore.isComponentValidMoveSource('not.valid'));
    });

    it('returns true for a valid component type', () => {
      assert.isTrue(moveComponentStore.isComponentValidMoveSource('youtube.video'));
    });
  });
});
