import isEmail from 'validator/lib/isEmail';
import { DOMAIN_RIGHTS } from './Constants';
import { fetchJson } from '../../http';

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
 * @param {array} results List of search results
 * @param {array} selectedUsers Users that have already been selected in the combo box
 * @param {array} addedUsers Users that have already been added with persmissions
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
 */
export const userHasAccessLevel =
  (user, accessLevel) => user.accessLevels.some(level => level.name === accessLevel);

// TODO don't use window.location.host here (or maybe it's fine...?)
/**
 * Get the current domain
 */
export const getDomain = () => window.location.host;

/**
 * Get the URL to hit to query the catalog for a list of users.
 * @param {string} query User search query
 * @param {boolean} includeDomain Whether to include the domain in the querY (will only return roled users)
 */
export const userAutocompleteUrl = (query, domain) => `/api/catalog/v1/users/autocomplete?q=${encodeURIComponent(query)}${domain ? `&domain=${domain}` : ''}`; // eslint-disable-line max-len

/**
 * Get the url to hit for the permissions of an asset
 * @param {string} assetUid UID (4x4) of asset to get/put permissions for
 */
export const permissionsUrl = (assetUid) => `/api/views/${assetUid}/permissions`;

/**
 * Returns a promise of a fetch call with the given url and options,
 * along with some defaults
 * @param {string} url URL to fetch
 * @param {object} options Options to pass to fetch (Optional)
 */
export const fetchJsonWithDefaults = (url, options = {}) => fetchJson(
  url,
  {
    credentials: 'same-origin',
    ...options
  }
);
