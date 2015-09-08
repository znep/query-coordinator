describe('storySaveButton jQuery plugin', function() {
  var $button;
  var storyteller = window.socrata.storyteller;
  var mockStore;

  beforeEach(function() {
    $button = $('<button>');

    function MockStore(forStoryUid) {
      var self = this;
      var _isSaved = true;
      var _isSaveInProgress = false;

      _.extend(this, new storyteller.Store());

      this.mockIsSaved = function(isSaved) {
        _isSaved = isSaved;
        self._emitChange();
      };

      this.mockIsSaveInProgress= function(isSaveInProgress) {
        _isSaveInProgress = isSaveInProgress;
        self._emitChange();
      };

      this.isStorySaved = function() { return _isSaved; };
      this.isStorySaveInProgress = function() { return _isSaveInProgress; };
      this.isSaveImpossibleDueToConflict = _.constant(false); // TODO test.
    }

    mockStore = new MockStore();
    storyteller.storySaveStatusStore = mockStore;
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $button.storySaveButton(1); });
    assert.throws(function() { $button.storySaveButton(''); });
  });

  it('should return a jQuery object for chaining', function() {
    var returnValue = $button.storySaveButton();
    assert.instanceOf(returnValue, jQuery);
  });


  describe('instance', function() {
    beforeEach(function() {
      $button.storySaveButton({ savedMessageTimeout: 10 });
    });

    describe('button text', function() {
      it('should mirror the story save state', function() {
        mockStore.mockIsSaveInProgress(false);
        mockStore.mockIsSaved(true);
        assert.equal($button.text(), 'Translation for: editor.story_save_button.saved');

        mockStore.mockIsSaveInProgress(false);
        mockStore.mockIsSaved(false);
        assert.equal($button.text(), 'Translation for: editor.story_save_button.unsaved');

        mockStore.mockIsSaveInProgress(true);
        mockStore.mockIsSaved(true);
        assert.equal($button.text(), 'Translation for: editor.story_save_button.saving');

        mockStore.mockIsSaveInProgress(true);
        mockStore.mockIsSaved(false);
        assert.equal($button.text(), 'Translation for: editor.story_save_button.saving');
      });

      describe('five seconds after story finishes saving', function() {
        it('should say "save" and stay disabled', function(done) {
          mockStore.mockIsSaveInProgress(true);
          mockStore.mockIsSaved(false);
          assert.equal($button.text(), 'Translation for: editor.story_save_button.saving');

          mockStore.mockIsSaved(true);
          mockStore.mockIsSaveInProgress(false);
          assert.equal($button.text(), 'Translation for: editor.story_save_button.saved');

          setTimeout(function() {
            assert.equal($button.text(), 'Translation for: editor.story_save_button.idle');
            assert.isTrue($button.prop('disabled'));
            done();
          }, 20);

        });
      });
    });

    describe('button', function() {
      describe('enabled state', function() {
        it('should mirror the story save state', function() {
          mockStore.mockIsSaveInProgress(false);
          mockStore.mockIsSaved(true);
          assert.isTrue($button.prop('disabled'));

          mockStore.mockIsSaveInProgress(false);
          mockStore.mockIsSaved(false);
          assert.isFalse($button.prop('disabled'));

          mockStore.mockIsSaveInProgress(true);
          mockStore.mockIsSaved(true);
          assert.isTrue($button.prop('disabled'));

          mockStore.mockIsSaveInProgress(true);
          mockStore.mockIsSaved(false);
          assert.isTrue($button.prop('disabled'));
        });
      });
      it('should call StoryDraftCreator.saveDraft when clicked', function() {
        var stub = sinon.stub(storyteller.StoryDraftCreator, 'saveDraft', _.noop);
        mockStore.mockIsSaved(false);
        $button.click();
        sinon.assert.calledWithExactly(stub, standardMocks.validStoryUid);
        stub.restore();
      });
    });
  });
});
