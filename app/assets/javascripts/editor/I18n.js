import _ from 'lodash';
import Environment from '../StorytellerEnvironment';

export default {
  t: function t(translationKeys) {
    return _.get(Environment.TRANSLATIONS, translationKeys);
  }
};
