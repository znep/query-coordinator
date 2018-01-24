import * as fromRoles from './roles/reducers';
import * as fromUsers from './users/reducers';
import * as fromInvitedUsers from './invitedUsers/reducers';
import * as fromUi from './ui/reducers';

import flow from 'lodash/fp/flow';
import get from 'lodash/fp/get';
import curry from 'lodash/fp/curry';
import curryRight from 'lodash/fp/curryRight';
import { combineSelectors } from 'combine-selectors-redux';
import { selectors as teamsSelectors } from './teams/reducers';

/** Config State Selectors **/
export const getInvitedUsersAdminPath = get('config.routes.invitedUsersAdminPath');
export const getTeamsAdminPath = get('config.routes.teamsAdminPath');
export const getTeamViewPath = curry((id, state) => `${getTeamsAdminPath(state)}/${id}`);
export const getUsersAdminPath = get('config.routes.usersAdminPath');
export const getUsersCsvUrl = get('config.routes.csvUrl');
export const getUsersResultsLimit = get('config.usersResultsLimit');
export const getDomain = get('config.domain');
export const getDefaultMemberRoleId = get('config.defaultMemberRoleId');
export const getEnableTeams = get('config.enableTeams');

/** UI State Selectors **/
export const getUiState = get('ui');
/**
 * TODO: EN-21622
 * What is this?  While factoring out these selectors to this file, and running the karma tests,
 * I would encounter an error : `Uncaught TypeError: Expected a function` - originating from the `flow`
 * calls below (but only for those that were composing with `fromUi` functions! wat)
 * Through some debugging, I found that this only happened during karma start up, not when the tests
 * were actually run, nor when run normally in a browser.  For the meantime, we will guard against these
 * functions being undefined with this function, and try to track down the underlying issue with
 * karma/webpack/the GOP when not under a time constraint.
 *
 * @param fn
 * @returns {function(): void}
 */
const safetyWrapper = (fn) => fn ? flow(getUiState, fn) : () => console.warn('Something is wrong. See EN-21622');
export const getNotificationContent = safetyWrapper(fromUi.getNotificationContent);
export const getNotificationType = safetyWrapper(fromUi.getNotificationType);
export const getShowNotification = safetyWrapper(fromUi.getShowNotification);
export const getShowAddUsersModal = safetyWrapper(fromUi.getShowAddUsersModal);
export const getAddUsersModalDisabled = safetyWrapper(fromUi.getAddUsersModalDisabled);

/** User State Selectors **/
export const getUserState = get('users');
export const getFilters = get('filters');
export const getUsersCurrentPage = flow(getUserState, fromUsers.getCurrentPage);
export const getUsersOrderBy = flow(getUserState, fromUsers.getOrderBy);
export const getUsersSortDirection = flow(getUserState, fromUsers.getSortDirection);
export const getUsersResultCount = flow(getUserState, fromUsers.getResultCount);
export const getUsers = flow(getUserState, fromUsers.getUsers);
export const getUsersQuery = get('autocomplete.query');
export const getAutocompleteUser = get('autocomplete.searchResults.results.[0].user');
export const getUsersOffset = state =>
  fromUsers.getZeroBasedPage(getUserState(state)) * getUsersResultsLimit(state);
export const getUsersLoadingData = flow(getUserState, fromUsers.getLoadingData);
export const getUserSearchResultCount = flow(getUserState, fromUsers.getSearchResultCount);
export const getAddUsersFormEmails = flow(getUserState, fromUsers.getAddUsersFormEmails);
export const getAddUsersFormRoleId = flow(getUserState, fromUsers.getAddUsersFormRoleId);
export const getAddUsersFormErrors = flow(getUserState, fromUsers.getAddUsersFormErrors);

/** Roles State Selectors **/
export const getRolesState = get('roles');
export const getRoles = flow(getRolesState, fromRoles.getRoles);
export const getRolesLoading = flow(getRolesState, fromRoles.getRolesLoading);
export const getUserRoleFilter = flow(getRolesState, fromRoles.getUserRoleFilter);

/** Invited Users State Selectors **/
export const getInvitedUsersState = get('invitedUsers');
export const getInvitedUsers = flow(getInvitedUsersState, fromInvitedUsers.getInvitedUsers);
export const getInvitedUserCount = flow(getInvitedUsersState, fromInvitedUsers.getInvitedUserCount);
export const getInvitedUsersLoading = flow(getInvitedUsersState, fromInvitedUsers.getInvitedUsersLoading);
export const getInvitedUserEmailById = (state, id) =>
  flow(getInvitedUsersState, curryRight(fromInvitedUsers.getInvitedUserEmailById)(id))(state);

export const selectors = combineSelectors({
  teams: teamsSelectors
});

/** Teams State Selectors **/
export const getTeamsList = selectors.teams.teams.getTeamsList;
export const getTeamsLoadingData = selectors.teams.ui.getLoadingData;
export const getTeamsLoadingTeam = selectors.teams.ui.getLoadingTeam;
export const getShowEditTeamModal = selectors.teams.ui.getShowEditTeamModal;
export const getDisableEditTeamModal = selectors.teams.ui.getDisableEditTeamModal;
export const getShowAddTeamMembersModal = selectors.teams.ui.getShowAddTeamMembersModal;
export const getDisableAddTeamMembersModal = selectors.teams.ui.getDisableAddTeamMembersModal;
export const getTeamFormId = selectors.teams.teams.getTeamFormId;
export const getTeamFormName = selectors.teams.teams.getTeamFormName;
export const getTeamFormDescription = selectors.teams.teams.getTeamFormDescription;
export const getTeamFormErrors = selectors.teams.teams.getTeamFormErrors;
export const getTeam = selectors.teams.teams.getTeam;
export const getTeamNameById = selectors.teams.teams.getTeamNameById;
export const getTeamRoles = selectors.teams.teams.getTeamRoles;
export const getTeamsCount = selectors.teams.teams.getTeamsCount;
export const findTeamMemberById = selectors.teams.teams.findTeamMemberById;
export const getTeamUserSearch = selectors.teams.teams.getUserSearch;

export const getTeamUserSearchCurrentQuery = selectors.teams.teams.getUserSearchCurrentQuery;
export const getTeamUserSearchResults = selectors.teams.teams.getUserSearchResults;
export const getTeamUserSearchSelectedUsers = selectors.teams.teams.getUserSearchSelectedUsers;
export const getTeamAddMemberErrors = selectors.teams.teams.getAddMemberErrors;
export const getTeamAddMemberSuccesses = selectors.teams.teams.getAddMemberSuccesses;

