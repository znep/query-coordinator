import get from 'lodash/fp/get';
import * as Actions from '../actions';

export const initialState = {
  disableAddTeamMembersModal: false,
  disableEditTeamModal: false,
  loadingData: true,
  loadingTeam: true,
  loadingError: null,
  loadingTeamRoles: true,
  showEditTeamModal: false,
  showAddTeamMembersModal: false,
  submittingUsers: false
};

const handleLoadTeams = state => ({ ...state, loadingData: true });
const handleLoadTeamsSuccess = state => ({ ...state, loadingData: false });
const handleLoadTeamsFailure = (state, { error }) => ({
  ...state,
  loadingData: false,
  loadingError: error
});
const handleLoadTeamRolesSuccess = state => ({ ...state, loadingTeamRoles: false });
const handleLoadTeamRolesFailure = (state, { error }) => ({
  ...state,
  loadingTeamRoles: false,
  loadingError: error
});

const handleShowEditTeamModal = state => ({ ...state, disableEditTeamModal: false, showEditTeamModal: true });
const handleHideEditTeamModal = state => ({
  ...state,
  disableEditTeamModal: false,
  showEditTeamModal: false
});
const handleDisableEditTeamModal = state => ({ ...state, disableEditTeamModal: true });
const handleEnableEditTeamModal = state => ({ ...state, disableEditTeamModal: false });

const handleShowAddTeamMembersModal = state => ({
  ...state,
  disableAddTeamMembersModal: false,
  showAddTeamMembersModal: true
});
const handleHideAddTeamMembersModal = state => ({
  ...state,
  disableAddTeamMembersModal: false,
  showAddTeamMembersModal: false
});
const handleDisableAddTeamMembersModal = state => ({ ...state, disableAddTeamMembersModal: true });
const handleEnableAddTeamMembersModal = state => ({ ...state, disableAddTeamMembersModal: false });

const handleLoadTeam = state => ({ ...state, loadingTeam: true });
const handleLoadTeamComplete = state => ({ ...state, loadingTeam: false });

const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case Actions.LOAD_TEAMS:
      return handleLoadTeams(state);
    case Actions.LOAD_TEAMS_SUCCESS:
      return handleLoadTeamsSuccess(state);
    case Actions.LOAD_TEAMS_FAILURE:
      return handleLoadTeamsFailure(state, payload);
    case Actions.LOAD_TEAM_ROLES_SUCCESS:
      return handleLoadTeamRolesSuccess(state);
    case Actions.LOAD_TEAM_ROLES_FAILURE:
      return handleLoadTeamRolesFailure(state, payload);
    case Actions.DISABLE_EDIT_TEAM_MODAL:
      return handleDisableEditTeamModal(state);
    case Actions.ENABLE_EDIT_TEAM_MODAL:
      return handleEnableEditTeamModal(state);

    case Actions.SHOW_EDIT_TEAM_MODAL:
      return handleShowEditTeamModal(state);
    case Actions.HIDE_EDIT_TEAM_MODAL:
      return handleHideEditTeamModal(state);

    case Actions.DISABLE_ADD_TEAM_MEMBERS_MODAL:
      return handleDisableAddTeamMembersModal(state);
    case Actions.ENABLE_ADD_TEAM_MEMBERS_MODAL:
      return handleEnableAddTeamMembersModal(state);

    case Actions.SHOW_ADD_TEAM_MEMBERS_MODAL:
      return handleShowAddTeamMembersModal(state);
    case Actions.HIDE_ADD_TEAM_MEMBERS_MODAL:
      return handleHideAddTeamMembersModal(state);

    case Actions.LOAD_TEAM:
      return handleLoadTeam(state);

    case Actions.LOAD_TEAM_SUCCESS:
    case Actions.LOAD_TEAM_FAILURE:
      return handleLoadTeamComplete(state);

    default:
      return state;
  }
};

// state => boolean
export const getShowEditTeamModal = get('showEditTeamModal');
export const getDisableEditTeamModal = get('disableEditTeamModal');
export const getShowAddTeamMembersModal = get('showAddTeamMembersModal');
export const getDisableAddTeamMembersModal = get('disableAddTeamMembersModal');
export const getLoadingData = get('loadingData');
export const getLoadingTeam = get('loadingTeam');

export default reducer;
