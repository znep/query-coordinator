import _ from 'lodash';

export const singularOrPlural = (quantity, singularString, pluralString) => {
  return quantity === 1 ? singularString : pluralString;
};

export const getComponentName = component => component.displayName || component.name;

// For forms. Most common errors handle client-side. Pattern matching only a few
// server-side errors to be displayed in the flash message.
export const getLocalizedErrorMessage = msg => {
  let localizedErrorMessage;
  const isInvalidURL = /validation failed:(.+)not a valid url/gi;
  const requiresLicense = /validation failed:(.+)requires that attribution be specified/gi;

  if (isInvalidURL.test(msg)) {
    localizedErrorMessage = I18n.edit_metadata.validation_error_url;
  } else if (requiresLicense.test(msg)) {
    localizedErrorMessage = I18n.edit_metadata.validation_error_attribution_required;
  } else {
    localizedErrorMessage = I18n.edit_metadata.validation_error_general;
  }

  return localizedErrorMessage;
};

export function getUniqueName(arr, name, count = 1) {
  const newName = count && count > 1 ? `${name} ${count}` : name;
  if (!arr.includes(newName)) {
    return newName;
  } else {
    return getUniqueName(arr, name, count + 1);
  }
}

export function mergeRecords(existing = {}, updates = {}) {
  const updateKeys = Object.keys(updates);

  return updateKeys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: { ...existing[key], ...updates[key] }
    }),
    existing
  );
}

export const removeWhitespace = str => str.replace(/\s/g, '_');

export const getUniqueFieldName = _.flowRight(removeWhitespace, getUniqueName);

export const titleCase = word => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
