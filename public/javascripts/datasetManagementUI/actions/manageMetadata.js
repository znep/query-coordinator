import _ from 'lodash';
import { push } from 'react-router-redux';
import * as Links from '../links';
import { checkStatus } from '../lib/http';
import {
  updateStarted,
  updateSucceeded,
  updateFailed
} from './database';

export function saveMetadata() {
  return (dispatch, getState) => {
    const metadata = _.omit(getState().db.views[0], '__status__');
    dispatch(updateStarted('views', metadata));
    fetch(`/api/views/${window.initialState.view.id}`, {
      method: 'PUT',
      credentials: 'same-origin',
      body: JSON.stringify(metadata)
    }).
      then(checkStatus).
      then(() => {
        dispatch(updateSucceeded('views', metadata));
        dispatch(redirectAfterInterval());
      }).
      catch((error) => {
        dispatch(updateFailed('views', metadata, error));
      });
  };
}

// when save succeeds, wait this long until modal goes away
// so user can see "saved" button is green
export const DELAY_UNTIL_CLOSE_MS = 1000;

function redirectAfterInterval() {
  return (dispatch, getState) => {
    setTimeout(() => {
      dispatch(push(Links.home(getState().routing)));
    }, DELAY_UNTIL_CLOSE_MS);
  };
}
