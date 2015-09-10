(function(root) {
  'use strict';

  var storyteller = root.socrata.storyteller;
  var utils = root.socrata.utils;

  /**
   * @class StoryPermissionsManager
   */
  function StoryPermissionsManager() {

    /**
     * @function makePublic
     */
    this.makePublic = function(errorCallback) {
      utils.assertIsOneOfTypes(errorCallback, 'undefined', 'function');

      _setToPublic().
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
      utils.assertIsOneOfTypes(errorCallback, 'undefined', 'function');

      _setToPrivate().
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
      if (callback) {
        utils.assert(_.isFunction(callback), 'callback must be a function');
      }

      console.error(error);

      if (callback) {
        callback();
      }
    }

    function _setToPublic() {
      return socrata.utils.storytellerApiRequest(
        'stories/{0}/published'.format(storyteller.userStoryUid),
        'POST',
        JSON.stringify({
          digest: storyteller.storyStore.getStoryDigest(
            storyteller.userStoryUid
          )
        })
      );
    }

    function _setToPrivate() {
      return socrata.utils.storytellerApiRequest(
        'stories/{0}/permissions'.format(storyteller.userStoryUid),
        'PUT',
        JSON.stringify({
          isPublic: false
        })
      );
    }
  }

  storyteller.StoryPermissionsManager = StoryPermissionsManager;
})(window);
