import * as publishedToActions from 'common/components/AccessManager/actions/PublishedToActions';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';
import * as uiActions from 'common/components/AccessManager/actions/UiActions';

// user is typing into the search box
const publishedToSearchQueryChanged = (state, action) => ({
  ...state,
  query: action.query,

  // blank out the results if we have no query
  results: null
});

// AddUsersSaga will call this with the search results from the catalog
const publishedToSearchResultsFetchSuccess = (state, action) => ({
  ...state,
  results: action.results
});

// AddUsersSaga will call this when catalog query fails
const publishedToSearchResultsFetchFail = (state, action) => {
  console.error('Error fetching user search results', action.error);
  return state;
};

// User is selected from the search reuslts
const addSelectedPublishedTo = (state, action) => {
  const selectedUsers = state.selectedUsers || [];

  return {
    ...state,
    selectedUsers: [...selectedUsers, action.user],
    results: null,
    query: ''
  };
};

// Remove a user that has been selected
const removeSelectedPublishedTo = (state, action) => {
  const selectedUsers = state.selectedUsers || [];

  let indexToRemove = null;

  // ideally, we have the user id here
  // sometimes, however, we have to rely on the email address
  // (note to self: should we just _always_ rely on email? What about for teams?)
  if (action.user.id) {
    indexToRemove = selectedUsers.findIndex(user => user.id === action.user.id);
  } else {
    indexToRemove = selectedUsers.findIndex(user => user.email === action.user.email);
  }

  if (indexToRemove !== null) {
    selectedUsers.splice(indexToRemove, 1);
  }

  return {
    ...state,
    selectedUsers: [...selectedUsers]
  };
};

const resetState = (state) => ({
  ...state,
  selectedUsers: [],
  query: '',
  results: null
});

export default (state = {}, action) => {
  switch (action.type) {
    // publishedToActions
    case publishedToActions.PUBLISHED_TO_SEARCH_QUERY_CHANGED:
      return publishedToSearchQueryChanged(state, action);
    case publishedToActions.PUBLISHED_TO_SEARCH_RESULTS_FETCH_SUCCESS:
      return publishedToSearchResultsFetchSuccess(state, action);
    case publishedToActions.PUBLISHED_TO_SEARCH_RESULTS_FETCH_FAIL:
      return publishedToSearchResultsFetchFail(state, action);
    case publishedToActions.ADD_SELECTED_PUBLISHED_TO:
      return addSelectedPublishedTo(state, action);
    case publishedToActions.REMOVE_SELECTED_PUBLISHED_TO:
      return removeSelectedPublishedTo(state, action);

    case permissionsActions.ADD_USERS: // Dispatched when the "Add" button is clicked and the users have been added to the list of users with access
    case uiActions.CANCEL_BUTTON_CLICKED: // Dispatched when the "cancel" button is clicked
      return resetState(state, action);
    default:
      return state;
  }
};
