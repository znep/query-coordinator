(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _saveDraft(storyUid) {
    utils.assertIsOneOfTypes(storyUid, 'string');
    utils.assert(storyteller.storyStore.storyExists(storyUid), 'Cannot save draft of non-existent story');

    var storyJson = JSON.stringify(
        storyteller.storyStore.serializeStoryDiff(storyUid)
    );

    // important note here: we need to use the storyteller server's csrf token on the page
    var storytellerCsrfToken = $('meta[name="csrf-token"]').attr('content');

    // Should be updated from the ETag header in the last save repsonse
    var draftVersion = storyteller.storyStore.getStoryDigest(storyUid);

    var appToken = storyteller.config.coreServiceAppToken;

    storyteller.dispatcher.dispatch({
      action: Constants.STORY_SAVE_STARTED,
      storyUid: storyUid
    });

    return $.ajax({
      type: 'POST',
      url: '/stories/api/v1/stories/{0}/drafts'.format(storyUid),
      data: storyJson,
      contentType: 'application/json',
      dataType: 'json',
      headers: {
        'X-Socrata-Host': location.host,
        'X-CSRF-Token': storytellerCsrfToken,
        'If-Match': draftVersion,
        'X-App-Token': appToken
      }
    }).
    then(function(data, status, response) {
      // Map to the ETag
      // get the new draft version/digest from the response headers
      var newDigest = response.getResponseHeader('ETag');
      if (_.isString(newDigest) && newDigest.length > 0) {
        return newDigest;
      } else {
        return new $.Deferred().reject('ETag was not provided in save draft response').promise();
      }
    }).
    done(function(newDigest) {
      storyteller.dispatcher.dispatch({
        action: Constants.STORY_SAVED,
        storyUid: storyUid,
        digest: newDigest
      });
    }).
    fail(function(data) {
      storyteller.dispatcher.dispatch({
        action: Constants.STORY_SAVE_ERROR,
        storyUid: storyUid,
        message: data
      });
    });
  }

  storyteller.StoryDraftCreator = {
    saveDraft: _saveDraft
  };

})(window);
