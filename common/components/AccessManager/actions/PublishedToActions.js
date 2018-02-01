// Typing into the publishedTo search box
export const PUBLISHED_TO_SEARCH_QUERY_CHANGED = 'PUBLISHED_TO_SEARCH_QUERY_CHANGED';
export const publishedToSearchQueryChanged = query => ({
  type: PUBLISHED_TO_SEARCH_QUERY_CHANGED,
  query
});

// Getting results back from the catalog
export const PUBLISHED_TO_SEARCH_RESULTS_FETCH_SUCCESS = 'PUBLISHED_TO_SEARCH_RESULTS_FETCH_SUCCESS';
export const publishedToSearchResultsFetchSuccess = results => ({
  type: PUBLISHED_TO_SEARCH_RESULTS_FETCH_SUCCESS,
  results
});

// Failed to get results from catalog
export const PUBLISHED_TO_SEARCH_RESULTS_FETCH_FAIL = 'PUBLISHED_TO_SEARCH_RESULTS_FETCH_FAIL';
export const publishedToSearchResultsFetchFail = error => ({
  type: PUBLISHED_TO_SEARCH_RESULTS_FETCH_FAIL,
  error
});

// Add a publishedTo to the combobox
export const ADD_SELECTED_PUBLISHED_TO = 'ADD_SELECTED_PUBLISHED_TO';
export const addSelectedPublishedTo = user => ({
  type: ADD_SELECTED_PUBLISHED_TO,
  user
});

// Remove a publishedTo from the combobox
export const REMOVE_SELECTED_PUBLISHED_TO = 'REMOVE_SELECTED_PUBLISHED_TO';
export const removeSelectedPublishedTo = user => ({
  type: REMOVE_SELECTED_PUBLISHED_TO,
  user
});
