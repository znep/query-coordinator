import 'whatwg-fetch';

import { POPULAR_VIEWS_CHUNK_SIZE } from 'lib/constants';

import {
  TOGGLE_POPULAR_VIEWS,
  REQUEST_POPULAR_VIEWS,
  RECEIVE_POPULAR_VIEWS,
  HANDLE_POPULAR_VIEWS_ERROR,
  DISMISS_POPULAR_VIEWS_ERROR
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

export function togglePopularViews() {
  return {
    type: TOGGLE_POPULAR_VIEWS
  };
}

export function requestPopularViews() {
  return {
    type: REQUEST_POPULAR_VIEWS
  };
}

export function receivePopularViews(popularViews) {
  return {
    type: RECEIVE_POPULAR_VIEWS,
    popularViews: popularViews
  };
}

export function handlePopularViewsError() {
  return {
    type: HANDLE_POPULAR_VIEWS_ERROR
  };
}

export function dismissPopularViewsError() {
  return {
    type: DISMISS_POPULAR_VIEWS_ERROR
  };
}

export function loadMorePopularViews() {
  return function(dispatch, getState) {
    var state = getState();

    if (_.get(state, 'popularViews.isLoading', false)) {
      return;
    }

    var viewId = state.view.id;
    var offset = _.get(state, 'popularViews.viewList.length', 0);
    var limit = POPULAR_VIEWS_CHUNK_SIZE + 1;
    var fetchUrl = `/dataset_landing_page/${viewId}/popular_views?limit=${limit}&offset=${offset}`;
    var fetchOptions = {
      credentials: 'same-origin'
    };

    dispatch(requestPopularViews());

    fetch(fetchUrl, fetchOptions).
      then(checkStatus).
      then(response => response.json()).
      then(
        popularViews => dispatch(receivePopularViews(popularViews))
      )['catch'](() => dispatch(handlePopularViewsError()));
  };
}
