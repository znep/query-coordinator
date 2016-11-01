import $ from 'jquery';
import _ from 'lodash';

import Actions from './Actions';
import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';
import { storyStore } from './stores/StoryStore';
import { dispatcher } from './Dispatcher';

export default {
  /**
   * Saves a new draft of a story.
   * Emits STORY_SAVE_STARTED, STORY_SAVE_FAILED, and STORY_SAVED as steps are completed.
   *
   * @param {string} storyUid - The UID of the story to save.
   * @return {Promise<string>} A promise for the new story draft's digest.
   */
  saveDraft: _saveDraft
};


function _saveDraft(storyUid) {
  StorytellerUtils.assertIsOneOfTypes(storyUid, 'string');
  StorytellerUtils.assert(storyStore.storyExists(storyUid), 'Cannot save draft of non-existent story');

  const storyJson = JSON.stringify(
    storyStore.serializeStory(storyUid)
  );

  // important note here: we need to use the storyteller server's csrf token on the page
  const storytellerCsrfToken = $('meta[name="csrf-token"]').attr('content');

  // Should be updated from the X-Story-Digest header in the last save repsonse
  const storyDigest = storyStore.getStoryDigest(storyUid);

  dispatcher.dispatch({
    action: Actions.STORY_SAVE_STARTED,
    storyUid: storyUid
  });

  const headers = {
    'X-Socrata-Host': location.host,
    'X-CSRF-Token': storytellerCsrfToken,
    'X-App-Token': Environment.CORE_SERVICE_APP_TOKEN
  };

  // This story will only have a digest if a
  // saved draft exists. I.e., goals which have just
  // been migrated will not have a digest.
  if (storyDigest) {
    headers['If-Match'] = storyDigest;
  }

  return $.ajax({
    type: 'POST',
    url: StorytellerUtils.format('/stories/api/v1/stories/{0}/drafts', storyUid),
    data: storyJson,
    contentType: 'application/json',
    dataType: 'json',
    headers: headers
  }).
  then(function(data, status, response) {
    dispatcher.dispatch({
      action: Actions.STORY_UPDATED,
      updatedAt: data.updatedAt,
      storyUid: storyUid
    });

    // Get the new draft digest from the response X-Story-Digest header.
    const newDigest = response.getResponseHeader('X-Story-Digest');
    if (_.isString(newDigest) && newDigest.length > 0) {
      return newDigest;
    } else {
      return new $.Deferred().reject('X-Story-Digest was not provided in save draft response').promise();
    }
  }).
  done(function(newDigest) {
    dispatcher.dispatch({
      action: Actions.STORY_SAVED,
      storyUid: storyUid,
      digest: newDigest
    });
  }).
  fail(function(data) {
    const errorReportingLabel = 'StoryDraftCreator#_saveDraft';

    dispatcher.dispatch({
      action: Actions.STORY_SAVE_FAILED,
      storyUid: storyUid,
      message: data,
      conflictingUserId: _.get(data, 'responseJSON.conflictingUserId'),
      // A 412 (Precondition Failed) means our If-Match check failed, indicating someone else already
      // saved over the version of the story our user is editing. Aside: it's not 409 (Conflict) because
      // this error is generated by the If-Match, which is a precondition header.
      // Downstream code needs to handle this case specially, so it is called out as a separate field.
      conflict: data.status === 412,
      errorReporting: {
        message: StorytellerUtils.format(
          '{0}: Saving over already saved version (story: {1}, status: {2}).',
          errorReportingLabel,
          storyUid,
          data.status
        ),
        label: errorReportingLabel
      }
    });
  });
}
