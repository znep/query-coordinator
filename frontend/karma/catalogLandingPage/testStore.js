import catalogLandingPage from 'catalogLandingPage/reducers';

export function getDefaultStore() {
  return redux.createStore(catalogLandingPage);
}
