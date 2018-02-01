import isEmail from 'validator/lib/isEmail';
import { put } from 'redux-saga/effects';

import { assetWillEnterApprovalsQueueOnPublish } from 'common/asset/utils';

import * as uiActions from 'common/components/AccessManager/actions/UiActions';
import { AUDIENCE_SCOPES } from 'common/components/AccessManager/Constants';

import { DOMAIN_RIGHTS, MODES } from './Constants';
import { fetchJsonWithDefaultHeaders } from '../../http';

import fp from 'lodash/fp';

/**
 * Returns true is the "userList" already contains a user that has the
 * given email.
 * @param {array} userList List of users with emails
 * @param {string} email Email to check for
 */
const userListContainsEmail =
  (userList, email) => userList && userList.some(user => user.email === email);

/**
 * Returns true if the given email has already been used in some fashion for this view
 * @param {array} selectedUsers List of users selected from multiselect
 * @param {array} addedUsers List of users who currently have access to the view
 * @param {string} email Email to check for
 */
const userWithEmailAbsent =
  (selectedUsers, addedUsers, email) =>
    !userListContainsEmail(selectedUsers, email) &&
    !userListContainsEmail(addedUsers, email);

/**
 * Returns true if the given email exists in the list of users given
 * @param {string} email Email to search for
 * @param {array} results List of users to check for email in
 */
const emailExistsInResults = (email, results) => results.some(result => result.user.email === email);

/**
 * Filter a list of search results to not display users that have already been selected in some way
 * @param {array} searchResults List of search results
 * @param {array} selectedUsers Users that have already been selected in the combo box
 * @param {array} addedUsers Users that have already been added with persmissions
 * @param query
 */
export const filterSearchResults = (searchResults, selectedUsers, addedUsers, query) => {
  // filter out any results of users that have already been added to this view
  const filteredResults = searchResults.results.filter(
    result => userWithEmailAbsent(selectedUsers, addedUsers, result.user.email)
  );

  // if the search query is a valid email address, we add it to the end
  // to allow users to add unregistered users to the view
  if (
    isEmail(query) &&
    userWithEmailAbsent(selectedUsers, addedUsers, query) &&
    !emailExistsInResults(query, searchResults.results)) {
    filteredResults.push({
      user: {
        email: query
      }
    });
  }

  return {
    ...searchResults,
    results: [...filteredResults]
  };
};

/**
 * Filters out the current owner from the list of search results
 * @param {array} searchResults Results to filter
 * @param {object} currentOwner Current owner of asset
 */
export const filterOwnerSearchResults =
  (searchResults, currentOwner) => ({
    ...searchResults,
    results: searchResults.results.filter(result => result.user.email !== currentOwner.email)
  });

/**
 * Check whether the given user is allowed to change the owner of an asset
 * @param {object} user User to check for ability to change owner
 */
export const userCanChangeOwner =
  user => user && ((user.rights || []).includes(DOMAIN_RIGHTS.CHOWN_DATASETS));

/**
 * Find a user in a given list with the given access level
 * @param {array} users List of users
 * @param {string} accessLevel Access level to find
 */
export const findUserWithAccessLevel = (users, accessLevel) => users.find(
  user => userHasAccessLevel(user, accessLevel)
);

/**
 * Find the index of a user in the given list with the given access level
 * @param {array} users List of users
 * @param {string} accessLevel Access level to find
 */
export const findUserIndexWithAccessLevel = (users, accessLevel) => users.findIndex(
  user => userHasAccessLevel(user, accessLevel)
);

/**
 * Determine if the given user has the given access level
 * @param {object} user User to check
 * @param {string} accessLevel Access level to check
 * @param {string} accessLevelVersion (Optional) Version to check for
 */
export const userHasAccessLevel =
  (user, accessLevel, accessLevelVersion) =>
    user.accessLevels.some(
      level =>
        level.name === accessLevel &&
        (!accessLevelVersion || (accessLevelVersion === level.version))
    );

// TODO don't use window.location.host here (or maybe it's fine...?)
/**
 * Get the current domain
 */
export const getDomain = () => window.location.host;

const userAutocompletePath = '/api/catalog/v1/users/autocomplete';

const buildQueryString = fp.flow(
  fp.toPairs,
  fp.filter(([_, v]) => !fp.isNil(v)),
  fp.map(([k, v]) => [k, encodeURIComponent(v)]),
  fp.map(fp.join('=')),
  fp.join('&')
);

/**
 * Get the URL to hit to query the catalog for a list of users.
 * @param {string} query User search query
 * @param {boolean} domain Whether to include the domain in the query (will only return roled users)
 */
export const userAndTeamAutocompleteUrl = (query, domain) =>
  fp.flow(fp.compact, fp.join('?'))([
    userAutocompletePath,
    buildQueryString({
      q: query,
      include_teams: true,
      domain: domain
    })
  ]);

/**
 * Get the url to hit for the permissions of an asset
 * @param {string} assetUid UID (4x4) of asset to get/put permissions for
 */
export const permissionsUrl = (assetUid) => `/api/views/${assetUid}/permissions`;

/**
 * Get the url to hit to publish an asset
 * @param {string} assetUid UID (4x4) of asset to get/put permissions for
 */
export const publishUrl = (assetUid) => `/api/views/${assetUid}/publication.json`;

/**
 * Determines if, when saving, the asset should be published after changing
 * its permissions.
 * @param {string} mode Current mode of access manager
 */
export const shouldPublishOnSave = (mode) => mode === MODES.PUBLISH;

/**
 * Whather or not the "Confim" button in the footer should default to disabled
 * when the access manager opens up with the given mode
 * @param {string} mode Current mode of access manager
 */
export const confirmButtonDisabledByDefault = (mode) =>
  mode === MODES.CHANGE_OWNER ||

  // if changing audience or publishing,
  // a saga will check if the asset will go into approvals
  // and then set the status of the button afterwards (see uiReducer/sagas)
  mode === MODES.CHANGE_AUDIENCE ||
  mode === MODES.PUBLISH;

/**
 * Whether or not the "Confirm" button in the footer should default to busy
 * when the access manager comes up in the given mode
 * @param {string} mode  Current mode of access manager
 */
export const confirmButtonBusyByDefault = (mode) =>
  // if changing audience or publishing,
  // a saga will check if the asset will go into approvals
  // and then set the status of the button afterwards (see uiReducer/sagas)
  mode === MODES.CHANGE_AUDIENCE ||
  mode === MODES.PUBLISH;

/**
 * Returns a promise of a fetch call with the given url and options,
 * along with some defaults
 * @param {string} url URL to fetch
 * @param {object} options Options to pass to fetch (Optional)
 */
export const fetchJsonWithDefaults = (url, options = {}) => fetchJsonWithDefaultHeaders(
  url,
  {
    credentials: 'same-origin',
    ...options
  }
);

/**
 * Intended to be yield-ed in a saga; will end in a put with an action
 * that will determine if the approval message should be shown
 * @param {object} coreView View object
 * @param {string} scope Scope view will have
 */
export function* checkWillEnterApprovalQueue(coreView, scope) {
  // if the scope it changing to "Public" then we want to check if we should
  // show the approval message
  if (scope === AUDIENCE_SCOPES.PUBLIC) {
    const showApprovalMessage =
      yield assetWillEnterApprovalsQueueOnPublish({ coreView, assetWillBePublic: true });

    yield put(uiActions.showApprovalMessageChanged(showApprovalMessage));
  } else {
    yield put(uiActions.showApprovalMessageChanged(false));
  }
}
