import { delay } from 'redux-saga';
import { takeLatest, call, put, select } from 'redux-saga/effects';

import {
  filterSearchResults,
  getDomain,
  userAutocompleteUrl,
  fetchJsonWithDefaults
} from 'common/components/AccessManager/Util';
import { CATALOG_SEARCH_DEBOUNCE_MILLISECONDS } from 'common/components/AccessManager/Constants';

import * as addCollaboratorsActions from 'common/components/AccessManager/actions/AddCollaboratorsActions';

import { getAddedUsers, getSelectedUsers } from './Selectors';

// grab list of (roled) users from the catalog
export function* collaboratorsSearchQueryChanged(action) {
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
      const results = yield call(
        fetchJsonWithDefaults,
        userAutocompleteUrl(query, domain || getDomain())
      );

      const addedUsers = yield select(getAddedUsers);
      const selectedUsers = yield select(getSelectedUsers);

      // this will filter out all the users who have already been selected,
      // or who already have permissions on the asset
      // it will also add "query" to the bottom of the list if it is a valid email address
      const filteredResults = filterSearchResults(results, selectedUsers, addedUsers, query);

      yield put(addCollaboratorsActions.collaboratorsSearchResultsFetchSuccess(filteredResults));
    } catch (error) {
      yield put(addCollaboratorsActions.collaboratorsSearchResultsFetchFail(error));
    }
  }
}

export default [
  takeLatest(addCollaboratorsActions.COLLABORATORS_SEARCH_QUERY_CHANGED, collaboratorsSearchQueryChanged)
];
