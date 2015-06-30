describe('Story', function() {

  describe('constructor', function() {

    describe('when `storyData` is not an object', function() {

      it('raises an exception', function() {

        assert.throw(function() {
          new Story('not an object')
        });
      });
    });

    describe('when `storyData` is incomplete', function() {

      var storyData;

      beforeEach(function() {
        storyData = generateStoryData();
      });

      describe('and `uid` is missing', function() {

        it('raises an exception', function() {

          delete storyData['uid'];

          assert.throw(function() {
            new Story(storyData)
          });
        });
      });

      describe('and `uid` is not a valid four-by-four', function() {

        it('raises an exception', function() {

          storyData['uid'] = 'testtest';

          assert.throw(function() {
            new Story(storyData)
          });
        });
      });

      describe('and `title` is missing', function() {

        it('raises an exception', function() {

          delete storyData['title'];

          assert.throw(function() {
            new Story(storyData)
          });
        });
      });

      describe('and `blocks` is missing', function() {

        it('raises an exception', function() {

          delete storyData['blocks'];

          assert.throw(function() {
            new Story(storyData)
          });
        });
      });

      describe('and `blocks` is not an array', function() {

        it('raises an exception', function() {

          var storyData = generateStoryData({
            blocks: 'not an array'
          });

          assert.throw(function() {
            new Story(storyData)
          });
        });
      });

      describe('and `blocks` contains invalid block objects', function() { 

        it('raises an exception', function() {

          var storyData = generateStoryData({
            blocks: [
              { invalidBlockObject: true }
            ]
          });

          assert.throw(function() {
            new Story(storyData)
          });
        });
      });
    });

    describe('when `storyData` is valid', function() {

      it('creates a new Story', function() {
        assert.instanceOf(new Story(generateStoryData()), Story, 'instantiated story is an instance of Story');
      });
    });
  });

  describe('instance variables', function() {

    it('should not expose `_uid` directly', function() {

      var storyData = generateStoryData({
        uid: 'test-test'
      });
      var newStory = new Story(storyData);

      assert.isUndefined(newStory._uid, '`_uid` is undefined on story');
    });

    it('should return a four-by-four when .getUid() is called', function() {

      var storyData = generateStoryData({
        uid: 'test-test'
      });
      var newStory = new Story(storyData);
      var uid = newStory.getUid();

      assert.equal(uid, 'test-test', 'story `_uid` is "test-test"');
    });

    it('should not expose `_title` directly', function() {

      var storyData = generateStoryData({
        title: 'Story Title'
      });
      var newStory = new Story(storyData);

      assert.isUndefined(newStory._title, '`_title` is undefined on story');
    });

    it('should return title when .getTitle() is called', function() {

      var storyData = generateStoryData({
        title: 'Story Title'
      });
      var newStory = new Story(storyData);
      var title = newStory.getTitle();

      assert.equal(title, 'Story Title', 'story `_title` is "Story Title"');
    });

    it('should not expose `_blockIds` directly', function() {

      var storyData = generateStoryData({
        blocks: [
          generateBlockData({
            components: [
              { type: 'text', value: 'Component 1' }
            ]
          })
        ]
      });
      var newStory = new Story(storyData);

      assert.isUndefined(newStory._blockIds, '`_blockIds` is undefined on story');
    });

    it('should return valid block ids when .getBlockIds() is called', function() {

      var storyData = generateStoryData({
        blocks: [
          generateBlockData({
            components: [
              { type: 'text', value: 'Component 1' }
            ]
          })
        ]
      });
      var newStory = new Story(storyData);
      var blockIds = newStory.getBlockIds();

      assert.property(blockIds, 'length', '`length` is present on story blocks');
    });
  });

  describe('.getBlockIdAtIndex()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({
            id: 'first',
            components: [
              { type: 'text', value: 'First' }
            ]
          }),
          generateBlockData({
            id: 'second',
            components: [
              { type: 'text', value: 'Second' }
            ]
          })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called with an index < 0', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.getBlockIdAtIndex(-1);
        });
      });
    });

    describe('when called with an index >= the number of blocks', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.getBlockIdAtIndex(2);
        });
      });
    });

    describe('when called with a valid index', function() {

      it('returns the correct block', function() {

        assert.deepEqual(
          newStory.getBlockIdAtIndex(1),
          'second',
          'the returned block is correct'
        );
      });
    });
  });

  describe('.getBlockIndexWithId()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: '100' }),
          generateBlockData({ id: 'test' }),
          generateBlockData({ id: '101' })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called with an id that does not exist', function() {

      it('returns null', function() {

        var noBlock = newStory.getBlockIndexWithId('does not exist');

        assert(noBlock === null, 'returns null')
      });
    });

    describe('when called with a string id that exists', function() {

      it('returns the index with the specified id', function() {

        var blockIndex = newStory.getBlockIndexWithId('test');

        assert.equal(
          blockIndex,
          1,
          'the correct index is returned'
        );
      });
    });

    describe('when called with a numeric id that exists', function() {

      it('returns the index with the specified id', function() {

        var blockIndex = newStory.getBlockIndexWithId('101');

        assert.equal(
          blockIndex,
          2,
          'the correct index is returned'
        );
      });
    });
  });

  describe('.insertBlockAtIndex()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: '100' }),
          generateBlockData({ id: '101' })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called with no block id', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.insertBlockAtIndex(0);
        });
      });
    });

    describe('when called with an invalid block id', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.insertBlockAtIndex(0, null);
        });
      });
    });

    describe('when called with a valid block id', function() {

      describe('and index < 0', function() {

        it('raises an exception', function() {

          assert.throws(function() {
            newStory.insertBlockAtIndex(-1, 'newBlockId');
          });
        });
      });

      describe('and index > the number of blocks', function() {

        it('raises an exception', function() {

          assert.throws(function() {
            newStory.insertBlockAtIndex(3, 'newBlockId');
          });
        });
      });

      describe('and index > 0 and index < the number of blocks', function() {

        it('inserts a new block into the existing blocks at the specified index', function() {

          newStory.insertBlockAtIndex(1, 'newBlockId');
          assert.equal(
            newStory.getBlockIdAtIndex(1),
            'newBlockId',
            'new block was inserted at the specified index'
          );
        });
      });

      describe('and index === the number of blocks', function() {

        it('appends a new block to the existing blocks', function() {

          newStory.insertBlockAtIndex(2, 'newBlockId');
          assert.equal(
            newStory.getBlockIdAtIndex(2),
            'newBlockId',
            'new block was inserted at the specified index'
          );
        });
      });
    });
  });

  describe('.appendBlock()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: '100' }),
          generateBlockData({ id: '101' })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called with no block id', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.appendBlock();
        });
      });
    });

    describe('when called with an invalid block id', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.appendBlock(null);
        });
      });
    });

    describe('when called with a valid block id', function() {

      it('appends a new block to the existing blocks', function() {

        newStory.appendBlock('newBlockId');
        assert.equal(
          newStory.getBlockIdAtIndex(2),
          'newBlockId',
          'new block was inserted at the specified index'
        );
      });
    });
  });

  describe('.removeBlockAtIndex()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: 'first' }),
          generateBlockData({ id: '2' }),
          generateBlockData({ id: 'third' })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called with an index < 0', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.removeBlockAtIndex(-1);
        });
      });
    });

    describe('when called with an index >= the number of blocks', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.removeBlockAtIndex(3);
        });
      });
    });

    describe('when called with a valid index', function() {

      it('removes the block at the specified index', function() {

        newStory.removeBlockAtIndex(0);

        assert(newStory.getBlockIds().length === 2, 'only two blocks remain');
        assert.equal(
          newStory.getBlockIdAtIndex(0),
          '2',
          'the first remaining block is the one that was originally at index 1'
        );
        assert.equal(
          newStory.getBlockIdAtIndex(1),
          'third',
          'the second remaining block is the one that was originally at index 2'
        );
      });
    });
  });

  describe('.removeBlockWithId()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: 'first' }),
          generateBlockData({ id: '2' }),
          generateBlockData({ id: 'third' })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called with an id that does not exist', function() {

      it('does not remove any blocks', function() {

        newStory.removeBlockWithId('does not exist');

        assert(newStory.getBlockIds().length === 3, 'only two blocks remain');
        assert.equal(
          newStory.getBlockIdAtIndex(0),
          'first',
          'the first remaining block is the one that was originally at index 0'
        );
        assert.equal(
          newStory.getBlockIdAtIndex(1),
          '2',
          'the second remaining block is the one that was originally at index 1'
        );
        assert.equal(
          newStory.getBlockIdAtIndex(2),
          'third',
          'the third remaining block is the one that was originally at index 2'
        );
      });
    });

    describe('when called with a string id that exists', function() {

      it('removes the block at the specified index', function() {

        newStory.removeBlockWithId('first');

        assert(newStory.getBlockIds().length === 2, 'only two blocks remain');
        assert.equal(
          newStory.getBlockIdAtIndex(0),
          '2',
          'the first remaining block is the one that was originally at index 1'
        );
        assert.equal(
          newStory.getBlockIdAtIndex(1),
          'third',
          'the second remaining block is the one that was originally at index 2'
        );
      });
    });

    describe('when called with a numeric id that exists', function() {

      it('removes the block at the specified index', function() {

        newStory.removeBlockWithId('2');

        assert(newStory.getBlockIds().length === 2, 'only two blocks remain');
        assert.equal(
          newStory.getBlockIdAtIndex(0),
          'first',
          'the first remaining block is the one that was originally at index 0'
        );
        assert.equal(
          newStory.getBlockIdAtIndex(1),
          'third',
          'the second remaining block is the one that was originally at index 2'
        );
      });
    });
  });

  describe('.swapBlocksAtIndices()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: 'first' }),
          generateBlockData({ id: 'second' })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called with the first index < 0', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.swapBlocksAtIndices(-1, 1);
        });
      });
    });

    describe('when called with the second index < 0', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.swapBlocksAtIndices(0, -1);
        });
      });
    });

    describe('when called with the first index < 0', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.swapBlocksAtIndices(2, 1);
        });
      });
    });

    describe('when called with the second index < 0', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.swapBlocksAtIndices(0, 2);
        });
      });
    });

    describe('when called with valid indices', function() {

      it('swaps the positions of the blocks at the specified indices', function() {

        var blockAtIndex0 = newStory.getBlockIdAtIndex(0);
        var blockAtIndex1 = newStory.getBlockIdAtIndex(1);

        newStory.swapBlocksAtIndices(0, 1);

        assert.equal(
          newStory.getBlockIdAtIndex(0),
          blockAtIndex1,
          'the block at index 0 is the block that was originally at index 1'
        );
        assert.equal(
          newStory.getBlockIdAtIndex(1),
          blockAtIndex0,
          'the block at index 1 is the block that was originally at index 0'
        );
      });
    });
  });

  // TODO: Come back to this once we have fleshed out the save story.
  xdescribe('.serialize()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: 'first' }),
          generateBlockData({ id: 'second' })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called on a story with no dirty blocks', function() {
      it('returns a serialized story in which the block objects have only `id` properties', function() {

        var savedStory = newStory.serialize();

        assert.property(savedStory.blocks[0], 'id', 'unchanged block has `id`');
        assert.notProperty(savedStory.blocks[0], 'layout', 'uncahnged block does not have `layout`');

        assert.property(savedStory.blocks[1], 'id', 'unchanged block has `id`');
        assert.notProperty(savedStory.blocks[1], 'layout', 'unchanged block does not have `layout`');
      });
    });

    describe('when called on a story with one dirty block', function() {
      it('returns a serialized story in which the first block object has only an `id` property and the second block object has other properties but no `id`', function() {

        var dirtyBlock = newStory.getBlockIdAtIndex(0);

        dirtyBlock.updateComponentAtIndex(0, 'text', 'Updated block');

        var savedStory = newStory.serialize();

        assert.notProperty(savedStory.blocks[0], 'id', 'changed block does not have `id`');
        assert.property(savedStory.blocks[0], 'layout', 'changed block has `layout`');

        assert.property(savedStory.blocks[1], 'id', 'unchanged block has `id`');
        assert.notProperty(savedStory.blocks[1], 'layout', 'unchanged block does not have `layout`');
      });
    });
  });
});
