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

export const camelCase = str =>
  str.split('_').map((word, idx) => (idx === 0 ? word : titleCase(word))).join('');

export const snakeCase = str => str.split(/(?=[A-Z])/).map(word => word.toLowerCase()).join('_');

export const camelCamelCamel = obj => {
  return Object.keys(obj).reduce((acc, key) => {
    // I know right? wtf on the custom fields thing!? core expects it snake cased :(
    const newKey = key === 'custom_fields' ? key : camelCase(key);

    return {
      ...acc,
      [newKey]: _.isPlainObject(obj[key]) && key !== 'custom_fields' ? camelCamelCamel(obj[key]) : obj[key]
    };
  }, {});
};
