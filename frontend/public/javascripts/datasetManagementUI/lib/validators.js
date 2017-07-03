/* eslint new-cap: 0 */
import { Success, Failure } from 'folktale/validation';
import isEmailHelper from 'validator/lib/isEmail';
import isURLHelper from 'validator/lib/isURL';

export function hasValue(fieldName, val) {
  return val
    ? Success(val)
    : Failure([
      {
        message: I18n.edit_metadata.validation_error_required,
        fieldName
      }
    ]);
}

export function areUnique(fieldName, vals) {
  return [...new Set(vals)].length === vals.length
    ? Success(vals)
    : Failure([
      {
        message: I18n.edit_metadata.validation_error_no_dupes,
        fieldName
      }
    ]);
}

export function isURL(fieldName, val) {
  return !val || isURLHelper(val, { require_protocol: true })
    ? Success(val)
    : Failure([
      {
        message: I18n.edit_metadata.validation_error_url,
        fieldName
      }
    ]);
}

export function isEmail(fieldName, val) {
  return !val || isEmailHelper(val)
    ? Success(val)
    : Failure([
      {
        message: I18n.edit_metadata.validation_error_email,
        fieldName
      }
    ]);
}

export function dependsOn(dependentField, field) {
  if (dependentField.value && !field.value) {
    return Failure([
      {
        message: I18n.edit_metadata.validation_error_attribution_required,
        fieldName: dependentField.name
      }
    ]);
  } else {
    return Success(dependentField.value);
  }
}
