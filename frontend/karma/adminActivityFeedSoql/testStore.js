import activityFeed from 'reducers';

export function getDefaultStore() {
  return redux.createStore(activityFeed);
}
