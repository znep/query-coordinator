import _ from 'lodash';
import Environment from '../StorytellerEnvironment';

// TODO: Shim this to common/i18n
export default {
  t: function t(translationKeys) {
    if (!_.has(Environment.TRANSLATIONS, translationKeys) && _.has(window, 'console')) {
      console.warn(`Missing translation: ${translationKeys}`);
    }

    return _.get(Environment.TRANSLATIONS, translationKeys);
  }
};
