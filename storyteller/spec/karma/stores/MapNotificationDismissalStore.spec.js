import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import MapNotificationDismissalStore, {__RewireAPI__ as MapNotificationDismissalStoreAPI}  from 'editor/stores/MapNotificationDismissalStore';

describe('MapNotificationDismissalStore', function() {

  let dispatcher;
  let mapNotificationDismissalStore;

  beforeEach(function() {
    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);
    MapNotificationDismissalStoreAPI.__Rewire__('dispatcher', dispatcher);

    const MoveComponentStoreMock = function() {
      _.extend(this, new Store());
      this.getSourceMoveComponent = _.constant({ blockId: 'test-block-id', componentIndex: 0 });
    };
    MapNotificationDismissalStoreAPI.__Rewire__('moveComponentStore', new MoveComponentStoreMock());

    mapNotificationDismissalStore = new MapNotificationDismissalStore();
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    MapNotificationDismissalStoreAPI.__ResetDependency__('dispatcher');
  });

  describe('isDismissed', function() {
    it('is false on first load', function() {
      assert.isFalse(mapNotificationDismissalStore.isDismissed('test-block-id', 0));
    });

    it('is true after Actions.DISMISS_MAP_NOTIFICATION', function() {
      dispatcher.dispatch({
        action: Actions.DISMISS_MAP_NOTIFICATION,
        blockId: 'test-block-id',
        componentIndex: 0
      });

      assert.isTrue(mapNotificationDismissalStore.isDismissed('test-block-id', 0));
    });

    it('is accurate after Actions.MOVE_COMPONENT_DESTINATION_CHOSEN', function() {
      dispatcher.dispatch({
        action: Actions.DISMISS_MAP_NOTIFICATION,
        blockId: 'test-block-id',
        componentIndex: 0
      });

      dispatcher.dispatch({
        action: Actions.MOVE_COMPONENT_DESTINATION_CHOSEN,
        blockId: 'test-block-id',
        componentIndex: 1
      });

      assert.isTrue(mapNotificationDismissalStore.isDismissed('test-block-id', 1));
      assert.isFalse(mapNotificationDismissalStore.isDismissed('test-block-id', 0));
    });
  });
});
