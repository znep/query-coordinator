import {isNull, isString, isPlainObject, has, get} from 'lodash';

import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import ca from './locales/ca';
import it from './locales/it';
import nl from './locales/nl';
import zh from './locales/zh';

const default_locale = 'en';
const locales = { en, es, fr, ca, it, nl, zh };
let locale = default_locale;

export const setLocale = key => {
  key = isString(key) ? key.toLowerCase() : null;

  if (has(locales, key)) {
    locale = key;
  } else {
    // Default to English if the locale translation file is not present
    locale = default_locale;
  }
  return locale;
};

// Passing in environmentLocale is a temporary workaround to localize the Table & Pager
export const translate = (key, environmentLocale) => {
  locale = environmentLocale ? setLocale(environmentLocale) : locale;

  key = isString(key) ? key.toLowerCase() : null;
  let translation = get(locales[locale], key, null);
  // Default to English for an individual translation if it is missing from the locale file
  if (translation === null) {
    translation = get(locales[default_locale], key, null);
  }

  if (isString(translation)) {
    return translation;
  } else if (isNull(key)) {
    throw new Error('I18n: translate requires a String.');
  } else if (isPlainObject(translation)) {
    throw new Error('I18n: Access to a group of translations is not allowed. Use translateGroup instead.');
  } else {
    throw new Error(`I18n: Translation missing for ${key}.`);
  }
};

export const translateGroup = key => {
  key = isString(key) ? key.toLowerCase() : null;
  let translationGroup = get(locales[locale], key, null);

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
