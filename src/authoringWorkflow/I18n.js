import _ from 'lodash';

import en from './locales/en';
import es from './locales/es';

var locale = 'en';
const locales = { en, es };

export const setLocale = key => {
  if (_.isString(key) && _.has(locales, key.toLowerCase())) {
    locale = key;
  } else {
    throw new Error(`I18n: There is not a locale with the key, ${key}`);
  }
};

export const translate = key => {
  return _.get(locales[locale], key, `I18n: Translation missing for ${key}.`);
};
