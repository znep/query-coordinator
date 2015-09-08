(function(root) {
  'use strict';

  var storyteller = root.socrata.storyteller;
  var utils = root.socrata.utils;

  /**
   * @function StoryPermissionsManager
   */
  function StoryPermissionsManager() {

    /**
     * @function makePublic
     */
    this.makePublic = function(errorCallback) {
      _updatePermissions(true).
        then(
          _handleRequestSuccess,
          function(error) {
            _handleRequestError(error, errorCallback);
          }
        );
    };

    /**
     * @function makePrivate
     */
    this.makePrivate = function(errorCallback) {
      _updatePermissions(false).
        then(
          _handleRequestSuccess,
          function(error) {
            _handleRequestError(error, errorCallback);
          }
        );
    };

    function _handleRequestSuccess(response) {
      utils.assertIsOneOfTypes(response, 'object');
      utils.assertHasProperty(response, 'isPublic');
      utils.assertIsOneOfTypes(response.isPublic, 'boolean');

      if (response.uid) {
        storyteller.dispatcher.dispatch({
          action: Constants.STORY_SET_PUBLISHED_STORY,
          storyUid: storyteller.userStoryUid,
          publishedStory: response
        });
      }

      var payload = {
        action: Constants.STORY_SET_PERMISSIONS,
        storyUid: storyteller.userStoryUid,
        isPublic: response.isPublic
      };

      storyteller.dispatcher.dispatch(payload);
    }

    function _handleRequestError(error, callback) {
      console.error(error);

      if (typeof callback === 'function') {
        callback();
      }
    }

    function _updatePermissions(setPublic) {
      utils.assertIsOneOfTypes(setPublic, 'boolean');

      if (setPublic) {
        return socrata.utils.storytellerApiRequest(
          'stories/{0}/published'.format(storyteller.userStoryUid),
          'POST',
          JSON.stringify({
            digest: storyteller.storyStore.getStoryDigest(
              storyteller.userStoryUid
            )
          })
        );
      } else {
        return socrata.utils.storytellerApiRequest(
          'stories/{0}/permissions'.format(storyteller.userStoryUid),
          'PUT',
          JSON.stringify({
            isPublic: setPublic
          })
        )
      }
    }
  }

  root.storyteller.StoryPermissionsManager = StoryPermissionsManager;

})(window);
