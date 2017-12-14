import { delay } from 'redux-saga';
import { takeLatest, call, put, select } from 'redux-saga/effects';
import * as changeOwnerActions from '../actions/ChangeOwnerActions';
import { getCurrentOwner } from './Selectors';
import { filterOwnerSearchResults, userAutocompleteUrl, fetchWithDefaults } from '../Util';
import { CATALOG_SEARCH_DEBOUNCE_MILLISECONDS } from '../Constants';

// search for ALL users
function* ownerSearchQueryChanged(action) {
  const { query } = action;

  if (query) {
    // debounce this
    // (we're using takeLatest which will cancel this if it gets called again)
    yield call(delay, CATALOG_SEARCH_DEBOUNCE_MILLISECONDS);

    try {
      const response = yield call(
        fetchWithDefaults,
        // by not passing a domain here, we get ALL users on the platform
        // this is only for feature parity and we may want to change it in the future
        userAutocompleteUrl(query)
      );
      const results = yield call(response.json.bind(response));

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
