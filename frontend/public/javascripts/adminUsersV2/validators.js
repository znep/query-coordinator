/* eslint new-cap: 0 */
import { collect, Success, Failure } from 'folktale/validation';
import validateIsEmail from 'validator/lib/isEmail';

import _ from 'lodash';

const isPresent = value => !_.isEmpty(value);

export const validateEmailsPresent = emails => {
  return isPresent(emails)
    ? Success(emails)
    : Failure([{ translationKey: 'users.errors.no_emails_provided' }]);
};

export const isEmail = maybeEmail => {
  return validateIsEmail(maybeEmail)
    ? Success(maybeEmail)
    : Failure([{ translationKey: 'users.errors.invalid_email', value: maybeEmail }]);
};

export const isValidEmailGroup = emails => {
  return validateEmailsPresent(emails).matchWith({
    Success: value =>
      collect(
        value.
        unsafeGet().
        split(',').
        map(email => isEmail(email.trim()))
      ).map(() => value.unsafeGet()),
    Failure: _.identity
  });
};

export const isValidRoleId = roleId => {
  return _.isFinite(roleId) && roleId > 0
    ? Success(roleId)
    : Failure([{ translationKey: 'users.errors.invalid_role_selected' }]);
};
