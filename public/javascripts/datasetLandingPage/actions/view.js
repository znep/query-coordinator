import 'whatwg-fetch';
import { checkStatus, defaultHeaders } from '../lib/http';

import {
  REQUESTED_VIEW_PUBLISH,
  HANDLE_VIEW_PUBLISH_SUCCESS,
  HANDLE_VIEW_PUBLISH_ERROR,
  CLEAR_VIEW_PUBLISH_ERROR
} from '../actionTypes';

export function requestedViewPublish() {
  return { type: REQUESTED_VIEW_PUBLISH };
}

export function handleViewPublishSuccess() {
  return { type: HANDLE_VIEW_PUBLISH_SUCCESS };
}

export function handleViewPublishError() {
  return { type: HANDLE_VIEW_PUBLISH_ERROR };
}

export function clearViewPublishError() {
  return { type: CLEAR_VIEW_PUBLISH_ERROR };
}

export function publishView() {
  return (dispatch, getState) => {
    var viewId = getState().view.id;
    var fetchOptions = {
      method: 'POST',
      headers: defaultHeaders,
      credentials: 'same-origin'
    };

    dispatch(requestedViewPublish());

    fetch(`/api/views/${viewId}/publication.json`, fetchOptions).
      then(checkStatus).
      then(response => response.json()).
      then((publishedView) => {
        function redirect() {
          window.location.href = window.location.href.replace(viewId, publishedView.id);
        }

        dispatch(handleViewPublishSuccess());
        _.delay(redirect, 1000);
      })['catch'](() => {
        dispatch(handleViewPublishError());
      });
  };
}
