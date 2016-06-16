import 'whatwg-fetch';
import { defaultHeaders, checkStatus } from '../lib/http';
import { UID_REGEX } from '../lib/constants';

import {
  ADD_FEATURED_ITEM,
  EDIT_FEATURED_ITEM,
  CANCEL_FEATURED_ITEM_EDIT,
  REQUESTED_FEATURED_ITEM_SAVE,
  HANDLE_FEATURED_ITEM_SAVE_SUCCESS,
  HANDLE_FEATURED_ITEM_SAVE_ERROR,
  SET_EXTERNAL_RESOURCE_FIELD,
  SET_STORY_URL_FIELD,
  REQUESTED_STORY,
  SET_SAVING_FEATURED_ITEM,
  REQUESTED_DERIVED_VIEWS,
  RECEIVE_DERIVED_VIEWS,
  HANDLE_DERIVED_VIEWS_REQUEST_ERROR,
  HANDLE_LOADING_STORY_SUCCESS,
  HANDLE_LOADING_STORY_ERROR,
  REQUESTED_FEATURED_ITEM_REMOVAL,
  HANDLE_FEATURED_ITEM_REMOVAL_SUCCESS,
  HANDLE_FEATURED_ITEM_REMOVAL_ERROR
} from '../actionTypes';

function parseUid(url) {
  var trimmedUrl = trimEditFromUrl(url);
  return trimmedUrl.match(UID_REGEX)[0] || '';
}

function trimEditFromUrl(url) {
  return url.replace(/\/?edit\/?$/, '');
}

// Item Add
export function addFeaturedItem(type, position) {
  return {
    type: ADD_FEATURED_ITEM,
    editType: type,
    position: position
  };
}

// Item Edit
export function editFeaturedItem(featuredItem) {
  return {
    type: EDIT_FEATURED_ITEM,
    featuredItem: featuredItem
  };
}

export function cancelFeaturedItemEdit() {
  return {
    type: CANCEL_FEATURED_ITEM_EDIT
  };
}

// Item Save
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

export function saveFeaturedItem(options) {
  return function(dispatch, getState) {
    var state = getState();
    var viewId = state.view.id;
    var featuredContent = state.featuredContent;
    var editType = featuredContent.editType;
    var editPosition = featuredContent.editPosition;

    var payload;
    var fetchOptions;

    // The payload differs depending on the type of item that is being featured.
    if (editType === 'visualization') {
      dispatch(setSavingFeaturedItem(options.featuredLensUid));

      payload = {
        featuredLensUid: options.featuredLensUid,
        contentType: 'internal',
        position: editPosition
      };
    } else if (editType === 'story') {
      payload = {
        featuredLensUid: parseUid(featuredContent.story.url),
        position: editPosition,
        contentType: 'internal',
        url: trimEditFromUrl(featuredContent.story.url)
      };
    } else if (editType === 'externalResource') {
      var previewImage = featuredContent.externalResource.previewImage;
      var matches = previewImage.match(/base64,([^\s]+)$/);
      var previewImageBase64 = _.isNull(matches) ? null : matches[1];

      payload = {
        description: featuredContent.externalResource.description,
        previewImageBase64: previewImageBase64,
        title: featuredContent.externalResource.title,
        url: featuredContent.externalResource.url,
        position: editPosition,
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
      headers: defaultHeaders,
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

// Item Removal
export function requestedFeaturedItemRemoval(position) {
  return {
    type: REQUESTED_FEATURED_ITEM_REMOVAL,
    position: position
  };
}

export function handleFeaturedItemRemovalSuccess(position) {
  return {
    type: HANDLE_FEATURED_ITEM_REMOVAL_SUCCESS,
    position: position
  };
}

export function handleFeaturedItemRemovalError() {
  return {
    type: HANDLE_FEATURED_ITEM_REMOVAL_ERROR
  };
}

export function removeFeaturedItem(position) {
  return function(dispatch, getState) {
    var state = getState();
    var viewId = state.view.id;

    var fetchOptions;

    fetchOptions = {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: defaultHeaders
    };

    dispatch(requestedFeaturedItemRemoval(position));

    // Save featured item
    fetch(`/dataset_landing_page/${viewId}/featured_content/${position}`, fetchOptions).
      then(checkStatus).
      then(response => response.json()).
      then(function() {
        dispatch(handleFeaturedItemRemovalSuccess(position));
      })['catch'](() => dispatch(handleFeaturedItemRemovalError()));
  };
}

// External Resources
export function setExternalResourceField(field, value) {
  return {
    type: SET_EXTERNAL_RESOURCE_FIELD,
    field: field,
    value: value
  };
}

// Stories
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

// Internal Assets
export function setSavingFeaturedItem(viewUid) {
  return {
    type: SET_SAVING_FEATURED_ITEM,
    viewUid: viewUid
  };
}

export function requestDerivedViews() {
  return function(dispatch, getState) {
    var state = getState();

    var viewId = state.view.id;
    var fetchUrl = `/dataset_landing_page/${viewId}/related_views?sort_by=date`;
    var fetchOptions = {
      credentials: 'same-origin'
    };

    dispatch(requestedDerivedViews());

    fetch(fetchUrl, fetchOptions).
      then(checkStatus).
      then(response => response.json()).
      then(function(response) {
        dispatch(receiveDerivedViews(response));
      })['catch'](() => dispatch(handleDerivedViewsError()));
  };
}

export function requestedDerivedViews() {
  return {
    type: REQUESTED_DERIVED_VIEWS
  };
}

export function receiveDerivedViews(views) {
  return {
    type: RECEIVE_DERIVED_VIEWS,
    views: views
  };
}

export function handleDerivedViewsError() {
  return {
    type: HANDLE_DERIVED_VIEWS_REQUEST_ERROR
  };
}
