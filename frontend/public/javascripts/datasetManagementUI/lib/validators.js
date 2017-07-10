/* eslint new-cap: 0 */
import Validation, { Success, Failure } from 'folktale/validation';
import isEmailHelper from 'validator/lib/isEmail';
import isURLHelper from 'validator/lib/isURL';
import _ from 'lodash';

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

export function isUnique(fieldName, value, values) {
  const idxToRemove = _.findIndex(values, val => val === value);
  const withFirstOccuranceRemoved = values.filter((val, idx) => idx !== idxToRemove);
  const errorMessage = /^field-name/.test(fieldName)
    ? I18n.edit_metadata.validation_error_dupe_field_name
    : I18n.edit_metadata.validation_error_dupe_display_name;

  if (!value) {
    return Success(value);
  } else if (withFirstOccuranceRemoved.includes(value)) {
    return Failure([
      {
        message: errorMessage,
        fieldName
      }
    ]);
  } else {
    return Success(value);
  }
}

function isProperFieldName(fieldName, value) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)
    ? Success(value)
    : Failure([
      {
        message: I18n.edit_metadata.validation_error_fieldname,
        fieldName
      }
    ]);
}

export function isValidDisplayName(fieldName, value, displayNames) {
  return Validation.of().concat(hasValue(fieldName, value)).concat(isUnique(fieldName, value, displayNames));
}

export function isValidFieldName(fieldName, value, fieldNames) {
  return Validation.of()
    .concat(hasValue(fieldName, value))
    .concat(isUnique(fieldName, value, fieldNames))
    .concat(isProperFieldName(fieldName, value));
}
