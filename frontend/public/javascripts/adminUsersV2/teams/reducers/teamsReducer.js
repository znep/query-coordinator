import compact from 'lodash/fp/compact';
import curryRight from 'lodash/fp/curryRight';
import eq from 'lodash/fp/eq';
import filter from 'lodash/fp/filter';
import find from 'lodash/fp/find';
import flow from 'lodash/fp/flow';
import get from 'lodash/fp/get';
import getOr from 'lodash/fp/getOr';
import includes from 'lodash/fp/includes';
import map from 'lodash/fp/map';
import negate from 'lodash/fp/negate';
import partialRight from 'lodash/fp/partialRight';
import set from 'lodash/fp/set';
import uniqBy from 'lodash/fp/uniqBy';
import * as Actions from '../actions';

export const initialState = {
  addMemberErrors: [],
  addMemberSuccesses: [],
  currentTeamId: null,
  offset: 0,
  // orderBy: SORT_KEYS.SCREEN_NAME,
  // sortDirection: SORT_DIRECTION.ASC,
  resultCount: 0,
  teamForm: { id: null, screenName: '', description: '', errors: [] },
  teams: [],
  teamRoles: [],
  userSearch: {
    currentQuery: '',
    results: null,
    selectedUsers: []
  }
};

export const getUserId = get('id');
export const getUserScreenName = get('screen_name');

const handleLoadTeamsSuccess = (state, { teams }) => ({ ...state, teams });
const clearForm = set('teamForm', { ...initialState.teamForm });

const handleUpdateTeamForm = (state, { screenName, description }) =>
  set('teamForm', { screenName, description, errors: [] }, state);

const handleLoadTeamSuccess = (state, { team }) =>
  set('teams', getTeamsList(state).map(t => (t.id === team.id ? team : t)), state);

const handleLoadTeamRolesSuccess = (state, { teamRoles }) => ({ ...state, teamRoles });

// TODO: Use the team that is returned
const handleAddTeamSuccess = (state, { team }) => ({
  ...state,
  teams: [
    ...state.teams,
    team
  ],
  teamForm: { ...initialState.teamForm }
});

const handleEditTeamSuccess = (state, { team }) => ({
  ...state,
  teams: state.teams.map(
    t =>
      t.id === team.id
        ? {
            id: t.id,
            screenName: state.teamForm.screenName,
            description: state.teamForm.description,
            members: t.members
          }
        : t
  ),
  teamForm: { ...initialState.teamForm }
});

const handleSetTeamFormErrors = (state, { errors }) => ({
  ...state,
  teamForm: { ...state.teamForm, errors }
});

const handleSetTeamForm = (state, { id, screenName, description }) => ({
  ...state,
  teamForm: { id, screenName, description, errors: [] }
});

export const mapResultToMember = (result, teamRole) => ({
  ...result,
  displayName: getUserScreenName(result),
  teamRole
});

const handleAddTeamMemberSuccess = (state, { teamId, newMember }) => ({
  ...state,
  addMemberSuccesses: [...getAddMemberSuccesses(state), newMember],
  userSearch: {
    ...state.userSearch,
    selectedUsers: filter(u => u.id !== newMember.id, getUserSearchSelectedUsers(state))
  },
  teams: state.teams.map(
    team =>
      team.id === teamId
        ? {
            ...team,
            members: [...team.members, newMember]
          }
        : team
  )
});
const handleAddTeamMemberFailure = (state, { error }) => ({
  ...state,
  addMemberErrors: [...getAddMemberErrors(state), error]
});

const handleSubmitAddTeamMembersModal = (state) => ({
  ...state,
  addMemberErrors: [],
  addMemberSuccesses: []
});

const handleRemoveTeamMemberSuccess = (state, { teamId, userId }) => ({
  ...state,
  teams: state.teams.map(
    team =>
      team.id === teamId
        ? {
            ...team,
            members: filter(m => m.id !== userId, team.members)
          }
        : team
  )
});

const handleChangeMemberRoleSuccess = (state, { teamId, userId, roleId }) => ({
  ...state,
  teams: state.teams.map(
    team =>
      team.id === teamId
        ? {
            ...team,
            members: team.members.map(
              member => (member.id === userId ? { ...member, teamRole: roleId } : member)
            )
          }
        : team
  )
});

const handleUserSearchQueryChanged = (state, { currentQuery }) => ({
  ...state,
  addMemberErrors: [],
  addMemberSuccesses: [],
  userSearch: {
    ...state.userSearch,
    currentQuery
  }
});

const getSearchResultUserId = get('user.id');
const notIncludes = negate(includes);
const searchResultNotInListOfIds = idList => flow(getSearchResultUserId, partialRight(notIncludes, [idList]));

const filterSearchResults = (state, results) => {
  const existingMemberIds = getMemberIds(getCurrentTeam(state));
  const selectedUserIds = getUserSearchSelectedUserIds(state);

  const filterIds = selectedUserIds.concat(existingMemberIds);
  const searchResultNotInFilterIds = searchResultNotInListOfIds(filterIds);
  return filter(searchResultNotInFilterIds, results);
};

const handleUserSearchResults = (state, { results }) => ({
  ...state,
  addMemberErrors: [],
  addMemberSuccesses: [],
  userSearch: {
    ...state.userSearch,
    results: filterSearchResults(state, results)
  }
});

const handleUserSearchAddSelectedUser = (state, { user }) => ({
  ...state,
  addMemberErrors: [],
  addMemberSuccesses: [],
  userSearch: {
    currentQuery: '',
    results: null,
    selectedUsers: flow(uniqBy(getUserId), compact)(getUserSearchSelectedUsers(state).concat([user]))
  }
});

const handleUserSearchRemoveSelectedUser = (state, { user }) => ({
  ...state,
  addMemberErrors: [],
  addMemberSuccesses: [],
  userSearch: {
    currentQuery: '',
    results: null,
    selectedUsers: filter(u => getUserId(u) !== getUserId(user), getUserSearchSelectedUsers(state))
  }
});

const handleTeamViewNavigation = (state, { id }) => ({
  ...state,
  currentTeamId: id
});

const handleCancelAddTeamMembersModal = state => ({
  ...state,
  addMemberErrors: [],
  addMemberSuccesses: [],
  userSearch: { ...initialState.userSearch }
});

const handleDeleteTeamSuccess = (state, { id }) => ({
  ...state,
  teams: getTeamsList(state).filter(t => t.id === id)
});

const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case Actions.ADD_TEAM:
      return clearForm(state);

    case Actions.LOAD_TEAMS_SUCCESS:
      return handleLoadTeamsSuccess(state, payload);

    case Actions.LOAD_TEAM_ROLES_SUCCESS:
      return handleLoadTeamRolesSuccess(state, payload);

    case Actions.ADD_TEAM_SUCCESS:
      return handleAddTeamSuccess(state, payload);

    case Actions.EDIT_TEAM_SUCCESS:
      return handleEditTeamSuccess(state, payload);

    case Actions.SET_TEAM_FORM_ERRORS:
      return handleSetTeamFormErrors(state, payload);

    case Actions.SET_TEAM_FORM:
      return handleSetTeamForm(state, payload);

    case Actions.ADD_TEAM_MEMBER_SUCCESS:
      return handleAddTeamMemberSuccess(state, payload);

    case Actions.ADD_TEAM_MEMBER_FAILURE:
      return handleAddTeamMemberFailure(state, payload);

    case Actions.REMOVE_TEAM_MEMBER_SUCCESS:
      return handleRemoveTeamMemberSuccess(state, payload);

    case Actions.CHANGE_MEMBER_ROLE_SUCCESS:
      return handleChangeMemberRoleSuccess(state, payload);

    case Actions.LOAD_TEAM_SUCCESS:
      return handleLoadTeamSuccess(state, payload);

    case Actions.UPDATE_TEAM_FORM:
      return handleUpdateTeamForm(state, payload);

    case Actions.TEAM_VIEW_NAVIGATION:
      return handleTeamViewNavigation(state, payload);

    case Actions.USER_SEARCH_QUERY_CHANGED:
      return handleUserSearchQueryChanged(state, payload);

    case Actions.USER_SEARCH_RESULTS:
      return handleUserSearchResults(state, payload);

    case Actions.USER_SEARCH_ADD_SELECTED_USER:
      return handleUserSearchAddSelectedUser(state, payload);

    case Actions.USER_SEARCH_REMOVE_SELECTED_USER:
      return handleUserSearchRemoveSelectedUser(state, payload);

    case Actions.SUBMIT_ADD_TEAM_MEMBERS_MODAL:
      return handleSubmitAddTeamMembersModal(state);

    case Actions.CANCEL_ADD_TEAM_MEMBERS_MODAL:
      return handleCancelAddTeamMembersModal(state, payload);

    case Actions.DELETE_TEAM_SUCCESS:
      return handleDeleteTeamSuccess(state, payload);

    default:
      return state;
  }
};

// member => teamRole
export const getTeamRole = get('teamRole');
// member => boolean
export const isOwner = flow(getTeamRole, eq('owner'));
// Array[member] => owner
export const findOwner = find(isOwner);
// team => Array[member]
export const getMembers = get('members');
export const getMemberIds = team => map(getUserId, getMembers(team));
// member => string
export const getDisplayName = get('displayName');
// team => owner
export const getOwner = flow(getMembers, findOwner, getDisplayName);
export const findTeamMemberById = (state, teamId, userId) =>
  flow(curryRight(getTeam)(teamId), getMembers, find(member => member.id === userId))(state);

const getTeamForm = get('teamForm');
export const getTeamFormDescription = flow(getTeamForm, get('description'));
export const getTeamFormName = flow(getTeamForm, get('screenName'));
export const getTeamFormErrors = flow(getTeamForm, get('errors'));
export const getTeamFormId = flow(getTeamForm, get('id'));

// state => Array[team]
export const getTeamsList = flow(
  get('teams'),
  map(team => ({
    ...team,
    owner: getOwner(team)
  }))
);

export const getTeam = (state, id) => flow(getTeamsList, find({ id }))(state);

export const getTeamRoles = get('teamRoles');
export const getTeamsCount = flow(get('teams'), getOr(0, 'length'));
export const getTeamName = get('screenName');
export const getTeamNameById = (state, id) => getTeamName(getTeam(state, id));

export const getUserSearch = get('userSearch');
export const getUserSearchCurrentQuery = flow(getUserSearch, get('currentQuery'));
export const getUserSearchResults = flow(getUserSearch, get('results'));
export const getUserSearchSelectedUsers = flow(getUserSearch, get('selectedUsers'));
export const getUserSearchSelectedUserIds = flow(getUserSearchSelectedUsers, map(getUserId));
export const getCurrentTeamId = get('currentTeamId');
export const getCurrentTeam = state => getTeam(state, getCurrentTeamId(state));
export const getAddMemberErrors = get('addMemberErrors');
export const getAddMemberSuccesses = get('addMemberSuccesses');

export default reducer;
