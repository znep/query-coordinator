// Typing into the owner search box
export const OWNER_SEARCH_QUERY_CHANGED = 'OWNER_SEARCH_QUERY_CHANGED';
export const ownerSearchQueryChanged = query => ({
  type: OWNER_SEARCH_QUERY_CHANGED,
  query
});

// Getting results back from catalog
export const OWNER_SEARCH_RESULTS_FETCH_SUCCESS = 'OWNER_SEARCH_RESULTS_FETCH_SUCCESS';
export const ownerSearchResultsFetchSuccess = results => ({
  type: OWNER_SEARCH_RESULTS_FETCH_SUCCESS,
  results
});

// Failed to get results from catalog
export const OWNER_SEARCH_RESULTS_FETCH_FAIL = 'OWNER_SEARCH_RESULTS_FETCH_FAIL';
export const ownerSearchResultsFetchFail = error => ({
  type: OWNER_SEARCH_RESULTS_FETCH_FAIL,
  error
});

// Add a owner to the combobox
export const ADD_SELECTED_OWNER = 'ADD_SELECTED_OWNER';
export const addSelectedOwner = owner => ({
  type: ADD_SELECTED_OWNER,
  owner
});

// Remove the pending owner from the combobox
export const REMOVE_SELECTED_OWNER = 'REMOVE_SELECTED_OWNER';
export const removeSelectedOwner = owner => ({
  type: REMOVE_SELECTED_OWNER,
  owner
});

// Confirm changing ownership to the selected owner
export const CONFIRM_SELECTED_OWNER = 'CONFIRM_SELECTED_OWNER';
export const confirmSelectedOwner = owner => ({
  type: CONFIRM_SELECTED_OWNER,
  owner
});
