import _ from 'lodash';
import 'whatwg-fetch';
import { checkStatus, defaultHeaders, redirectTo } from 'common/http';

import {
  HANDLE_FETCH_ROW_COUNT_SUCCESS,
  HANDLE_FETCH_ROW_COUNT_ERROR,
  REQUESTED_VIEW_PUBLISH,
  HANDLE_VIEW_PUBLISH_SUCCESS,
  HANDLE_VIEW_PUBLISH_ERROR,
  CLEAR_VIEW_PUBLISH_ERROR,
  ON_SUBSCRIPTION_CHANGE,
  CHECK_SUBSCRIPTION_ON_LOAD,
  HANDLE_CHECK_SUBSCRIPTION_ON_LOAD_ERROR
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

export function handleFetchRowCountSuccess(rowCount) {
  return {
    type: HANDLE_FETCH_ROW_COUNT_SUCCESS,
    rowCount
  };
}

export function handleFetchRowCountError() {
  return { type: HANDLE_FETCH_ROW_COUNT_ERROR };
}

export function onSubscriptionChange(subscriptionId) {
  return {
    type: ON_SUBSCRIPTION_CHANGE,
    subscriptionId,
    subscribed: _.isNumber(subscriptionId) && !_.isNaN(subscriptionId)
  };
}

export function checkSubscriptionOnLoad(subscriptionId) {
  return {
    type: CHECK_SUBSCRIPTION_ON_LOAD,
    subscriptionId,
    subscribed: _.isNumber(subscriptionId) && !_.isNaN(subscriptionId)
  };
}

export function handleCheckSubscriptionOnLoadError() {
  return {
    type: HANDLE_CHECK_SUBSCRIPTION_ON_LOAD_ERROR
  };
}

export function publishView() {
  return (dispatch, getState) => {
    const viewId = getState().view.id;
    const fetchOptions = {
      method: 'POST',
      headers: defaultHeaders,
      credentials: 'same-origin'
    };

    dispatch(requestedViewPublish());

    fetch(`/api/views/${viewId}/publication.json`, fetchOptions).
      then(checkStatus).
      then((response) => response.json()).
      then((publishedView) => {
        dispatch(handleViewPublishSuccess());

        redirectTo(window.location.href.replace(viewId, publishedView.id), 1000);
      }).
      catch(() => dispatch(handleViewPublishError()));
  };
}

export function fetchRowCount() {
  return (dispatch, getState) => {
    const viewId = getState().view.id;
    const fetchOptions = {
      method: 'GET',
      headers: defaultHeaders,
      credentials: 'same-origin'
    };

    // NOTE: This is where a REQUESTED-type action would be dispatched, but
    // we're firing this on page load and it doesn't seem necessary.

    fetch(`/api/id/${viewId}?$query=select count(*) as COLUMN_ALIAS_GUARD__count`, fetchOptions).
      then(checkStatus).
      then((response) => response.json()).
      then((apiResponse) => {
        // OBE will lowercase the field in the response.
        const rowCountOBE = _.get(apiResponse, '[0].column_alias_guard__count', null);
        const rowCountNBE = _.get(apiResponse, '[0].COLUMN_ALIAS_GUARD__count', null);

        let rowCount = null;
        if (_.isString(rowCountNBE)) {
          rowCount = _.toNumber(rowCountNBE);
        } else if (_.isString(rowCountOBE)) {
          rowCount = _.toNumber(rowCountOBE);
        }

        dispatch(handleFetchRowCountSuccess(rowCount));
      }).
      catch(() => dispatch(handleFetchRowCountError()));
  };
}

export const checkSubscription = () => (dispatch, getState) => {
  const fetchOptions = {
    method: 'GET',
    headers: defaultHeaders,
    credentials: 'same-origin'
  };
  const viewId = getState().view.id;
  const fetchUrl = '/api/notifications_and_alerts/subscriptions?dataset_domain=' +
    `${window.location.host}&dataset=${viewId}&activity=WATCH_DATASET`;

  fetch(fetchUrl, fetchOptions).then(checkStatus).then((response) => response.json()).then((response) => {
    var subscriptionResponse = response.data;
    dispatch(checkSubscriptionOnLoad(_.get(subscriptionResponse[0], 'id', null)));
  }).catch(() => dispatch(handleCheckSubscriptionOnLoadError()));
};
