/* eslint new-cap: 0 */
import { collect, Success, Failure } from 'folktale/validation';
import validateIsEmail from 'validator/lib/isEmail';

import identity from 'lodash/fp/identity';
import isEmpty from 'lodash/fp/isEmpty';
import isFinite from 'lodash/fp/isFinite';
import negate from 'lodash/fp/negate';

const isPresent = negate(isEmpty);

export function ValidationError(failure) {
  this.name = 'ValidationError';
  this.failure = failure;
  this.message = failure.toString();
  this.stack = (new Error()).stack;
}
ValidationError.prototype = new Error;

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
    Failure: identity
  });
};

export const isValidRoleId = id => {
  const roleId = parseInt(id, 10);
  return isFinite(roleId) && roleId > 0
    ? Success(roleId)
    : Failure([{ translationKey: 'users.errors.invalid_role_selected' }]);
};
