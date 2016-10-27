import _ from 'lodash';

import { dispatcher } from './Dispatcher';
import { storyStore } from './stores/StoryStore';
import httpRequest, { storytellerAPIRequestHeaders } from '../services/httpRequest';
import Environment from '../StorytellerEnvironment';
import StorytellerUtils from '../StorytellerUtils';
import Actions from './Actions';
import Constants from './Constants';

export const storyPermissionsManager = new StoryPermissionsManager();
export default function StoryPermissionsManager() {
  // For now, this has to be defined inside the export because of the way the
  // tests are written. Should it be okay to destructure Environment early? Yes.
  // But something about the way this file's stubs are set up requires otherwise.
  const { STORY_UID } = Environment;

  this.makePublic = (errorCallback) => {
    StorytellerUtils.assertIsOneOfTypes(errorCallback, 'undefined', 'function');

    const setPublishedStoryAndHandleRequest = response => {
      dispatcher.dispatch({
        action: Actions.STORY_SET_PUBLISHED_STORY,
        storyUid: STORY_UID,
        publishedStory: response
      });

      return handleRequestSuccess(response);
    };

    return setToPublic().
      then(setPublishedStoryAndHandleRequest).
      catch(error => handleRequestError(error, errorCallback));
  };

  this.makePrivate = (errorCallback) => {
    StorytellerUtils.assertIsOneOfTypes(errorCallback, 'undefined', 'function');

    return setToPrivate().
      then(handleRequestSuccess).
      catch(error => handleRequestError(error, errorCallback));
  };

  function handleRequestSuccess(response) {
    StorytellerUtils.assertIsOneOfTypes(response, 'object');
    StorytellerUtils.assertHasProperty(response, 'isPublic');
    StorytellerUtils.assertIsOneOfTypes(response.isPublic, 'boolean');

    dispatcher.dispatch({
      action: Actions.STORY_SET_PERMISSIONS,
      storyUid: STORY_UID,
      isPublic: response.isPublic
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
    const url = `${Constants.API_PREFIX_PATH}stories/${STORY_UID}/published`;
    const options = {
      headers: storytellerAPIRequestHeaders(),
      data: JSON.stringify({ digest })
    };

    return httpRequest(method, url, options);
  }

  function setToPrivate() {
    const method = 'PUT';
    const url = `${Constants.API_PREFIX_PATH}stories/${STORY_UID}/permissions`;
    const options = {
      headers: storytellerAPIRequestHeaders(),
      data: JSON.stringify({ isPublic: false })
    };

    return httpRequest(method, url, options);
  }
}
