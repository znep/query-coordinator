import 'whatwg-fetch';
import { checkStatus, defaultHeaders } from '../lib/http';
import { RELATED_VIEWS_CHUNK_SIZE } from '../lib/constants';

import {
  TOGGLE_RELATED_VIEWS,
  REQUEST_RELATED_VIEWS,
  RECEIVE_RELATED_VIEWS,
  HANDLE_RELATED_VIEWS_ERROR,
  DISMISS_RELATED_VIEWS_ERROR
} from '../actionTypes';

export function toggleRelatedViews() {
  return {
    type: TOGGLE_RELATED_VIEWS
  };
}

export function requestRelatedViews() {
  return {
    type: REQUEST_RELATED_VIEWS
  };
}

export function receiveRelatedViews(relatedViews) {
  return {
    type: RECEIVE_RELATED_VIEWS,
    relatedViews: relatedViews
  };
}

export function handleRelatedViewsError() {
  return {
    type: HANDLE_RELATED_VIEWS_ERROR
  };
}

export function dismissRelatedViewsError() {
  return {
    type: DISMISS_RELATED_VIEWS_ERROR
  };
}

export function loadMoreRelatedViews() {
  return function(dispatch, getState) {
    var state = getState();

    if (_.get(state, 'relatedViews.isLoading', false)) {
      return;
    }

    var viewId = state.view.id;
    var offset = _.get(state, 'relatedViews.viewList.length', 0);
    var limit = RELATED_VIEWS_CHUNK_SIZE + 1;
    var fetchUrl = `/dataset_landing_page/${viewId}/related_views?limit=${limit}&offset=${offset}`;
    var fetchOptions = {
      credentials: 'same-origin',
      headers: defaultHeaders
    };

    dispatch(requestRelatedViews());

    fetch(fetchUrl, fetchOptions).
      then(checkStatus).
      then(response => response.json()).
      then(
        relatedViews => dispatch(receiveRelatedViews(relatedViews))
      ).
      catch(() => dispatch(handleRelatedViewsError()));
  };
}
