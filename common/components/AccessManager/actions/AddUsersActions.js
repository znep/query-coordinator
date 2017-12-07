// Typing into the user search box
export const USER_SEARCH_QUERY_CHANGED = 'USER_SEARCH_QUERY_CHANGED';
export const userSearchQueryChanged = query => ({
  type: USER_SEARCH_QUERY_CHANGED,
  query
});

// Getting results back from the catalog
export const USER_SEARCH_RESULTS_FETCH_SUCCESS = 'USER_SEARCH_RESULTS_FETCH_SUCCESS';
export const userSearchResultsFetchSuccess = results => ({
  type: USER_SEARCH_RESULTS_FETCH_SUCCESS,
  results
});

// Failed to get results from catalog
export const USER_SEARCH_RESULTS_FETCH_FAIL = 'USER_SEARCH_RESULTS_FETCH_FAIL';
export const userSearchResultsFetchFail = error => ({
  type: USER_SEARCH_RESULTS_FETCH_FAIL,
  error
});

// Add a user to the combobox
export const ADD_SELECTED_USER = 'ADD_SELECTED_USER';
export const addSelectedUser = user => ({
  type: ADD_SELECTED_USER,
  user
});

// Remove a user from the combobox
export const REMOVE_SELECTED_USER = 'REMOVE_SELECTED_USER';
export const removeSelectedUser = user => ({
  type: REMOVE_SELECTED_USER,
  user
});

// Desired access level for the users that have been selected has changed
export const ACCESS_LEVEL_CHANGED = 'ACCESS_LEVEL_CHANGED';
export const accessLevelChanged = level => ({
  type: ACCESS_LEVEL_CHANGED,
  level
});
