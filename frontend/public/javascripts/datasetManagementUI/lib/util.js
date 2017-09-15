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
