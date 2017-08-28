import DataGenerators from '../DataGenerators';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import Actions from 'editor/Actions';
import Environment from 'StorytellerEnvironment';
import Dispatcher from 'editor/Dispatcher';
import StoryStore from 'editor/stores/StoryStore';

describe('StoryStore', function() {
  var dispatcher;
  var storyStore;
  var story1Uid = 'what-what';
  var story1Title = 'Story 1';
  var story1Description = 'Story 1 Description';
  var story1TileTitle = 'Override Title 1';
  var story1TileDescription = 'Override Description 1';
  var story1Theme = 'testTheme';
  var story1Digest = 'Story 1 digest';
  var story1PublishedStory = {digest: 'test-digest-1'};

  var story2Uid = 'stry-spc2';
  var story2Title = 'Story 2';
  var story2Description = 'Story 2 Description';
  var story2TileTitle = 'Override Title 2';
  var story2TileDescription = 'Override Description 2';
  var story2Digest = 'Story 2 digest';
  var story2PublishedStory = {digest: 'test-digest-2'};

  var block1Id = 'block1';
  var block1Layout = '6-6';
  var block1Components = [
    { type: 'image', value: 'fakeImageFile.png' },
    { type: 'html', value: 'First Block' }
  ];
  var block1Presentable = true;
  var block1Content = {
    'id': block1Id,
    'layout': block1Layout,
    'components': block1Components,
    'presentable': block1Presentable
  };

  var block2Id = 'block2';
  var block2Layout = '12';
  var block2Components = [ { type: 'html', value: 'Second Block' } ];
  var block2Presentable = false;

  var block3Id = 'block3';
  var block3Layout = '12';
  var block3Components = [ { type: 'html', value: 'Third Block' } ];
  var block3Presentable = false;

  function dispatch(action) {
    dispatcher.dispatch(action);
  }

  // We don't rely on StandardMocks for the sample stories because
  // we want this test to explicitly test StoryStore, not test it
  // through some mocking layer.
  function createSampleStories() {

    var sampleStory1Data = DataGenerators.generateStoryData({
      uid: story1Uid,
      title: story1Title,
      description: story1Description,
      tileConfig: {
        title: story1TileTitle,
        description: story1TileDescription
      },
      theme: story1Theme,
      digest: story1Digest,
      permissions: {isPublic: false},
      publishedStory: story1PublishedStory,
      blocks: [
        DataGenerators.generateBlockData({
          layout: block1Layout,
          components: block1Components,
          presentable: block1Presentable
        }),
        DataGenerators.generateBlockData({
          layout: block2Layout,
          components: block2Components,
          presentable: block2Presentable
        })
      ]
    });

    var sampleStory2Data = DataGenerators.generateStoryData({
      uid: story2Uid,
      title: story2Title,
      description: story2Description,
      tileConfig: {
        title: story2TileTitle,
        description: story2TileDescription
      },
      digest: story2Digest,
      permissions: {isPublic: true},
      publishedStory: story2PublishedStory,
      blocks: [
        DataGenerators.generateBlockData({
          layout: block3Layout,
          components: block3Components,
          presentable: block3Presentable
        })
      ]
    });

    dispatch({ action: Actions.STORY_CREATE, data: sampleStory1Data });
    dispatch({
      action: Actions.STORY_SET_PUBLISHED_STORY,
      publishedStory: sampleStory1Data.publishedStory,
      storyUid: sampleStory1Data.uid
    });

    dispatch({ action: Actions.STORY_CREATE, data: sampleStory2Data });
    dispatch({
      action: Actions.STORY_SET_PUBLISHED_STORY,
      publishedStory: sampleStory2Data.publishedStory,
      storyUid: sampleStory2Data.uid
    });

    block1Id = storyStore.getStoryBlockIds(story1Uid)[0];
    block2Id = storyStore.getStoryBlockIds(story1Uid)[1];
    block3Id = storyStore.getStoryBlockIds(story2Uid)[0];
  }

  beforeEach(function() {
    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);
    storyStore = new StoryStore();

    createSampleStories();
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
  });

  describe('story data accessors', function() {

    describe('given an invalid story uid', function() {

      describe('.doesStoryExist()', function() {

        it('should return false', function() {
          assert.isFalse(storyStore.doesStoryExist(null));
        });
      });

      describe('.isStoryPublic()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.isStoryPublic(null);
          });
        });
      });

      describe('.getStoryTitle()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryTitle(null);
          });
        });
      });

      describe('.getStoryDescription()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryDescription(null);
          });
        });
      });

      describe('.getStoryTileTitle()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryTileTitle(null);
          });
        });
      });

      describe('.getStoryTileDescription()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryTileDescription(null);
          });
        });
      });

      describe('.getStoryTheme()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryTheme(null);
          });
        });
      });

      describe('.getStoryDigest()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryDigest(null);
          });
        });
      });

      describe('.getStoryPermissions()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryPermissions(null);
          });
        });
      });

      describe('.getStoryPublishedStory()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryPublishedStory(null);
          });
        });
      });

      describe('.getStoryBlockIds()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryBlockIds(null);
          });
        });
      });

      describe('.getStoryBlockAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryBlockAtIndex(null, 0);
          });
        });
      });

      describe('.getStoryBlockIdAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryBlockIdAtIndex(null, 0);
          });
        });
      });

      describe('.serializeStory()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.serializeStory(null);
          });
        });
      });
    });

    describe('given a non-existent story uid', function() {

      describe('.doesStoryExist()', function() {

        it('should return false', function() {
          assert.isFalse(storyStore.doesStoryExist('notf-ound'));
        });
      });

      describe('.isStoryPublic()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.isStoryPublic('notf-ound');
          });
        });
      });

      describe('.getStoryTitle()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryTitle('notf-ound');
          });
        });
      });

      describe('.getStoryDescription()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryDescription('notf-ound');
          });
        });
      });

      describe('.getStoryTileTitle()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryTileTitle('notf-ound');
          });
        });
      });

      describe('.getStoryTileDescription()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryTileDescription('notf-ound');
          });
        });
      });

      describe('.getStoryTheme()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryTheme('notf-ound');
          });
        });
      });

      describe('.getStoryDigest()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryDigest('notf-ound');
          });
        });
      });

      describe('.getStoryPermissions()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryPermissions('notf-ound');
          });
        });
      });

      describe('.getStoryPublishedStory()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryPublishedStory('notf-ound');
          });
        });
      });

      describe('.getStoryBlockIds()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryBlockIds('notf-ound');
          });
        });
      });

      describe('.getStoryBlockAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryBlockAtIndex('notf-ound', 0);
          });
        });
      });

      describe('.getStoryBlockIdAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getStoryBlockIdAtIndex('notf-ound', 0);
          });
        });
      });

      describe('.serializeStory()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.serializeStory('notf-ound');
          });
        });
      });
    });

    describe('given an existing story uid', function() {

      describe('.doesStoryExist()', function() {

        it('should return true', function() {
          assert.isTrue(storyStore.doesStoryExist(story1Uid));
        });
      });

      describe('.isStoryPublic()', function() {

        it('should return the correct value', function() {
          assert.isFalse(storyStore.isStoryPublic(story1Uid));
          assert.isTrue(storyStore.isStoryPublic(story2Uid));
        });
      });

      describe('.getStoryTitle()', function() {

        it('should return the correct value', function() {
          assert.equal(storyStore.getStoryTitle(story1Uid), story1Title);
          assert.equal(storyStore.getStoryTitle(story2Uid), story2Title);
        });
      });

      describe('.getStoryDescription()', function() {

        it('should return the correct value', function() {
          assert.equal(storyStore.getStoryDescription(story1Uid), story1Description);
          assert.equal(storyStore.getStoryDescription(story2Uid), story2Description);
        });
      });

      describe('.getStoryTileTitle', function() {
        it('should return the correct value', function() {
          assert.equal(storyStore.getStoryTileTitle(story1Uid), story1TileTitle);
          assert.equal(storyStore.getStoryTileTitle(story2Uid), story2TileTitle);
        });
      });

      describe('.getStoryTileDescription', function() {
        it('should return the correct value', function() {
          assert.equal(storyStore.getStoryTileDescription(story1Uid), story1TileDescription);
          assert.equal(storyStore.getStoryTileDescription(story2Uid), story2TileDescription);
        });
      });

      describe('.getStoryTheme()', function() {
        it('defaults to `classic` when not set', function() {
          assert.equal(storyStore.getStoryTheme(story2Uid), 'classic');
        });

        it('returns the correct value when set on STORY_CREATE', function() {
          assert.equal(storyStore.getStoryTheme(story1Uid), story1Theme);
        });

        it('changes the value when `STORY_UPDATE_THEME` is fired', function() {
          dispatch({
            action: Actions.STORY_UPDATE_THEME,
            storyUid: story1Uid,
            theme: 'serif'
          });

          assert.equal(storyStore.getStoryTheme(story1Uid), 'serif');
        });
      });

      describe('.getStoryDigest()', function() {

        it('should return the correct value', function() {
          assert.equal(storyStore.getStoryDigest(story1Uid), story1Digest);
          assert.equal(storyStore.getStoryDigest(story2Uid), story2Digest);
        });
      });

      describe('.getStoryPermissions()', function() {

        it('should return the correct value', function() {
          assert.deepEqual(storyStore.getStoryPermissions(story1Uid), {isPublic: false});
          assert.deepEqual(storyStore.getStoryPermissions(story2Uid), {isPublic: true});
        });
      });

      describe('.getStoryPublishedStory()', function() {

        it('should return the correct value', function() {
          assert.deepEqual(storyStore.getStoryPublishedStory(story1Uid), story1PublishedStory);
          assert.deepEqual(storyStore.getStoryPublishedStory(story2Uid), story2PublishedStory);
        });
      });

      describe('.getStoryPrimaryOwnerUid()', function() {

        it('should return the correct value', function() {
          assert.equal(storyStore.getStoryPrimaryOwnerUid(), Environment.PRIMARY_OWNER_UID);
        });
      });

      describe('.getStoryBlockIds()', function() {

        it('should return the correct value', function() {
          assert.deepEqual(storyStore.getStoryBlockIds(story1Uid), [ block1Id, block2Id ]);
          assert.deepEqual(storyStore.getStoryBlockIds(story2Uid), [ block3Id ]);
        });
      });

      describe('.getStoryBlockAtIndex()', function() {

        describe('given an invalid index', function() {

          it('should throw an error', function() {
            assert.throw(function() {
              storyStore.getStoryBlockAtIndex(story1Uid, 99);
            });
          });
        });

        describe('given a valid index', function() {

          it('should return the correct value', function() {

            var block1 = storyStore.getStoryBlockAtIndex(story1Uid, 0);
            var block3 = storyStore.getStoryBlockAtIndex(story2Uid, 0);

            assert.propertyVal(block1, 'layout', block1Layout);
            assert.equal(block1.components[0].type, block1Components[0].type);
            assert.equal(block1.components[0].value, block1Components[0].value);
            assert.equal(block1.components[1].type, block1Components[1].type);
            assert.equal(block1.components[1].value, block1Components[1].value);

            assert.propertyVal(block3, 'layout', block3Layout);
            assert.equal(block3.components[0].type, block3Components[0].type);
            assert.equal(block3.components[0].value, block3Components[0].value);
          });
        });
      });

      describe('.getStoryBlockIdAtIndex()', function() {

        describe('given an invalid index', function() {

          it('should throw an error', function() {
            assert.throw(function() {
              storyStore.getStoryBlockIdAtIndex(story1Uid, 99);
            });
          });
        });

        describe('given a valid index', function() {

          it('should return the correct value', function() {
            assert.equal(storyStore.getStoryBlockIdAtIndex(story1Uid, 0), block1Id);
            assert.equal(storyStore.getStoryBlockIdAtIndex(story2Uid, 0), block3Id);
          });
        });
      });

      describe('.serializeStory()', function() {

        it('should return an object matching the properties of the story', function() {

          var serializedStory = storyStore.serializeStory(story1Uid);

          assert.equal(serializedStory.uid, story1Uid);
          assert.equal(serializedStory.title, story1Title);
          assert.equal(serializedStory.blocks[0].layout, block1Layout);
          assert.deepEqual(serializedStory.blocks[0].components, block1Components);
          assert.equal(serializedStory.blocks[1].layout, block2Layout);
          assert.deepEqual(serializedStory.blocks[1].components, block2Components);
        });
      });
    });
  });

  describe('block data accessors', function() {

    describe('given an invalid block id', function() {

      describe('.getBlockLayout()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getBlockLayout(null);
          });
        });
      });

      describe('.getBlockComponents()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getBlockLayout(null);
          });
        });
      });

      describe('.getBlockComponentAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getBlockComponentAtIndex(null, 0);
          });
        });
      });
    });

    describe('given a non-existent block id', function() {

      describe('.getBlockLayout()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getBlockLayout('does not exist');
          });
        });
      });

      describe('.getBlockComponents()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getBlockComponents('does not exist');
          });
        });
      });

      describe('.getBlockComponentAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyStore.getBlockLayout('does not exist', 0);
          });
        });
      });

      describe('.isBlockPresentable()', function() {
        it('should throw an error', function() {
          assert.throw(function() {
            storyStore.isBlockPresentable('does not exist');
          });
        });
      });
    });

    describe('given an existing block id', function() {

      describe('.getBlockLayout()', function() {

        it('should return the layout of the specified block', function() {

          assert.equal(storyStore.getBlockLayout(block1Id), block1Layout);
          assert.equal(storyStore.getBlockLayout(block2Id), block2Layout);
        });
      });

      describe('.getBlockComponents()', function() {

        it('should return the components of the specified block', function() {

          assert.deepEqual(storyStore.getBlockComponents(block1Id), block1Components);
          assert.deepEqual(storyStore.getBlockComponents(block2Id), block2Components);
        });
      });

      describe('.getBlockComponentAtIndex()', function() {

        describe('given an index < 0', function() {

          it('should throw an error', function() {

            assert.throw(function() {
              storyStore.getBlockComponentAtIndex(block1Id, -1);
            });
          });
        });

        describe('given an index >= the number of components', function() {

          it('should throw an error', function() {

            assert.throw(function() {
              storyStore.getBlockComponentAtIndex(block1Id, 2);
            });

            assert.throw(function() {
              storyStore.getBlockComponentAtIndex(block1Id, 3);
            });
          });
        });

        describe('given a valid index', function() {

          it('should return the specified component of the specified block', function() {

            var component = storyStore.getBlockComponentAtIndex(block1Id, 1);

            assert.equal(component.type, block1Components[1].type);
            assert.equal(component.value, block1Components[1].value);
          });
        });
      });

      describe('.isBlockPresentable()', function() {
        it('should return the presentable boolean of the specified block', function() {
          assert.equal(storyStore.isBlockPresentable(block1Id), block1Presentable);
          assert.equal(storyStore.isBlockPresentable(block2Id), block2Presentable);
        });
      });
    });
  });

  describe('actions', function() {

    describe('GOAL_MIGRATION_END', function() {
      // Very basic validation, this calls into the exact same handler as STORY_CREATE.
      describe('given valid story data', function() {

        it('should create the story', function() {

          var validStoryUid = 'test-titl';
          var validStoryTitle = 'Test Title';

          var validStoryData = DataGenerators.generateStoryData({
            uid: validStoryUid,
            title: validStoryTitle
          });

          dispatch({ action: Actions.GOAL_MIGRATION_END, story: validStoryData });

          assert.equal(storyStore.getStoryTitle(validStoryUid), validStoryTitle);
        });
      });

    });

    describe('STORY_CREATE', function() {

      describe('when `storyData` is incomplete', function() {

        var storyData;

        beforeEach(function() {
          storyData = DataGenerators.generateStoryData();
        });

        describe('and `uid` is missing', function() {

          it('raises an exception', function() {

            delete storyData.uid;

            assert.throw(function() {
              dispatch({ action: Actions.STORY_CREATE, data: storyData });
            });
          });
        });

        describe('and `uid` is not a valid four-by-four', function() {

          it('raises an exception', function() {

            storyData.uid = 'testtest';

            assert.throw(function() {
              dispatch({ action: Actions.STORY_CREATE, data: storyData });
            });
          });
        });

        describe('and `title` is missing', function() {

          it('raises an exception', function() {

            delete storyData.title;

            assert.throw(function() {
              dispatch({ action: Actions.STORY_CREATE, data: storyData });
            });
          });
        });

        describe('and `blocks` is missing', function() {

          it('raises an exception', function() {

            delete storyData.blocks;

            assert.throw(function() {
              dispatch({ action: Actions.STORY_CREATE, data: storyData });
            });
          });
        });

        describe('and `blocks` is not an array', function() {

          it('raises an exception', function() {

            var invalidStoryData = DataGenerators.generateStoryData({
              blocks: 'not an array'
            });

            assert.throw(function() {
              dispatch({ action: Actions.STORY_CREATE, data: invalidStoryData });
            });
          });
        });
      });

      describe('given `blocks` with an invalid block', function() {

        it('raises an exception', function() {

          var invalidStoryData = DataGenerators.generateStoryData({
            blocks: [
              { invalidBlockObject: true }
            ]
          });

          assert.throw(function() {
            dispatch({ action: Actions.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given `blocks` with a block that does not have an `id`', function() {

        it('raises an exception', function() {

          var invalidStoryData = DataGenerators.generateStoryData({
            blocks: [
              {
                invalidBlockObject: {
                  layout: '12',
                  components: [
                    { type: 'html', value: 'test' }
                  ]
                }
              }
            ]
          });

          assert.throw(function() {
            dispatch({ action: Actions.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given `blocks` with a block that does not have a `layout`', function() {

        it('raises an exception', function() {

          var invalidStoryData = DataGenerators.generateStoryData({
            blocks: [
              {
                invalidBlockObject: {
                  id: 'testBlockId',
                  components: [
                    { type: 'html', value: 'test' }
                  ]
                }
              }
            ]
          });

          assert.throw(function() {
            dispatch({ action: Actions.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given `blocks` with a block that does not have `components`', function() {

        it('raises an exception', function() {

          var invalidStoryData = DataGenerators.generateStoryData({
            blocks: [
              {
                invalidBlockObject: {
                  id: 'testBlockId',
                  layout: '12'
                }
              }
            ]
          });

          assert.throw(function() {
            dispatch({ action: Actions.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given a story uid that already exists', function() {

        it('should throw an error', function() {

          var invalidStoryData = DataGenerators.generateStoryData({
            uid: story1Uid
          });

          assert.throw(function() {
            dispatch({ action: Actions.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given valid story data', function() {

        it('should create the story', function() {

          var validStoryUid = 'test-titl';
          var validStoryTitle = 'Test Title';

          var validStoryData = DataGenerators.generateStoryData({
            uid: validStoryUid,
            title: validStoryTitle
          });

          dispatch({ action: Actions.STORY_CREATE, data: validStoryData });

          assert.equal(storyStore.getStoryTitle(validStoryUid), validStoryTitle);
        });
      });
    });

    describe('STORY_SET_TITLE', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_TITLE,
              title: 'title'
            });
          });
        });
      });

      describe('not given a title', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_TITLE,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_TITLE,
              storyUid: 'badd-ddab',
              title: 'title'
            });
          });
        });
      });


      describe('given a valid story uid and title', function() {

        it('should update the story', function() {

          dispatch({
            action: Actions.STORY_SET_TITLE,
            storyUid: story1Uid,
            title: 'new title'
          });

          assert.deepEqual(storyStore.getStoryTitle(story1Uid), 'new title');
        });
      });
    });

    describe('STORY_SAVED', function() {
      it('should update the digest', function() {
        dispatch({
          action: Actions.STORY_SAVED,
          storyUid: story1Uid,
          digest: 'new digest'
        });

        assert.equal(storyStore.getStoryDigest(story1Uid), 'new digest');
      });
    });

    describe('STORY_SET_DESCRIPTION', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_DESCRIPTION,
              description: 'foobar'
            });
          });
        });
      });

      describe('not given a description', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_DESCRIPTION,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_DESCRIPTION,
              storyUid: 'badd-ddab',
              description: 'foobar'
            });
          });
        });
      });

      describe('given a valid story uid and description', function() {

        it('should update the story', function() {

          dispatch({
            action: Actions.STORY_SET_DESCRIPTION,
            storyUid: story1Uid,
            description: 'new description'
          });

          assert.equal(storyStore.getStoryDescription(story1Uid), 'new description');
        });
      });
    });

    describe('STORY_SET_TILE_CONFIG', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_TILE_CONFIG,
              tile: {
                title: story1TileTitle,
                description: story1TileDescription
              }
            });
          });
        });
      });

      describe('not given a payload', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_TILE_CONFIG,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_TILE_CONFIG,
              storyUid: 'badd-ddab',
              tileConfig: {
                title: story1TileTitle,
                description: story1TileDescription
              }
            });
          });
        });
      });

      describe('given a valid story tile title and description', function() {

        it('should update the story', function() {

          dispatch({
            action: Actions.STORY_SET_TILE_CONFIG,
            storyUid: story1Uid,
            tileConfig: {
              title: story1TileTitle + 'zzz',
              description: story1TileDescription + 'zzz'
            }
          });

          assert.equal(storyStore.getStoryTileTitle(story1Uid), story1TileTitle + 'zzz');
          assert.equal(storyStore.getStoryTileDescription(story1Uid), story1TileDescription + 'zzz');
        });
      });
    });

    describe('STORY_SET_PERMISSIONS', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_PERMISSIONS,
              isPublic: true
            });
          });
        });
      });

      describe('not given an isPublic property', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_PERMISSIONS,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_PERMISSIONS,
              storyUid: 'badd-ddab',
              isPublic: true
            });
          });
        });
      });

      describe('given a valid story uid and an isPublic property', function() {

        it('should update the story', function() {

          dispatch({
            action: Actions.STORY_SET_PERMISSIONS,
            storyUid: story1Uid,
            isPublic: true
          });

          assert.deepEqual(storyStore.getStoryPermissions(story1Uid), {isPublic: true});
        });
      });
    });

    describe('STORY_SET_PUBLISHED_STORY', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_PUBLISHED_STORY,
              publishedStory: {digest: 'digest-1'}
            });
          });
        });
      });

      describe('not given a publishedStory property', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_PUBLISHED_STORY,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_SET_PUBLISHED_STORY,
              storyUid: 'badd-ddab',
              publishedStory: {digest: 'digest-1'}
            });
          });
        });
      });

      describe('given a valid story uid and a publishedStory property', function() {

        it('should update the story', function() {

          dispatch({
            action: Actions.STORY_SET_PUBLISHED_STORY,
            storyUid: story1Uid,
            publishedStory: {digest: 'new-digest'}
          });

          assert.deepEqual(storyStore.getStoryPublishedStory(story1Uid), {digest: 'new-digest'});
        });
      });
    });

    describe('STORY_MOVE_BLOCK_UP', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_UP,
              blockId: block1Id
            });
          });
        });
      });

      describe('not given a block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_UP,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given an invalid story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_UP,
              storyUid: null,
              blockId: block1Id
            });
          });
        });
      });


      describe('given an invalid block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_UP,
              storyUid: story1Uid,
              blockId: null
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_UP,
              storyUid: 'badd-ddab',
              blockId: block1Id
            });
          });
        });
      });


      describe('given a non-existent block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_UP,
              storyUid: story1Uid,
              blockId: 'not-found'
            });
          });
        });
      });

      describe('given a valid story uid', function() {

        it('should update the story', function() {

          dispatch({
            action: Actions.STORY_MOVE_BLOCK_UP,
            storyUid: story1Uid,
            blockId: block2Id
          });

          assert.deepEqual(storyStore.getStoryBlockIds(story1Uid), [ block2Id, block1Id ]);
        });
      });
    });

    describe('STORY_MOVE_BLOCK_DOWN', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_DOWN,
              blockId: block1Id
            });
          });
        });
      });

      describe('not given a block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_DOWN,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given an invalid story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_DOWN,
              storyUid: null,
              blockId: block1Id
            });
          });
        });
      });


      describe('given an invalid block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_DOWN,
              storyUid: story1Uid,
              blockId: null
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_DOWN,
              storyUid: 'badd-ddab',
              blockId: block1Id
            });
          });
        });
      });


      describe('given a non-existent block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_MOVE_BLOCK_DOWN,
              storyUid: story1Uid,
              blockId: 'not-found'
            });
          });
        });
      });

      describe('given a valid story uid', function() {
        it('should update the story', function() {

          dispatch({
            action: Actions.STORY_MOVE_BLOCK_DOWN,
            storyUid: story1Uid,
            blockId: block1Id
          });

          assert.deepEqual(storyStore.getStoryBlockIds(story1Uid), [ block2Id, block1Id ]);
        });
      });
    });

    describe('STORY_TOGGLE_BLOCK_PRESENTATION_VISIBILITY', function() {
      describe('given a non-existent block id', function() {
        it('should throw an error', function() {
          assert.throw(function() {
            dispatch({
              action: Actions.STORY_TOGGLE_BLOCK_PRESENTATION_VISIBILITY,
              blockId: 'nothing to see here'
            });
          });
        });
      });

      describe('given a valid block id', function() {
        it('should toggle the block\'s presentable attribute', function() {

          assert.isTrue(storyStore.isBlockPresentable(block1Id));

          dispatch({
            action: Actions.STORY_TOGGLE_BLOCK_PRESENTATION_VISIBILITY,
            blockId: block1Id
          });

          assert.isFalse(storyStore.isBlockPresentable(block1Id));
        });
      });
    });

    describe('STORY_DELETE_BLOCK', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_DELETE_BLOCK,
              blockId: block1Id
            });
          });
        });
      });

      describe('not given a block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_DELETE_BLOCK,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given an invalid story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_DELETE_BLOCK,
              storyUid: null,
              blockId: block1Id
            });
          });
        });
      });


      describe('given an invalid block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_DELETE_BLOCK,
              storyUid: story1Uid,
              blockId: null
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_DELETE_BLOCK,
              storyUid: 'badd-ddab',
              blockId: block1Id
            });
          });
        });
      });


      describe('given a non-existent block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_DELETE_BLOCK,
              storyUid: story1Uid,
              blockId: 'not-found'
            });
          });
        });
      });

      describe('given a valid story uid', function() {
        it('should update the story', function() {

          dispatch({
            action: Actions.STORY_DELETE_BLOCK,
            storyUid: story1Uid,
            blockId: block1Id
          });

          assert.deepEqual(storyStore.getStoryBlockIds(story1Uid), [ block2Id ]);
        });
      });
    });

    describe('STORY_INSERT_BLOCK', function() {

      var validInsertionIndex;

      beforeEach(function() {
        validInsertionIndex = 0;
      });

      describe('not given block content', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              storyUid: story1Uid,
              insertAt: validInsertionIndex
            });
          });
        });
      });

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              blockContent: block1Content,
              insertAt: validInsertionIndex
            });
          });
        });
      });

      describe('not given an insertion index', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              blockContent: block1Content,
              storyUid: story1Uid
            });
          });
        });
      });

      describe('given invalid block content', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              blockContent: null,
              storyUid: story1Uid,
              insertAt: validInsertionIndex
            });
          });
        });
      });

      describe('given an invalid story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              blockContent: block1Content,
              storyUid: null,
              insertAt: validInsertionIndex
            });
          });
        });
      });

      describe('given an invalid insertion index', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              blockContent: block1Content,
              storyUid: story1Uid,
              insertAt: null
            });
          });
        });
      });


      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              blockContent: block1Content,
              storyUid: 'notf-ound',
              insertAt: validInsertionIndex
            });
          });
        });
      });

      describe('given an out of bounds insertion index', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.STORY_INSERT_BLOCK,
              blockContent: block1Content,
              storyUid: story1Uid,
              insertAt: 99
            });
          });
        });
      });

      describe('given valid data', function() {

        it('should insert a block at the specified index', function() {

          dispatch({
            action: Actions.STORY_INSERT_BLOCK,
            blockContent: block1Content,
            storyUid: story1Uid,
            insertAt: validInsertionIndex
          });

          var clonedBlock = storyStore.getStoryBlockAtIndex(story1Uid, validInsertionIndex);

          assert.equal(clonedBlock.layout, block1Layout);
          assert.deepEqual(clonedBlock.components, block1Components);
        });
      });
    });

    describe('BLOCK_UPDATE_COMPONENT', function() {

      var validComponentIndex;
      var validComponentType;
      var validComponentValue;

      beforeEach(function() {
        validComponentIndex = 1;
        validComponentType = 'html';
        validComponentValue = 'updated component text';
      });

      describe('given an invalid block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.BLOCK_UPDATE_COMPONENT,
              blockId: null,
              componentIndex: validComponentIndex,
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
              action: Actions.BLOCK_UPDATE_COMPONENT,
              blockId: block1Id,
              componentIndex: null,
              type: validComponentType,
              value: validComponentValue
            });
          });
        });
      });

      describe('given an out of bounds component index', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.BLOCK_UPDATE_COMPONENT,
              blockId: block1Id,
              componentIndex: 99,
              type: validComponentType,
              value: validComponentValue
            });
          });
        });
      });

      describe('given valid, different data', function() {
        const dispatchAction = () => {
          dispatch({
            action: Actions.BLOCK_UPDATE_COMPONENT,
            blockId: block1Id,
            componentIndex: validComponentIndex,
            type: validComponentType,
            value: validComponentValue
          });
        };

        it('should update the specified component', function() {
          dispatchAction();
          assert.equal(storyStore.getBlockComponentAtIndex(block1Id, 1).value, validComponentValue);
        });

        it('should call the change handler', function() {
          const spy = sinon.spy();
          storyStore.addChangeListener(spy);
          dispatchAction();
          sinon.assert.calledOnce(spy);
        });
      });

      describe('given data identical to the current state', function() {

        it('does not call the change handler', function() {
          const currentBlock = storyStore.getBlockComponentAtIndex(block1Id, 1);

          const spy = sinon.spy();
          storyStore.addChangeListener(spy);

          dispatch({
            action: Actions.BLOCK_UPDATE_COMPONENT,
            blockId: block1Id,
            componentIndex: validComponentIndex,
            type: currentBlock.type,
            value: currentBlock.value
          });

          sinon.assert.notCalled(spy);
        });
      });
    });

    describe('RESET_COMPONENT', function() {
      describe('given an invalid block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.RESET_COMPONENT,
              blockId: null,
              componentIndex: 1
            });
          });
        });
      });

      describe('given an invalid component index', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.RESET_COMPONENT,
              blockId: block1Id,
              componentIndex: null
            });
          });
        });
      });

      describe('given an out of bounds component index', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Actions.RESET_COMPONENT,
              blockId: block1Id,
              componentIndex: 99
            });
          });
        });
      });

      describe('given valid data', function() {

        it('should reset the specified component', function() {

          dispatch({
            action: Actions.RESET_COMPONENT,
            blockId: block1Id,
            componentIndex: 1
          });

          assert.deepEqual(
            storyStore.getBlockComponentAtIndex(block1Id, 1),
            { type: 'assetSelector', value: {} }
          );
        });
      });

    });
  });
});

describe('HistoryStore', function() {
  var historyStore;
  var dispatcher;
  var validStoryUid = 'what-what';
  var storyState1 = DataGenerators.generateStoryData({
    uid: validStoryUid,
    blocks: [
      DataGenerators.generateBlockData({
        id: 'block1'
      })
    ]
  });
  var storyState2 = DataGenerators.generateStoryData({
    uid: validStoryUid,
    blocks: [
      DataGenerators.generateBlockData({
        id: 'block1'
      }),
      DataGenerators.generateBlockData({
        id: 'block2'
      })
    ]
  });
  var storyState3 = DataGenerators.generateStoryData({
    uid: validStoryUid,
    blocks: [
      DataGenerators.generateBlockData({
        id: 'block1'
      }),
      DataGenerators.generateBlockData({
        id: 'block2'
      }),
      DataGenerators.generateBlockData({
        id: 'block3'
      })
    ]
  });
  var storyState4 = DataGenerators.generateStoryData({
    uid: validStoryUid,
    blocks: [
      DataGenerators.generateBlockData({
        id: 'block1'
      }),
      DataGenerators.generateBlockData({
        id: 'block2'
      }),
      DataGenerators.generateBlockData({
        id: 'block3'
      }),
      DataGenerators.generateBlockData({
        id: 'block4'
      })
    ]
  });

  var firstEditAction = {
    action: Actions.STORY_INSERT_BLOCK,
    storyUid: validStoryUid,
    insertAt: 1,
    blockContent: storyState2.blocks[1]
  };

  var secondEditAction = {
    action: Actions.STORY_INSERT_BLOCK,
    storyUid: validStoryUid,
    insertAt: 1,
    blockContent: storyState3.blocks[2]
  };

  var thirdEditAction = {
    action: Actions.STORY_INSERT_BLOCK,
    storyUid: validStoryUid,
    insertAt: 1,
    blockContent: storyState4.blocks[3]
  };

  beforeEach(function() {
    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);

    historyStore = new StoryStore(validStoryUid);
    dispatch({ action: Actions.STORY_CREATE, data: storyState1 });
  });

  function dispatch(action) {
    dispatcher.dispatch(action);
  }

  describe('history accessors', function() {

    describe('given a newly-created story', function() {

      describe('.canUndo()', function() {

        it('should return false', function() {
          assert.isFalse(historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return false', function() {
          assert.isFalse(historyStore.canUndo());
        });
      });
    });

    describe('given a newly-created story and one content change', function() {

      beforeEach(function() {
        dispatch(firstEditAction);
      });

      describe('.canUndo()', function() {

        it('should return true', function() {
          assert.isTrue(historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return false', function() {
          assert.isFalse(historyStore.canRedo());
        });
      });
    });

    describe('given a newly-created story, two content changes and one undo action', function() {

      beforeEach(function() {
        dispatch(firstEditAction);
        dispatch(secondEditAction);
        dispatch({ action: Actions.HISTORY_UNDO });
      });

      describe('.canUndo()', function() {

        it('should return true', function() {
          assert.isTrue(historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return true', function() {
          assert.isTrue(historyStore.canUndo());
        });
      });
    });

    describe('given a newly-created story, two content changes and two undo actions', function() {

      beforeEach(function() {
        dispatch(firstEditAction);
        dispatch(secondEditAction);
        dispatch({ action: Actions.HISTORY_UNDO });
        dispatch({ action: Actions.HISTORY_UNDO });
      });

      describe('.canUndo()', function() {

        it('should return false', function() {
          assert.isFalse(historyStore.canUndo());
        });
      });

      describe('.canRedo()', function() {

        it('should return true', function() {
          assert.isTrue(historyStore.canRedo());
        });
      });
    });
  });

  describe('actions', function() {

    describe('HISTORY_UNDO', function() {

      describe('given a newly-created story', function() {

        it('should not modify the story', function() {

          var storyBeforeUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState1.blocks.length);

          dispatch({ action: Actions.HISTORY_UNDO });

          var storyAfterUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);
        });
      });

      describe('given a newly-created story and one content change', function() {

        beforeEach(function() {
          dispatch(firstEditAction);
        });

        it('should cause the story data to revert to the previous version', function() {

          var storyBeforeUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Actions.HISTORY_UNDO });

          var storyAfterUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);
        });
      });

      describe('given a newly-created story, one content change, an undo action and a different content change', function() {

        beforeEach(function() {
          dispatch(firstEditAction);
        });

        it('should reflect the latest content change and disable redo', function() {

          var storyBeforeUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Actions.HISTORY_UNDO });

          var storyAfterUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);

          assert.isTrue(historyStore.canRedo());

          dispatch(secondEditAction);

          var storyAfterContentChange = historyStore.getStorySnapshotAtCursor();
          assert.equal(storyAfterContentChange.blocks.length, storyState2.blocks.length);

          assert.isFalse(historyStore.canRedo());
        });
      });

      describe('given three content changes', function() {

        beforeEach(function() {
          dispatch(firstEditAction);
          dispatch(secondEditAction);
          dispatch(thirdEditAction);
        });

        it('should allow three redo actions', function() {

          dispatch({ action: Actions.HISTORY_UNDO });
          assert.isTrue(historyStore.canUndo());
          dispatch({ action: Actions.HISTORY_UNDO });
          assert.isTrue(historyStore.canUndo());
          dispatch({ action: Actions.HISTORY_UNDO });

          assert.isFalse(historyStore.canUndo());
        });
      });
    });

    describe('HISTORY_REDO', function() {

      describe('given a newly-created story', function() {

        it('should not modify the story', function() {

          var storyBeforeUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState1.blocks.length);

          dispatch({ action: Actions.HISTORY_REDO });

          var storyAfterRedo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterRedo.blocks.length, storyState1.blocks.length);
        });
      });

      describe('given a newly-created story and one content change', function() {

        beforeEach(function() {
          dispatch(firstEditAction);
        });

        it('should not modify the story', function() {

          var storyBeforeUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Actions.HISTORY_REDO });

          var storyAfterRedo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterRedo.blocks.length, storyState2.blocks.length);
        });
      });

      describe('given a newly-created story, one content change and one undo action', function() {

        beforeEach(function() {
          dispatch(firstEditAction);
        });

        it('should revert the story to the last updated version', function() {

          var storyBeforeUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyBeforeUndo.blocks.length, storyState2.blocks.length);

          dispatch({ action: Actions.HISTORY_UNDO });

          var storyAfterUndo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterUndo.blocks.length, storyState1.blocks.length);

          dispatch({ action: Actions.HISTORY_REDO });

          var storyAfterRedo = historyStore.getStorySnapshotAtCursor();

          assert.equal(storyAfterRedo.blocks.length, storyState2.blocks.length);
        });
      });
    });
  });
});
