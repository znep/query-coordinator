/** Load teams **/
export const LOAD_TEAMS = 'LOAD_TEAMS';
export const LOAD_TEAMS_SUCCESS = 'LOAD_TEAMS_SUCCESS';
export const LOAD_TEAMS_FAILURE = 'LOAD_TEAMS_FAILURE';

export const loadTeams = () => ({ type: LOAD_TEAMS });
export const loadTeamsSuccess = teams => ({ type: LOAD_TEAMS_SUCCESS, payload: { teams } });
export const loadTeamsFailure = error => ({ type: LOAD_TEAMS_FAILURE, error: true, payload: { error } });

/** Load Team Roles **/
export const LOAD_TEAM_ROLES = 'LOAD_TEAM_ROLES';
export const LOAD_TEAM_ROLES_SUCCESS = 'LOAD_TEAM_ROLES_SUCCESS';
export const LOAD_TEAM_ROLES_FAILURE = 'LOAD_TEAM_ROLES_FAILURE';

export const loadTeamRoles = () => ({ type: LOAD_TEAM_ROLES });
export const loadTeamRolesSuccess = teamRoles => ({ type: LOAD_TEAM_ROLES_SUCCESS, payload: { teamRoles } });
export const loadTeamRolesFailure = error => ({
  type: LOAD_TEAM_ROLES_FAILURE,
  error: true,
  payload: { error }
});

/** Delete Team **/
export const DELETE_TEAM = 'DELETE_TEAM';
export const DELETE_TEAM_SUCCESS = 'DELETE_TEAM_SUCCESS';
export const DELETE_TEAM_FAILURE = 'DELETE_TEAM_FAILURE';
export const deleteTeam = id => ({ type: DELETE_TEAM, payload: { id } });
export const deleteTeamSuccess = id => ({ type: DELETE_TEAM_SUCCESS, payload: { id } });
export const deleteTeamFailure = error => ({ type: DELETE_TEAM_FAILURE, error: true, payload: { error } });

/** Edit Team **/
export const EDIT_TEAM = 'EDIT_TEAM';
export const EDIT_TEAM_SUCCESS = 'EDIT_TEAM_SUCCESS';
export const EDIT_TEAM_FAILURE = 'EDIT_TEAM_FAILURE';
export const editTeam = id => ({ type: EDIT_TEAM, payload: { id } });
export const editTeamSuccess = team => ({ type: EDIT_TEAM_SUCCESS, payload: { team } });
export const editTeamFailure = error => ({ type: EDIT_TEAM_FAILURE, error: true, payload: { error } });

/** Add Team **/
export const ADD_TEAM = 'ADD_TEAM';
export const ADD_TEAM_SUCCESS = 'ADD_TEAM_SUCCESS';
export const ADD_TEAM_FAILURE = 'ADD_TEAM_FAILURE';
export const addTeam = () => ({ type: ADD_TEAM });
export const addTeamSuccess = team => ({ type: ADD_TEAM_SUCCESS, payload: { team } });
export const addTeamFailure = error => ({ type: ADD_TEAM_FAILURE, error: true, payload: { error } });

/** Edit Team Modal Actions **/
export const SHOW_EDIT_TEAM_MODAL = 'SHOW_EDIT_TEAM_MODAL';
export const HIDE_EDIT_TEAM_MODAL = 'HIDE_EDIT_TEAM_MODAL';
export const DISABLE_EDIT_TEAM_MODAL = 'DISABLE_EDIT_TEAM_MODAL';
export const ENABLE_EDIT_TEAM_MODAL = 'ENABLE_EDIT_TEAM_MODAL';
export const CANCEL_EDIT_TEAM_MODAL = 'CANCEL_EDIT_TEAM_MODAL';
export const SUBMIT_EDIT_TEAM_MODAL = 'SUBMIT_EDIT_TEAM_MODAL';
export const showEditTeamModal = () => ({ type: SHOW_EDIT_TEAM_MODAL });
export const hideEditTeamModal = () => ({ type: HIDE_EDIT_TEAM_MODAL });
export const disableEditTeamModal = () => ({ type: DISABLE_EDIT_TEAM_MODAL });
export const enableEditTeamModal = () => ({ type: ENABLE_EDIT_TEAM_MODAL });
export const cancelEditTeamModal = () => ({ type: CANCEL_EDIT_TEAM_MODAL });
export const submitEditTeamModal = () => ({ type: SUBMIT_EDIT_TEAM_MODAL });

/** Form Actions **/
export const SET_TEAM_FORM_ERRORS = 'SET_TEAM_FORM_ERRORS';
export const setTeamFormErrors = errors => ({ type: SET_TEAM_FORM_ERRORS, payload: { errors } });
export const clearTeamFormErrors = () => ({ type: SET_TEAM_FORM_ERRORS, payload: { errors: [] } });

export const SET_TEAM_FORM = 'SET_TEAM_FORM';
export const setTeamForm = (id, screenName, description) => ({
  type: SET_TEAM_FORM,
  payload: { id, screenName, description }
});

export const ADD_TEAM_MEMBERS = 'ADD_TEAM_MEMBERS';
export const ADD_TEAM_MEMBER_SUCCESS = 'ADD_TEAM_MEMBER_SUCCESS';
export const ADD_TEAM_MEMBER_FAILURE = 'ADD_TEAM_MEMBER_FAILURE';
export const addTeamMembers = teamId => ({ type: ADD_TEAM_MEMBERS, payload: { teamId } });
export const addTeamMemberSuccess = (teamId, newMember) => ({
  type: ADD_TEAM_MEMBER_SUCCESS,
  payload: { teamId, newMember }
});
export const addTeamMemberFailure = error => ({
  type: ADD_TEAM_MEMBER_FAILURE,
  error: true,
  payload: { error }
});

/** Edit Team Modal Actions **/
export const SHOW_ADD_TEAM_MEMBERS_MODAL = 'SHOW_ADD_TEAM_MEMBERS_MODAL';
export const HIDE_ADD_TEAM_MEMBERS_MODAL = 'HIDE_ADD_TEAM_MEMBERS_MODAL';
export const DISABLE_ADD_TEAM_MEMBERS_MODAL = 'DISABLE_ADD_TEAM_MEMBERS_MODAL';
export const ENABLE_ADD_TEAM_MEMBERS_MODAL = 'ENABLE_ADD_TEAM_MEMBERS_MODAL';
export const CANCEL_ADD_TEAM_MEMBERS_MODAL = 'CANCEL_ADD_TEAM_MEMBERS_MODAL';
export const SUBMIT_ADD_TEAM_MEMBERS_MODAL = 'SUBMIT_ADD_TEAM_MEMBERS_MODAL';
export const showAddTeamMembersModal = () => ({ type: SHOW_ADD_TEAM_MEMBERS_MODAL });
export const hideAddTeamMembersModal = () => ({ type: HIDE_ADD_TEAM_MEMBERS_MODAL });
export const disableAddTeamMembersModal = () => ({ type: DISABLE_ADD_TEAM_MEMBERS_MODAL });
export const enableAddTeamMembersModal = () => ({ type: ENABLE_ADD_TEAM_MEMBERS_MODAL });
export const cancelAddTeamMembersModal = () => ({ type: CANCEL_ADD_TEAM_MEMBERS_MODAL });
export const submitAddTeamMembersModal = () => ({ type: SUBMIT_ADD_TEAM_MEMBERS_MODAL });

// TODO: Debounce/throttle?
export const UPDATE_TEAM_FORM = 'UPDATE_TEAM_FORM';
export const updateTeamForm = (screenName, description) => ({
  type: UPDATE_TEAM_FORM,
  payload: { screenName, description }
});

export const LOAD_TEAM = 'LOAD_TEAM';
export const LOAD_TEAM_SUCCESS = 'LOAD_TEAM_SUCCESS';
export const LOAD_TEAM_FAILURE = 'LOAD_TEAM_FAILURE';
export const loadTeam = id => ({ type: LOAD_TEAM, payload: { id } });
export const loadTeamSuccess = team => ({ type: LOAD_TEAM_SUCCESS, payload: { team } });
export const loadTeamFailure = error => ({ type: LOAD_TEAM_FAILURE, error: true, payload: { error } });

export const REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER';
export const REMOVE_TEAM_MEMBER_SUCCESS = 'REMOVE_TEAM_MEMBER_SUCCESS';
export const removeTeamMember = (teamId, userId) => ({
  type: REMOVE_TEAM_MEMBER,
  payload: { teamId, userId }
});
export const removeTeamMemberSuccess = (teamId, userId) => ({
  type: REMOVE_TEAM_MEMBER_SUCCESS,
  payload: { teamId, userId }
});

export const CHANGE_MEMBER_ROLE = 'CHANGE_MEMBER_ROLE';
export const CHANGE_MEMBER_ROLE_SUCCESS = 'CHANGE_MEMBER_ROLE_SUCCESS';
export const changeMemberRole = (teamId, userId, roleId) => ({
  type: CHANGE_MEMBER_ROLE,
  payload: { teamId, userId, roleId }
});
export const changeMemberRoleSuccess = (teamId, userId, roleId) => ({
  type: CHANGE_MEMBER_ROLE_SUCCESS,
  payload: { teamId, userId, roleId }
});

/** User Search Actions */
// Called when a user is selected in the multiselect
// Receives a search result, but adds the user object portion of that to the state
export const USER_SEARCH_ADD_SELECTED_USER = 'USER_SEARCH_ADD_SELECTED_USER';
export const userSearchAddSelectedUser = ({ user }) => ({
  type: USER_SEARCH_ADD_SELECTED_USER,
  payload: { user }
});

// Called when removing a selected user from the multiselect
// (either clicking the remove button or hitting backspace)
export const USER_SEARCH_REMOVE_SELECTED_USER = 'USER_SEARCH_REMOVE_SELECTED_USER';
export const userSearchRemoveSelectedUser = user => ({
  type: USER_SEARCH_REMOVE_SELECTED_USER,
  payload: { user }
});

// Called when the user is typing in to the search box
export const USER_SEARCH_QUERY_CHANGED = 'USER_SEARCH_QUERY_CHANGED';
export const userSearchQueryChanged = currentQuery => ({
  type: USER_SEARCH_QUERY_CHANGED,
  payload: { currentQuery }
});

export const USER_SEARCH_RESULTS = 'USER_SEARCH_RESULTS';
export const userSearchResults = results => ({ type: USER_SEARCH_RESULTS, payload: { results } });

export const TEAM_VIEW_NAVIGATION = 'TEAM_VIEW_NAVIGATION';
export const teamViewNavigation = id => ({ type: TEAM_VIEW_NAVIGATION, payload: { id } });
