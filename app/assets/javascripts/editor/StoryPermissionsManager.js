import _ from 'lodash';

import { dispatcher } from './Dispatcher';
import { storyStore } from './stores/StoryStore';
import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';
import Actions from './Actions';

/**
 * @class StoryPermissionsManager
 */
export var storyPermissionsManager = new StoryPermissionsManager();
export default function StoryPermissionsManager() {

  /**
   * @function makePublic
   */
  this.makePublic = function(errorCallback) {
    StorytellerUtils.assertIsOneOfTypes(errorCallback, 'undefined', 'function');

    _setToPublic().
      then(
        function(response) {
          dispatcher.dispatch({
            action: Actions.STORY_SET_PUBLISHED_STORY,
            storyUid: Environment.STORY_UID,
            publishedStory: response
          });
          _handleRequestSuccess(response);
        },
        function(error) {
          _handleRequestError(error, errorCallback);
        }
      );
  };

  /**
   * @function makePrivate
   */
  this.makePrivate = function(errorCallback) {
    StorytellerUtils.assertIsOneOfTypes(errorCallback, 'undefined', 'function');

    _setToPrivate().
      then(
        _handleRequestSuccess,
        function(error) {
          _handleRequestError(error, errorCallback);
        }
      );
  };

  function _handleRequestSuccess(response) {
    StorytellerUtils.assertIsOneOfTypes(response, 'object');
    StorytellerUtils.assertHasProperty(response, 'isPublic');
    StorytellerUtils.assertIsOneOfTypes(response.isPublic, 'boolean');

    var payload = {
      action: Actions.STORY_SET_PERMISSIONS,
      storyUid: Environment.STORY_UID,
      isPublic: response.isPublic
    };

    dispatcher.dispatch(payload);
  }

  function _handleRequestError(error, callback) {
    StorytellerUtils.assert(
      !callback ||
      (callback && _.isFunction(callback)),
      'callback must be a function'
    );

    console.error(error);

    if (callback) {
      callback();
    }
  }

  function _setToPublic() {
    return StorytellerUtils.storytellerApiRequest(
      StorytellerUtils.format('stories/{0}/published', Environment.STORY_UID),
      'POST',
      JSON.stringify({
        digest: storyStore.getStoryDigest(
          Environment.STORY_UID
        )
      })
    );
  }

  function _setToPrivate() {
    return StorytellerUtils.storytellerApiRequest(
      StorytellerUtils.format('stories/{0}/permissions', Environment.STORY_UID),
      'PUT',
      JSON.stringify({
        isPublic: false
      })
    );
  }
}
