describe('StoryTitle jQuery plugin', function() {
  var node;

  beforeEach(function() {
    node = testDom.root().append('<div>');
  });

  afterEach(function() {
    testDom.clear();
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

        window.dispatcher.dispatch({
          action: Constants.STORY_SET_TITLE,
          storyUid: standardMocks.validStoryUid,
          title: newTitle
        });

        assert.equal(node.text(), newTitle);
      });
    });

    describe('when the title is clicked', function() {
      var originalPrompt;

      beforeEach(function() {
        originalPrompt = window.prompt;
      });

      afterEach(function() {
        window.prompt = originalPrompt;
      });

      it('shows a dialog', function(done) {
        window.prompt = function(promptString, prefill) {
          assert.isString(promptString); // Arbitrary human-readable string.
          assert.equal(prefill, standardMocks.validStoryTitle);

          done();
        };
        node.click();
      });

      it('sets the value of the story to the entered text', function(done) {
        var newTitle = 'woohoo prompts!';

        window.prompt = function() {
          return newTitle;
        };

        storyStore.addChangeListener(function() {
          if(storyStore.getStoryTitle(standardMocks.validStoryUid) === newTitle) {
            done();
          }
        });

        node.click();
      });
    });

  });
});
