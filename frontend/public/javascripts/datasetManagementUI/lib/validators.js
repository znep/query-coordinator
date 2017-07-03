/* eslint new-cap: 0 */
import { Success, Failure } from 'folktale/validation';
import isEmailHelper from 'validator/lib/isEmail';
import isURLHelper from 'validator/lib/isURL';

export function hasValue(fieldName, val) {
  return val
    ? Success(val)
    : Failure([
      {
        message: 'Cannot be empty',
        fieldName
      }
    ]);
}

export function isValidCategory(fieldName, val) {
  const validCategories = ['business', 'education', 'government'];
  return !val || validCategories.includes(val)
    ? Success(val)
    : Failure([
      {
        message: 'Invalid Category',
        fieldName
      }
    ]);
}

export function noDuplicates(fieldName, vals) {
  return [...new Set(vals)].length === vals.length
    ? Success(vals)
    : Failure([
      {
        message: 'Duplicate values',
        fieldName
      }
    ]);
}

export function isURL(fieldName, val) {
  return !val || isURLHelper(val, { require_protocol: true })
    ? Success(val)
    : Failure([
      {
        message: 'Invalid url',
        fieldName
      }
    ]);
}

export function isEmail(fieldName, val) {
  return !val || isEmailHelper(val)
    ? Success(val)
    : Failure([
      {
        message: 'Invalid email',
        fieldName
      }
    ]);
}
