/* eslint new-cap: 0 */
import { Success, Failure } from 'folktale/validation';
import isEmailHelper from 'validator/lib/isEmail';
import isURLHelper from 'validator/lib/isURL';

export function hasValue(fieldName, val) {
  return val ? Success(val) : Failure([{ [fieldName]: 'Cannot be empty' }]);
}

export function isValidCategory(fieldName, val) {
  const validCategories = ['business', 'education', 'government'];
  return validCategories.includes(val) ? Success(val) : Failure([{ [fieldName]: 'Invalid Category' }]);
}

export function noDuplicates(fieldName, vals) {
  return [...new Set(vals)].length === vals.length
    ? Success(vals)
    : Failure([({ fieldName }: 'Duplicate values')]);
}

export function isURL(fieldName, val) {
  return isURLHelper(val, { require_protocol: true })
    ? Success(val)
    : Failure([{ [fieldName]: 'Invalid url' }]);
}

export function isEmail(fieldName, val) {
  return isEmailHelper(val) ? Success(val) : Failure([{ [fieldName]: 'Invalid email' }]);
}
