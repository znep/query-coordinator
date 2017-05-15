import _ from 'lodash';

import { dispatcher } from './Dispatcher';
import { storyStore } from './stores/StoryStore';
import httpRequest, { storytellerHeaders } from '../services/httpRequest';
import Environment from '../StorytellerEnvironment';
import { assertIsOneOfTypes, assertHasProperty } from 'common/js_utils';
import Actions from './Actions';
import Constants from './Constants';

export const storyPermissionsManager = new StoryPermissionsManager();
export default function StoryPermissionsManager() {
  // For now, this has to be defined inside the export because of the way the
  // tests are written. Should it be okay to destructure Environment early? Yes.
  // But something about the way this file's stubs are set up requires otherwise.
  const { IS_GOAL, STORY_UID } = Environment;

  this.makePublic = (errorCallback) => {
    assertIsOneOfTypes(errorCallback, 'undefined', 'function');

    return setToPublic().
      then((response) => {
        dispatcher.dispatch({
          action: Actions.STORY_SET_PUBLISHED_STORY,
          storyUid: STORY_UID,
          publishedStory: response.data
        });

        return response;
      }).
      then(handleRequestSuccess).
      catch(error => handleRequestError(error, errorCallback));
  };

  this.makePrivate = (errorCallback) => {
    assertIsOneOfTypes(errorCallback, 'undefined', 'function');

    return setToPrivate().
      then(handleRequestSuccess).
      catch(error => handleRequestError(error, errorCallback));
  };

  function handleRequestSuccess({ data }) {
    assertIsOneOfTypes(data, 'object');
    assertHasProperty(data, 'isPublic');
    assertIsOneOfTypes(data.isPublic, 'boolean');

    dispatcher.dispatch({
      action: Actions.STORY_SET_PERMISSIONS,
      storyUid: STORY_UID,
      isPublic: data.isPublic
    });

    return Promise.resolve();
  }

  function handleRequestError(error, callback) {
    console.error(error);
    _.attempt(callback, error);
    return Promise.reject();
  }

  function setToPublic() {
    const digest = storyStore.getStoryDigest(STORY_UID);

    const method = 'POST';
    const url = IS_GOAL ?
      `${Constants.GOALS_API_V1_PREFIX_PATH}/goals/${STORY_UID}/narrative/published` :
      `${Constants.API_PREFIX_PATH}/stories/${STORY_UID}/published`;
    const options = {
      headers: storytellerHeaders(),
      data: { digest }
    };

    return httpRequest(method, url, options);
  }

  function setToPrivate() {
    const method = 'PUT';
    const url = IS_GOAL ?
      `${Constants.GOALS_API_V1_PREFIX_PATH}/goals/${STORY_UID}/narrative/permissions` :
      `${Constants.API_PREFIX_PATH}/stories/${STORY_UID}/permissions`;
    const options = {
      headers: storytellerHeaders(),
      data: { isPublic: false }
    };

    return httpRequest(method, url, options);
  }
}
