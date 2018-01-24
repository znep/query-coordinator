import { delay } from 'redux-saga';
import { call, put, race, select, take, takeEvery } from 'redux-saga/effects';
import * as Actions from './actions';
import * as GlobalActions from '../actions';
import * as Selectors from '../selectors';
import UsersApi from 'common/users-api';
import * as Validators from '../validators';
import { Failure } from 'folktale/validation';
import CoreFutureAccountsApi from 'common/core-future-accounts-api';

const selectOptions = state => ({
  filters: {
    role_ids: Selectors.getUserRoleFilter(state)
  },
  offset: Selectors.getUsersOffset(state),
  query: Selectors.getUsersQuery(state),
  limit: Selectors.getUsersResultsLimit(state),
  orderBy: Selectors.getUsersOrderBy(state),
  sortDirection: Selectors.getUsersSortDirection(state)
});

const selectUserFormFields = state => ({
  emails: Selectors.getAddUsersFormEmails(state),
  roleId: Selectors.getAddUsersFormRoleId(state)
});

export function* addUsers() {
  yield put(Actions.showAddUsersModal());

  let hasErrors;
  do {
    try {
      hasErrors = false;
      yield put(Actions.enableAddUsersModal());
      const retVal = yield race({
        submit: take(Actions.SUBMIT_ADD_USERS_MODAL),
        cancel: take(Actions.CANCEL_ADD_USERS_MODAL)
      });
      const { submit, cancel } = retVal;
      if (submit) {
        yield put(Actions.disableAddUsersModal());
        const formFields = yield select(selectUserFormFields);
        const { emails, roleId } = validateUserForm(formFields.emails, formFields.roleId);
        yield delay(250); // delay to provide user feedback
        yield call(CoreFutureAccountsApi.postFutureUsers, emails, roleId);
        const invitedUsers = yield call(CoreFutureAccountsApi.getFutureUsers); // reload users
        yield put(Actions.addUsersSuccess(invitedUsers));
        yield put(GlobalActions.showLocalizedSuccessNotification('users.notifications.add_user_success'));
      }
      if (cancel) {
        break;
      }
    } catch (error) {
      hasErrors = true;
      let errors;
      if (error instanceof CoreFutureAccountsApi.FutureAccountsCreationError) {
        errors = error.errors;
      } else if (error instanceof Validators.ValidationError) {
        errors = error.failure.value;
      } else {
        errors = [{ translationKey: 'users.errors.server_error_html' }];
      }
      yield put(Actions.setAddUsersFormErrors(errors));
      yield put(Actions.addUsersFailure(errors));
    }
  } while (hasErrors);
  yield put(Actions.clearAddUsersForm());
  yield put(Actions.hideAddUsersModal());
}

export function* gotoPage() {
  yield put(Actions.userSearch());
}

export function* loadUsers() {
  try {
    const options = yield select(selectOptions);
    const domain = yield select(Selectors.getDomain);
    const { users, resultCount } = yield call(UsersApi.getUsers, domain, options);
    yield put(Actions.loadUsersSuccess(users, resultCount));
  } catch (error) {
    console.warn('Unable to load users, using empty list.', error);
    yield put(Actions.loadUsersFailure(error));
  }
}

export function* resetPassword({ payload: { userId } }) {
  try {
    const response = yield call(UsersApi.resetPassword, userId);
    if (response.success) {
      yield put(GlobalActions.showLocalizedSuccessNotification('users.notifications.password_reset'));
    } else {
      yield put(GlobalActions.showLocalizedErrorNotification('users.errors.unknown'));
    }
  } catch (error) {
    yield put(GlobalActions.showLocalizedErrorNotification('users.errors.unknown'));
  }
}

export function* sortColumn() {
  yield put(Actions.userSearch());
}

export function* userAutocomplete({ payload: { query, callback } }) {
  if (query !== '') {
    const domain = yield select(Selectors.getDomain);
    try {
      const searchResults = yield call(UsersApi.autocomplete, domain, query);
      yield call(callback, searchResults);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  }
}

export function* userSearch() {
  try {
    const options = yield select(selectOptions);
    const domain = yield select(Selectors.getDomain);
    const { users, resultCount } = yield call(UsersApi.getUsers, domain, options);
    yield put(Actions.userSearchSuccess(users, resultCount));
  } catch (error) {
    console.warn('Unable to search for users, using empty list.', error);
    yield put(Actions.userSearchFailure(error));
  }
}

export function validateUserForm(emails, roleId) {
  const validation = Validators.isValidEmailGroup(emails).concat(Validators.isValidRoleId(roleId));

  const failedValidation = Failure.hasInstance(validation);
  if (failedValidation) {
    throw new Validators.ValidationError(validation);
  }
  return { emails, roleId };
}

export default [
  takeEvery(Actions.ADD_USERS, addUsers),
  takeEvery(Actions.GOTO_USER_PAGE, gotoPage),
  takeEvery(Actions.LOAD_USERS, loadUsers),
  takeEvery(Actions.RESET_PASSWORD, resetPassword),
  takeEvery(Actions.SORT_USER_COLUMN, sortColumn),
  takeEvery(Actions.USER_AUTOCOMPLETE, userAutocomplete),
  takeEvery(Actions.USER_SEARCH, userSearch)
];
