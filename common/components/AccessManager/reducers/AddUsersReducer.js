import * as addUsersActions from 'common/components/AccessManager/actions/AddUsersActions';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';
import * as uiActions from 'common/components/AccessManager/actions/UiActions';

// user is typing into the search box
const userSearchQueryChanged = (state, action) => ({
  ...state,
  query: action.query,

  // blank out the results if we have no query
  results: null
});

// AddUsersSaga will call this with the search results from the catalog
const userSearchResultsFetchSuccess = (state, action) => ({
  ...state,
  results: action.results
});

// AddUsersSaga will call this when catalog query fails
const userSearchResultsFetchFail = (state, action) => {
  console.error('Error fetching user search results', action.error);
  return state;
};

// User is selected from the search reuslts
const addSelectedUser = (state, action) => {
  const selectedUsers = state.selectedUsers || [];

  return {
    ...state,
    selectedUsers: [...selectedUsers, action.user],
    results: null,
    query: ''
  };
};

// Remove a user that has been selected
const removeSelectedUser = (state, action) => {
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

// Access level dropdown next to the search box has been changed
const accessLevelChanged = (state, action) => ({
  ...state,
  accessLevel: action.level.value
});


const resetState = (state) => ({
  ...state,
  selectedUsers: [],
  accessLevel: null,
  query: '',
  results: null
});

export default (state = {}, action) => {
  switch (action.type) {
    // addUsersActions
    case addUsersActions.USER_SEARCH_QUERY_CHANGED:
      return userSearchQueryChanged(state, action);
    case addUsersActions.USER_SEARCH_RESULTS_FETCH_SUCCESS:
      return userSearchResultsFetchSuccess(state, action);
    case addUsersActions.USER_SEARCH_RESULTS_FETCH_FAIL:
      return userSearchResultsFetchFail(state, action);
    case addUsersActions.ADD_SELECTED_USER:
      return addSelectedUser(state, action);
    case addUsersActions.REMOVE_SELECTED_USER:
      return removeSelectedUser(state, action);
    case addUsersActions.ACCESS_LEVEL_CHANGED:
      return accessLevelChanged(state, action);

    case permissionsActions.ADD_USERS: // Dispatched when the "confirm" button is clicked and the users have been added to the list of users with access
    case uiActions.CANCEL_BUTTON_CLICKED: // Dispatched when the "cancel" button is clicked
      return resetState(state, action);
    default:
      return state;
  }
};
