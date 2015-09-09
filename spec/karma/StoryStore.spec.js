describe('StoryStore', function() {

  'use strict';

  var story1Uid = 'stry-spc1';
  var story1Title = 'Story 1';
  var story1Description = 'Story 1 Description';
  var story1Theme = 'testTheme';
  var story1Digest = 'Story 1 digest';
  var story1PublishedStory = {digest: 'test-digest-1'};

  var story2Uid = 'stry-spc2';
  var story2Title = 'Story 2';
  var story2Description = 'Story 2 Description';
  var story2Digest = 'Story 2 digest';
  var story2PublishedStory = {digest: 'test-digest-2'};

  var block1Id = 'block1';
  var block1Layout = '6-6';
  var block1Components = [
    { type: 'image', value: 'fakeImageFile.png' },
    { type: 'text', value: 'First Block' }
  ];
  var block1Content = {
    'id': block1Id,
    'layout': block1Layout,
    'components': block1Components
  }

  var block2Id = 'block2';
  var block2Layout = '12';
  var block2Components = [ { type: 'text', value: 'Second Block' } ];

  var block3Id = 'block3';
  var block3Layout = '12';
  var block3Components = [ { type: 'text', value: 'Third Block' } ];
  var storyteller = window.socrata.storyteller;

  function dispatch(action) {
    storyteller.dispatcher.dispatch(action);
  }

  function createSampleStories() {

    var sampleStory1Data = generateStoryData({
      uid: story1Uid,
      title: story1Title,
      description: story1Description,
      theme: story1Theme,
      digest: story1Digest,
      permissions: {isPublic: false},
      publishedStory: story1PublishedStory,
      blocks: [
        generateBlockData({
          id: block1Id,
          layout: block1Layout,
          components: block1Components
        }),
        generateBlockData({
          id: block2Id,
          layout: block2Layout,
          components: block2Components
        })
      ]
    });

    var sampleStory2Data = generateStoryData({
      uid: story2Uid,
      title: story2Title,
      description: story2Description,
      digest: story2Digest,
      permissions: {isPublic: true},
      publishedStory: story2PublishedStory,
      blocks: [
        generateBlockData({
          id: block3Id,
          layout: block3Layout,
          components: block3Components
        })
      ]
    });

    dispatch({ action: Constants.STORY_CREATE, data: sampleStory1Data });
    dispatch({ action: Constants.STORY_CREATE, data: sampleStory2Data });
  }

  beforeEach(function() {
    createSampleStories();
  });

  describe('story data accessors', function() {

    describe('given an invalid story uid', function() {

      describe('.storyExists()', function() {

        it('should return false', function() {
          assert.isFalse(storyteller.storyStore.storyExists(null));
        });
      });

      describe('.storyHasBlock()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.storyHasBlock(null);
          });
        });
      });

      describe('.getStoryTitle()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryTitle(null);
          });
        });
      });

      describe('.getStoryDescription()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryDescription(null);
          });
        });
      });

      describe('.getStoryTheme()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryTheme(null);
          });
        });
      });

      describe('.getStoryDigest()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryDigest(null);
          });
        });
      });

      describe('.getStoryPermissions()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryPermissions(null);
          });
        });
      });

      describe('.getStoryPublishedStory()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryPublishedStory(null);
          });
        });
      });

      describe('.getStoryBlockIds()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryBlockIds(null);
          });
        });
      });

      describe('.getStoryBlockAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryBlockAtIndex(null, 0);
          });
        });
      });

      describe('.getStoryBlockIdAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryBlockIdAtIndex(null, 0);
          });
        });
      });

      describe('.serializeStory()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.serializeStory(null);
          });
        });
      });

      describe('.serializeStoryDiff()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.serializeStoryDiff(null);
          });
        });
      });
    });

    describe('given a non-existent story uid', function() {

      describe('.storyExists()', function() {

        it('should return false', function() {
          assert.isFalse(storyteller.storyStore.storyExists('notf-ound'));
        });
      });

      describe('.storyHasBlock()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.storyHasBlock('notf-ound');
          });
        });
      });

      describe('.getStoryTitle()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryTitle('notf-ound');
          });
        });
      });

      describe('.getStoryDescription()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryDescription('notf-ound');
          });
        });
      });

      describe('.getStoryTheme()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryTheme('notf-ound');
          });
        });
      });

      describe('.getStoryDigest()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryDigest('notf-ound');
          });
        });
      });

      describe('.getStoryPermissions()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryPermissions('notf-ound');
          });
        });
      });

      describe('.getStoryPublishedStory()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryPublishedStory('notf-ound');
          });
        });
      });

      describe('.getStoryBlockIds()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryBlockIds('notf-ound');
          });
        });
      });

      describe('.getStoryBlockAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryBlockAtIndex('notf-ound', 0);
          });
        });
      });

      describe('.getStoryBlockIdAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getStoryBlockIdAtIndex('notf-ound', 0);
          });
        });
      });

      describe('.serializeStory()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.serializeStory('notf-ound');
          });
        });
      });

      describe('.serializeStoryDiff()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.serializeStoryDiff('notf-ound');
          });
        });
      });
    });

    describe('given an existing story uid', function() {

      describe('.storyExists()', function() {

        it('should return true', function() {
          assert.isTrue(storyteller.storyStore.storyExists(story1Uid));
        });
      });

      describe('.storyHasBlock()', function() {

        it('should return the correct value', function() {
          assert.isTrue(storyteller.storyStore.storyHasBlock(story2Uid, block3Id));
          assert.isFalse(storyteller.storyStore.storyHasBlock(story2Uid, 'notthere'));
        });
      });

      describe('.getStoryTitle()', function() {

        it('should return the correct value', function() {
          assert.equal(storyteller.storyStore.getStoryTitle(story1Uid), story1Title);
          assert.equal(storyteller.storyStore.getStoryTitle(story2Uid), story2Title);
        });
      });

      describe('.getStoryDescription()', function() {

        it('should return the correct value', function() {
          assert.equal(storyteller.storyStore.getStoryDescription(story1Uid), story1Description);
          assert.equal(storyteller.storyStore.getStoryDescription(story2Uid), story2Description);
        });
      });

      describe('.getStoryTheme()', function() {
        it('defaults to `classic` when not set', function() {
          assert.equal(storyteller.storyStore.getStoryTheme(story2Uid), 'classic');
        });

        it('returns the correct value when set on STORY_CREATE', function() {
          assert.equal(storyteller.storyStore.getStoryTheme(story1Uid), story1Theme);
        });

        it('changes the value when `STORY_UPDATE_THEME` is fired', function() {
          dispatch({
            action: Constants.STORY_UPDATE_THEME,
            storyUid: story1Uid,
            theme: 'serif'
          });

          assert.equal(storyteller.storyStore.getStoryTheme(story1Uid), 'serif');
        });
      });

      describe('.getStoryDigest()', function() {

        it('should return the correct value', function() {
          assert.equal(storyteller.storyStore.getStoryDigest(story1Uid), story1Digest);
          assert.equal(storyteller.storyStore.getStoryDigest(story2Uid), story2Digest);
        });
      });

      describe('.getStoryPermissions()', function() {

        it('should return the correct value', function() {
          assert.deepEqual(storyteller.storyStore.getStoryPermissions(story1Uid), {isPublic: false});
          assert.deepEqual(storyteller.storyStore.getStoryPermissions(story2Uid), {isPublic: true});
        });
      });

      describe('.getStoryPublishedStory()', function() {

        it('should return the correct value', function() {
          assert.equal(storyteller.storyStore.getStoryPublishedStory(story1Uid), story1PublishedStory);
          assert.equal(storyteller.storyStore.getStoryPublishedStory(story2Uid), story2PublishedStory);
        });
      });

      describe('.getStoryBlockIds()', function() {

        it('should return the correct value', function() {
          assert.deepEqual(storyteller.storyStore.getStoryBlockIds(story1Uid), [ block1Id, block2Id ]);
          assert.deepEqual(storyteller.storyStore.getStoryBlockIds(story2Uid), [ block3Id ]);
        });
      });

      describe('.getStoryBlockAtIndex()', function() {

        describe('given an invalid index', function() {

          it('should throw an error', function() {
            assert.throw(function() {
              storyteller.storyStore.getStoryBlockAtIndex(story1Uid, 99);
            });
          });
        });

        describe('given a valid index', function() {

          it('should return the correct value', function() {

            var block1 = storyteller.storyStore.getStoryBlockAtIndex(story1Uid, 0);
            var block3 = storyteller.storyStore.getStoryBlockAtIndex(story2Uid, 0);

            assert.propertyVal(block1, 'id', block1Id);
            assert.propertyVal(block1, 'layout', block1Layout);
            assert.equal(block1.components[0].type, block1Components[0].type);
            assert.equal(block1.components[0].value, block1Components[0].value);
            assert.equal(block1.components[1].type, block1Components[1].type);
            assert.equal(block1.components[1].value, block1Components[1].value);

            assert.propertyVal(block3, 'id', block3Id);
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
              storyteller.storyStore.getStoryBlockIdAtIndex(story1Uid, 99);
            });
          });
        });

        describe('given a valid index', function() {

          it('should return the correct value', function() {
            assert.equal(storyteller.storyStore.getStoryBlockIdAtIndex(story1Uid, 0), block1Id);
            assert.equal(storyteller.storyStore.getStoryBlockIdAtIndex(story2Uid, 0), block3Id);
          });
        });
      });

      describe('.serializeStory()', function() {

        it('should return an object matching the properties of the story', function() {

          var serializedStory = storyteller.storyStore.serializeStory(story1Uid);

          assert.equal(serializedStory.uid, story1Uid);
          assert.equal(serializedStory.title, story1Title);
          assert.equal(serializedStory.blocks[0].id, block1Id);
          assert.equal(serializedStory.blocks[0].layout, block1Layout);
          assert.deepEqual(serializedStory.blocks[0].components, block1Components);
          assert.equal(serializedStory.blocks[1].id, block2Id);
          assert.equal(serializedStory.blocks[1].layout, block2Layout);
          assert.deepEqual(serializedStory.blocks[1].components, block2Components);
        });
      });

      describe('.serializeStoryDiff()', function() {

        it('should return an object matching the properties of the story except for unchanged blocks', function() {

          dispatch({ action: Constants.STORY_INSERT_BLOCK, storyUid: story1Uid, blockContent: block1Content, insertAt: 2 });

          var serializedStory = storyteller.storyStore.serializeStoryDiff(story1Uid);

          assert.equal(serializedStory.uid, story1Uid);
          assert.equal(serializedStory.title, story1Title);
          assert.property(serializedStory.blocks[0], 'id');
          assert.notProperty(serializedStory.blocks[0], 'layout');
          assert.notProperty(serializedStory.blocks[0], 'components');
          assert.property(serializedStory.blocks[1], 'id');
          assert.notProperty(serializedStory.blocks[1], 'layout');
          assert.notProperty(serializedStory.blocks[1], 'components');
          assert.property(serializedStory.blocks[2], 'id');
          assert.equal(serializedStory.blocks[2].layout, block1Layout);

          assert.deepEqual(serializedStory.blocks[2].components, block1Components);
        });
      });
    });
  });

  describe('block data accessors', function() {

    describe('given an invalid block id', function() {

      describe('.getBlockLayout()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getBlockLayout(null);
          });
        });
      });

      describe('.getBlockComponents()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getBlockLayout(null);
          });
        });
      });

      describe('.getBlockComponentAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getBlockComponentAtIndex(null, 0);
          });
        });
      });
    });

    describe('given a non-existent block id', function() {

      describe('.getBlockLayout()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getBlockLayout('does not exist');
          });
        });
      });

      describe('.getBlockComponents()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getBlockComponents('does not exist');
          });
        });
      });

      describe('.getBlockComponentAtIndex()', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            storyteller.storyStore.getBlockLayout('does not exist', 0);
          });
        });
      });
    });

    describe('given an existing block id', function() {

      describe('.getBlockLayout()', function() {

        it('should return the layout of the specified block', function() {

          assert.equal(storyteller.storyStore.getBlockLayout(block1Id), block1Layout);
          assert.equal(storyteller.storyStore.getBlockLayout(block2Id), block2Layout);
        });
      });

      describe('.getBlockComponents()', function() {

        it('should return the components of the specified block', function() {

          assert.deepEqual(storyteller.storyStore.getBlockComponents(block1Id), block1Components);
          assert.deepEqual(storyteller.storyStore.getBlockComponents(block2Id), block2Components);
        });
      });

      describe('.getBlockComponentAtIndex()', function() {

        describe('given an index < 0', function() {

          it('should throw an error', function() {

            assert.throw(function() {
              storyteller.storyStore.getBlockComponentAtIndex(block1Id, -1);
            });
          });
        });

        describe('given an index >= the number of components', function() {

          it('should throw an error', function() {

            assert.throw(function() {
              storyteller.storyStore.getBlockComponentAtIndex(block1Id, 2);
            });

            assert.throw(function() {
              storyteller.storyStore.getBlockComponentAtIndex(block1Id, 3);
            });
          });
        });

        describe('given a valid index', function() {

          it('should return the specified component of the specified block', function() {

            var component = storyteller.storyStore.getBlockComponentAtIndex(block1Id, 1);

            assert.equal(component.type, block1Components[1].type);
            assert.equal(component.value, block1Components[1].value);
          });
        });
      });
    });
  });

  describe('actions', function() {

    describe('STORY_CREATE', function() {

      describe('when `storyData` is incomplete', function() {

        var storyData;

        beforeEach(function() {
          storyData = generateStoryData();
        });

        describe('and `uid` is missing', function() {

          it('raises an exception', function() {

            delete storyData['uid'];

            assert.throw(function() {
              dispatch({ action: Constants.STORY_CREATE, data: storyData });
            });
          });
        });

        describe('and `uid` is not a valid four-by-four', function() {

          it('raises an exception', function() {

            storyData['uid'] = 'testtest';

            assert.throw(function() {
              dispatch({ action: Constants.STORY_CREATE, data: storyData });
            });
          });
        });

        describe('and `title` is missing', function() {

          it('raises an exception', function() {

            delete storyData['title'];

            assert.throw(function() {
              dispatch({ action: Constants.STORY_CREATE, data: storyData });
            });
          });
        });

        describe('and `blocks` is missing', function() {

          it('raises an exception', function() {

            delete storyData['blocks'];

            assert.throw(function() {
              dispatch({ action: Constants.STORY_CREATE, data: storyData });
            });
          });
        });

        describe('and `blocks` is not an array', function() {

          it('raises an exception', function() {

            var invalidStoryData = generateStoryData({
              blocks: 'not an array'
            });

            assert.throw(function() {
              dispatch({ action: Constants.STORY_CREATE, data: invalidStoryData });
            });
          });
        });
      });

      describe('given `blocks` with an invalid block', function() {

        it('raises an exception', function() {

          var invalidStoryData = generateStoryData({
            blocks: [
              { invalidBlockObject: true }
            ]
          });

          assert.throw(function() {
            dispatch({ action: Constants.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given `blocks` with a block that does not have an `id`', function() {

        it('raises an exception', function() {

          var invalidStoryData = generateStoryData({
            blocks: [
              {
                invalidBlockObject: {
                  layout: '12',
                  components: [
                    { type: 'text', value: 'test' }
                  ]
                }
              }
            ]
          });

          assert.throw(function() {
            dispatch({ action: Constants.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given `blocks` with a block that does not have a `layout`', function() {

        it('raises an exception', function() {

          var invalidStoryData = generateStoryData({
            blocks: [
              {
                invalidBlockObject: {
                  id: 'testBlockId',
                  components: [
                    { type: 'text', value: 'test' }
                  ]
                }
              }
            ]
          });

          assert.throw(function() {
            dispatch({ action: Constants.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given `blocks` with a block that does not have `components`', function() {

        it('raises an exception', function() {

          var invalidStoryData = generateStoryData({
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
            dispatch({ action: Constants.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given a story uid that already exists', function() {

        it('should throw an error', function() {

          var invalidStoryData = generateStoryData({
            uid: story1Uid
          });

          assert.throw(function() {
            dispatch({ action: Constants.STORY_CREATE, data: invalidStoryData });
          });
        });
      });

      describe('given `blocks` with a block id that already exists', function() {

        it('should throw an error', function() {

          var invalidStoryData = generateStoryData({
            uid: 'notf-ound',
            blocks: [
              generateBlockData({
                id: block1Id
              })
            ]
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

          assert.equal(storyteller.storyStore.getStoryTitle(validStoryUid), validStoryTitle);
        });
      });
    });

    describe('STORY_SET_TITLE', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_TITLE,
              title: 'title'
            });
          });
        });
      });

      describe('not given a title', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_TITLE,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_TITLE,
              storyUid: 'badd-ddab',
              title: 'title'
            });
          });
        });
      });


      describe('given a valid story uid and title', function() {

        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_SET_TITLE,
            storyUid: story1Uid,
            title: 'new title'
          });

          assert.deepEqual(storyteller.storyStore.getStoryTitle(story1Uid), 'new title');
        });
      });
    });

    describe('STORY_SAVED', function() {
      it('should update the digest', function() {
        dispatch({
          action: Constants.STORY_SAVED,
          storyUid: story1Uid,
          digest: 'new digest'
        });

        assert.equal(storyteller.storyStore.getStoryDigest(story1Uid), 'new digest');
      });
    });

    describe('STORY_SET_DESCRIPTION', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_DESCRIPTION,
              description: 'foobar'
            });
          });
        });
      });

      describe('not given a description', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_DESCRIPTION,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_DESCRIPTION,
              storyUid: 'badd-ddab',
              description: 'foobar'
            });
          });
        });
      });

      describe('given a valid story uid and description', function() {

        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_SET_DESCRIPTION,
            storyUid: story1Uid,
            description: 'new description'
          });

          assert.equal(storyteller.storyStore.getStoryDescription(story1Uid), 'new description');
        });
      });
    });

    describe('STORY_SET_PERMISSIONS', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_PERMISSIONS,
              isPublic: true
            });
          });
        });
      });

      describe('not given an isPublic property', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_PERMISSIONS,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_PERMISSIONS,
              storyUid: 'badd-ddab',
              isPublic: true
            });
          });
        });
      });

      describe('given a valid story uid and an isPublic property', function() {

        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_SET_PERMISSIONS,
            storyUid: story1Uid,
            isPublic: true
          });

          assert.equal(storyteller.storyStore.getStoryDescription(story1Uid), true);
        });
      });
    });

    describe('STORY_SET_PUBLISHED_STORY', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_PUBLISHED_STORY,
              publishedStory: {digest: 'digest-1'}
            });
          });
        });
      });

      describe('not given a publishedStory property', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_PUBLISHED_STORY,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given a non-existent story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_SET_PUBLISHED_STORY,
              storyUid: 'badd-ddab',
              publishedStory: {digest: 'digest-1'}
            });
          });
        });
      });

      describe('given a valid story uid and an isPublic property', function() {

        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_SET_PUBLISHED_STORY,
            storyUid: story1Uid,
            publishedStory: {digest: 'digest-1'}
          });

          assert.deepEqual(storyteller.storyStore.getStoryDescription(story1Uid), {digest: 'digest-1'});
        });
      });
    });

    describe('STORY_MOVE_BLOCK_UP', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_MOVE_BLOCK_UP,
              blockId: block1Id
            });
          });
        });
      });

      describe('not given a block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_MOVE_BLOCK_UP,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given an invalid story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_MOVE_BLOCK_UP,
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
              action: Constants.STORY_MOVE_BLOCK_UP,
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
              action: Constants.STORY_MOVE_BLOCK_UP,
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
              action: Constants.STORY_MOVE_BLOCK_UP,
              storyUid: story1Uid,
              blockId: 'not-found'
            });
          });
        });
      });

      describe('given a valid story uid', function() {

        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_MOVE_BLOCK_UP,
            storyUid: story1Uid,
            blockId: block2Id
          });

          assert.deepEqual(storyteller.storyStore.getStoryBlockIds(story1Uid), [ block2Id, block1Id ]);
        });
      });
    });

    describe('STORY_MOVE_BLOCK_DOWN', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_MOVE_BLOCK_DOWN,
              blockId: block1Id
            });
          });
        });
      });

      describe('not given a block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_MOVE_BLOCK_DOWN,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given an invalid story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_MOVE_BLOCK_DOWN,
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
              action: Constants.STORY_MOVE_BLOCK_DOWN,
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
              action: Constants.STORY_MOVE_BLOCK_DOWN,
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
              action: Constants.STORY_MOVE_BLOCK_DOWN,
              storyUid: story1Uid,
              blockId: 'not-found'
            });
          });
        });
      });

      describe('given a valid story uid', function() {
        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_MOVE_BLOCK_DOWN,
            storyUid: story1Uid,
            blockId: block1Id
          });

          assert.deepEqual(storyteller.storyStore.getStoryBlockIds(story1Uid), [ block2Id, block1Id ]);
        });
      });
    });

    describe('STORY_DELETE_BLOCK', function() {

      describe('not given a story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_DELETE_BLOCK,
              blockId: block1Id
            });
          });
        });
      });

      describe('not given a block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_DELETE_BLOCK,
              storyUid: 'badd-ddab'
            });
          });
        });
      });

      describe('given an invalid story uid', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.STORY_DELETE_BLOCK,
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
              action: Constants.STORY_DELETE_BLOCK,
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
              action: Constants.STORY_DELETE_BLOCK,
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
              action: Constants.STORY_DELETE_BLOCK,
              storyUid: story1Uid,
              blockId: 'not-found'
            });
          });
        });
      });

      describe('given a valid story uid', function() {
        it('should update the story', function() {

          dispatch({
            action: Constants.STORY_DELETE_BLOCK,
            storyUid: story1Uid,
            blockId: block1Id
          });

          assert.deepEqual(storyteller.storyStore.getStoryBlockIds(story1Uid), [ block2Id ]);
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
              action: Constants.STORY_INSERT_BLOCK,
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
              action: Constants.STORY_INSERT_BLOCK,
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
              action: Constants.STORY_INSERT_BLOCK,
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
              action: Constants.STORY_INSERT_BLOCK,
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
              action: Constants.STORY_INSERT_BLOCK,
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
              action: Constants.STORY_INSERT_BLOCK,
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
              action: Constants.STORY_INSERT_BLOCK,
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
              action: Constants.STORY_INSERT_BLOCK,
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
            action: Constants.STORY_INSERT_BLOCK,
            blockContent: block1Content,
            storyUid: story1Uid,
            insertAt: validInsertionIndex
          });

          var clonedBlock = storyteller.storyStore.getStoryBlockAtIndex(story1Uid, validInsertionIndex);

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
        validComponentType = 'text';
        validComponentValue = 'updated component text';
      });

      describe('given an invalid block id', function() {

        it('should throw an error', function() {

          assert.throw(function() {
            dispatch({
              action: Constants.BLOCK_UPDATE_COMPONENT,
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
              action: Constants.BLOCK_UPDATE_COMPONENT,
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
              action: Constants.BLOCK_UPDATE_COMPONENT,
              blockId: block1Id,
              componentIndex: 99,
              type: validComponentType,
              value: validComponentValue
            });
          });
        });
      });

      describe('given valid data', function() {

        it('should update the specified component', function() {

          dispatch({
            action: Constants.BLOCK_UPDATE_COMPONENT,
            blockId: block1Id,
            componentIndex: validComponentIndex,
            type: validComponentType,
            value: validComponentValue
          });

          assert.equal(storyteller.storyStore.getBlockComponentAtIndex(block1Id, 1).value, validComponentValue);
        });
      });
    });
  });
});
