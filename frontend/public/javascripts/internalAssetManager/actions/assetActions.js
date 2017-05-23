import 'whatwg-fetch';
import { defaultHeaders, checkStatus, reload } from '../../common/http';

export const closeModal = () => (
  { type: 'CLOSE_MODAL' }
);

const performingAction = (actionType) => (
  { type: 'PERFORMING_ACTION', actionType }
);

const performingActionSuccess = (actionType) => (
  { type: 'PERFORMING_ACTION_SUCCESS', actionType }
);

const performingActionFailure = (actionType) => (
  { type: 'PERFORMING_ACTION_FAILURE', actionType }
);

export const deleteAsset = uid => dispatch => {
  const ACTION_TYPE = 'deleteAsset';
  const fetchOptions = {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: defaultHeaders
  };

  dispatch(performingAction(ACTION_TYPE));

  return fetch(`https://localhost/api/views/${uid}.json?accessType=WEBSITE`, fetchOptions).
    then(checkStatus).
    then(() => dispatch(performingActionSuccess(ACTION_TYPE))).
    then(reload).
    catch(() => dispatch(performingActionFailure(ACTION_TYPE)));
};
