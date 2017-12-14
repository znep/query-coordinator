import CoreFutureAccountsApi from 'common/core-future-accounts-api';
import _ from 'lodash';

import { showNotification, START, COMPLETE_SUCCESS, COMPLETE_FAIL } from '../actions';

export const loadInvitedUsers = () =>
  CoreFutureAccountsApi.getFutureUsers().
    then(values => values.map(value => _.pick(value, ['createdAt', 'email', 'id', 'pendingRoleId']))).
    then(users =>
      users.sort((a, b) => {
        return b.createdAt - a.createdAt;
      })
    ).
    catch(error => {
      console.warn('Unable to load invited users, showing empty list.', error);
      return [];
    });

export const REMOVE_INVITED_USER = 'REMOVE_INVITED_USER';
export const removeInvitedUser = id => dispatch => {
  dispatch({ type: REMOVE_INVITED_USER, stage: START, payload: { id } });
  CoreFutureAccountsApi.removeFutureUser(id).
    then(() => {
      dispatch({ type: REMOVE_INVITED_USER, stage: COMPLETE_SUCCESS, payload: { id } });
      dispatch(showNotification({ translationKey: 'users.notifications.invited_user_removed' }, 'success'));
    }).
    catch(error => {
      dispatch({ type: REMOVE_INVITED_USER, stage: COMPLETE_FAIL, payload: { id, error } });
      dispatch(showNotification({ translationKey: 'users.errors.server_error_html' }, 'error'));
    });
};

export const RESEND_INVITED_USER_EMAIL = 'RESEND_INVITED_USER_EMAIL';
export const resendInvitedUserEmail = email => dispatch => {
  dispatch({ type: RESEND_INVITED_USER_EMAIL, stage: START, payload: { email } });
  CoreFutureAccountsApi.resendFutureUserEmail(email).
    then(() => {
      dispatch({ type: RESEND_INVITED_USER_EMAIL, stage: COMPLETE_SUCCESS, payload: { email } });
      dispatch(showNotification({ translationKey: 'users.notifications.resent_email_success' }, 'success'));
    }).
    catch(error => {
      dispatch({ type: RESEND_INVITED_USER_EMAIL, stage: COMPLETE_FAIL, payload: { email, error } });
      dispatch(showNotification({ translationKey: 'users.errors.server_error_html' }, 'error'));
    });
};
