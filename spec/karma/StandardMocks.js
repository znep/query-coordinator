'use strict';

/* Responsible for:
 * Setting up window state and test data for karma tests
 *   - Attaching all stores to the window
 *   - Generating a story
 *   - Exposing relevant blockIds and properties for testing
 *
 * Usage:
 * Automatic. In your tests, just access window.standardMocks.
 * If for some reason you don't want the mocks active during
 * your tests, do this in the appropriate describe() block:
 *
 *   beforeEach(standardMocks.remove);
 *
 */

function applyStandardMocks() {
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
        layout: '12',
        components: [
          { type: 'media', value: { type: 'image', value: { src: 'fakeImageFile.png' } } }
        ]
      }),
      generateBlockData({
        id: textBlockId,
        layout: '12',
        components: [
          { type: 'text', value: 'some-text' }
        ]
      }),
      generateBlockData({
        id: imageAndTextBlockId,
        layout: '6-6',
        components: [
          { type: 'media', value: { type: 'image', value: { src: 'anotherFakeImageFile.png' } } },
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

  SquireMocker.mock();

  window.dispatcher = new Dispatcher();

  dispatcher.register(function(payload) {
    // Some general validation.
    assert.isObject(payload);
    assert.property(payload, 'action', 'action payload had no `action` property');
    assert.isDefined(payload.action, 'action property of payload must be defined,' +
      ' check your Constants and/or dispatch call. Payload keys: ' + Object.keys(payload));
    assert.isString(payload.action, 'action payload had a non-string `action` property');
  });

  window.storyStore = new StoryStore();
  window.embedWizardStore = new EmbedWizardStore();
  window.dragDropStore = new DragDropStore();
  window.historyStore = new HistoryStore();
  window.blockRemovalConfirmationStore = new BlockRemovalConfirmationStore();

  dispatcher.dispatch({ action: Constants.STORY_CREATE, data: storyData });

  window.standardMocks = {
    remove: removeStandardMocks,

    validStoryTitle: storyTitle,
    validBlockData1: storyData.blocks[0],
    validBlockData2: storyData.blocks[1],

    validStoryUid: storyUid,
    imageBlockId: imageBlockId,
    textBlockId: textBlockId,
    imageAndTextBlockId: imageAndTextBlockId,
    validBlockId: textBlockId,

    firstBlockId: imageBlockId,
    secondBlockId: textBlockId,
    thirdBlockId: imageAndTextBlockId,
    lastBlockId: imageAndTextBlockId,

    invalidBlockId: 'NotValidBlockId',
    invalidStoryUid: 'NotValidStoryUid'
  };

  assert.notEqual(window.standardMocks.invalidBlockId, window.standardMocks.validBlockId);
  assert.notEqual(window.standardMocks.invalidStoryUid, window.standardMocks.validStoryUid);
}

function removeStandardMocks() {
  SquireMocker.unmock();
  AssetFinderMocker.unmock();
  delete window.dispatcher;
  delete window.storyStore;
  delete window.blockStore;
  delete window.dragDropStore;
  delete window.I18n;
  delete window.standardMocks;
}

// Run StandardMocks before every test.
// Currently, this introduces an unmeasureable
// performance penalty (under 10ms for a full
// test run).
// If you don't want these standard mocks for a
// particular test, see this file's top-level comment.
beforeEach(applyStandardMocks);
afterEach(removeStandardMocks);
