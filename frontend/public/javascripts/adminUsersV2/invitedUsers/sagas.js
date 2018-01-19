import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as Actions from './actions';
import * as GlobalActions from '../actions';
import * as Selectors from '../selectors';
import CoreFutureAccountsApi from 'common/core-future-accounts-api';
import sortBy from 'lodash/fp/sortBy';
import pick from 'lodash/fp/pick';
import flow from 'lodash/fp/flow';
import map from 'lodash/fp/map';

const sortByCreatedAt = sortBy(['createdAt']);
const pickUserFields = pick(['createdAt', 'email', 'id', 'pendingRoleId']);
const mapAndSortInvitedUsers = flow(map(pickUserFields), sortByCreatedAt);

export function* loadInvitedUsers() {
  try {
    const values = yield call(CoreFutureAccountsApi.getFutureUsers);
    const invitedUsers = mapAndSortInvitedUsers(values);
    yield put(Actions.loadInvitedUsersSuccess(invitedUsers));
  } catch (error) {
    console.warn('Unable to load invited users, showing empty list.', error);
    yield put(Actions.loadInvitedUsersFailure(error));
  }
}

export function* removeInvitedUser({ payload: { id } }) {
  try {
    const email = yield select(Selectors.getInvitedUserEmailById, id);
    yield call(CoreFutureAccountsApi.removeFutureUser, id);
    yield put(Actions.removeInvitedUserSuccess(id));
    yield put(
      GlobalActions.showLocalizedSuccessNotification('users.notifications.remove_invited_user_success', {
        email
      })
    );
  } catch (error) {
    console.warn(`Unable to remove invited user ${id}`, error);
    yield put(Actions.removeInvitedUserFailure(id, error));
    yield put(GlobalActions.showLocalizedErrorNotification('users.errors.server_error_html'));
  }
}

export function* resendInvitedUserEmail({ payload: { email } }) {
  try {
    yield call(CoreFutureAccountsApi.resendFutureUserEmail, email);
    yield put(Actions.resendInvitedUserEmailSuccess());
    yield put(GlobalActions.showLocalizedSuccessNotification('users.notifications.resent_email_success'));
  } catch (error) {
    console.warn(`Unable to resend invited user email to ${email}`, email);
    yield put(Actions.resendInvitedUserEmailFailure(error));
    yield put(GlobalActions.showLocalizedErrorNotification('users.errors.server_error_html'));
  }
}

export default [
  takeEvery(Actions.LOAD_INVITED_USERS, loadInvitedUsers),
  takeEvery(Actions.REMOVE_INVITED_USER, removeInvitedUser),
  takeEvery(Actions.RESEND_INVITED_USER_EMAIL, resendInvitedUserEmail)
];
