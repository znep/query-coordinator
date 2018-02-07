import _ from 'lodash';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import BlockRemovalConfirmationStore from 'editor/stores/BlockRemovalConfirmationStore';

describe('BlockRemovalConfirmationStore', function() {

  var dispatcher;
  var storyBlockIds;
  var blockRemovalConfirmationStore;

  beforeEach(function() {
    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);

    var StoryStoreMock = function() {
      _.extend(this, new Store());

      this.register(_.noop);
      this.getStoryBlockIds = function() {
        return storyBlockIds;
      };
    };

    BlockRemovalConfirmationStore.__Rewire__('dispatcher', dispatcher);
    BlockRemovalConfirmationStore.__Rewire__('storyStore', new StoryStoreMock());

    blockRemovalConfirmationStore = new BlockRemovalConfirmationStore();
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    BlockRemovalConfirmationStore.__ResetDependency__('dispatcher');
    BlockRemovalConfirmationStore.__ResetDependency__('storyStore');
  });

  describe('needsConfirmation', function() {
    describe('for a newly loaded story', function() {
      beforeEach(function() {
        storyBlockIds = ['test-block-id'];
        dispatcher.dispatch({action: Actions.STORY_CREATE, data: {uid: 'test-test'}});
      });

      it('needs confirmation to remove any block', function() {
        assert.isTrue(
          blockRemovalConfirmationStore.needsConfirmation(
            'test-block-id'
          )
        );
      });
    });

    describe('when a new block has been added', function() {
      beforeEach(function() {
        storyBlockIds = [];
      });

      it('should not ask for confirmation to delete', function() {
        assert.isFalse(
          blockRemovalConfirmationStore.needsConfirmation('new-block-id')
        );
      });

      describe('and then it is edited', function() {
        it('should ask for confirmation to delete', function() {
          dispatcher.dispatch({
            action: Actions.BLOCK_UPDATE_COMPONENT,
            blockId: 'new-block-id',
            componentIndex: 0,
            type: '',
            value: ''
          });

          assert.isTrue(
            blockRemovalConfirmationStore.needsConfirmation('new-block-id')
          );
        });
      });
    });
  });
});
