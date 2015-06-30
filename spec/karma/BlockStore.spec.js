describe('BlockStore', function() {

  'use strict';

  function dispatch(action) {
    window.dispatcher.dispatch(action);
  }

  beforeEach(function() {
    window.dispatcher = new Dispatcher();
    window.store = new BlockStore();
  });

  afterEach(function() {
  });


  describe('accessors', function() {

    describe('given an existing block id', function() {

      it('should return the correct value', function() {

        assert.equal(store.getComponents(story1Uid), 'Test Story');
        assert.deepEqual(store.getBlock(block1Id), block1);
        assert.equal(store.getBlockIdAtIndex(story1Uid, 0), firstBlockId);

        assert.equal(store.getTitle(story2Uid), 'Test Story');
        assert.deepEqual(store.getBlockIds(story2Uid), [ thirdBlockId ]);
        assert.equal(store.getBlockIdAtIndex(story2Uid, 0), thirdBlockId);
      });
    });
  });


/*
  describe('with story data in the constructor', function() {
    var storyData1;
    var storyData2;
    var firstBlockId = 2000;
    var secondBlockId = 2001;
    var thirdBlockId = 2002;
    var store;

    beforeEach(function() {
      var story1Id = 'stry-spc1';
      var story2Id = 'stry-spc2';
      storyData1 = generateStoryData({
        fourByFour: story1Id,
        blocks: [
          generateBlockData({
            id: firstBlockId,
            components: [
              { type: 'image', value: 'fakeImageFile.png' }
            ]
          }),
          generateBlockData({
            id: secondBlockId,
            components: [
              { type: 'text', value: 'some-text-a' }
            ]
          })
        ]
      });
      
      storyData2 = generateStoryData({
        fourByFour: story2Id,
        blocks: [
          generateBlockData({
            id: thirdBlockId,
            components: [
              { type: 'text', value: 'some-text-b' }
            ]
          })
        ]
      });
      
      store = new BlockStore([storyData1, storyData2]);
    });

    describe('with conflicting block IDs', function() {
      beforeEach(function() {
        storyData1.blocks[0].id = storyData1.blocks[1].id;
      });

      it('should throw', function() {
        assert.throw(function() {
          new BlockStore([storyData1, storyData2]);
        });
      });
    });
    
    describe('accessors', function() {
      describe('given an existing block ID', function() {
        it('should return the correct value', function() {
          assert.equal(store.isDirty(firstBlockId), false);
          assert.equal(store.getLayout(firstBlockId), '12');
          assert.equal(store.getComponents(firstBlockId).length, 1);
          assert.deepEqual(store.getComponentAtIndex(firstBlockId, 0), storyData1.blocks[0].components[0]);
          assert.deepEqual(store.serialize(firstBlockId), { id: 2000 });
        });
      });
    });

    describe('action', function() {
      function dispatch(action) {
        window.dispatcher.emit(action);
      }

      // NOTE! These implementations delegate to the Block model.
      // Proper tests for these actions live in Block.spec.js.
      describe('block:updateComponentAtIndex', function() {

        describe('given a bad story ID', function() {
          it('should throw', function() {
            assert.throw(function() {
              dispatch({
                name: 'block:updateComponentAtIndex',
                blockId: 'bad',
                index: 0,
                type: 'image',
                value: 'newValue'
              });
            });
          });
        });

        it('should update the block', function() {
          dispatch({
            name: 'block:updateComponentAtIndex',
            blockId: thirdBlockId,
            index: 0,
            type: 'image',
            value: 'newValue'
          });

          var component = store.getComponentAtIndex(thirdBlockId, 0);
          assert.deepEqual(component, {
            type: 'image',
            value: 'newValue'
          });
        });
      });

      describe('block:cloneExistingBlock', function() {

        describe('given a bad source story ID', function() {
          it('should throw', function() {
            assert.throw(function() {
              dispatch({
                name: 'block:cloneExistingBlock',
                newBlockId: 1111,
                sourceBlockId: 'bad'
              });
            });
          });
        });

        it('should update the block', function() {
          dispatch({
            name: 'block:cloneExistingBlock',
            newBlockId: 1337,
            sourceBlockId: secondBlockId
          });

          var component = store.getComponents(1337);
          assert.deepEqual(component, storyData1.blocks[1].components);
        });
      });

    });
  });*/
});
