import approvals from 'reducers';

export function getDefaultStore() {
  return redux.createStore(approvals);
}
