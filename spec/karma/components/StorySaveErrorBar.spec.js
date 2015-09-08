describe('storySaveErrorBar jQuery plugin', function() {
  var $errorBar;
  var storyteller = window.socrata.storyteller;
  var mockStore;

  beforeEach(function() {
    $errorBar = $('<div>');

    function MockStore(forStoryUid) {
      var self = this;
      var _isSaveInProgress = false;
      var _lastSaveError = null;

      _.extend(this, new storyteller.Store());

      this.mockIsSaveInProgress= function(isSaveInProgress) {
        _isSaveInProgress = isSaveInProgress;
        self._emitChange();
      };

      this.mockLastError= function(error) {
        _lastSaveError = error;
        self._emitChange();
      };

      this.isStorySaveInProgress = function() { return _isSaveInProgress; };
      this.lastSaveError = function() { return _lastSaveError; };
    }

    mockStore = new MockStore();
    storyteller.storySaveStatusStore = mockStore;
  });

  it('should return a jQuery object for chaining', function() {
    var returnValue = $errorBar.storySaveErrorBar();
    assert.instanceOf(returnValue, jQuery);
  });


  describe('instance', function() {
    beforeEach(function() {
      $errorBar.storySaveErrorBar();
    });

    describe('with no error', function() {
      it('should be invisible', function() {
        mockStore.mockLastError(null);
        mockStore.mockIsSaveInProgress(true);
        assert.isFalse($errorBar.hasClass('visible'));

        mockStore.mockIsSaveInProgress(false);
        assert.isFalse($errorBar.hasClass('visible'));
      });

      it('should not place the story-save-error class on body', function() {
        assert.isFalse($(document.body).hasClass('story-save-error'));
      });
    });

    describe('with a non-conflict error', function() {
      beforeEach(function() {
        mockStore.mockLastError({ conflict: false });
      });

      it('should place the story-save-error class on body', function() {
        assert.isTrue($(document.body).hasClass('story-save-error'));
      });

      it('bar should be visible', function() {
        mockStore.mockIsSaveInProgress(true);
        assert.isTrue($errorBar.hasClass('visible'));

        mockStore.mockIsSaveInProgress(false);
        assert.isTrue($errorBar.hasClass('visible'));
      });

      describe('try again button', function() {
        it('should call StoryDraftCreator.saveDraft when clicked', function() {
          var stub = sinon.stub(storyteller.StoryDraftCreator, 'saveDraft', _.noop);
          $errorBar.find('button').click();
          sinon.assert.calledWithExactly(stub, standardMocks.validStoryUid);
          stub.restore();
        });

        it('try again button should be visible only when save is not in progress', function() {
          mockStore.mockIsSaveInProgress(true);
          assert.equal($errorBar.find('button').css('display'), 'none');

          mockStore.mockIsSaveInProgress(false);
          assert.equal($errorBar.find('button').css('display'), 'inline-block');
        });
      });

      it('should place the correct text in the message', function() {
        assert.equal($errorBar.find('span:not(.container)').text(), 'Translation for: editor.story_save_error_generic');
      });
    });

    describe('with a conflict error', function() {
      beforeEach(function() {
        mockStore.mockLastError({ conflict: true });
      });

      it('should place the story-save-error class on body', function() {
        assert.isTrue($(document.body).hasClass('story-save-error'));
      });

      it('bar should be visible', function() {
        mockStore.mockIsSaveInProgress(true);
        assert.isTrue($errorBar.hasClass('visible'));

        mockStore.mockIsSaveInProgress(false);
        assert.isTrue($errorBar.hasClass('visible'));
      });

      it('try again button should be hidden', function() {
        mockStore.mockIsSaveInProgress(true);
        assert.equal($errorBar.find('button').css('display'), 'none');

        mockStore.mockIsSaveInProgress(false);
        assert.equal($errorBar.find('button').css('display'), 'none');
      });

      it('should place the correct text in the message', function() {
        assert.equal($errorBar.find('span:not(.container)').text(), 'Translation for: editor.story_save_error_conflict');
      });
    });
  });
});
