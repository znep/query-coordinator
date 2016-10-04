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
  const { STORY_UID, PUBLISHED_STORY_DATA } = Environment;

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

  this.isPublic = () => {
    const permissions = storyStore.getStoryPermissions(STORY_UID);
    return permissions && permissions.isPublic;
  };

  this.havePublishedAndDraftDiverged = () => {
    let publishedAndDraftDiverged = false;
    const publishedStory = storyStore.getStoryPublishedStory(STORY_UID) || PUBLISHED_STORY_DATA;
    const digest = storyStore.getStoryDigest(STORY_UID);

    // Only stories that have been published can have their published and
    // draft versions diverge. If a story has never been published, storyStore
    // will return undefined for .getStoryPublishedStory() and the
    // publishedStory object embedded in the page by the Rails app will be set
    // to null. Because of the '|| root.publishedStory;' conditional
    // assignment to publishedStory above, we can be reasonably confident that
    // we will only ever encounter a JSON representation of the published
    // story or null.
    if (publishedStory !== null && publishedStory.hasOwnProperty('digest')) {
      publishedAndDraftDiverged = publishedStory.digest !== digest;
    }

    return publishedAndDraftDiverged;
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
