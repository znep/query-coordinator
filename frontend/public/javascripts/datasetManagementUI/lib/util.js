export const singularOrPlural = (quantity, singularString, pluralString) => {
  return quantity === 1 ? singularString : pluralString;
};

export const getComponentName = component => component.displayName || component.name;

// For forms. Most common errors handle client-side. Pattern matching only a few
// server-side errors to be displayed in the flash message.
export const getLocalizedErrorMessage = msg => {
  let localizedErrorMessage;
  const isInvalidURL = /validation failed:(.+)not a valid url/ig;
  const requiresLicense = /validation failed:(.+)requires that attribution be specified/ig;

  if (isInvalidURL.test(msg)) {
    localizedErrorMessage = I18n.edit_metadata.validation_error_url;
  } else if (requiresLicense.test(msg)) {
    localizedErrorMessage = I18n.edit_metadata.validation_error_attribution_required;
  } else {
    localizedErrorMessage = I18n.edit_metadata.validation_error_general;
  }

  return localizedErrorMessage;
};

export const flattenObject = (obj = {}) =>
  Object.keys(obj).reduce((acc, key) => {
    if (_.isPlainObject(obj[key])) {
      return Object.assign(
        {},
        acc,
        flattenObject(obj[key])
      );
    } else {
      acc[key] = obj[key];
    }

    return acc;
  }, {});
