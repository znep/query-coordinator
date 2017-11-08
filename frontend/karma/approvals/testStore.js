import approvals from 'common/components/AssetBrowser/reducers';

export function getDefaultStore() {
  return redux.createStore((approvals));
}
