describe('StoryTitle jQuery plugin', function() {
  var node;

  beforeEach(function() {
    standardMocks();
    node = testDom.root().append('<div>');
  });

  afterEach(function() {
    standardMocks.unmock();
    testDom.clear();
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { node.storyTitle(); });
    assert.throws(function() { node.storyTitle(1); });
    assert.throws(function() { node.storyTitle(null); });
    assert.throws(function() { node.storyTitle(undefined); });
    assert.throws(function() { node.storyTitle({}); });
    assert.throws(function() { node.storyTitle([]); });
    assert.throws(function() { node.storyTitle(); });
  });

  describe('given a storyUid that does not correspond to a story', function() {
    // We might revisit this behavior - another totally
    // valid approach would be to wait for the story
    // to exist.
    it('should throw', function() {
      assert.throws(function() { node.storyTitle('badd-guyz') });
    });
  });

  describe('given a storyUid that corresponds to a story', function() {
    beforeEach(function() {
      node.storyTitle(standardMocks.validStoryUid);
    });

    it('should render the story title', function() {
      assert.equal(node.text(), standardMocks.validStoryTitle);
    });

    describe('that changes', function() {
      it('should update the story title', function() {
        var newTitle = 'New Story Title';

        window.dispatcher.dispatch({
          action: Constants.STORY_SET_TITLE,
          storyUid: standardMocks.validStoryUid,
          title: newTitle
        });

        assert.equal(node.text(), newTitle);
      });
    });

  });
});
