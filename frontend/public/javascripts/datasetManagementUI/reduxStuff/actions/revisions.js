import uuid from 'uuid';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  UPDATE_REVISION
} from 'reduxStuff/actions/apiCalls';
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
      .then(resp => {
        console.log('resp', resp);
        return dispatch(apiCallSucceeded(callId));
      })
      .catch(err => dispatch(apiCallFailed(callId, err)));
  };
}

// export function updateRevision(permission, params) {
//   return (dispatch, getState) => {
//     const { entities } = getState();
//     const { id: revisionId } = _.find(entities.revisions, { revision_seq: _.toNumber(params.revisionSeq) });
//     const { permission: oldPermission } = entities.revisions[revisionId];
//
//     if (permission === oldPermission) {
//       return;
//     }
//
//     // disable btn then reenable in promise resolve
//     const callId = uuid();
//
//     dispatch(
//       apiCallStarted(callId, {
//         operation: UPDATE_REVISION,
//         callParams: {
//           action: {
//             permission
//           }
//         }
//       })
//     );
//
//     return socrataFetch(dsmapiLinks.revisionBase(params), {
//       method: 'PUT',
//       body: JSON.stringify({
//         action: {
//           permission
//         }
//       })
//     })
//       .then(checkStatus)
//       .then(getJson)
//       .then(resp => {
//         dispatch(apiCallSucceeded(callId));
//
//         const updatedRevision = shapeRevision(resp.resource);
//
//         dispatch(editRevision(updatedRevision.id, updatedRevision));
//       })
//       .catch(err => {
//         dispatch(apiCallFailed(callId, err));
//       });
//   };
// }
