import * as addCollaboratorsActions from 'common/components/AccessManager/actions/AddCollaboratorsActions';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';
import * as uiActions from 'common/components/AccessManager/actions/UiActions';
import { filterSearchResults } from 'common/components/AccessManager/Util';

// user is typing into the search box
const collaboratorsSearchQueryChanged = (state, action) => ({
  ...state,
  query: action.query,

  // blank out the results if we have no query
  results: null
});

// AddUsersSaga will call this with the search results from the catalog
export const collaboratorsSearchResultsFetchSuccess = (state, { payload: { results, existingUsers } }) => ({
  ...state,
  results: filterSearchResults(results, state.selectedUsers, existingUsers, state.query)
});

// User is selected from the search reuslts
const addSelectedCollaborator = (state, { user }) => ({
  ...state,
  selectedUsers: [...state.selectedUsers, user],
  results: null,
  query: ''
});

// Remove a user that has been selected
const removeSelectedCollaborator = (state, { user }) => ({
  ...state,
  selectedUsers: state.selectedUsers.filter(u => (user.id ? user.id !== u.id : user.email !== u.email))
});

// Access level dropdown next to the search box has been changed
const selectedCollaboratorAccessLevelChanged = (state, action) => ({
  ...state,
  accessLevel: action.level.value
});

const resetState = state => ({
  ...state,
  selectedUsers: [],
  accessLevel: null,
  query: '',
  results: null
});

const initialState = {
  query: '',
  results: null,
  selectedUsers: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    // addCollaboratorsActions
    case addCollaboratorsActions.COLLABORATORS_SEARCH_QUERY_CHANGED:
      return collaboratorsSearchQueryChanged(state, action);
    case addCollaboratorsActions.COLLABORATORS_SEARCH_RESULTS_FETCH_SUCCESS:
      return collaboratorsSearchResultsFetchSuccess(state, action);
    case addCollaboratorsActions.ADD_SELECTED_COLLABORATOR:
      return addSelectedCollaborator(state, action);
    case addCollaboratorsActions.REMOVE_SELECTED_COLLABORATOR:
      return removeSelectedCollaborator(state, action);
    case addCollaboratorsActions.SELECTED_COLLABORATOR_ACCESS_LEVEL_CHANGED:
      return selectedCollaboratorAccessLevelChanged(state, action);

    case permissionsActions.ADD_USERS: // Dispatched when the "confirm" button is clicked and the users have been added to the list of users with access
    case uiActions.CANCEL_BUTTON_CLICKED: // Dispatched when the "cancel" button is clicked
      return resetState(state, action);
    default:
      return state;
  }
};
