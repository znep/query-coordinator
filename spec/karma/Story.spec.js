describe('Story class', function() {

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

      describe('and `fourByFour` is missing', function() {

        it('raises an exception', function() {

          delete storyData['fourByFour'];

          assert.throw(function() {
            new Story(storyData)
          });
        });
      });

      describe('and `fourByFour` is not a valid four-by-four', function() {

        it('raises an exception', function() {

          storyData['fourByFour'] = 'testtest';

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

    it('should should not expose `_fourByFour` directly', function() {

      var storyData = generateStoryData({
        fourByFour: 'test-test'
      });
      var newStory = new Story(storyData);

      assert.isUndefined(newStory._fourByFour, '`_fourByFour` is undefined on story');
    });

    it('should return fourByFour when .getFourByFour() is called', function() {

      var storyData = generateStoryData({
        fourByFour: 'test-test'
      });
      var newStory = new Story(storyData);
      var fourByFour = newStory.getFourByFour();

      assert.equal(fourByFour, 'test-test', 'story `_fourByFour` is "test-test"');
    });

    it('should should not expose `_title` directly', function() {

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

    it('should should not expose `_blocks` directly', function() {

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

      assert.isUndefined(newStory._blocks, '`_blocks` is undefined on story');
    });

    it('should return valid blocks when .getBlocks() is called', function() {

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
      var blocks = newStory.getBlocks();

      assert.property(blocks, 'length', '`length` is present on story blocks');
    });
  });

  describe('.getBlockAtIndex()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({
            components: [
              { type: 'text', value: 'First' }
            ]
          }),
          generateBlockData({
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
          newStory.getBlockAtIndex(-1);
        });
      });
    });

    describe('when called with an index >= the number of blocks', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.getBlockAtIndex(2);
        });
      });
    });

    describe('when called with a valid index', function() {

      it('returns the correct block', function() {

        assert.deepEqual(
          newStory.getBlockAtIndex(1).getComponentAtIndex(0),
          { type: 'text', value: 'Second' },
          'the returned block is correct'
        );
      });
    });
  });

  describe('.getBlockWithId()', function() {

    var newStory;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: 100 }),
          generateBlockData({ id: 'test' }),
          generateBlockData({ id: 101 })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called with an id that does not exist', function() {

      it('returns null', function() {

        var noBlock = newStory.getBlockWithId('does not exist');

        assert(noBlock === null, 'returns null')
      });
    });

    describe('when called with a string id that exists', function() {

      it('returns the block with the specified id', function() {

        var block = newStory.getBlockWithId('test');

        assert.deepEqual(
          block,
          newStory.getBlockAtIndex(1),
          'the correct block is returned'
        );
      });
    });

    describe('when called with a numeric id that exists', function() {

      it('returns the block with the specified id', function() {

        var block = newStory.getBlockWithId(101);

        assert.deepEqual(
          block,
          newStory.getBlockAtIndex(2),
          'the correct block is returned'
        );
      });
    });
  });

  describe('.insertBlockAtIndex()', function() {

    var newStory;
    var newBlock;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: 100 }),
          generateBlockData({ id: 101 })
        ]
      });
      newStory = new Story(storyData);
      newBlock = new Block(
        generateBlockData({
          id: 'inserted'
        })
      );
    });

    describe('when called with an invalid block', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.insertBlockAtIndex(0, 'not a block');
        });
      });
    });

    describe('when called with a valid block', function() {

      describe('and index < 0', function() {

        it('raises an exception', function() {

          assert.throws(function() {
            newStory.insertBlockAtIndex(-1, newBlock);
          });
        });
      });

      describe('and index > the number of blocks', function() {

        it('raises an exception', function() {

          assert.throws(function() {
            newStory.insertBlockAtIndex(3, newBlock);
          });
        });
      });

      describe('and index > 0 and index < the number of blocks', function() {

        it('inserts a new block into the existing blocks at the specified index', function() {

          newStory.insertBlockAtIndex(1, newBlock);
          assert.deepEqual(
            newStory.getBlockAtIndex(1),
            newBlock,
            'new block was inserted at the specified index'
          );
        });
      });

      describe('and index === the number of blocks', function() {

        it('appends a new block to the existing blocks', function() {

          newStory.insertBlockAtIndex(2, newBlock);
          assert.deepEqual(
            newStory.getBlockAtIndex(2),
            newBlock,
            'new block was inserted at the specified index'
          );
        });
      });
    });
  });

  describe('.appendBlock()', function() {

    var newStory;
    var newBlock;

    beforeEach(function() {
      var storyData = generateStoryData({
        blocks: [
          generateBlockData({ id: 100 }),
          generateBlockData({ id: 101 })
        ]
      });
      newStory = new Story(storyData);
      newBlock = new Block(
        generateBlockData({
          id: 'inserted'
        })
      );
    });

    describe('when called with an invalid block', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newStory.appendBlock('not a block');
        });
      });
    });

    describe('when called with a valid block', function() {

      it('appends a new block to the existing blocks', function() {

        newStory.appendBlock(newBlock);
        assert.deepEqual(
          newStory.getBlockAtIndex(2),
          newBlock,
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
          generateBlockData({ id: 2 }),
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

        assert(newStory.getBlocks().length === 2, 'only two blocks remain');
        assert.deepEqual(
          newStory.getBlockAtIndex(0).getId(),
          2,
          'the first remaining block is the one that was originally at index 1'
        );
        assert.deepEqual(
          newStory.getBlockAtIndex(1).getId(),
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
          generateBlockData({ id: 2 }),
          generateBlockData({ id: 'third' })
        ]
      });
      newStory = new Story(storyData);
    });

    describe('when called with an id that does not exist', function() {

      it('does not remove any blocks', function() {

        newStory.removeBlockWithId('does not exist');

        assert(newStory.getBlocks().length === 3, 'only two blocks remain');
        assert.deepEqual(
          newStory.getBlockAtIndex(0).getId(),
          'first',
          'the first remaining block is the one that was originally at index 0'
        );
        assert.deepEqual(
          newStory.getBlockAtIndex(1).getId(),
          2,
          'the second remaining block is the one that was originally at index 1'
        );
        assert.deepEqual(
          newStory.getBlockAtIndex(2).getId(),
          'third',
          'the third remaining block is the one that was originally at index 2'
        );
      });
    });

    describe('when called with a string id that exists', function() {

      it('removes the block at the specified index', function() {

        newStory.removeBlockWithId('first');

        assert(newStory.getBlocks().length === 2, 'only two blocks remain');
        assert.deepEqual(
          newStory.getBlockAtIndex(0).getId(),
          2,
          'the first remaining block is the one that was originally at index 1'
        );
        assert.deepEqual(
          newStory.getBlockAtIndex(1).getId(),
          'third',
          'the second remaining block is the one that was originally at index 2'
        );
      });
    });

    describe('when called with a numeric id that exists', function() {

      it('removes the block at the specified index', function() {

        newStory.removeBlockWithId(2);

        assert(newStory.getBlocks().length === 2, 'only two blocks remain');
        assert.deepEqual(
          newStory.getBlockAtIndex(0).getId(),
          'first',
          'the first remaining block is the one that was originally at index 0'
        );
        assert.deepEqual(
          newStory.getBlockAtIndex(1).getId(),
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

        var blockAtIndex0 = newStory.getBlockAtIndex(0);
        var blockAtIndex1 = newStory.getBlockAtIndex(1);

        newStory.swapBlocksAtIndices(0, 1);

        assert.deepEqual(
          newStory.getBlockAtIndex(0),
          blockAtIndex1,
          'the block at index 0 is the block that was originally at index 1'
        );
        assert.deepEqual(
          newStory.getBlockAtIndex(1),
          blockAtIndex0,
          'the block at index 1 is the block that was originally at index 0'
        );
      });
    });
  });

  describe('.serialize()', function() {

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

        var dirtyBlock = newStory.getBlockAtIndex(0);

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
