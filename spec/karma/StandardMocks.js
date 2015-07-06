'use strict';

function standardMocks() {
  var storyUid = 'test-test';
  var imageBlockId = '1000';
  var textBlockId = '1001';
  var imageAndTextBlockId = '1002';

  var storyData = generateStoryData({
    uid: storyUid,
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

  dispatcher.dispatch({ action: Constants.STORY_CREATE, data: storyData });

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
};
