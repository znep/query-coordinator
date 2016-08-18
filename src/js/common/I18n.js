import { isNull, isString, isPlainObject, has, get } from 'lodash';

import en from './locales/en';

var locale = 'en';
const locales = { en };

export const setLocale = key => {
  key = isString(key) ? key.toLowerCase() : null;

  if (has(locales, key)) {
    locale = key;
  } else {
    throw new Error(`I18n: The locale ${key} is not available.`);
  }
};

export const translate = key => {
  key = isString(key) ? key.toLowerCase() : null;
  var translation = get(locales[locale], key, null);

  if (isString(translation)) {
    return translation;
  } else if (isNull(key)) {
    throw new Error('I18n: translate requires a String.');
  } else if (isPlainObject(translation)) {
    throw new Error(
      'I18n: Access to a group of translations is not allowed. Use translateGroup instead.'
    );
  } else {
    throw new Error(`I18n: Translation missing for ${key}.`);
  }
};

export const translateGroup = key => {
  key = isString(key) ? key.toLowerCase() : null;
  var translationGroup = get(locales[locale], key, null);

  if (isPlainObject(translationGroup)) {
    return translationGroup;
  } else if (isNull(key)) {
    throw new Error('I18n: translateGroup requires a String.');
  } else if (isString(translationGroup)) {
    throw new Error('I18n: Access to a direct translation is not allowed. Use translate instead.');
  } else {
    throw new Error(`I18n: Translations missing for ${key}`);
  }
};
