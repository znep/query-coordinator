import uuid from 'uuid';
import _ from 'lodash';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  UPDATE_REVISION
} from 'reduxStuff/actions/apiCalls';
import { showFlashMessage } from 'reduxStuff/actions/flashMessage';
import { markFormClean, setFormErrors } from 'reduxStuff/actions/forms';
import * as dsmapiLinks from 'links/dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';

export const EDIT_REVISION = 'EDIT_REVISION';
export const SET_REVISION_VALUE = 'SET_REVISION_VALUE';
export const editRevision = (id, payload) => ({
  type: EDIT_REVISION,
  id,
  payload
});

export const setRevisionValue = (path, value) => ({
  type: SET_REVISION_VALUE,
  path,
  value
});

export function updateRevision(update, params) {
  return dispatch => {
    const callId = uuid();

    dispatch(
      apiCallStarted(callId, {
        operation: UPDATE_REVISION,
        callParams: {
          ...update
        }
      })
    );

    return socrataFetch(dsmapiLinks.revisionBase(params), {
      method: 'PUT',
      body: JSON.stringify(update)
    })
      .then(checkStatus)
      .then(getJson)
      .then(() => {
        dispatch(markFormClean('hrefForm'));
        return dispatch(apiCallSucceeded(callId));
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
        return err.response.json();
      })
      .then(({ message, reason }) => {
        const errors = _.chain(reason.href)
          .filter(href => !_.isEmpty(href))
          .flatMap(href => href.urls)
          .value();

        dispatch(setFormErrors('hrefForm', errors));
        dispatch(showFlashMessage('error', message));
      });
  };
}
