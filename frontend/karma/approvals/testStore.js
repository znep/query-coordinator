import { createStore } from 'redux';

import reducers from 'common/components/AssetBrowser/reducers';

export function getDefaultStore() {
  return createStore(reducers);
}
