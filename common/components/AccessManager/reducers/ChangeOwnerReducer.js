import * as changeOwnerActions from '../actions/ChangeOwnerActions';

/*
 * NOTE for this reducer:
 * I was lazy when making this and operated on the assumption
 * that we will only ever have one "true owner" of a dataset.
 * Hence a lot of this is assuming we're working with an array
 * that is always length 1.
 */

// called by ChangeOwnerSaga when users are fetched from the catalog
const ownerSearchResultsFetchSuccess = (state, action) => ({
  ...state,
  results: action.results
});

// failed to get results from the catalog
const ownerSearchResultsFetchFail = (state, action) => {
  console.error('Error fetching user search results', action.error);
  return state;
};

// user is typing into the search box
const ownerSearchQueryChanged = (state, action) => ({
  ...state,
  query: action.query
});

// a user is selected from the search results
const addSelectedOwner = (state, action) => ({
  ...state,
  selectedOwner: [action.owner],
  query: ''
});

// remove the selected user
const removeSelectedOwner = (state) => ({
  ...state,
  selectedOwner: [],
  query: ''
});

export default (state = {}, action) => {
  switch (action.type) {
    case changeOwnerActions.OWNER_SEARCH_RESULTS_FETCH_SUCCESS:
      return ownerSearchResultsFetchSuccess(state, action);
    case changeOwnerActions.OWNER_SEARCH_RESULTS_FETCH_FAIL:
      return ownerSearchResultsFetchFail(state, action);
    case changeOwnerActions.OWNER_SEARCH_QUERY_CHANGED:
      return ownerSearchQueryChanged(state, action);
    case changeOwnerActions.ADD_SELECTED_OWNER:
      return addSelectedOwner(state, action);
    case changeOwnerActions.REMOVE_SELECTED_OWNER:
      return removeSelectedOwner(state, action);
    case changeOwnerActions.CONFIRM_SELECTED_OWNER:
      // see the AccessManagerReducer for where the owner is actually changed
      // here we're basically "resetting" the change owner component
      return removeSelectedOwner(state, action);
    default:
      return state;
  }
};
