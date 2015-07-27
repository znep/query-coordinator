describe('StoryTitle jQuery plugin', function() {
  var node;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    node = testDom.append('<div>');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { node.storyTitle(); });
    assert.throws(function() { node.storyTitle(1); });
    assert.throws(function() { node.storyTitle(null); });
    assert.throws(function() { node.storyTitle(undefined); });
    assert.throws(function() { node.storyTitle({}); });
    assert.throws(function() { node.storyTitle([]); });
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
    var returnValue;

    beforeEach(function() {
      returnValue = node.storyTitle(standardMocks.validStoryUid);
    });

    it('should return a jQuery object for chaining', function() {
      assert.isTrue($.fn.isPrototypeOf(returnValue), 'Returned value is not a jQuery collection');
    });

    it('should render the story title', function() {
      assert.equal(node.text(), standardMocks.validStoryTitle);
    });

    describe('that changes', function() {
      it('should update the story title', function() {
        var newTitle = 'New Story Title';

        window.socrata.storyteller.dispatcher.dispatch({
          action: Constants.STORY_SET_TITLE,
          storyUid: standardMocks.validStoryUid,
          title: newTitle
        });

        assert.equal(node.text(), newTitle);
      });
    });

  });
});
