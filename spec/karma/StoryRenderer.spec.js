xdescribe('StoryRenderer class', function() {

  describe('constructor', function() {

    describe('when `blockData` is not an object', function() {

      it('raises an exception', function() {

        assert.throw(function() {
          new Block('not an object')
        });
      });
    });

    describe('when `blockData` is incomplete', function() {

      var blockData;

      beforeEach(function() {
        blockData = generateBlockData();
      });

      describe('and `id` is missing', function() {

        it('raises an exception', function() {

          delete blockData['id'];

          assert.throw(function() {
            new Block(blockData)
          });
        });
      });

      describe('and `layout` is missing', function() {

        it('raises an exception', function() {

          delete blockData['layout'];

          assert.throw(function() {
            new Block(blockData)
          });
        });
      });

      describe('and `components` is missing', function() {

        it('raises an exception', function() {

          delete blockData['components'];

          assert.throw(function() {
            new Block(blockData)
          });
        });
      });
    });
    describe('when `blockData` is valid', function() {

      it('creates a new Block', function() {
        assert.instanceOf(new Block(generateBlockData()), Block, 'instantiated block is an instance of Block');
      });
    });
  });

  describe('instance variables', function() {

    it('should should not expose `_id` directly', function() {

      var blockData = generateBlockData({
        id: 99
      });
      var newBlock = new Block(blockData);

      assert.isUndefined(newBlock._id, '`_id` is undefined on block');
    });

    it('should return layout when .getLayout() is called', function() {

      var blockData = generateBlockData({
        id: 99
      });
      var newBlock = new Block(blockData);
      var id = newBlock.getId();

      assert.equal(id, 99, 'block `id` is 99');
    });

    it('should should not expose `_layout` directly', function() {

      var blockData = generateBlockData({
        layout: '12'
      });
      var newBlock = new Block(blockData);

      assert.isUndefined(newBlock._layout, '`_layout` is undefined on block');
    });

    it('should return layout when .getLayout() is called', function() {

      var blockData = generateBlockData({
        layout: '12'
      });
      var newBlock = new Block(blockData);
      var layout = newBlock.getLayout();

      assert.equal(layout, '12', 'block `layout` is "12"');
    });

    it('should should not expose `_components` directly', function() {

      var blockData = generateBlockData({
        components: [
          { type: 'text', value: 'Component 1' }
        ]
      });
      var newBlock = new Block(blockData);

      assert.isUndefined(newBlock._components, '`_components` is undefined on block');
    });

    it('should return valid components when .getComponents() is called', function() {

      var blockData = generateBlockData({
        components: [
          { type: 'text', value: 'Component 1' }
        ]
      });
      var newBlock = new Block(blockData);
      var components = newBlock.getComponents();

      assert.property(components, 'length', '`length` is present on block components');
    });
  });

  describe('.isDirty()', function() {

    var newBlock;

    beforeEach(function() {
      newBlock = new Block(generateBlockData());
    });

    it('should return false when a Block is first instantiated', function() {
      assert.isFalse(newBlock.isDirty(), 'block is not dirty');
    });

    it('should return true when a Block is cloned', function() {

      var clonedBlock = newBlock.clone();

      assert.isTrue(clonedBlock.isDirty(), 'block is dirty');
    });

    it('should return true when a Block is updated', function() {

      newBlock.updateComponentAtIndex(0, 'text', 'Updated!');

      assert.isTrue(newBlock.isDirty(), 'block is dirty');
    });
  });

  describe ('.markDirty()', function() {

    var newBlock;

    beforeEach(function() {
      newBlock = new Block(generateBlockData());
    });

    it('should mark a non-dirty object as dirty', function() {

      assert.isFalse(newBlock.isDirty(), 'block is not dirty');

      newBlock.markDirty();

      assert.isTrue(newBlock.isDirty(), 'block is dirty');
    });

    it('should leave a dirty object dirty', function() {

      newBlock.markDirty();

      assert.isTrue(newBlock.isDirty(), 'block is dirty');

      newBlock.markDirty();      

      assert.isTrue(newBlock.isDirty(), 'block is dirty');
    });
  });

  describe('.updateLayout()', function() {

    var newBlock;

    beforeEach(function() {
      newBlock = new Block(generateBlockData());
    });

    describe('when called with a layout that is not a string', function() {

      it('raises an exception', function() {
        assert.throws(function() {
          newBlock.updateLayout(12);
        });
      });
    });

    describe('when called with a layout that is a string', function() {

      it('updates the layout with the correct value', function() {

        var oldLayout = newBlock.getLayout();

        newBlock.updateLayout('new layout');

        var newLayout = newBlock.getLayout();

        assert(oldLayout !== newLayout, 'old layout does not equal new layout');
        assert(newLayout === 'new layout', 'layout was updated correctly');
      });
    });
  });

  describe('.getComponentAtIndex()', function() {

    var newBlock;

    beforeEach(function() {
      var blockData = generateBlockData({
        components: [
          { type: 'text', value: 'First' },
          { type: 'text', value: 'Second' }
        ]
      });
      newBlock = new Block(blockData);
    });

    describe('when called with an index < 0', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newBlock.getComponentAtIndex(-1);
        });
      });
    });

    describe('when called with an index >= the number of components', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newBlock.getComponentAtIndex(2);
        });
      });
    });

    describe('when called with a valid index', function() {

      it('returns the correct block component', function() {

        assert.deepEqual(
          newBlock.getComponentAtIndex(1),
          { type: 'text', value: 'Second' },
          'the returned component is correct'
        );
      });
    });
  });

  describe('.updateComponentAtIndex()', function() {

    var newBlock;
    var validType = 'text';
    var validValue = 'Updated text component value';

    beforeEach(function() {
      var blockData = generateBlockData({
        components: [
          { type: 'text', value: 'First' },
          { type: 'text', value: 'Second' }
        ]
      });
      newBlock = new Block(blockData);
    });

    describe('when called with an index < 0', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newBlock.getComponentAtIndex(-1, validType, validValue);
        });
      });
    });

    describe('when called with an index >= the number of components', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newBlock.updateComponentAtIndex(2, validType, validValue);
        });
      });
    });

    describe('when called with a component type that is not a string', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newBlock.updateComponentAtIndex(1, 12, validValue);
        });
      });
    });

    describe('when called with an unrecognized component type', function() {

      it('raises an exception', function() {

        assert.throws(function() {
          newBlock.updateComponentAtIndex(1, 'unrecognized type', validValue);
        });
      });
    });

    describe('when called with a valid index', function() {

      describe('when updating a text component', function() {

        describe('with an `value` that is not a string', function() {

          it('raises an exception', function() {
            assert.throws(function() {
              newBlock.updateComponentAtIndex(1, 'text', 1);
            });
          });
        });

        describe('with a `value` that is a string', function() {
          it('updates the correct block component', function() {

            newBlock.updateComponentAtIndex(1, 'text', 'Hello, world!');

            assert.deepEqual(
              newBlock.getComponentAtIndex(1),
              { type: 'text', value: 'Hello, world!' },
              'the specified component was updated'
            );
          });
        });
      });

      describe('when updating an image component', function() {

        describe('with an `value` that is not a string', function() {

          it('raises an exception', function() {
            assert.throws(function() {
              newBlock.updateComponentAtIndex(1, 'image', 1);
            });
          });
        });

        describe('with a `value` that is a string', function() {
          it('updates the correct block component', function() {

            newBlock.updateComponentAtIndex(1, 'image', '/path/to/image.png');

            assert.deepEqual(
              newBlock.getComponentAtIndex(1),
              { type: 'image', value: '/path/to/image.png' },
              'the specified component was updated'
            );
          });
        });
      });

      describe('when updating a visualization component', function() {

        describe('with an `value` that is not a string', function() {

          it('raises an exception', function() {
            assert.throws(function() {
              newBlock.updateComponentAtIndex(1, 'visualization', 1);
            });
          });
        });

        describe('with a `value` that is a string', function() {

          it('updates the correct block component', function() {

            newBlock.updateComponentAtIndex(1, 'visualization', '/path/to/visualiation.json');

            assert.deepEqual(
              newBlock.getComponentAtIndex(1),
              { type: 'visualization', value: '/path/to/visualiation.json' },
              'the specified component was updated'
            );
          });
        });
      });
    });
  });

  describe('.serialize()', function() {

    var newBlock;

    beforeEach(function() {
      newBlock = new Block(
        generateBlockData({
          id: 99
        })
      );
    });

    describe('on a non-dirty Block', function() {

      it('should return an object with the same value for id as its parent and no other properties', function() {

        var savedBlock = newBlock.serialize();

        assert(savedBlock['id'] === 99, "block `id` is 99");
        assert.notProperty(savedBlock, 'layout', '`layout` is not present in block data');
        assert.notProperty(savedBlock, 'components', '`components` is not present in block data');
      });
    });

    describe('on a dirty Block', function() {

      it('should return an object with the same values for layout and components as its parent and no other properties', function() {

        newBlock.markDirty();

        var savedBlock = newBlock.serialize();

        assert.notProperty(savedBlock, 'id', '`id` is not present in block data');
        assert(savedBlock['layout'] === '12', 'block `layout` is "12"');
        assert.property(savedBlock['components'], 'length', 'block `components` has `length`');
        assert(savedBlock['components'].length === 1, 'block `components` is of length 1');
      });
    });
  });

  describe('.clone()', function() {

    var parentBlock;
    var clonedBlock;

    beforeEach(function() {
      parentBlock = new Block(generateBlockData());
      clonedBlock = parentBlock.clone();
    });

    it('returns a new, dirty instance of Block class with identical properties', function() {

      assert.instanceOf(clonedBlock, Block, 'cloned block is an instance of Block');
      assert.isTrue(clonedBlock.isDirty(), 'cloned block is dirty');
      assert(clonedBlock.getLayout() === parentBlock.getLayout(), 'cloned block `layout` is equal to parent block `layout`');
      assert.deepEqual(clonedBlock.getComponents(), parentBlock.getComponents(), 'cloned block `components` is equal to parent block `components`');
    });

    it('does not reflect changes to the parent Block', function() { 

      assert.deepEqual(clonedBlock.getComponents(), parentBlock.getComponents(), 'cloned block `components` is equal to parent block `components`');
      parentBlock.updateComponentAtIndex(0, 'text', 'not propagated');
      assert.notDeepEqual(clonedBlock.getComponents(), parentBlock.getComponents(), 'cloned block `components` is not equal to parent block `components`');
    });
  });
});
