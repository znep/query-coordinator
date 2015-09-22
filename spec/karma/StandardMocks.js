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
  var storyDescription = 'Standard Mock Story Description';
  var assetSelectorBlockId = '1000';
  var textBlockId = '1001';
  var assetSelectorAndTextBlockId = '1002';
  var storyteller = window.socrata.storyteller;

  var storyData = generateStoryData({
    uid: storyUid,
    title: storyTitle,
    description: storyDescription,
    digest: 'test-digest',
    blocks: [
      generateBlockData({
        id: assetSelectorBlockId,
        layout: '12',
        components: [
          { type: 'assetSelector' }
        ]
      }),
      generateBlockData({
        id: textBlockId,
        layout: '12',
        components: [
          { type: 'html', value: 'some-text' }
        ]
      }),
      generateBlockData({
        id: assetSelectorAndTextBlockId,
        layout: '6-6',
        components: [
          { type: 'assetSelector' },
          { type: 'html', value: 'some-text' }
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

  window.socrata.storyteller.AssetFinderMocker.mock();
  window.socrata.storyteller.assetFinder = new storyteller.AssetFinder();

  window.socrata.storyteller.config = {
    coreServiceAppToken: 'storyteller_app_token',
    fileUploader: {
      checkDocumentProcessedRetryInterval: 50,
      checkDocumentProcessedMaxRetrySeconds: 1,
      maxFileSizeBytes: 5 * 1024
    }
  }

  window.socrata.storyteller.SquireMocker.mock();

  window.socrata.storyteller.dispatcher = new storyteller.Dispatcher();


  window.socrata.storyteller.dispatcher.register(function(payload) {
    // Some general validation.
    assert.isObject(payload);
    assert.property(payload, 'action', 'action payload had no `action` property');
    assert.isDefined(payload.action, 'action property of payload must be defined,' +
      ' check your Actions and/or dispatch call. Payload keys: ' + Object.keys(payload));
    assert.isString(payload.action, 'action payload had a non-string `action` property');
  });

  storyteller.userStoryUid = storyUid;
  storyteller.storyStore = new storyteller.StoryStore();
  storyteller.storySaveStatusStore = new storyteller.StorySaveStatusStore(storyUid);
  storyteller.assetSelectorStore = new storyteller.AssetSelectorStore();
  storyteller.dragDropStore = new storyteller.DragDropStore();
  storyteller.historyStore = new storyteller.HistoryStore(storyUid);
  storyteller.blockRemovalConfirmationStore = new storyteller.BlockRemovalConfirmationStore();
  storyteller.coreSavingStore = new storyteller.CoreSavingStore();
  storyteller.windowSizeBreakpointStore = new storyteller.WindowSizeBreakpointStore();
  storyteller.fileUploadStore = new storyteller.FileUploadStore();

  storyteller.dispatcher.dispatch({ action: Actions.STORY_CREATE, data: storyData });

  window.standardMocks = {
    remove: removeStandardMocks,

    validStoryTitle: storyTitle,
    validStoryDescription: storyDescription,
    validStoryDigest: storyData.digest,
    validBlockData1: storyData.blocks[0],
    validBlockData2: storyData.blocks[1],

    validStoryUid: storyUid,
    assetSelectorBlockId: assetSelectorBlockId,
    textBlockId: textBlockId,
    assetSelectorAndTextBlockId: assetSelectorAndTextBlockId,
    validBlockId: textBlockId,

    firstBlockId: assetSelectorBlockId,
    secondBlockId: textBlockId,
    thirdBlockId: assetSelectorAndTextBlockId,
    lastBlockId: assetSelectorAndTextBlockId,

    invalidBlockId: 'NotValidBlockId',
    invalidStoryUid: 'NotValidStoryUid'
  };

  assert.notEqual(window.standardMocks.invalidBlockId, window.standardMocks.validBlockId);
  assert.notEqual(window.standardMocks.invalidStoryUid, window.standardMocks.validStoryUid);
}

function removeStandardMocks() {

  var storyteller = window.socrata.storyteller;

  storyteller.SquireMocker.unmock();
  storyteller.AssetFinderMocker.unmock();

  delete storyteller.dispatcher;
  delete storyteller.storyStore;
  delete storyteller.storySaveStatusStore;
  delete storyteller.dragDropStore;
  delete storyteller.historyStore;
  delete storyteller.blockRemovalConfirmationStore;
  delete storyteller.coreSavingStore;
  delete storyteller.assetSelectorStore;
  delete storyteller.fileUploadStore;
  delete storyteller.I18n;
  delete storyteller.config;
  delete storyteller.standardMocks;
}

// Run StandardMocks before every test.
// Currently, this introduces an unmeasureable
// performance penalty (under 10ms for a full
// test run).
// If you don't want these standard mocks for a
// particular test, see this file's top-level comment.
beforeEach(applyStandardMocks);
afterEach(removeStandardMocks);
