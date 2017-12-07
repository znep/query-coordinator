import { delay } from 'redux-saga';
import { takeLatest, call, put, select } from 'redux-saga/effects';
import * as addUsersActions from '../actions/AddUsersActions';
import { getAddedUsers, getSelectedUsers } from './Selectors';
import { filterSearchResults, getDomain, userAutocompleteUrl, fetchWithDefaults } from '../Util';
import { CATALOG_SEARCH_DEBOUNCE_MILLISECONDS } from '../Constants';

// grab list of (roled) users from the catalog
export function* userSearchQueryChanged(action) {
  const { query, domain } = action;

  if (query) {
    // debounce this
    // (we're using takeLatest which will cancel this if it gets called again)
    yield call(delay, CATALOG_SEARCH_DEBOUNCE_MILLISECONDS);

    try {
      // by passing the domain, we only receive roled users on that domain
      // this is the desired behavior when searching for users to give permission to
      // Note that users can still be added by email if they are un-roled on the domain
      // (we may want to control this in the future)
      const response = yield call(
        fetchWithDefaults,
        userAutocompleteUrl(query, domain || getDomain())
      );
      const results = yield call(response.json.bind(response));

      const addedUsers = yield select(getAddedUsers);
      const selectedUsers = yield select(getSelectedUsers);

      // this will filter out all the users who have already been selected,
      // or who already have permissions on the asset
      // it will also add "query" to the bottom of the list if it is a valid email address
      const filteredResults = filterSearchResults(results, selectedUsers, addedUsers, query);

      yield put(addUsersActions.userSearchResultsFetchSuccess(filteredResults));
    } catch (error) {
      yield put(addUsersActions.userSearchResultsFetchFail(error));
    }
  }
}

export default [
  takeLatest(addUsersActions.USER_SEARCH_QUERY_CHANGED, userSearchQueryChanged)
];
