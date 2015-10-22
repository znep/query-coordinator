describe('storySavingStatus jQuery plugin', function() {
  var $button;
  var storyteller = window.socrata.storyteller;
  var mockStore;

  beforeEach(function() {
    $button = $('<button>');

    function MockStore(forStoryUid) {
      var self = this;
      var _isDirty = false;
      var _isSaveInProgress = false;

      _.extend(this, new storyteller.Store());

      this.mockIsStoryDirty = function(isDirty) {
        _isDirty = isDirty;
        self._emitChange();
      };

      this.mockIsSaveInProgress= function(isSaveInProgress) {
        _isSaveInProgress = isSaveInProgress;
        self._emitChange();
      };

      this.isStoryDirty = function() { return _isDirty; };
      this.isStorySaveInProgress = function() { return _isSaveInProgress; };
      this.isSaveImpossibleDueToConflict = _.constant(false); // TODO test.
    }

    mockStore = new MockStore();
    storyteller.storySaveStatusStore = mockStore;
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $button.storySavingStatus(1); });
    assert.throws(function() { $button.storySavingStatus(''); });
  });

  it('should return a jQuery object for chaining', function() {
    var returnValue = $button.storySavingStatus();
    assert.instanceOf(returnValue, jQuery);
  });


  describe('instance', function() {
    beforeEach(function() {
      $button.storySavingStatus({ savedMessageTimeout: 10 });
    });

    describe('button text', function() {
      it('should mirror the story save state', function() {
        mockStore.mockIsSaveInProgress(false);
        mockStore.mockIsStoryDirty(false);
        assert.equal($button.text(), 'Translation for: editor.story_save_button.saved');

        mockStore.mockIsSaveInProgress(false);
        mockStore.mockIsStoryDirty(true);
        assert.isTrue($button.is(':hidden'));

        mockStore.mockIsSaveInProgress(true);
        mockStore.mockIsStoryDirty(false);
        assert.equal($button.text(), 'Translation for: editor.story_save_button.saving');

        mockStore.mockIsSaveInProgress(true);
        mockStore.mockIsStoryDirty(true);
        assert.equal($button.text(), 'Translation for: editor.story_save_button.saving');
      });

      describe('five seconds after story finishes saving', function() {
        it('should say "save" and stay disabled', function(done) {
          mockStore.mockIsSaveInProgress(true);
          mockStore.mockIsStoryDirty(true);
          assert.equal($button.text(), 'Translation for: editor.story_save_button.saving');

          mockStore.mockIsStoryDirty(false);
          mockStore.mockIsSaveInProgress(false);
          assert.equal($button.text(), 'Translation for: editor.story_save_button.saved');

          setTimeout(function() {
            assert.isTrue($button.is(':hidden'));
            done();
          }, 20);

        });
      });
    });

    describe('button', function() {
      describe('visible state', function() {
        it('should mirror the story save state', function() {
          mockStore.mockIsSaveInProgress(false);
          mockStore.mockIsStoryDirty(false);
          assert.isTrue($button.is(':hidden'));

          mockStore.mockIsSaveInProgress(false);
          mockStore.mockIsStoryDirty(true);
          assert.isTrue($button.is(':hidden'));

          //mockStore.mockIsSaveInProgress(true);
          //mockStore.mockIsStoryDirty(false); // Autosave should be triggered, then...
          //assert.isFalse($button.is(':hidden')); // Text should be visible and read 'Saving...'
          // TODO: Figure out how to make the timing work.

          mockStore.mockIsSaveInProgress(true);
          mockStore.mockIsStoryDirty(true);
          assert.isTrue($button.is(':hidden')); // Waiting for autosave to kick in; hide button.
        });
      });
    });
  });
});
