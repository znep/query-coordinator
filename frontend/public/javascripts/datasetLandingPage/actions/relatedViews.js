import 'whatwg-fetch';

import { checkStatus, defaultHeaders } from 'common/http';
import { RELATED_VIEWS_FETCH_LIMIT } from '../lib/constants';

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
    relatedViews
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
  return (dispatch, getState) => {
    const state = getState();

    if (_.get(state, 'relatedViews.isLoading', false)) {
      return;
    }

    const uid = state.view.id;
    const offset = _.get(state, 'relatedViews.viewList.length', 0);
    const limit = RELATED_VIEWS_FETCH_LIMIT + 1;
    const fetchUrl = `/dataset_landing_page/${uid}/related_views?limit=${limit}&offset=${offset}`;
    const fetchOptions = {
      credentials: 'same-origin',
      headers: defaultHeaders
    };

    dispatch(requestRelatedViews());

    fetch(fetchUrl, fetchOptions).
      then(checkStatus).
      then((response) => response.json()).
      then((relatedViews) => dispatch(receiveRelatedViews(relatedViews))).
      catch(() => dispatch(handleRelatedViewsError()));
  };
}
