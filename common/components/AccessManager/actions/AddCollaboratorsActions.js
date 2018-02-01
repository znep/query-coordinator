// Typing into the user search box
export const COLLABORATORS_SEARCH_QUERY_CHANGED = 'COLLABORATORS_SEARCH_QUERY_CHANGED';
export const collaboratorsSearchQueryChanged = query => ({
  type: COLLABORATORS_SEARCH_QUERY_CHANGED,
  query
});

// Getting results back from the catalog
export const COLLABORATORS_SEARCH_RESULTS_FETCH_SUCCESS = 'COLLABORATORS_SEARCH_RESULTS_FETCH_SUCCESS';
export const collaboratorsSearchResultsFetchSuccess = results => ({
  type: COLLABORATORS_SEARCH_RESULTS_FETCH_SUCCESS,
  results
});

// Failed to get results from catalog
export const COLLABORATORS_SEARCH_RESULTS_FETCH_FAIL = 'COLLABORATORS_SEARCH_RESULTS_FETCH_FAIL';
export const collaboratorsSearchResultsFetchFail = error => ({
  type: COLLABORATORS_SEARCH_RESULTS_FETCH_FAIL,
  error
});

// Add a user to the combobox
export const ADD_SELECTED_COLLABORATOR = 'ADD_SELECTED_COLLABORATOR';
export const addSelectedCollaborator = user => ({
  type: ADD_SELECTED_COLLABORATOR,
  user
});

// Remove a user from the combobox
export const REMOVE_SELECTED_COLLABORATOR = 'REMOVE_SELECTED_COLLABORATOR';
export const removeSelectedCollaborator = user => ({
  type: REMOVE_SELECTED_COLLABORATOR,
  user
});

// Desired access level for the users that have been selected has changed
export const SELECTED_COLLABORATOR_ACCESS_LEVEL_CHANGED = 'SELECTED_COLLABORATOR_ACCESS_LEVEL_CHANGED';
export const selectedCollaboratorAccessLevelChanged = level => ({
  type: SELECTED_COLLABORATOR_ACCESS_LEVEL_CHANGED,
  level
});
