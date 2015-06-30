describe('StoryStore', function() {

  'use strict';

  var story1Uid = 'stry-spc1';
  var story2Uid = 'stry-spc2';
  var firstBlockId = '2000';
  var secondBlockId = '2001';
  var thirdBlockId = '2002';
  var store;

  function dispatch(action) {
    window.dispatcher.dispatch(action);
  }

  function createSampleStories() {

    var sampleStory1Data = generateStoryData({
      uid: story1Uid,
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

    var sampleStory2Data = generateStoryData({
      uid: story2Uid,
      blocks: [
        generateBlockData({
          id: thirdBlockId,
          components: [
            { type: 'text', value: 'some-text-b' }
          ]
        })
      ]
    });

    dispatch({ action: Constants.STORY_CREATE, data: sampleStory1Data });
    dispatch({ action: Constants.STORY_CREATE, data: sampleStory2Data });
  }

  beforeEach(function() {
    window.dispatcher = new Dispatcher();
    store = new StoryStore();
    createSampleStories();
  });

  afterEach(function() {
    delete window.dispatcher;
  });

  describe('accessors', function() {

    describe('given an existing story uid', function() {

      it('should return the correct value', function() {

        assert.equal(store.getTitle(story1Uid), 'Test Story');
        assert.deepEqual(store.getBlockIds(story1Uid), [ firstBlockId, secondBlockId ]);
        assert.equal(store.getBlockIdAtIndex(story1Uid, 0), firstBlockId);

        assert.equal(store.getTitle(story2Uid), 'Test Story');
        assert.deepEqual(store.getBlockIds(story2Uid), [ thirdBlockId ]);
        assert.equal(store.getBlockIdAtIndex(story2Uid, 0), thirdBlockId);
      });
    });
  });

  describe('actions', function() {

    describe('STORY_CREATE', function() {

      describe('given invalid story data', function() {

        it('should throw', function() {

          var invalidStoryData = generateStoryData({
            uid: null
          });

          assert.throw(function() {
            dispatch({ action: Constants.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given a story uid that already exists', function() {

        it('should throw', function() {

          var invalidStoryData = generateStoryData({
            uid: story1Uid
          });

          assert.throw(function() {
            dispatch({ action: Constants.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given valid story data', function() {

        it('should create the story', function() {

          var validStoryUid = 'test-titl';
          var validStoryTitle = 'Test Title';

          var validStoryData = generateStoryData({
            uid: validStoryUid,
            title: validStoryTitle
          });

          dispatch({ action: Constants.STORY_CREATE, data: validStoryData });

          assert.equal(store.getTitle(validStoryUid), validStoryTitle);
        });
      });
    });

    describe('STORY_MOVE_BLOCK_UP', function() {

      describe('given an invalid story uid', function() {

        it('should throw', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_MOVE_BLOCK_UP,
              storyUid: 'badd-ddab',
              blockId: firstBlockId
            });
          });
        });
      });

      describe('given a valid story uid', function() {
        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_MOVE_BLOCK_UP,
            storyUid: story1Uid,
            blockId: secondBlockId
          });

          assert.deepEqual(store.getBlockIds(story1Uid), [ secondBlockId, firstBlockId ]);
        });
      });
    });

    describe('STORY_MOVE_BLOCK_DOWN', function() {

      describe('given an invalid story uid', function() {

        it('should throw', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_MOVE_BLOCK_DOWN,
              storyUid: 'badd-ddab',
              blockId: firstBlockId
            });
          });
        });
      });

      describe('given a valid story uid', function() {
        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_MOVE_BLOCK_DOWN,
            storyUid: story1Uid,
            blockId: firstBlockId
          });

          assert.deepEqual(store.getBlockIds(story1Uid), [ secondBlockId, firstBlockId ]);
        });
      });
    });

    describe('STORY_DELETE_BLOCK', function() {

      describe('given an invalid story uid', function() {

        it('should throw', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_DELETE_BLOCK,
              storyUid: 'badd-ddab',
              blockId: firstBlockId
            });
          });
        });
      });

      describe('given a valid story uid', function() {
        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_DELETE_BLOCK,
            storyUid: story1Uid,
            blockId: firstBlockId
          });

          assert.deepEqual(store.getBlockIds(story1Uid), [ secondBlockId ]);
        });
      });
    });

    // NOTE! These implementations delegate to the Story model.
    // Proper tests for these actions live in Story.spec.js.
    // describe('story:insertBlockAtIndex', function() {
    //   describe('given a bad story ID', function() {
    //     it('should throw', function() {
    //       assert.throw(function() {
    //         dispatch({
    //           name: 'story:insertBlockAtIndex',
    //           storyId: 'notv-lidz',
    //           index: 1,
    //           blockId: thirdBlockId
    //         });
    //       });
    //     });
    //   });

    //   it('should update the story', function() {
    //     dispatch({
    //       name: 'story:insertBlockAtIndex',
    //       storyId: story1Uid,
    //       index: 1,
    //       blockId: thirdBlockId
    //     });
    //     assert.deepEqual(store.getBlockIds(story1Uid), [ firstBlockId, thirdBlockId, secondBlockId ]);
    //   });
    // });
  });
});
