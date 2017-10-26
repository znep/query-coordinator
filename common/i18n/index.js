import _ from 'lodash';
import I18nJS from 'i18n-js';
import pluralization from './pluralization';

I18nJS.locale = _.get(window, 'serverConfig.locale', 'en');
I18nJS.pluralization[I18nJS.locale] = pluralization(I18nJS.locale);

_.assign(I18nJS.translations, {
  [I18nJS.locale]: window.datalensTranslations || window.translations
});

export function useTestTranslations(translations) {
  _.assign(I18nJS.translations, {
    [I18nJS.locale]: translations
  });
}

export default I18nJS;
