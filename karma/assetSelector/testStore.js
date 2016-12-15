import assetSelector from 'reducers';

export function getDefaultStore() {
  return redux.createStore(assetSelector);
}
