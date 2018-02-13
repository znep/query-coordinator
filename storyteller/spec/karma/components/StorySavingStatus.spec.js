import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import I18nMocker from '../I18nMocker';
import Store from 'editor/stores/Store';
import {__RewireAPI__ as StorySavingStatusAPI} from 'editor/components/StorySavingStatus';

describe('storySavingStatus jQuery plugin', function() {

  var $button;
  var mockStore;

  beforeEach(function() {
    $button = $('<button>');

    function MockStore() {
      var self = this;
      var _isDirty = false;
      var _isSaveInProgress = false;

      _.extend(this, new Store());

      this.mockIsStoryDirty = function(isDirty) {
        _isDirty = isDirty;
        self._emitChange();
      };

      this.mockIsSaveInProgress = function(isSaveInProgress) {
        _isSaveInProgress = isSaveInProgress;
        self._emitChange();
      };

      this.isStoryDirty = function() { return _isDirty; };
      this.isStorySaveInProgress = function() { return _isSaveInProgress; };
      this.isSaveImpossibleDueToConflict = _.constant(false); // TODO test.
    }

    mockStore = new MockStore();
    StorySavingStatusAPI.__Rewire__('storySaveStatusStore', mockStore);
    StorySavingStatusAPI.__Rewire__('I18n', I18nMocker);
    StorySavingStatusAPI.__Rewire__('storyStore', {
      doesStoryExist: _.constant(true)
    });
  });

  afterEach(function() {
    StorySavingStatusAPI.__ResetDependency__('storySaveStatusStore');
    StorySavingStatusAPI.__ResetDependency__('I18n');
    StorySavingStatusAPI.__ResetDependency__('storyStore');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $button.storySavingStatus(1); });
    assert.throws(function() { $button.storySavingStatus(''); });
  });

  it('should return a jQuery object for chaining', function() {
    var returnValue = $button.storySavingStatus();
    assert.instanceOf(returnValue, $);
  });


  describe('instance', function() {
    beforeEach(function() {
      $button.storySavingStatus({ savedMessageTimeout: 10, statusDebounceTimeout: 10 });
    });

    describe('button text', function() {
      function verify(saving, dirty, expectedButtonText, callback) {
        mockStore.mockIsSaveInProgress(saving);
        mockStore.mockIsStoryDirty(dirty);
        setTimeout(function() {
          assert.equal($button.text(), expectedButtonText);
          callback();
        }, 20);
      }

      it('not saving, clean', function(done) {
        verify(false, false, '', done); // empty
      });
      it('saving, clean', function(done) {
        verify(true, false, 'Translation for: editor.story_save_button.saving', done);
      });
      it('saving, dirty', function(done) {
        verify(true, true, 'Translation for: editor.story_save_button.saving', done);
      });
      it('not saving, dirty', function(done) {
        verify(false, true, '', done); // empty
      });

      describe('five seconds after story finishes saving', function() {
        it('should say "saved" and stay disabled', function(done) {
          mockStore.mockIsSaveInProgress(true);
          mockStore.mockIsStoryDirty(true);
          setTimeout(function() {
            assert.equal($button.text(), 'Translation for: editor.story_save_button.saving');

            mockStore.mockIsStoryDirty(false);
            mockStore.mockIsSaveInProgress(false);
            setTimeout(function() {
              assert.equal($button.text(), 'Translation for: editor.story_save_button.saved');

              setTimeout(function() {
                assert.isTrue($button.is(':hidden'));
                done();
              }, 50);
            }, 50);
          }, 50);

        });
      });
    });

    describe('button', function() {
      describe('visible state', function() {
        function verify(saving, dirty, expectedHidden, callback) {
          mockStore.mockIsSaveInProgress(saving);
          mockStore.mockIsStoryDirty(dirty);
          setTimeout(function() {
            assert.equal(expectedHidden, $button.is(':hidden'));
            callback();
          }, 20);
        }

        it('not saving, clean', function(done) {
          verify(false, false, true, done);
        });
        it('not saving, dirty', function(done) {
          verify(false, true, true, done);
        });
        it('saving, dirty', function(done) {
          verify(true, true, true, done);
        });
      });
    });
  });
});
