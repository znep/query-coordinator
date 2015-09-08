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

      var payload = {
        action: Constants.STORY_SET_PERMISSIONS,
        storyUid: storyteller.userStoryUid,
        isPublic: response.isPublic
      };

      storyteller.dispatcher.dispatch(payload);
    }

    function _handleRequestError(error, callback) {
      utils.assertIsOneOfTypes(error, 'object');
      utils.assertHasProperty(error, 'message');
      utils.assertIsOneOfTypes(error.message, 'string');

      callback(error.message);
    }

    function _updatePermissions(setPublic) {
      utils.assertIsOneOfTypes(setPublic, 'boolean');

      if (setPublic) {
        return socrata.utils.storytellerApiRequest(
          'stories/{0}/published'.format(storyteller.userStoryUid),
          'POST',
          {
            digest: storyteller.storyStore.getDigest(
              storyteller.userStoryUid
            )
          }
        );
      } else {
        return socrata.utils.storytellerApiRequest(
          'stories/{0}/permissions'.format(storyteller.userStoryUid),
          'PUT',
          {
            isPublic: setPublic
          }
        )
      }
    }
  }

  root.storyteller.StoryPermissionsManager = StoryPermissionsManager;

})(window);
