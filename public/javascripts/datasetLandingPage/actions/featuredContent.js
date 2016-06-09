import 'whatwg-fetch';

import { UID_REGEX } from '../lib/constants';
import {
  ADD_FEATURED_ITEM,
  EDIT_FEATURED_ITEM,
  REMOVE_FEATURED_ITEM,
  CANCEL_FEATURED_ITEM_EDIT,
  REQUESTED_FEATURED_ITEM_SAVE,
  HANDLE_FEATURED_ITEM_SAVE_SUCCESS,
  HANDLE_FEATURED_ITEM_SAVE_ERROR,
  SET_EXTERNAL_RESOURCE_FIELD,
  SET_STORY_URL_FIELD,
  REQUESTED_STORY,
  HANDLE_LOADING_STORY_SUCCESS,
  HANDLE_LOADING_STORY_ERROR
} from '../actionTypes';

// Used to throw errors from non-200 responses when using fetch.
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  var error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function parseUid(url) {
  var trimmedUrl = trimEditFromUrl(url);
  return trimmedUrl.match(UID_REGEX)[0] || '';
}

function trimEditFromUrl(url) {
  return url.replace(/\/?edit\/?$/, '');
}

export function addFeaturedItem(type, position) {
  return {
    type: ADD_FEATURED_ITEM,
    editType: type,
    position: position
  };
}

export function editFeaturedItem(featuredItem) {
  return {
    type: EDIT_FEATURED_ITEM,
    featuredItem: featuredItem
  };
}

export function removeFeaturedItem(position) {
  return {
    type: REMOVE_FEATURED_ITEM,
    position: position
  };
}

export function cancelFeaturedItemEdit() {
  return {
    type: CANCEL_FEATURED_ITEM_EDIT
  };
}

export function requestedFeaturedItemSave() {
  return {
    type: REQUESTED_FEATURED_ITEM_SAVE
  };
}

export function handleFeaturedItemSaveSuccess(featuredItem, position) {
  return {
    type: HANDLE_FEATURED_ITEM_SAVE_SUCCESS,
    featuredItem: featuredItem,
    position: position
  };
}

export function handleFeaturedItemSaveError() {
  return {
    type: HANDLE_FEATURED_ITEM_SAVE_ERROR
  };
}

export function saveFeaturedItem() {
  return function(dispatch, getState) {
    var state = getState();
    var viewId = state.view.id;
    var csrfToken = state.contactForm.token;
    var featuredContent = state.featuredContent;
    var editType = featuredContent.editType;
    var editPosition = featuredContent.editPosition;

    var headers;
    var payload;
    var fetchOptions;

    headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    };

    // The payload differs depending on the type of item that is being featured.
    if (editType === 'visualization') {
      payload = {};
    } else if (editType === 'story') {
      payload = {
        featuredLensUid: parseUid(featuredContent.story.url),
        position: editPosition + 1,
        contentType: 'internal',
        url: trimEditFromUrl(featuredContent.story.url)
      };
    } else if (editType === 'externalResource') {
      payload = {
        description: featuredContent.externalResource.description,
        title: featuredContent.externalResource.title,
        url: featuredContent.externalResource.url,
        position: editPosition + 1,
        contentType: 'external'
      };
    } else {
      return console.error(
        `Asked to save a featured item, but the current editType is "${editType}". ` +
        'Expected one of "visualization", "story", or "externalResource".'
      );
    }

    fetchOptions = {
      method: 'POST',
      credentials: 'same-origin',
      headers: headers,
      body: JSON.stringify(payload)
    };

    dispatch(requestedFeaturedItemSave());

    // Save featured item
    fetch(`/dataset_landing_page/${viewId}/featured_content`, fetchOptions).
      then(checkStatus).
      then(response => response.json()).
      then(function(response) {
        dispatch(handleFeaturedItemSaveSuccess(response, editPosition));
        _.delay(dispatch, 1500, cancelFeaturedItemEdit());
      })['catch'](() => dispatch(handleFeaturedItemSaveError()));
  };
}

export function setExternalResourceField(field, value) {
  return {
    type: SET_EXTERNAL_RESOURCE_FIELD,
    field: field,
    value: value
  };
}

export function setStoryUrlField(value) {
  return {
    type: SET_STORY_URL_FIELD,
    value: value
  };
}

export function requestedStory() {
  return {
    type: REQUESTED_STORY
  };
}

export function handleLoadingStoryError() {
  return {
    type: HANDLE_LOADING_STORY_ERROR
  };
}

export function handleLoadingStorySuccess(story) {
  return {
    type: HANDLE_LOADING_STORY_SUCCESS,
    story: story
  };
}

export function loadStory() {
  return function(dispatch, getState) {
    var state = getState();
    var uid = parseUid(state.featuredContent.story.url);

    var fetchOptions = {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    dispatch(requestedStory());

    fetch(`/dataset_landing_page/formatted_view/${uid}`, fetchOptions).
      then(checkStatus).
      then(response => response.json()).
      then(function(response) {
        dispatch(handleLoadingStorySuccess(response));
      })['catch'](() => dispatch(handleLoadingStoryError()));
  };
}
