import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import I18nMocker from '../I18nMocker';
import Store from 'editor/stores/Store';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StorySaveErrorBarAPI} from 'editor/components/StorySaveErrorBar';

describe('storySaveErrorBar jQuery plugin', function() {

  var $errorBar;
  var mockStore;
  var userSessionStoreMock;
  var autosave;
  var dispatcher;
  var environment;

  beforeEach(function() {
    $(document.body).attr('class', '');
    $errorBar = $('<div>');

    function MockStore() {
      var self = this;
      var _isSaveInProgress = false;
      var _lastSaveError = null;

      _.extend(this, new Store());

      this.mockIsSaveInProgress = function(isSaveInProgress) {
        _isSaveInProgress = isSaveInProgress;
        self._emitChange();
      };

      this.mockLastError = function(error) {
        _lastSaveError = error;
        self._emitChange();
      };

      this.isStorySaveInProgress = function() { return _isSaveInProgress; };
      this.lastSaveError = function() { return _lastSaveError; };
      this.hasValidSession = _.constant(true);
    }

    mockStore = new MockStore();
    userSessionStoreMock = new MockStore();
    autosave = {saveASAP: sinon.stub()};
    dispatcher = new Dispatcher();
    environment = {
      IS_GOAL: false
    };

    StorySaveErrorBarAPI.__Rewire__('userSessionStore', userSessionStoreMock);
    StorySaveErrorBarAPI.__Rewire__('storySaveStatusStore', mockStore);
    StorySaveErrorBarAPI.__Rewire__('Environment', environment);
    StorySaveErrorBarAPI.__Rewire__('autosave', autosave);
    StorySaveErrorBarAPI.__Rewire__('I18n', I18nMocker);
    StorySaveErrorBarAPI.__Rewire__('dispatcher', dispatcher);
  });

  afterEach(function() {
    StorySaveErrorBarAPI.__ResetDependency__('userSessionStore');
    StorySaveErrorBarAPI.__ResetDependency__('storySaveStatusStore');
    StorySaveErrorBarAPI.__ResetDependency__('Environment');
    StorySaveErrorBarAPI.__ResetDependency__('autosave');
    StorySaveErrorBarAPI.__ResetDependency__('I18n');
    StorySaveErrorBarAPI.__ResetDependency__('dispatcher');
  });

  it('should return a jQuery object for chaining', function() {
    var returnValue = $errorBar.storySaveErrorBar();
    assert.instanceOf(returnValue, $);
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

      it('should place the correct text in the message', function() {
        assert.include($errorBar.find('.message').text(), 'Translation for: editor.story_save_error_generic');
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

      it('should place the correct text in the message', function() {
        assert.include($errorBar.find('.message').text(), 'Translation for: editor.story_save_error_conflict');
      });
    });

    describe('with an invalid session', function() {
      beforeEach(function() {
        userSessionStoreMock.hasValidSession = _.constant(false);
        userSessionStoreMock._emitChange();
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

      it('should place the correct text in the message', function() {
        assert.include($errorBar.find('.message').text(), 'Translation for: editor.user_session_timeout');
      });

      describe('login button', function() {
        it('should have a link to log back in', function() {
          assert.lengthOf($errorBar.find('.login-link'), 1);
        });

        it('should emit a LOGIN_BUTTON_CLICK event when clicked', function(done) {
          dispatcher.register(function(action) {
            if (action.action === Actions.LOGIN_BUTTON_CLICK) {
              done();
            }
          });

          $errorBar.find('.login-link').click();
        });
      });
    });
  });
});
