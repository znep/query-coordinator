describe('SettingsPanel jQuery plugin', function() {
  var node;
  var handle;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    var dom = [
      '<div class="panel">',
        '<div class="settings-panel">',
          '<form>',
            '<input name="title" type="text" />',
            '<textarea></textarea>',
          '</form>',
          '<div class="settings-save-failure-message">',
            '<div class="settings-save-failure-message-details"></div>',
          '</div>',
          '<button class="settings-save-btn"></button>',
        '</div>',
      '</div>'
    ].join('')

    testDom.append(dom);
    testDom.append('<div class="handle">');

    node = testDom.find('.panel');
    handle = testDom.find('.handle');

    storyteller.userStoryUid = standardMocks.validStoryUid;

    // We need to get rid of mocks - they have too much behavior we'd have to mock and override.
    // We'll just provide our own implementations of what we care about.
    standardMocks.remove();

    window.socrata.storyteller.dispatcher = new storyteller.Dispatcher();

    storyteller.storyStore = {
      addChangeListener: _.noop,
      getStoryTitle: _.constant(standardMocks.validStoryTitle),
      getStoryDescription: _.constant(standardMocks.validStoryDescription)
    };

    storyteller.coreSavingStore = {
      addChangeListener: function(listener) {
        storyteller.coreSavingStore.listeners.push(listener)
      },
      triggerChange: function() {
        _.each(this.listeners, function(listener) { listener(); });
      },
      listeners: [],
      isSaveInProgress: _.constant(false),
      lastSaveError: _.constant(null)

    };
  });

  function setSaveAndErrorStates(isSaveInProgress, lastSaveError) {
    storyteller.coreSavingStore.isSaveInProgress = _.constant(isSaveInProgress);
    storyteller.coreSavingStore.lastSaveError = _.constant(lastSaveError);
    storyteller.coreSavingStore.triggerChange();
  }

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { node.settingsPanel(); });
    assert.throws(function() { node.settingsPanel(1); });
    assert.throws(function() { node.settingsPanel(null); });
    assert.throws(function() { node.settingsPanel(undefined); });
    assert.throws(function() { node.settingsPanel({}); });
    assert.throws(function() { node.settingsPanel([]); });
  });

  describe('given a valid toggle handle', function() {
    var returnValue;

    beforeEach(function() {
      returnValue = node.settingsPanel(handle);
    });

    it('should return a jQuery object for chaining', function() {
      assert.isTrue($.fn.isPrototypeOf(returnValue), 'Returned value is not a jQuery collection');
    });

    describe('when opened', function() {
      beforeEach(function() {
        node.find('.settings-panel').trigger('sidebar:open');
      });

      it('should have a grayed-out save button', function() {
        assert.lengthOf(node.find('.settings-save-btn:disabled'), 1);
      });

      describe('story title field', function() {
        var field;
        beforeEach(function() {
          field = node.find('input');
        });

        it('should be prepopulated with the current story title', function() {
          assert.equal(field.val(), standardMocks.validStoryTitle);
        });

        describe('when edited', function() {
          var newTitle;

          beforeEach(function() {
            newTitle = standardMocks.validStoryTitle + 'foobar';
            field.val(newTitle);
            field.trigger('input');
          });
        
          it('should cause the save button to enable', function() {
            assert.lengthOf(node.find('.settings-save-btn:enabled'), 1);

            // Also test that it disables again if I edit back.
            field.val(standardMocks.validStoryTitle);
            field.trigger('input');
            assert.lengthOf(node.find('.settings-save-btn:disabled'), 1);
          });

          describe('then saved', function() {
            var saveButton;

            beforeEach(function() {
              saveButton = node.find('.settings-save-btn');
            });

            it('should cause a STORY_SET_TITLE action, then a STORY_SAVE_METADATA action', function() {
              var actions = [];

              storyteller.dispatcher.register(function(payload) {
                actions.push(payload);
              });
              saveButton.click();

              assert.deepEqual(
                _.pluck(actions, 'action'),
                [ Constants.STORY_SET_TITLE, Constants.STORY_SAVE_METADATA ]
              );

              assert.equal(actions[0].storyUid, standardMocks.validStoryUid);
              assert.equal(actions[0].title, newTitle);

              assert.equal(actions[1].storyUid, standardMocks.validStoryUid);
            });
          });
        });

      });

      describe('story description field', function() {
        var field;
        beforeEach(function() {
          field = node.find('textarea');
        });

        it('should be prepopulated with the current story description', function() {
          assert.equal(field.val(), standardMocks.validStoryDescription);
        });

        describe('when edited', function() {
          var newDescription;

          beforeEach(function() {
            newDescription = standardMocks.validStoryDescription + 'foobar';
            field.val(newDescription);
            field.trigger('input');
          });

          it('should cause the save button to enable', function() {
            assert.lengthOf(node.find('.settings-save-btn:enabled'), 1);

            // Also test that it disables again if I edit back.
            field.val(standardMocks.validStoryDescription);
            field.trigger('input');
            assert.lengthOf(node.find('.settings-save-btn:disabled'), 1);
          });

          describe('then saved', function() {
            var saveButton;

            beforeEach(function() {
              saveButton = node.find('.settings-save-btn');
            });

            it('should cause a STORY_SET_DESCRIPTION action, then a STORY_SAVE_METADATA action', function() {
              var actions = [];

              storyteller.dispatcher.register(function(payload) {
                actions.push(payload);
              });
              saveButton.click();

              assert.deepEqual(
                _.pluck(actions, 'action'),
                [ Constants.STORY_SET_DESCRIPTION, Constants.STORY_SAVE_METADATA ]
              );

              assert.equal(actions[0].storyUid, standardMocks.validStoryUid);
              assert.equal(actions[0].description, newDescription);

              assert.equal(actions[1].storyUid, standardMocks.validStoryUid);
            });
          });
        });

      });

      describe('save button', function() {
        var saveButton;

        beforeEach(function() {
          saveButton = node.find('.settings-save-btn');
        });

        describe('when there is no save in progress', function() {
          it('should not have a `busy` class.', function() {
            setSaveAndErrorStates(false, null);
            assert.isFalse(saveButton.hasClass('busy'));

            setSaveAndErrorStates(false, 'some error');
            assert.isFalse(saveButton.hasClass('busy'));
          });
        });

        describe('when a save is in progress', function() {
          it('should have a `busy` class.', function() {
            setSaveAndErrorStates(true, null);
            assert.isTrue(saveButton.hasClass('busy'));

            setSaveAndErrorStates(true, 'some error');
            assert.isTrue(saveButton.hasClass('busy'));
          });
        });
      });

      describe('error explanation text', function() {
        var errorDiv;
        var errorDetails;

        beforeEach(function() {
          errorDiv = node.find('.settings-save-failure-message');
          errorDetails = node.find('.settings-save-failure-message-details');
        });

        describe('when there is no error', function() {
          it('should not have the `active` class.', function() {
            setSaveAndErrorStates(false, null);
            assert.isFalse(errorDiv.hasClass('active'));
          });
        });

        describe('when there is an error', function() {
          var error = 'lp0 on fire!';

          beforeEach(function() {
            setSaveAndErrorStates(false, error);
          });

          it('should have the `active` class.', function() {
            assert.isTrue(errorDiv.hasClass('active'));
          });

          it('should put the error text on the page', function() {
            assert.equal(errorDetails.text(), error);
          });
        });

      });
    });

  });
});
