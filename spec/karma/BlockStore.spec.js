describe('BlockStore', function() {

  'use strict';

  var block1Id = 'block1';
  var block1Layout = '6-6';
  var block1Components = [
    { type: 'image', value: 'fakeImageFile.png' },
    { type: 'text', value: 'some-text-a' }
  ];
  var block2Id = 'block2';
  var block2Layout = '12';
  var block2Components = [ { type: 'text', value: 'some-text-b' } ];
  var store;

  function dispatch(action) {
    window.dispatcher.dispatch(action);
  }

  function createSampleBlocks() {

    var sampleBlock1Data = generateBlockData({
      id: block1Id,
      layout: block1Layout,
      components: block1Components
    });

    var sampleBlock2Data = generateBlockData({
      id: block2Id,
      layout: block2Layout,
      components: block2Components
    });

    dispatch({ action: Constants.BLOCK_CREATE, data: sampleBlock1Data });
    dispatch({ action: Constants.BLOCK_CREATE, data: sampleBlock2Data });
  }


  beforeEach(function() {
    window.dispatcher = new Dispatcher();
    store = new BlockStore();
    createSampleBlocks();
  });

  afterEach(function() {
  });

  describe('accessors', function() {

    describe('given an invalid block id', function() {

      describe('.getLayout()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            store.getLayout(null);
          });
        });
      });

      describe('.getComponents()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            store.getLayout(null);
          });
        });
      });

      describe('.getComponentAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            store.getComponentAtIndex(null, 0);
          });
        });
      });
    });

    describe('given a non-existant block id', function() {

      describe('.getLayout()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            store.getLayout('does not exist');
          });
        });
      });

      describe('.getComponents()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            store.getComponents('does not exist');
          });
        });
      });

      describe('.getComponentAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            store.getLayout('does not exist', 0);
          });
        });
      });
    });

    describe('given an existing block id', function() {

      describe('.getLayout()', function() {

        it('should return the layout of the specified block', function() {

          assert.equal(store.getLayout(block1Id), block1Layout);
          assert.equal(store.getLayout(block2Id), block2Layout);
        });
      });

      describe('.getComponents()', function() {

        it('should return the components of the specified block', function() {

          assert.deepEqual(store.getComponents(block1Id), block1Components);
          assert.deepEqual(store.getComponents(block2Id), block2Components);
        });
      });

      describe('.getComponentAtIndex()', function() {

        describe('given an index < 0', function() {

          it('should throw an error', function() {

            assert.throw(function() {
              store.getComponentAtIndex(block1Id, -1);
            });
          });
        });

        describe('given an index >= the number of components', function() {

          it('should throw an error', function() {

            assert.throw(function() {
              store.getComponentAtIndex(block1Id, 2);
            });

            assert.throw(function() {
              store.getComponentAtIndex(block1Id, 3);
            });
          });
        });

        describe('given a valid index', function() {

          it('should return the specified component of the specified block', function() {

            var component = store.getComponentAtIndex(block1Id, 1);

            assert.equal(component.type, 'text');
            assert.equal(component.value, 'some-text-a');
          });
        });
      });
    });
  });

  describe('actions', function() {

    describe('BLOCK_CREATE', function() {

      describe('given invalid block data', function() {

        it('should throw an error', function() {

          var invalidBlockData = generateBlockData({
            id: null
          });

          assert.throw(function() {
            dispatch({ action: Constants.BLOCK_CREATE, data: invalidBlockData });
          });
        });
      });

      describe('given a block id that already exists', function() {

        it('should throw an error', function() {

          var invalidBlockData = generateBlockData({
            id: block1Id
          });

          assert.throw(function() {
            dispatch({ action: Constants.BLOCK_CREATE, data: invalidBlockData });
          });
        });
      });

      describe('given valid block data', function() {

        it('should create the story', function() {

          var validBlockId = 'validBlockId';
          var validBlockLayout = '12';
          var validBlockComponents = [
            { type: 'text', value: 'valid block text' }
          ];

          var validBlockData = generateBlockData({
            id: validBlockId,
            layout: validBlockLayout,
            components: validBlockComponents
          });

          dispatch({ action: Constants.BLOCK_CREATE, data: validBlockData });

          assert.equal(store.getLayout(validBlockId), validBlockLayout);
        });
      });
    });

    describe('BLOCK_UPDATE_COMPONENT', function() {

      var validComponentIndex;
      var validComponentType;
      var validComponentValue;

      beforeEach(function() {
        validComponentIndex = 1;
        validComponentType = 'text';
        validComponentValue = 'updated component text';
      });

      describe('given an invalid block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.BLOCK_UPDATE_COMPONENT,
              blockId: null,
              index: validComponentIndex,
              type: validComponentType,
              value: validComponentValue
            });
          });
        });
      });

      describe('given an invalid component index', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.BLOCK_UPDATE_COMPONENT,
              blockId: block1Id,
              index: -1,
              type: validComponentType,
              value: validComponentValue
            });
          });
        });
      });

      describe('given an invalid component type', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.BLOCK_UPDATE_COMPONENT,
              blockId: block1Id,
              index: validComponentIndex,
              type: null,
              value: validComponentValue
            });
          });
        });
      });

      describe('given an invalid component value', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.BLOCK_UPDATE_COMPONENT,
              blockId: block1Id,
              index: validComponentIndex,
              type: validComponentType,
              value: null
            });
          });
        });
      });

      describe('given valid data', function() {

        it('should update the specified component', function() {

          dispatch({
            action: Constants.BLOCK_UPDATE_COMPONENT,
            blockId: block1Id,
            index: validComponentIndex,
            type: validComponentType,
            value: validComponentValue
          });

          assert.equal(store.getComponentAtIndex(block1Id, 1).value, validComponentValue);
        });
      });
    });
  });
});
