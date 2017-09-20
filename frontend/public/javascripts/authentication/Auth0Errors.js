import _ from 'lodash';
import I18n from 'common/i18n';

export function processAuth0Error(error) {
  if (_.isEmpty(error) || _.isEmpty(error.code)) {
    console.error('Unknown auth0 error', error);
    return {
      level: 'error',
      message: I18n.t('screens.sign_in.auth0_unknown')
    };
  }

  switch (error.code) {
    case 'invalid_user_password':
      return {
        level: 'warning',
        message: I18n.t('screens.sign_in.auth0_invalid')
      };
    case 'too_many_attempts':
      return {
        level: 'warning',
        mesage: I18n.t('screens.sign_in.auth0_locked_out')
      };
    case 'too_many_logins':
      // this one is for rate limiting password attempts
      return {
        level: 'warning',
        message: I18n.t('screens.sign_in.auth0_too_many_requests')
      };
    default:
      console.error('Unknown auth0 error', error);
      return {
        level: 'error',
        message: I18n.t('screens.sign_in.auth0_unknown')
      };
  }
}
