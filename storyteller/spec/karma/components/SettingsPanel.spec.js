import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import { $transient } from '../TransientElement';
import StandardMocks from '../StandardMocks';
import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as SettingsPanelAPI} from 'editor/components/SettingsPanel';

describe('SettingsPanel jQuery plugin', function() {

  var node;
  var handle;
  var dispatcher;
  var coreSavingStore;

  beforeEach(function() {
    /* eslint-disable indent */
    var dom = [
      '<div class="panel">',
        '<div class="settings-panel">',
          '<form>',
            '<input name="title" type="text" />',
            '<textarea></textarea>',
          '</form>',
          '<div class="settings-save-failure-message"></div>',
          '<button class="settings-save-btn"></button>',
          '<section class="settings-panel-publishing"></section>',
        '</div>',
      '</div>'
    ].join('');
    /* eslint-enable indent */

    $transient.append(dom);
    $transient.append('<div class="handle">');

    node = $transient.find('.panel');
    handle = $transient.find('.handle');

    dispatcher = new Dispatcher();

    coreSavingStore = {
      addChangeListener: function(listener) {
        coreSavingStore.listeners.push(listener);
      },
      triggerChange: function() {
        _.each(coreSavingStore.listeners, function(listener) { listener(); });
      },
      listeners: [],
      isSaveInProgress: _.constant(false),
      lastRequestSaveErrorForStory: _.constant(null)
    };

    SettingsPanelAPI.__Rewire__('dispatcher', dispatcher);
    SettingsPanelAPI.__Rewire__('StoryPermissionsRenderer', _.noop);

    SettingsPanelAPI.__Rewire__('Environment', {
      STORY_UID: StandardMocks.validStoryUid
    });

    SettingsPanelAPI.__Rewire__('storyStore', {
      addChangeListener: _.noop,
      getStoryTitle: _.constant('Title'),
      getStoryDescription: _.constant('Description'),
      getStoryPermissions: _.constant({ isPublic: true }),
      getStoryPublishedStory: _.constant({}),
      getStoryDigest: _.constant('')
    });

    SettingsPanelAPI.__Rewire__('coreSavingStore', coreSavingStore);
  });

  afterEach(function() {
    SettingsPanelAPI.__ResetDependency__('dispatcher');
    SettingsPanelAPI.__ResetDependency__('StoryPermissionsRenderer');
    SettingsPanelAPI.__ResetDependency__('Environment');
    SettingsPanelAPI.__ResetDependency__('storyStore');
    SettingsPanelAPI.__ResetDependency__('coreSavingStore');
  });

  function setIsSavingAndLastError(isSaveInProgress, lastSaveError) {
    coreSavingStore.isSaveInProgress = _.constant(isSaveInProgress);
    coreSavingStore.lastRequestSaveErrorForStory = _.constant(lastSaveError);
    coreSavingStore.triggerChange();
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
      assert.instanceOf(returnValue, $);
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
          assert.equal(field.val(), 'Title');
        });

        describe('when edited', function() {
          var newTitle;

          beforeEach(function() {
            newTitle = 'foobar';
            field.val(newTitle);
            field.trigger('input');
          });

          describe('with an empty string', function() {
            it('should leave the save button disabled', function() {
              field.val('');
              field.trigger('input');

              assert.lengthOf(node.find('.settings-save-btn:enabled'), 0);
            });
          });

          it('should cause the save button to enable', function() {
            assert.lengthOf(node.find('.settings-save-btn:enabled'), 1);

            // Also test that it disables again if I edit back.
            field.val('Title');
            field.trigger('input');
            assert.lengthOf(node.find('.settings-save-btn:disabled'), 1);
          });

          describe('then saved', function() {
            describe('by hitting enter', function() {
              it('should case a STORY_SET_TITLE action, then a STORY_SAVE_METADATA action', function() {
                var actions = [];

                dispatcher.register(function(payload) {
                  actions.push(payload);
                });

                field.parent('form').submit();

                assert.deepEqual(
                  _.map(actions, 'action'),
                  [ Actions.STORY_SET_TITLE, Actions.STORY_SAVE_METADATA ]
                );

                assert.equal(actions[0].storyUid, StandardMocks.validStoryUid);
                assert.equal(actions[0].title, newTitle);

                assert.equal(actions[1].storyUid, StandardMocks.validStoryUid);
              });
            });

            describe('by click the save button', function() {
              var saveButton;

              beforeEach(function() {
                saveButton = node.find('.settings-save-btn');
              });

              it('should cause a STORY_SET_TITLE action, then a STORY_SAVE_METADATA action', function() {
                var actions = [];

                dispatcher.register(function(payload) {
                  actions.push(payload);
                });
                saveButton.click();

                assert.deepEqual(
                  _.map(actions, 'action'),
                  [ Actions.STORY_SET_TITLE, Actions.STORY_SAVE_METADATA ]
                );

                assert.equal(actions[0].storyUid, StandardMocks.validStoryUid);
                assert.equal(actions[0].title, newTitle);

                assert.equal(actions[1].storyUid, StandardMocks.validStoryUid);
              });
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
          assert.equal(field.val(), 'Description');
        });

        describe('when edited', function() {
          var newDescription;

          beforeEach(function() {
            newDescription = 'foobar';
            field.val(newDescription);
            field.trigger('input');
          });

          it('should cause the save button to enable', function() {
            assert.lengthOf(node.find('.settings-save-btn:enabled'), 1);

            // Also test that it disables again if I edit back.
            field.val('Description');
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

              dispatcher.register(function(payload) {
                actions.push(payload);
              });
              saveButton.click();

              assert.deepEqual(
                _.map(actions, 'action'),
                [ Actions.STORY_SET_DESCRIPTION, Actions.STORY_SAVE_METADATA ]
              );

              assert.equal(actions[0].storyUid, StandardMocks.validStoryUid);
              assert.equal(actions[0].description, newDescription);

              assert.equal(actions[1].storyUid, StandardMocks.validStoryUid);
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
          describe('and there is no error', function() {
            it('should not have a `busy` class.', function() {
              setIsSavingAndLastError(false, null);
              assert.isFalse(saveButton.hasClass('busy'));
            });

            it('should not be enabled', function() {
              setIsSavingAndLastError(false, null);
              assert.isTrue(saveButton.prop('disabled'));
            });
          });

          describe('and there is an error', function() {
            it('should not have a `busy` class.', function() {
              setIsSavingAndLastError(false, 'some error');
              assert.isFalse(saveButton.hasClass('busy'));
            });

            it('should be enabled', function() {
              setIsSavingAndLastError(false, 'some error');
              assert.isFalse(saveButton.prop('disabled'));
            });
          });
        });

        describe('when a save is in progress', function() {
          beforeEach(function() {
            setIsSavingAndLastError(true, null);
          });

          it('should have a `busy` class.', function() {
            assert.isTrue(saveButton.hasClass('busy'));

            setIsSavingAndLastError(true, 'some error'); // Also check in error state.
            assert.isTrue(saveButton.hasClass('busy'));
          });

          describe('that then completes successfully', function() {
            it('should close the sidebar', function(done) {
              node.on('sidebar:close', function() {
                done();
              });
              setIsSavingAndLastError(false, null);
            });
          });

          describe('that then fails', function() {
            it('should not close the sidebar', function(done) {
              node.on('sidebar:close', function() {
                throw new Error('should not close sidebar');
              });

              setIsSavingAndLastError(false, 'some error');
              setTimeout(done, 10);
            });

            describe('then the sidebar is closed by the user', function() {
              it('should revert the title and description', function() {
                var titleField = node.find('input');
                var descriptionTextarea = node.find('textarea');

                var actions = [];

                titleField.val('fooooo');
                titleField.trigger('foo');
                descriptionTextarea.val('bar');
                descriptionTextarea.trigger('input');

                dispatcher.register(function(payload) {
                  actions.push(payload);
                });

                setIsSavingAndLastError(false, 'some error');
                node.find('.settings-panel').trigger('sidebar:close');

                assert.deepEqual(
                  _.map(actions, 'action'),
                  [ Actions.STORY_SET_TITLE, Actions.STORY_SET_DESCRIPTION ]
                );

                assert.equal(actions[0].storyUid, StandardMocks.validStoryUid);
                assert.equal(actions[0].title, 'Title');

                assert.equal(actions[1].storyUid, StandardMocks.validStoryUid);
                assert.equal(actions[1].description, 'Description');
              });
            });
          });
        });
      });

      describe('error explanation text', function() {
        var errorDiv;

        beforeEach(function() {
          errorDiv = node.find('.settings-save-failure-message');
        });

        describe('when there is no error', function() {
          it('should not have the `active` class.', function() {
            setIsSavingAndLastError(false, null);
            assert.isFalse(errorDiv.hasClass('active'));
          });
        });

        describe('when there is an error', function() {
          var error = 'lp0 on fire!';

          beforeEach(function() {
            setIsSavingAndLastError(false, error);
          });

          it('should have the `active` class.', function() {
            assert.isTrue(errorDiv.hasClass('active'));
          });
        });
      });
    });
  });
});
