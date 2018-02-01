import { delay } from 'redux-saga';
import { takeLatest, call, put, select } from 'redux-saga/effects';

import {
  getDomain,
  userAndTeamAutocompleteUrl,
  fetchJsonWithDefaults
} from 'common/components/AccessManager/Util';
import { CATALOG_SEARCH_DEBOUNCE_MILLISECONDS, USER_TYPES } from 'common/components/AccessManager/Constants';

import * as addCollaboratorsActions from 'common/components/AccessManager/actions/AddCollaboratorsActions';

import { getAddedUsers } from './Selectors';

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
      const unmappedResults = yield call(
        fetchJsonWithDefaults,
        userAndTeamAutocompleteUrl(query, domain || getDomain())
      );

      // TODO: EN-21982 - Reassess remapping these results
      const results = {
        ...unmappedResults,
        results: unmappedResults.results.map(
          result => (
            result.team ?
            { ...result, user: { ...result.team, type: USER_TYPES.TEAM } } :
            { ...result, user: { ...result.user, type: USER_TYPES.INTERACTIVE } })
        )
      };

      const addedUsers = yield select(getAddedUsers);

      yield put(addCollaboratorsActions.collaboratorsSearchResultsFetchSuccess(results, addedUsers));
    } catch (error) {
      console.error('Error fetching user search results', error);
      yield put(addCollaboratorsActions.collaboratorsSearchResultsFetchFail(error));
    }
  }
}

export default [takeLatest(addCollaboratorsActions.COLLABORATORS_SEARCH_QUERY_CHANGED, collaboratorsSearchQueryChanged)];
