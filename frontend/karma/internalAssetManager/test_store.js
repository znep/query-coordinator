import internalAssetManager from 'reducers';

export function getDefaultStore() {
  return redux.createStore(internalAssetManager);
}
