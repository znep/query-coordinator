export const singularOrPlural = (quantity, singularString, pluralString) => {
  return quantity === 1 ? singularString : pluralString;
};

export const getComponentName = component => component.displayName || component.name;
