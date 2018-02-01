import { delay } from 'redux-saga';
import { takeLatest, call, put, select } from 'redux-saga/effects';

import {
  filterOwnerSearchResults,
  userAndTeamAutocompleteUrl,
  fetchJsonWithDefaults
} from 'common/components/AccessManager/Util';
import { CATALOG_SEARCH_DEBOUNCE_MILLISECONDS } from 'common/components/AccessManager/Constants';

import * as changeOwnerActions from 'common/components/AccessManager/actions/ChangeOwnerActions';

import { getCurrentOwner } from './Selectors';

// search for ALL users
function* ownerSearchQueryChanged(action) {
  const { query } = action;

  if (query) {
    // debounce this
    // (we're using takeLatest which will cancel this if it gets called again)
    yield call(delay, CATALOG_SEARCH_DEBOUNCE_MILLISECONDS);

    try {
      const results = yield call(
        fetchJsonWithDefaults,
        // by not passing a domain here, we get ALL users on the platform
        // this is only for feature parity and we may want to change it in the future
        userAndTeamAutocompleteUrl(query)
      );

      const currentOwner = yield select(getCurrentOwner);

      // this will only fitler out the current owner, unlike the
      // (much more complicated) filtering done when adding users
      const filteredResults = filterOwnerSearchResults(results, currentOwner);

      yield put(changeOwnerActions.ownerSearchResultsFetchSuccess(filteredResults));
    } catch (error) {
      yield put(changeOwnerActions.ownerSearchResultsFetchFail(error));
    }
  }
}

export default [
  takeLatest(changeOwnerActions.OWNER_SEARCH_QUERY_CHANGED, ownerSearchQueryChanged)
];
