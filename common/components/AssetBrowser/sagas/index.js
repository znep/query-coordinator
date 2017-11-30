import { all } from 'redux-saga/effects';

import approvalsSagas from './approvals';
import settingsSagas from './settings';

export default function* sagas() {
  yield all([
    ...approvalsSagas,
    ...settingsSagas
  ]);
}
