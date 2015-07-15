'use strict';

/* Responsible for:
 * Setting up window state and test data for karma tests
 *   - Attaching all stores to the window
 *   - Generating a story
 *   - Exposing relevant blockIds and properties for testing
 *
 * Usage:
 * In each spec at the top level
 *   beforeEach(standardMocks);         // Set up state
 *   afterEach(standardMocks.unmock);   // Remove state between each test
 *
 */

function standardMocks() {
  var storyUid = 'test-test';
  var storyTitle = 'Standard Mock Story Title';
  var imageBlockId = '1000';
  var textBlockId = '1001';
  var imageAndTextBlockId = '1002';

  var storyData = generateStoryData({
    uid: storyUid,
    title: storyTitle,
    blocks: [
      generateBlockData({
        id: imageBlockId,
        components: [
          { type: 'image', value: 'fakeImageFile.png' }
        ]
      }),
      generateBlockData({
        id: textBlockId,
        components: [
          { type: 'text', value: 'some-text' }
        ]
      }),
      generateBlockData({
        id: imageAndTextBlockId,
        components: [
          { type: 'image', value: 'anotherFakeImageFile.png' },
          { type: 'text', value: 'some-text' }
        ]
      })
    ]
  });

  // Stub translations
  window.I18n = {
    t: sinon.spy(function(translationKeys) {
      return 'Translation for: ' + translationKeys;
    })
  };
  AssetFinderMocker.mock();
  window.assetFinder = new AssetFinder();

  window.dispatcher = new Dispatcher();

  dispatcher.register(function(payload) {
    // Some general validation.
    assert.isObject(payload);
    assert.property(payload, 'action', 'action payload had no `action` property');
    assert.isDefined(payload.action, 'action payload had an undefined `action` property, check your Constants!');
    assert.isString(payload.action, 'action payload had a non-string `action` property');
  });

  window.storyStore = new StoryStore();
  window.dragDropStore = new DragDropStore();
  window.historyStore = new HistoryStore();
  window.blockRemovalConfirmationStore = new BlockRemovalConfirmationStore();

  dispatcher.dispatch({ action: Constants.STORY_CREATE, data: storyData });

  standardMocks.validStoryTitle = storyTitle;

  standardMocks.validStoryUid = storyUid;
  standardMocks.imageBlockId = imageBlockId;
  standardMocks.textBlockId = textBlockId;
  standardMocks.imageAndTextBlockId = imageAndTextBlockId;
  standardMocks.validBlockId = textBlockId;

  standardMocks.firstBlockId = imageBlockId;
  standardMocks.secondBlockId = textBlockId;
  standardMocks.thirdBlockId = imageAndTextBlockId;
  standardMocks.lastBlockId = imageAndTextBlockId;

  standardMocks.invalidBlockId = 'NotValidBlockId';
  standardMocks.invalidStoryUid = 'NotValidStoryUid';

  assert.notEqual(standardMocks.invalidBlockId, standardMocks.validBlockId);
  assert.notEqual(standardMocks.invalidStoryUid, standardMocks.validStoryUid);
}

standardMocks.unmock = function() {
  delete window.dispatcher;
  delete window.storyStore;
  delete window.blockStore;
  delete window.dragDropStore;
  delete window.I18n;
};
