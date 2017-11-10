import _ from 'lodash';
import I18nJS from 'i18n-js';
import pluralization from './pluralization';
import { sift } from 'common/js_utils';

I18nJS.locale = sift(window, 'serverConfig.locale', 'blist.locale') || 'en';
I18nJS.pluralization[I18nJS.locale] = pluralization(I18nJS.locale);

const translations = sift(
  window,
  'datalensTranslations', 'translations', 'blist.translations'
);

const overwrittenKeys = _.reject(_.intersection(
  _.keys(I18nJS.translations[I18nJS.locale]),
  _.keys(translations)
), (sharedKey) => {
  return _.isEqual(
    I18nJS.translations[I18nJS.locale][sharedKey],
    translations[sharedKey]
  );
});

if (!_.isEmpty(overwrittenKeys)) {
  console.warn(`Keys being overwritten: ${overwrittenKeys.join(', ')}`);
}

I18nJS.translations[I18nJS.locale] =
  _.assign({}, I18nJS.translations[I18nJS.locale], translations);

export function useTestTranslations(translations) {
  _.assign(I18nJS.translations, {
    [I18nJS.locale]: translations
  });
}

export default I18nJS;
