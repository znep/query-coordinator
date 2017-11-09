import { createStore } from 'redux';

import approvals from 'common/components/AssetBrowser/reducers';

export function getDefaultStore() {
  return createStore(approvals);
}
