import { delay } from 'redux-saga';
import { all, call, cancel, fork, put, race, select, take, takeEvery, takeLatest } from 'redux-saga/effects';
import CoreTeamsApi from 'common/core-teams-api';
import UsersApi from 'common/users-api';
import * as Actions from './actions';
import * as Selectors from '../selectors';
import * as Validators from '../validators';
import { Failure } from 'folktale/validation';
import * as GlobalActions from '../actions';
import * as TeamSelectors from './reducers/teamsReducer';
import { browserHistory } from 'react-router';
import isEmpty from 'lodash/fp/isEmpty';
import map from 'lodash/fp/map';
import zip from 'lodash/fp/zip';

const UX_DELAY = 250;

export function* addTeam() {
  yield put(Actions.showEditTeamModal());
  const { submit } = yield handleTeamModal();
  if (submit) {
    const screenName = yield select(Selectors.getTeamFormName);
    const description = yield select(Selectors.getTeamFormDescription);
    try {
      // const createdTeam = yield call(CoreTeamsApi.foo, { name, description }); // Testing failure
      const createdTeam = yield call(CoreTeamsApi.createTeam, { screenName, description });
      yield put(Actions.addTeamSuccess(createdTeam));
      yield put(
        GlobalActions.showLocalizedSuccessNotification('users.add_new_team.add_team_success_notification')
      );
      const path = yield select(Selectors.getTeamViewPath(createdTeam.id));
      yield call(browserHistory.push, path);
    } catch (error) {
      console.warn('Unable to create team', error);
      yield put(Actions.addTeamFailure(error));
    }
  }
  yield put(Actions.clearTeamFormErrors());
  yield put(Actions.hideEditTeamModal());
}

export function* addTeamMembers({ payload: { teamId } }) {
  yield put(Actions.showAddTeamMembersModal());

  let hasErrors;
  do {
    hasErrors = false;
    yield put(Actions.enableAddTeamMembersModal());
    const userSearch = yield fork(watchUserSearchQueryChanged);
    const { submit, cancelModal } = yield race({
      submit: take(Actions.SUBMIT_ADD_TEAM_MEMBERS_MODAL),
      cancelModal: take(Actions.CANCEL_ADD_TEAM_MEMBERS_MODAL)
    });
    yield cancel(userSearch);
    if (submit) {
      yield put(Actions.disableAddTeamMembersModal());
      yield delay(UX_DELAY);
      const roleId = yield select(Selectors.getDefaultMemberRoleId);
      const selectedUsers = yield select(Selectors.getTeamUserSearchSelectedUsers);
      const selectedUserIds = map(TeamSelectors.getUserId, selectedUsers);
      const calls = selectedUserIds.map(userId => call(fetchAddTeamMember, teamId, userId, roleId));
      const results = yield all(calls);
      const resultActions = zip(selectedUsers, results).map(([user, result]) => {
        if (result instanceof Error) {
          hasErrors = true;
          return put(Actions.addTeamMemberFailure({
            translationKey: 'users.edit_team.add_team_member_failure_html',
            displayName: TeamSelectors.getUserScreenName(user)
          }));
        } else {
          return put(Actions.addTeamMemberSuccess(teamId, TeamSelectors.mapResultToMember(user, roleId)));
        }
      });
      yield all(resultActions);
      if (!hasErrors) {
        yield put(GlobalActions.showLocalizedSuccessNotification('users.edit_team.add_team_members_success'));
      }
    }
    if (cancelModal) {
      break;
    }
  } while (hasErrors);
  yield put(Actions.hideAddTeamMembersModal());
}

export function* changeMemberRole({ payload: { teamId, userId, roleId } }) {
  try {
    yield call(CoreTeamsApi.updateTeamMember, teamId, userId, roleId);
    yield put(Actions.changeMemberRoleSuccess(teamId, userId, roleId));
  } catch (error) {
    console.error(error);
  }
}

export function* deleteTeam({ payload: { id } }) {
  try {
    yield call(CoreTeamsApi.deleteTeam, id);
    yield put(Actions.deleteTeamSuccess(id));
    yield put(GlobalActions.showLocalizedSuccessNotification('users.notifications.delete_team_success'));
  } catch (error) {
    yield put(Actions.deleteTeamFailure(error));
    yield put(GlobalActions.showLocalizedErrorNotification('users.errors.server_error_html'));
  }
}

export function* editTeam({ payload: { id } }) {
  const team = yield select(Selectors.getTeam, id);
  yield put(Actions.setTeamForm(team.id, team.screenName, team.description));
  yield put(Actions.showEditTeamModal());
  const { submit } = yield handleTeamModal();
  if (submit) {
    const screenName = yield select(Selectors.getTeamFormName);
    const description = yield select(Selectors.getTeamFormDescription);
    try {
      const updatedTeam = yield call(CoreTeamsApi.updateTeam, id, { screenName, description });
      yield put(Actions.editTeamSuccess({ ...updatedTeam, id }));
      yield put(
        GlobalActions.showLocalizedSuccessNotification('users.edit_team.edit_team_success_notification')
      );
    } catch (error) {
      console.warn('Unable to edit team', error);
      yield put(Actions.editTeamFailure(error));
    }
  }
  yield put(Actions.clearTeamFormErrors());
  yield put(Actions.hideEditTeamModal());
}

export function* loadTeams() {
  try {
    const teams = yield call(CoreTeamsApi.getAllTeams, 10, 1);
    yield put(Actions.loadTeamsSuccess(teams));
  } catch (error) {
    yield put(Actions.loadTeamsFailure(error));
  }
}

export function* loadTeamRoles() {
  try {
    const teamRoles = yield call(CoreTeamsApi.getRoles);
    yield put(Actions.loadTeamRolesSuccess(teamRoles));
  } catch (error) {
    yield put(Actions.loadTeamRolesFailure(error));
  }
}

export function* removeTeamMember({ payload: { teamId, userId } }) {
  const teamMember = yield select(Selectors.findTeamMemberById, teamId, userId);
  const displayName = TeamSelectors.getDisplayName(teamMember);
  try {
    yield call(CoreTeamsApi.removeTeamMember, teamId, userId);
    yield put(Actions.removeTeamMemberSuccess(teamId, userId));
    yield put(
      GlobalActions.showLocalizedSuccessNotification('users.edit_team.remove_team_member_success', {
        displayName
      })
    );
  } catch (error) {
    console.warn(error);
    yield put(
      GlobalActions.showLocalizedErrorNotification('users.edit_team.remove_team_member_failure', {
        displayName
      })
    );
  }
}

export function* teamViewNavigation(action) {
  const { payload: { id } } = action;
  try {
    yield call(loadTeam, action);
  } catch (error) {
    console.warn(`Unable to navigate to team with id ${id}`);
    const path = yield select(Selectors.getTeamsAdminPath);
    yield call(browserHistory.push, path);
  }
}

export function* handleTeamModal() {
  let failedValidation = true;
  let response;
  do {
    response = yield race({
      submit: take(Actions.SUBMIT_EDIT_TEAM_MODAL),
      cancel: take(Actions.CANCEL_EDIT_TEAM_MODAL)
    });
    yield put(Actions.disableEditTeamModal());
    if (response.submit) {
      yield delay(UX_DELAY);
      const screenName = yield select(Selectors.getTeamFormName);
      const validation = Validators.isValidTeamName(screenName);
      failedValidation = Failure.hasInstance(validation);
      if (failedValidation) {
        yield put(Actions.setTeamFormErrors(validation.value));
        yield put(Actions.enableEditTeamModal());
      }
    }
    if (response.cancel) {
      yield put(Actions.hideEditTeamModal());
      break;
    }
  } while (failedValidation);
  return response;
}

/**
 * Calls our to the teams API to add a team member
 * Catches errors and returns them, instead of allowing them to surface, to allow for fanning out requests with
 * `all` and not rejecting the batch for one failure
 * @param teamId
 * @param userId
 * @param roleId
 * @returns result or error
 */
export function* fetchAddTeamMember(teamId, userId, roleId) {
  try {
    return yield call(CoreTeamsApi.addTeamMember, teamId, userId, roleId);
  } catch (error) {
    return error;
  }
}

export function* userSearchQueryChanged({ payload: { currentQuery } }) {
  const domain = yield select(Selectors.getDomain);
  if (!isEmpty(currentQuery)) {
    try {
      const { results } = yield call(UsersApi.autocomplete, domain, currentQuery);
      yield put(Actions.userSearchResults(results));
    } catch (error) {
      console.warn('Error searching for team members', error);
    }
  }
}

export function* watchUserSearchQueryChanged() {
  yield takeLatest(Actions.USER_SEARCH_QUERY_CHANGED, userSearchQueryChanged);
}

export function* loadTeam({ payload: { id } }) {
  const team = yield call(CoreTeamsApi.getTeam, id);
  yield put(Actions.loadTeamSuccess(team));
}

export default [
  takeEvery(Actions.ADD_TEAM, addTeam),
  takeEvery(Actions.ADD_TEAM_MEMBERS, addTeamMembers),
  takeEvery(Actions.CHANGE_MEMBER_ROLE, changeMemberRole),
  takeEvery(Actions.DELETE_TEAM, deleteTeam),
  takeEvery(Actions.EDIT_TEAM, editTeam),
  takeEvery(Actions.LOAD_TEAM, loadTeam),
  takeEvery(Actions.LOAD_TEAM_ROLES, loadTeamRoles),
  takeEvery(Actions.LOAD_TEAMS, loadTeams),
  takeEvery(Actions.REMOVE_TEAM_MEMBER, removeTeamMember),
  takeLatest(Actions.TEAM_VIEW_NAVIGATION, teamViewNavigation)
];
