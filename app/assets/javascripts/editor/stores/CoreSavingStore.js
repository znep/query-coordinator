import _ from 'lodash';

import I18n from '../I18n';
import Store from './Store';
import Actions from '../Actions';
import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import httpRequest from '../../services/httpRequest';
import { exceptionNotifier } from '../../services/ExceptionNotifier';
import { storyStore } from './StoryStore';

export var coreSavingStore = new CoreSavingStore();
export default function CoreSavingStore() {
  _.extend(this, new Store());

  var self = this;

  var _isSaveInProgress = false;
  var _lastSaveErrorsByUid = {};

  // Queue of story metadata to save. Why bother with this?
  // Say we have an inflight save request, and we receive another STORY_SAVE_METADATA
  // action. What do we do?
  //
  // Option A: Do nothing.
  // Option B: Cancel the existing request and issue a new request.
  // Option C: Process the new save once the original save completes.
  //
  // `A` can result in data silently not being saved at all, which is not ideal.
  // `B` can result in data getting overwritten with old versions. Consider what happens
  // in this scenario:
  //  - Request 1 successfully sends data to core, but core stalls. The connection remains open.
  //  - While core is stalling, request 2 comes in with new data. Request 1 is canceled. Request
  //    2 then completes quickly.
  //  - A few seconds later, core un-stalls and finishes processing request 1, overwriting the
  //    data from request 2.
  //
  //  Thus, to have a better chance of success, we should wait for request 1 to complete before
  //  dealing with request 2. This is option `C`, which is implemented.
  //
  //  As soon as STORY_SAVE_METADATA comes in, we immediately take a snapshot of the metadata
  //  to save, and put that snapshot on the queue. To prevent saving the wrong data in case of
  //  future changes to StoryStore, the snapshot must be taken at the time STORY_SAVE_METADATA
  //  is dispatched, not upon dequeue.
  //  Queue items look like this:
  //  {
  //    storyUid: <4x4>,
  //    storyTitle: <string>,
  //    storyDescription: <string>
  //  }
  var _storyMetadataPendingSave = [];

  this.register(function(payload) {
    var action = payload.action;

    switch (action) {

      case Actions.STORY_SAVE_METADATA:
        StorytellerUtils.assertHasProperty(payload, 'storyUid');
        _saveStoryMetadata(payload.storyUid);
        break;
    }
  });

  /**
   * Public methods
   */

  /**
   * Returns true if any core saving request is outstanding, false otherwise.
   *
   * Note: Tracking this by-story is not trivial and is not needed today. Unless
   * you're reading this, in which case it likely is needed today. Sorry.
   *
   * @return {boolean}
   */
  this.isSaveInProgress = function() {
    return _isSaveInProgress;
  };

  /**
   * Obtain the error encountered while saving the
   * given story, or null if the last save succeeded.
   *
   * @return {string | null}
   */
  this.lastRequestSaveErrorForStory = function(storyUid) {
    return _lastSaveErrorsByUid[storyUid] || null;
  };

  /**
   * Private methods
   */

  function _setSaveInProgress(isInProgress) {
    if (_isSaveInProgress !== isInProgress) {
      _isSaveInProgress = isInProgress;
      self._emitChange();
    }
  }

  function _setLastSaveError(storyUid, error) {
    var lastError = _lastSaveErrorsByUid[storyUid];

    if (lastError !== error) {
      if (error) {
        _lastSaveErrorsByUid[storyUid] = error;
      } else {
        delete _lastSaveErrorsByUid[storyUid];
      }
      self._emitChange();
    }
  }

  function _saveStoryMetadata(storyUid) {
    var metadata = {
      storyUid: storyUid,
      storyTitle: storyStore.getStoryTitle(storyUid),
      storyDescription: storyStore.getStoryDescription(storyUid),
      storyTileConfig: {
        title: storyStore.getStoryTileTitle(storyUid),
        description: storyStore.getStoryTileDescription(storyUid)
      }
    };

    var error = _findMetadataError(metadata);
    if (error) {
      _setLastSaveError(storyUid, error);
    } else {
      _storyMetadataPendingSave.push(metadata);
      _makeRequests();
    }
  }

  /**
   * Verifies that the given saved metadata snapshot (from _saveStoryMetadata)
   * is OK to save. If problems are found, an error string is returned.
   * Otherwise, null is returned.
   *
   * @return {string | null}
   */
  function _findMetadataError(metadata) {
    if (metadata.storyTitle.length >= Constants.CORE_VIEW_NAME_MAX_LENGTH) {
      return I18n.t('editor.settings_panel.displaying_section.errors.title_too_long');
    } else {
      return null;
    }
  }

  /**
   * Makes a read/modify/write on all queued story save requests (sequentially).
   */
  function _makeRequests() {
    var metadataToSave;

    if (_.isEmpty(_storyMetadataPendingSave)) {
      _setSaveInProgress(false);
      return;
    }

    _setSaveInProgress(true);

    metadataToSave = _storyMetadataPendingSave.shift();

    _putViewMetadataToCore(metadataToSave).
      then(function() {
        _setLastSaveError(metadataToSave.storyUid, null);
      }).
      catch(function(error) {
        _setLastSaveError(
          metadataToSave.storyUid,
          error.message
        );
      }).
      then(_makeRequests, _makeRequests); // Process the next request if needed.
  }

  /**
   * Returns a promise for PUTing the provided core view metadata blob.
   *
   * Requires an initial GET in order to avoid clobbering the `metadata` field
   * (since core doesn't handle diffing sub-objects).
   *
   * @param metadata {object} The core view metadata fields to PUT.
   * @return {promise<object>} The response from the server.
   */
  function _putViewMetadataToCore(metadata) {
    StorytellerUtils.assertHasProperties(
      metadata,
      'storyUid',
      'storyTitle',
      'storyDescription',
      'storyTileConfig'
    );

    var url = StorytellerUtils.format('/api/views/{0}.json', metadata.storyUid);

    return httpRequest(
      'GET',
      url,
      {
        headers: _coreRequestHeaders()
      }
    ).then(function(response) {

      var payload = {
        name: metadata.storyTitle,
        description: metadata.storyDescription,
        metadata: _.extend(
          response.metadata || {},
          { tileConfig: metadata.storyTileConfig }
        )
      };

      return httpRequest(
        'PUT',
        url,
        {
          data: JSON.stringify(payload),
          headers: _coreRequestHeaders()
        }
      );
    });
  }

  function _coreRequestHeaders() {
    var headers = {};

    if (_.isEmpty(Environment.CORE_SERVICE_APP_TOKEN)) {
      exceptionNotifier.notify(new Error(
        '`Environment.CORE_SERVICE_APP_TOKEN` not configured.'
      ));
    }

    headers['X-App-Token'] = Environment.CORE_SERVICE_APP_TOKEN;
    headers['X-CSRF-Token'] = decodeURIComponent(
      StorytellerUtils.getCookie('socrata-csrf-token')
    );

    return headers;
  }
}
