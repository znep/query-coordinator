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
  var wizardBlockId = '1000';
  var textBlockId = '1001';
  var wizardAndTextBlockId = '1002';
  var storyteller = window.socrata.storyteller;

  var storyData = generateStoryData({
    uid: storyUid,
    title: storyTitle,
    description: storyDescription,
    blocks: [
      generateBlockData({
        id: wizardBlockId,
        layout: '12',
        components: [
          { type: 'media', value: { type: 'embed', value: { provider: 'wizard' } } }
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
        id: wizardAndTextBlockId,
        layout: '6-6',
        components: [
          { type: 'media', value: { type: 'embed', value: { provider: 'wizard' } } },
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

  window.socrata.storyteller.AssetFinderMocker.mock();
  window.socrata.storyteller.assetFinder = new storyteller.AssetFinder();

  window.socrata.storyteller.config = {
    coreServiceAppToken: 'storyteller_app_token'
  }

  window.socrata.storyteller.SquireMocker.mock();

  window.socrata.storyteller.dispatcher = new storyteller.Dispatcher();


  window.socrata.storyteller.dispatcher.register(function(payload) {
    // Some general validation.
    assert.isObject(payload);
    assert.property(payload, 'action', 'action payload had no `action` property');
    assert.isDefined(payload.action, 'action property of payload must be defined,' +
      ' check your Constants and/or dispatch call. Payload keys: ' + Object.keys(payload));
    assert.isString(payload.action, 'action payload had a non-string `action` property');
  });

  storyteller.storyStore = new storyteller.StoryStore();
  storyteller.embedWizardStore = new storyteller.EmbedWizardStore();
  storyteller.dragDropStore = new storyteller.DragDropStore();
  storyteller.historyStore = new storyteller.HistoryStore();
  storyteller.blockRemovalConfirmationStore = new storyteller.BlockRemovalConfirmationStore();
  storyteller.coreSavingStore = new storyteller.CoreSavingStore();

  storyteller.dispatcher.dispatch({ action: Constants.STORY_CREATE, data: storyData });

  window.standardMocks = {
    remove: removeStandardMocks,

    validStoryTitle: storyTitle,
    validStoryDescription: storyDescription,
    validBlockData1: storyData.blocks[0],
    validBlockData2: storyData.blocks[1],

    validStoryUid: storyUid,
    wizardBlockId: wizardBlockId,
    textBlockId: textBlockId,
    wizardAndTextBlockId: wizardAndTextBlockId,
    validBlockId: textBlockId,

    firstBlockId: wizardBlockId,
    secondBlockId: textBlockId,
    thirdBlockId: wizardAndTextBlockId,
    lastBlockId: wizardAndTextBlockId,

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
  delete storyteller.dragDropStore;
  delete storyteller.historyStore;
  delete storyteller.blockRemovalConfirmationStore;
  delete storyteller.coreSavingStore;
  delete storyteller.embedWizardStore;
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
