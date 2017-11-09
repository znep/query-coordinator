import { all } from 'redux-saga/effects';

import approvalsSagas from './approvals';

export default function* sagas() {
  yield all([
    ...approvalsSagas
  ]);
}
