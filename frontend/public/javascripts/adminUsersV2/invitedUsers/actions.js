export const LOAD_INVITED_USERS = 'LOAD_INVITED_USERS';
export const LOAD_INVITED_USERS_SUCCESS = 'LOAD_INVITED_USERS_SUCCESS';
export const LOAD_INVITED_USERS_FAILURE = 'LOAD_INVITED_USERS_FAILURE';

export const loadInvitedUsers = () => ({ type: LOAD_INVITED_USERS });
export const loadInvitedUsersSuccess = invitedUsers => ({ type: LOAD_INVITED_USERS_SUCCESS, payload: { invitedUsers }});
export const loadInvitedUsersFailure = error => ({ type: LOAD_INVITED_USERS_FAILURE, error: true, payload: { error }});

export const REMOVE_INVITED_USER = 'REMOVE_INVITED_USER';
export const REMOVE_INVITED_USER_SUCCESS = 'REMOVE_INVITED_USER_SUCCESS';
export const REMOVE_INVITED_USER_FAILURE = 'REMOVE_INVITED_USER_FAILURE';
export const removeInvitedUser = id => ({ type: REMOVE_INVITED_USER, payload: { id }});
export const removeInvitedUserSuccess = id => ({ type: REMOVE_INVITED_USER_SUCCESS, payload: { id } });
export const removeInvitedUserFailure = (id, error) => ({ type: REMOVE_INVITED_USER_FAILURE, error: true, payload: { id, error }});


export const RESEND_INVITED_USER_EMAIL = 'RESEND_INVITED_USER_EMAIL';
export const RESEND_INVITED_USER_EMAIL_SUCCESS = 'RESEND_INVITED_USER_EMAIL_SUCCESS';
export const RESEND_INVITED_USER_EMAIL_FAILURE = 'RESEND_INVITED_USER_EMAIL_FAILURE';
export const resendInvitedUserEmail = email => ({ type: RESEND_INVITED_USER_EMAIL, payload: { email }});
export const resendInvitedUserEmailSuccess = () => ({ type: RESEND_INVITED_USER_EMAIL_SUCCESS });
export const resendInvitedUserEmailFailure = (error) => ({ type: RESEND_INVITED_USER_EMAIL_FAILURE, error: true, payload: { error }});
