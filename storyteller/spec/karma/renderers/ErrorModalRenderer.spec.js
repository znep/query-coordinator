import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import Store, {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import ErrorModalRenderer, {__RewireAPI__ as ErrorModalRendererAPI} from 'editor/renderers/ErrorModalRenderer';
import I18nMocker from '../I18nMocker';

describe('ErrorModalRenderer', function() {

  var $body;
  var $modal;
  var dispatcher;
  var userSessionStore;
  var storySaveStatusStore;

  var hasValidSession = true;
  var isSaveImpossibleDueToConflict = false;
  var userCausingConflict = {};

  beforeEach(function() {
    $body = $('body');
    $modal = $('<div>', { id: 'error-modal-container' }).
      append([
        $('<div>', { 'class': 'error-warning-message' }),
        $('<button>', { 'class': 'btn-login' })
      ]);
    $body.append($modal);

    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);
    ErrorModalRendererAPI.__Rewire__('dispatcher', dispatcher);

    var StorySaveStatusStoreMock = function() {
      _.extend(this, new Store());

      this.isSaveImpossibleDueToConflict = function() { return isSaveImpossibleDueToConflict; };
      this.userCausingConflict = function() { return userCausingConflict; };
    };

    var UserSessionStoreMock = function() {
      _.extend(this, new Store());

      this.hasValidSession = function() { return hasValidSession; };
    };

    storySaveStatusStore = new StorySaveStatusStoreMock();
    userSessionStore = new UserSessionStoreMock();

    ErrorModalRendererAPI.__Rewire__('storySaveStatusStore', storySaveStatusStore);
    ErrorModalRendererAPI.__Rewire__('userSessionStore', userSessionStore);
    ErrorModalRendererAPI.__Rewire__('I18n', {
      t: function(key) {
        if (key === 'editor.user_session_timeout') {
          return '<a></a>';
        } else {
          return I18nMocker.t(key);
        }
      }
    });

    sinon.stub($.fn, 'modal');

    new ErrorModalRenderer(); //eslint-disable-line no-new
  });

  afterEach(function() {
    $.fn.modal.restore();
    $modal.remove();

    ErrorModalRendererAPI.__ResetDependency__('storySaveStatusStore');
    ErrorModalRendererAPI.__ResetDependency__('userSessionStore');
    StoreAPI.__ResetDependency__('dispatcher');
    ErrorModalRendererAPI.__ResetDependency__('dispatcher');
  });

  describe('on expired session', function() {
    function causeSessionExpiry() {
      hasValidSession = false;
      userSessionStore._emitChange();
    }

    function reestablishSession() {
      hasValidSession = true;
      userSessionStore._emitChange();
    }

    it('should open', function(done) {
      $modal.on('modal-open', function() {
        done();
      });

      causeSessionExpiry();
    });

    it('should not re-open if dismissed.', function() {
      causeSessionExpiry();
      $modal.on('modal-open', function() {
        throw new Error('should not get here');
      });
      causeSessionExpiry();
    });

    it('should close if the session is re-established', function(done) {
      causeSessionExpiry();
      $modal.on('modal-close', function() {
        done();
      });
      reestablishSession();
    });

    it('should include a login button that dispatches LOGIN_BUTTON_CLICK', function(done) {
      causeSessionExpiry();

      dispatcher.register(function(action) {
        if (action.action === Actions.LOGIN_BUTTON_CLICK) {
          done();
        }
      });

      $modal.find('.btn-login').click();
    });
  });

  describe('on conflict', function() {
    function causeConflict() {
      isSaveImpossibleDueToConflict = true;
      storySaveStatusStore._emitChange();
    }

    function populateUserDetails() {
      userCausingConflict = {
        id: 'evil-user',
        displayName: 'Evil User'
      };

      storySaveStatusStore._emitChange();
    }

    it('should open', function(done) {
      $modal.on('modal-open', function() {
        done();
      });

      causeConflict();
    });

    it('should not re-open if dismissed.', function() {
      causeConflict();
      $modal.on('modal-open', function() {
        throw new Error('should not get here');
      });
      causeConflict();
    });

    it('should include a link to the conflicting user profile', function() {
      var $link;
      causeConflict();
      populateUserDetails();
      $link = $modal.find('a');
      assert.lengthOf($link, 1); // Test sanity, did you change the DOM structure?
      assert.include($link.text(), 'Evil User');
      assert.equal($link.attr('href'), '/profile/evil-user');
    });
  });
});
