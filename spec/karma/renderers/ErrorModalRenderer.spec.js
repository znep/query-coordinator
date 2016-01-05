describe('ErrorModalRenderer', function() {
  'use strict';

  var $body;
  var $modal;
  var renderer;
  var storyteller = window.socrata.storyteller;
  var lastModalOptions;

  beforeEach(function() {
    $body = $('body');
    $modal = $('<div>', { id: 'error-modal-container' }).
      append($('<div>', { 'class': 'error-warning-message' }));
    $body.append($modal);

    sinon.stub($.fn, 'modal', function(options) {
      lastModalOptions = options;
    });

    renderer = new storyteller.ErrorModalRenderer();
  });

  afterEach(function() {
    $.fn.modal.restore();
    $modal.remove();
  });

  describe('on expired session', function() {
    function causeSessionExpiry() {
      storyteller.userSessionStore.hasValidSession = _.constant(false);
      storyteller.userSessionStore._emitChange();
    }

    function reestablishSession() {
      storyteller.userSessionStore.hasValidSession = _.constant(true);
      storyteller.userSessionStore._emitChange();
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

    it('should include a login link'); // TODO this functionality is not implemented yet.
  });

  describe('on conflict', function() {
    function causeConflict() {
      storyteller.storySaveStatusStore.isSaveImpossibleDueToConflict = _.constant(true);
      storyteller.storySaveStatusStore._emitChange();
    }

    function populateUserDetails() {
      storyteller.storySaveStatusStore.userCausingConflict = _.constant({
        id: 'evil-user',
        displayName: 'Evil User'
      });
      storyteller.storySaveStatusStore._emitChange();
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
