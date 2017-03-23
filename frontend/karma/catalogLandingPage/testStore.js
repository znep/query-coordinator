import catalogLandingPage from 'reducers';

export function getDefaultStore() {
  return redux.createStore(catalogLandingPage);
}
