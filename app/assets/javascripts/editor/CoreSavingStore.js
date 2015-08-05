;window.socrata.storyteller.CoreSavingStore = (function(socrata) {

  'use strict';

  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function CoreSavingStore() {
    _.extend(this, new storyteller.Store());

    var self = this;

    var _isBusy = false;
    var _lastSaveError = null;

    // Queue of stories to save. Why bother with this, since there is only one story?
    // Because it is simple and gives us predictable behavior in the case of adversity
    // (slow networks causing user to retry in the middle of a request, etc). Canceling
    // inflight requests is flaky.
    var _storyUidsPendingSave = [];

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Constants.STORY_SAVE_METADATA:
          utils.assertHasProperty(payload, 'storyUid');
          _saveStoryMetadata(payload.storyUid);
          break;
      }
    });

    /**
     * Public methods
     */

    this.isSaveInProgress = function() {
      return _isBusy;
    };

    this.lastSaveError = function() {
      return _lastSaveError;
    };

    /**
     * Private methods
     */

    function _setBusy(busy) {
      if (_isBusy !== busy) {
        _isBusy = busy;
        self._emitChange();
      }
    }

    function _setLastSaveError(error) {
      if (_lastSaveError !== error) {
        _lastSaveError = error;
        self._emitChange();
      }
    }

    function _saveStoryMetadata(storyUid) {
      _storyUidsPendingSave.push(storyUid);
      _makeRequest();
    }

    /**
     * Makes a read/modify/write on all queued story save requests (sequentially).
     */
    function _makeRequest() {
      if (_.isEmpty(_storyUidsPendingSave)) {
        _setBusy(false);
        return;
      }

      _setBusy(true);

      _getViewMetadataFromCore(_storyUidsPendingSave.pop()).
        then(function(response) {
          // Now that we have the current view metadata,
          // update it and PUT it back.
          return _putViewMetadataToCore(
            _updateCoreMetadataBlob(response)
          );
        }).
        done(function() {
          // Done? Yay, clear errors.
          _setLastSaveError(null);
        }).
        fail(function(failure) {
          // Ouch, save the error for later use.
          _setLastSaveError(_.get(failure, 'responseJSON.message', failure.statusText));
        }).
        always(_makeRequest); // Process the next request if needed.
    }

    /**
     * Update a view metadata blob from core with metadata
     * information from StoryStore
     *
     * @param blob {object} A core view metadata blob.
     * @return {object} An updated version of the blob.
     */
    function _updateCoreMetadataBlob(blob) {
      utils.assertHasProperty(blob, 'id');

      return _.extend(
        {},
        blob,
        {
          name: storyteller.storyStore.getStoryTitle(blob.id)
        }
      );
    }

    /**
     * Returns a promise for a story's view metadata from core
     *
     * @param storyUid {string} The story's uid.
     * @return {promise<object>}
     */
    function _getViewMetadataFromCore(storyUid) {
      return $.get('/views/{0}.json'.format(storyUid));
    }

    /**
     * Returns a promise for PUTing the provided core view
     * metadata blob back to the servers.
     *
     * @param newData {object} The core view metadata blob to PUT.
     * @return {promise<object>} The response from the server.
     */
    function _putViewMetadataToCore(newData) {
      utils.assertHasProperty(newData, 'id');

      return $.ajax({
        type: 'PUT',
        contentType: 'json',
        dataType: 'json',
        url: '/views/{0}.json'.format(newData.id),
        data: JSON.stringify(newData)
      });
    }
  }

  return CoreSavingStore;
})(window.socrata);

