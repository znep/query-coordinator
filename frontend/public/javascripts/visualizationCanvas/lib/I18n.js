import _ from 'lodash';

export function translate(key) {
  const translation = _.get(window.I18n, key);

  if (_.isUndefined(translation)) {
    console.warn(`Missing translation for key: ${key}`);
  }

  return translation;
}

export { translate as t };
