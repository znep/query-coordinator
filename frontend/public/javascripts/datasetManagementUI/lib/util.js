import _ from 'lodash';

export const singularOrPlural = (quantity, singularString, pluralString) => {
  return quantity === 1 ? singularString : pluralString;
};

export const getComponentName = component => component.displayName || component.name;

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

export function getBasename(url) {
  return url.split(/[\\/]/).pop();
}

export function getExtension(filename = '') {
  // check that we have an arg and that it is a string
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // find the index of the last '.' in the string
  const pos = filename.lastIndexOf('.');

  // if there was no '.' (lastIndexOf returned -1) or it was at the start of the
  // filename string (e.g. .htaccess)
  if (pos < 1) {
    return '';
  }

  return filename.slice(pos + 1);
}
